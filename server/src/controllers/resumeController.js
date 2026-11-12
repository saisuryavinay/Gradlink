import path from 'path';
import ResumeAnalysis from '../models/ResumeAnalysis.js';
import StudentProfile from '../models/StudentProfile.js';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import mammoth from 'mammoth';
import { GoogleGenerativeAI } from '@google/generative-ai';
import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';
import { Readable } from 'stream';

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw Object.assign(
      new Error('GEMINI_API_KEY is not configured. Please add it to your .env file.'),
      { statusCode: 503 }
    );
  }
  return new GoogleGenerativeAI(apiKey);
}

function getGridFSBucket() {
  if (!mongoose.connection.db) throw new Error('Database is not connected.');
  return new GridFSBucket(mongoose.connection.db, { bucketName: 'resumes' });
}

/**
 * Extract plain text from the uploaded file buffer.
 * Supports PDF and DOCX.
 */
async function extractText(file) {
  const ext = path.extname(file.originalname).toLowerCase();

  if (ext === '.pdf') {
    let parsed;
    try {
      parsed = await pdfParse(file.buffer);
    } catch {
      throw Object.assign(
        new Error(
          'Could not read the PDF. It may be encrypted, corrupted, or a scanned image without selectable text.'
        ),
        { statusCode: 400 }
      );
    }
    const text = parsed.text?.trim();
    if (!text || text.length < 50) {
      throw Object.assign(
        new Error(
          'The PDF appears to be empty or contains no readable text. ' +
            'GradLink does not support scanned image PDFs — please upload a text-based PDF.'
        ),
        { statusCode: 400 }
      );
    }
    return text;
  }

  if (ext === '.docx') {
    let result;
    try {
      result = await mammoth.extractRawText({ buffer: file.buffer });
    } catch {
      throw Object.assign(
        new Error(
          'Could not read the Word document. It may be corrupted or password-protected.'
        ),
        { statusCode: 400 }
      );
    }
    const text = result.value?.trim();
    if (!text || text.length < 50) {
      throw Object.assign(
        new Error('The Word document appears to be empty or contains no readable text.'),
        { statusCode: 400 }
      );
    }
    return text;
  }

  throw Object.assign(
    new Error('Unsupported file format. Only PDF (.pdf) and Word (.docx) files are accepted.'),
    { statusCode: 400 }
  );
}

