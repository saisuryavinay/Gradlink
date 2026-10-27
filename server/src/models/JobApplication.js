import mongoose from 'mongoose';

const jobApplicationSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    // For internal applications
    formData: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
    },
    status: {
      type: String,
      enum: ['submitted', 'pending', 'shortlisted', 'rejected', 'selected'],
      default: 'submitted',
    },
    // Admin-only note — not exposed to students
    adminNote: {
      type: String,
      trim: true,
      maxlength: 1000,
      select: false,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

jobApplicationSchema.index({ student: 1, job: 1 }, { unique: true });
jobApplicationSchema.index({ job: 1, status: 1 });

export default mongoose.model('JobApplication', jobApplicationSchema);
