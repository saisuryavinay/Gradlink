import mongoose from 'mongoose';

const resumeAnalysisSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // GridFS file ID for the resume
    fileId: { type: mongoose.Schema.Types.ObjectId },
    filename: { type: String },
    fileSizeBytes: { type: Number },
    // Analysis inputs
    targetCompany: { type: String, trim: true },
    targetRole: { type: String, trim: true, required: true },
    jobDescription: { type: String, trim: true },
    // Gemini analysis results
    matchScore: { type: Number, min: 0, max: 100 },
    matchingSkills: [String],
    missingSkills: [String],
    strengths: [String],
    weaknesses: [String],
    suggestions: [String],
    recommendedSkills: [String],
    rawAnalysis: { type: String },
    // Status
    status: {
      type: String,
      enum: ['processing', 'completed', 'failed'],
      default: 'processing',
    },
    errorMessage: { type: String },
    retainFile: { type: Boolean, default: false },
  },
  { timestamps: true }
);

resumeAnalysisSchema.index({ student: 1, createdAt: -1 });

export default mongoose.model('ResumeAnalysis', resumeAnalysisSchema);
