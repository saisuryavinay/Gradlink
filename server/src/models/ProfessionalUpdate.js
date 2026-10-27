import mongoose from 'mongoose';

const professionalUpdateSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    adminNote: {
      type: String,
      trim: true,
      select: false,
    },
    approvedAt: { type: Date },
    rejectedAt: { type: Date },
  },
  { timestamps: true }
);

professionalUpdateSchema.index({ author: 1, status: 1 });
professionalUpdateSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('ProfessionalUpdate', professionalUpdateSchema);
