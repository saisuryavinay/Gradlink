import mongoose from 'mongoose';
import crypto from 'crypto';

const emailVerificationSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    otpHash: {
      type: String,
      required: true,
      select: false,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 },
    },
    attempts: {
      type: Number,
      default: 0,
    },
    resendCount: {
      type: Number,
      default: 0,
    },
    lastResendAt: {
      type: Date,
    },
    verified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

emailVerificationSchema.statics.hashOTP = (otp) =>
  crypto.createHash('sha256').update(otp).digest('hex');

emailVerificationSchema.methods.verifyOTP = function (otp) {
  const hash = crypto.createHash('sha256').update(otp).digest('hex');
  return hash === this.otpHash;
};

export default mongoose.model('EmailVerification', emailVerificationSchema);
