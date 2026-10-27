import mongoose from 'mongoose';

const applicationFormFieldSchema = new mongoose.Schema({
  label: { type: String, required: true },
  fieldType: {
    type: String,
    enum: ['text', 'textarea', 'email', 'number', 'select', 'checkbox'],
    default: 'text',
  },
  options: [String], // For select type
  required: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
});

const jobSchema = new mongoose.Schema(
  {
    // Basic info
    company: { type: String, required: true, trim: true },
    companyLogo: { type: String, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    location: { type: String, trim: true },
    jobType: {
      type: String,
      enum: ['full-time', 'part-time', 'internship', 'contract', 'remote'],
      required: true,
    },
    // Category
    category: {
      type: String,
      enum: ['placement', 'off-campus', 'alumni-posted'],
      required: true,
    },
    // Eligibility
    requiredSkills: [{ type: String, trim: true }],
    eligibleDepartments: [{ type: String, trim: true }],
    eligibleGraduationYears: [{ type: Number }],
    minCGPA: { type: Number, min: 0, max: 10 },
    minPercentage: { type: Number, min: 0, max: 100 },
    maxBacklogs: { type: Number, min: 0, default: 0 },
    additionalEligibility: { type: String, trim: true },
    // Application method
    applicationMethod: {
      type: String,
      enum: ['external', 'internal'],
      required: true,
    },
    externalUrl: { type: String, trim: true },
    applicationFormFields: [applicationFormFieldSchema],
    // Status and timeline
    deadline: { type: Date, required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending', // Controller sets 'approved' for admin, 'pending' for alumni
    },
    // Authorship
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    adminNote: { type: String, trim: true, select: false },
    approvedAt: { type: Date },
    rejectedAt: { type: Date },
  },
  { timestamps: true }
);

jobSchema.index({ status: 1, deadline: 1 });
jobSchema.index({ category: 1, status: 1 });
jobSchema.index({ postedBy: 1 });

export default mongoose.model('Job', jobSchema);
