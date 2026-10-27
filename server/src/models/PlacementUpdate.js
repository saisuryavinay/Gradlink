import mongoose from 'mongoose';

const placementUpdateSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 200,
    },
    // Accept both 'body' (frontend) and 'content' (legacy) — stored as 'body'
    body: {
      type: String,
      trim: true,
      maxlength: 3000,
    },
    link: {
      type: String,
      trim: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    published: { type: Boolean, default: true }, // Admin-created updates are published immediately
    pinned: { type: Boolean, default: false },
    expiresAt: { type: Date },
    publishedAt: { type: Date },
  },
  { timestamps: true }
);

placementUpdateSchema.index({ published: 1, pinned: -1, createdAt: -1 });

export default mongoose.model('PlacementUpdate', placementUpdateSchema);