// POST /api/resume/analyze
export const analyzeResume = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No resume file uploaded.' });

    const { targetCompany, targetRole, jobDescription, retainFile } = req.body;
    if (!targetRole) return res.status(400).json({ message: 'Target job role is required.' });

    // Extract text from the uploaded file
    let resumeText;
    try {
      resumeText = await extractText(req.file);
    } catch (extractErr) {
      return res.status(extractErr.statusCode || 400).json({ message: extractErr.message });
    }

    // Store file in GridFS if retainFile is requested
    let fileId;
    const shouldRetain = retainFile === 'true' || retainFile === true;
    if (shouldRetain) {
      const bucket = getGridFSBucket();
      const uploadStream = bucket.openUploadStream(req.file.originalname, {
        metadata: { studentId: req.user._id, uploadedAt: new Date() },
      });
      const readable = Readable.from(req.file.buffer);
      await new Promise((resolve, reject) => {
        readable.pipe(uploadStream);
        uploadStream.on('finish', resolve);
        uploadStream.on('error', reject);
      });
      fileId = uploadStream.id;
    }

    // Create analysis record (status: processing)
    const analysis = await ResumeAnalysis.create({
      student: req.user._id,
      fileId: shouldRetain ? fileId : undefined,
      filename: req.file.originalname,
      fileSizeBytes: req.file.size,
      targetCompany: targetCompany?.trim(),
      targetRole: targetRole.trim(),
      jobDescription: jobDescription?.trim(),
      retainFile: shouldRetain,
      status: 'processing',
    });

    // Build Gemini prompt
    const prompt = `You are an expert career coach and ATS (Applicant Tracking System) specialist. Analyze the resume below and provide a comprehensive evaluation.

Target Role: ${targetRole}${targetCompany ? `\nTarget Company: ${targetCompany}` : ''}${
      jobDescription
        ? `\nJob Description:\n${jobDescription}`
        : '\n(No specific job description provided — analyze against general industry requirements for this role)'
    }

Resume Content:
${resumeText.substring(0, 8000)}

Provide a structured JSON analysis with EXACTLY these fields (all required):
{
  "overallScore": <number 0-100 — overall resume quality score>,
  "atsScore": <number 0-100 — ATS compatibility score>,
  "skillsIdentified": [<all skills found in resume — both technical and soft>],
  "technicalSkills": [<technical/hard skills found in resume>],
  "softSkills": [<soft/interpersonal skills found in resume>],
  "educationAnalysis": [<observations about education section — degree relevance, GPA, certifications>],
  "experienceAnalysis": [<observations about work experience — impact, quantification, relevance>],
  "projectsAnalysis": [<observations about projects — relevance, tech stack, impact>],
  "missingSkills": [<important skills for this role not found in resume>],
  "strengths": [<specific resume strengths>],
  "areasForImprovement": [<specific weaknesses or gaps>],
  "suggestions": [<actionable improvement suggestions>],
  "recommendedKeywords": [<ATS keywords to add for this role>]
}

Important: Return ONLY the JSON object. No markdown, no code fences, no extra text. Every field must be present. Use empty arrays [] for sections not applicable.`;

    try {
      const genAI = getGeminiClient();
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const aiResult = await model.generateContent(prompt);
      const rawText = aiResult.response.text().trim();

      // Parse JSON from response
      let parsed;
      try {
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        parsed = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);
      } catch {
        throw new Error('AI returned an invalid response format. Please try again.');
      }

      // Ensure all required fields exist
      const arrayFields = [
        'skillsIdentified', 'technicalSkills', 'softSkills',
        'educationAnalysis', 'experienceAnalysis', 'projectsAnalysis',
        'missingSkills', 'strengths', 'areasForImprovement',
        'suggestions', 'recommendedKeywords',
      ];
      if (!('overallScore' in parsed)) parsed.overallScore = 0;
      if (!('atsScore' in parsed)) parsed.atsScore = 0;
      for (const field of arrayFields) {
        if (!Array.isArray(parsed[field])) parsed[field] = [];
      }

      // Also keep legacy fields for backward compat (matchScore, matchingSkills, etc.)
      parsed.matchScore = parsed.overallScore;
      parsed.matchingSkills = parsed.skillsIdentified;
      parsed.weaknesses = parsed.areasForImprovement;
      parsed.recommendedSkills = parsed.recommendedKeywords;

      // Save result
      const updated = await ResumeAnalysis.findByIdAndUpdate(
        analysis._id,
        { ...parsed, status: 'completed', rawAnalysis: rawText },
        { new: true }
      );

      // Update student profile resume reference if retaining
      if (shouldRetain && fileId) {
        await StudentProfile.findOneAndUpdate(
          { user: req.user._id },
          {
            resumeFileId: fileId,
            resumeFilename: req.file.originalname,
            resumeUploadedAt: new Date(),
          }
        );
      }

      return res.json({
        message: 'Resume analyzed successfully.',
        analysisId: updated._id,
        // New comprehensive fields
        overallScore: parsed.overallScore,
        atsScore: parsed.atsScore,
        skillsIdentified: parsed.skillsIdentified,
        technicalSkills: parsed.technicalSkills,
        softSkills: parsed.softSkills,
        educationAnalysis: parsed.educationAnalysis,
        experienceAnalysis: parsed.experienceAnalysis,
        projectsAnalysis: parsed.projectsAnalysis,
        missingSkills: parsed.missingSkills,
        strengths: parsed.strengths,
        areasForImprovement: parsed.areasForImprovement,
        suggestions: parsed.suggestions,
        recommendedKeywords: parsed.recommendedKeywords,
        // Legacy compat
        matchScore: parsed.overallScore,
        matchingSkills: parsed.skillsIdentified,
        weaknesses: parsed.areasForImprovement,
        recommendedSkills: parsed.recommendedKeywords,
        disclaimer:
          'This score is an AI estimate and does not guarantee recruitment or shortlisting outcomes.',
        fileRetained: shouldRetain,
      });
    } catch (geminiError) {
      await ResumeAnalysis.findByIdAndUpdate(analysis._id, {
        status: 'failed',
        errorMessage: geminiError.message,
      });

      if (geminiError.statusCode === 503) return next(geminiError);
      if (
        geminiError.message.includes('quota') ||
        geminiError.message.includes('QUOTA') ||
        geminiError.message.includes('rate limit')
      ) {
        return res
          .status(503)
          .json({ message: 'Gemini API quota exceeded. Please try again later.' });
      }

      return res.status(500).json({ message: `AI analysis failed: ${geminiError.message}` });
    }
  } catch (error) {
    next(error);
  }
};

// DELETE /api/resume/:analysisId — delete retained file
export const deleteResumeFile = async (req, res, next) => {
  try {
    const analysis = await ResumeAnalysis.findOne({
      _id: req.params.analysisId,
      student: req.user._id,
    });

    if (!analysis) return res.status(404).json({ message: 'Analysis record not found.' });

    if (analysis.fileId) {
      try {
        const bucket = getGridFSBucket();
        await bucket.delete(analysis.fileId);
      } catch (deleteErr) {
        console.warn('[RESUME] Could not delete GridFS file:', deleteErr.message);
      }
    }

    await ResumeAnalysis.findByIdAndDelete(analysis._id);

    // Clear profile resume reference if this was the active resume
    const profile = await StudentProfile.findOne({ user: req.user._id });
    if (profile?.resumeFileId?.equals(analysis.fileId)) {
      await StudentProfile.updateOne(
        { user: req.user._id },
        { $unset: { resumeFileId: 1, resumeFilename: 1, resumeUploadedAt: 1 } }
      );
    }

    res.json({ message: 'Resume and analysis record deleted.' });
  } catch (error) {
    next(error);
  }
};

// GET /api/resume/my-analyses — student's analysis history
export const getMyAnalyses = async (req, res, next) => {
  try {
    const analyses = await ResumeAnalysis.find({ student: req.user._id })
      .select('-rawAnalysis')
      .sort({ createdAt: -1 })
      .limit(10);
    res.json({ analyses });
  } catch (error) {
    next(error);
  }
};

// GET /api/resume/download/:fileId — download file (owner or admin)
export const downloadResumeFile = async (req, res, next) => {
  try {
    const fileId = new mongoose.Types.ObjectId(req.params.fileId);

    // Check ownership
    const analysis = await ResumeAnalysis.findOne({ fileId });
    if (!analysis) return res.status(404).json({ message: 'File not found.' });

    const isOwner = analysis.student.equals(req.user._id);
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const ext = path.extname(analysis.filename).toLowerCase();
    const contentType =
      ext === '.docx'
        ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        : 'application/pdf';

    const bucket = getGridFSBucket();
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${analysis.filename}"`);
    bucket.openDownloadStream(fileId).pipe(res);
  } catch (error) {
    next(error);
  }
};
