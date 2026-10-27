import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 3000,
    },
    eventType: {
      type: String,
      enum: ['seminar', 'workshop', 'job-fair', 'hackathon', 'webinar', 'alumni-meet', 'other'],
      default: 'seminar',
    },
    // Frontend sends startDate; store as 'startDate' (was 'date')
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    time: { type: String, trim: true },
    venue: { type: String, trim: true },       // Frontend sends 'venue' (was 'location')
    registrationLink: { type: String, trim: true },
    published: { type: Boolean, default: true }, // Admin-created events are published immediately
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

eventSchema.index({ published: 1, startDate: 1 });

export default mongoose.model('Event', eventSchema);
