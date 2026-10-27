import mongoose from 'mongoose';

const mentorshipRequestSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    alumni: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      required: [true, 'Please explain what guidance you need'],
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'withdrawn', 'cancelled'],
      default: 'pending',
    },
    alumniNote: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    adminNote: {
      type: String,
      trim: true,
      maxlength: 500,
      select: false,
    },
  },
  { timestamps: true }
);

mentorshipRequestSchema.index({ student: 1, status: 1 });
mentorshipRequestSchema.index({ alumni: 1, status: 1 });

export default mongoose.model('MentorshipRequest', mentorshipRequestSchema);
