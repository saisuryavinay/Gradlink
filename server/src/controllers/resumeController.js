import ResumeAnalysis from '../models/ResumeAnalysis.js';
import StudentProfile from '../models/StudentProfile.js';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';
import { Readable } from 'stream';

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw Object.assign(new Error('GEMINI_API_KEY is not configured. Please add it to your .env file.'), { statusCode: 503 });
  }
  return new GoogleGenerativeAI(apiKey);
}

function getGridFSBucket() {
  if (!mongoose.connection.db) throw new Error('Database is not connected.');
  return new GridFSBucket(mongoose.connection.db, { bucketName: 'resumes' });
}

// POST /api/resume/analyze
export const analyzeResume = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No PDF file uploaded.' });

    const { targetCompany, targetRole, jobDescription, retainFile } = req.body;
    if (!targetRole) return res.status(400).json({ message: 'Target job role is required.' });

    // Validate PDF content
    let pdfText = '';
    try {
      const parsed = await pdfParse(req.file.buffer);
      pdfText = parsed.text?.trim();
    } catch (pdfErr) {
      return res.status(400).json({ message: 'Could not read the PDF. It may be encrypted, corrupted, or a scanned image without text.' });
    }

    if (!pdfText || pdfText.length < 50) {
      return res.status(400).json({ message: 'The PDF appears to be empty or contains no readable text. GradLink does not support scanned image PDFs without OCR.' });
    }

    // Store file in GridFS if retainFile
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
        uploadStream.on('finish', () => resolve());
        uploadStream.on('error', reject);
      });
      fileId = uploadStream.id;
    }

    // Create analysis record
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

    // Call Gemini
    try {
      const genAI = getGeminiClient();
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `You are an expert career coach and resume analyst. Analyze the provided resume for the following:

Target Role: ${targetRole}${targetCompany ? `\nTarget Company: ${targetCompany}` : ''}${jobDescription ? `\nJob Description: ${jobDescription}` : '\n(No specific job description provided — analyze against general industry requirements for this role)'}

Resume Content:
${pdfText.substring(0, 8000)}

Provide a structured JSON analysis with the following exact fields:
{
  "matchScore": <number 0-100 — AI estimate of how well this resume matches the role>,
  "matchingSkills": [<list of skills from resume that match the role>],
  "missingSkills": [<list of relevant skills not found in resume>],
  "strengths": [<list of resume strengths>],
  "weaknesses": [<list of resume weaknesses>],
  "suggestions": [<list of specific improvement suggestions>],
  "recommendedSkills": [<list of skills to learn for this role>]
}

Important: Return ONLY the JSON object, no markdown or extra text. The matchScore is an AI estimate and does not guarantee recruitment outcomes.`;

      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();

      // Parse JSON response
      let parsedResult;
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        parsedResult = JSON.parse(jsonMatch ? jsonMatch[0] : text);
      } catch {
        throw new Error('AI returned an invalid response format. Please try again.');
      }

      // Validate required fields
      const required = ['matchScore', 'matchingSkills', 'missingSkills', 'strengths', 'weaknesses', 'suggestions', 'recommendedSkills'];
      for (const field of required) {
        if (!(field in parsedResult)) parsedResult[field] = field === 'matchScore' ? 0 : [];
      }

      // Update analysis with results
      const updated = await ResumeAnalysis.findByIdAndUpdate(
        analysis._id,
        {
          ...parsedResult,
          status: 'completed',
          rawAnalysis: text,
        },
        { new: true }
      );

      // Update student profile with resume reference if retained
      if (shouldRetain && fileId) {
        await StudentProfile.findOneAndUpdate(
          { user: req.user._id },
          { resumeFileId: fileId, resumeFilename: req.file.originalname, resumeUploadedAt: new Date() }
        );
      }

      return res.json({
        message: 'Resume analyzed successfully.',
        analysisId: updated._id,
        matchScore: updated.matchScore,
        matchingSkills: updated.matchingSkills,
        missingSkills: updated.missingSkills,
        strengths: updated.strengths,
        weaknesses: updated.weaknesses,
        suggestions: updated.suggestions,
        recommendedSkills: updated.recommendedSkills,
        disclaimer: 'This match score is an AI estimate and does not guarantee recruitment or shortlisting outcomes.',
        fileRetained: shouldRetain,
      });
    } catch (geminiError) {
      await ResumeAnalysis.findByIdAndUpdate(analysis._id, {
        status: 'failed',
        errorMessage: geminiError.message,
      });

      if (geminiError.statusCode === 503) return next(geminiError);
      if (geminiError.message.includes('quota') || geminiError.message.includes('QUOTA')) {
        return res.status(503).json({ message: 'Gemini API quota exceeded. Please try again later.' });
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

    const bucket = getGridFSBucket();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${analysis.filename}"`);
    bucket.openDownloadStream(fileId).pipe(res);
  } catch (error) {
    next(error);
  }
};
