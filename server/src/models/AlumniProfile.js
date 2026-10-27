import mongoose from 'mongoose';

const alumniProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    // Career
    currentCompany: { type: String, trim: true },
    currentRole: { type: String, trim: true },
    skills: [{ type: String, trim: true }],
    workExperience: [
      {
        company: String,
        role: String,
        from: String,
        to: String,
        description: String,
      },
    ],
    careerJourney: { type: String, trim: true, maxlength: 2000 },
    // Education
    education: [
      {
        degree: String,
        institution: String,
        year: Number,
        score: String,
      },
    ],
    // Projects & achievements
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
    // Mentorship
    mentorshipAvailable: { type: Boolean, default: true },
    mentorshipAreas: [{ type: String, trim: true }],
    mentorshipInterests: { type: String, trim: true, maxlength: 500 },
    areasOfExpertise: [{ type: String, trim: true }],
    // Links
    linkedinUrl: { type: String, trim: true },
    githubUrl: { type: String, trim: true },
    portfolioUrl: { type: String, trim: true },
  },
  { timestamps: true }
);

export default mongoose.model('AlumniProfile', alumniProfileSchema);
