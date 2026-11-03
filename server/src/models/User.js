import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const ALLOWED_DOMAINS = ['acet.ac.in', 'acoe.edu.in', 'aec.edu.in'];

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: function (v) {
          const role = this.role || (this.getUpdate && (this.getUpdate().role || (this.getUpdate().$set && this.getUpdate().$set.role)));
          if (role === 'admin') return true;
          const domain = v ? v.split('@')[1] : '';
          return ALLOWED_DOMAINS.includes(domain);
        },
        message: 'Email must be from an official college domain (@acet.ac.in, @acoe.edu.in, or @aec.edu.in)',
      },
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['student', 'alumni', 'admin'],
      required: true,
    },
    department: {
      type: String,
      required: function () { return this.role !== 'admin'; },
      trim: true,
    },
    graduationYear: {
      type: Number,
      required: function () { return this.role !== 'admin'; },
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    avatar: {
      type: String,
      default: 'avatar_1',
    },
    themePreference: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system',
    },
    // Alumni-specific fields (stored on user for quick access)
    currentCompany: { type: String, trim: true },
    currentRole: { type: String, trim: true },
    skills: [{ type: String, trim: true }],
    linkedinUrl: { type: String, trim: true },
    mentorshipRestricted: { type: Boolean, default: false },
    deactivationRequestedAt: { type: Date },
  },
  { timestamps: true }
);

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Never return password in JSON
userSchema.set('toJSON', {
  transform: function (doc, ret) {
    delete ret.password;
    return ret;
  },
});

export default mongoose.model('User', userSchema);
