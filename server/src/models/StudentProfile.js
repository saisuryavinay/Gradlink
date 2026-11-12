import mongoose from 'mongoose';

const studentProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    // Academic
    cgpa: { type: Number, min: 0, max: 10 },
    percentage: { type: Number, min: 0, max: 100 },
    backlogs: { type: Number, default: 0, min: 0 },
    // Bio / About
    bio: { type: String, trim: true, maxlength: 1000 },
    // Skills & Projects
    skills: [{ type: String, trim: true }],
    projects: [
      {
        title: String,
        description: String,
        technologies: [String],
        link: String,
      },
    ],
    certifications: [
      {
        title: String,
        issuer: String,
        year: Number,
        url: String,
      },
    ],
    achievements: [{ type: String, trim: true }],
    // Education
    education: [
      {
        degree: String,
        institution: String,
        year: Number,
        score: String,
      },
    ],
    // Preferences
    preferredRoles: [{ type: String, trim: true }],
    preferredLocations: [{ type: String, trim: true }],
    jobTypePreference: {
      type: String,
      enum: ['internship', 'full-time', 'both', ''],
      default: '',
    },
    // Links
    linkedinUrl: { type: String, trim: true },
    githubUrl: { type: String, trim: true },
    portfolioUrl: { type: String, trim: true },
    // Resume reference (GridFS file id)
    resumeFileId: { type: mongoose.Schema.Types.ObjectId },
    resumeFilename: { type: String },
    resumeUploadedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model('StudentProfile', studentProfileSchema);
