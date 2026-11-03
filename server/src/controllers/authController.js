import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import EmailVerification from '../models/EmailVerification.js';
import StudentProfile from '../models/StudentProfile.js';
import AlumniProfile from '../models/AlumniProfile.js';
import { sendOTPEmail, sendOTPEmailBackground } from '../config/email.js';

const ALLOWED_DOMAINS = ['acet.ac.in', 'acoe.edu.in', 'aec.edu.in'];
const OTP_EXPIRY_MINUTES = 5;
const MAX_ATTEMPTS = 5;
const MAX_RESENDS = 3;

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

function validateDomain(email) {
  const domain = email.toLowerCase().trim().split('@')[1];
  return ALLOWED_DOMAINS.includes(domain);
}

export const register = async (req, res, next) => {
  try {
    const { name, email, password, role, department, graduationYear, currentCompany, currentRole, skills, linkedinUrl } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Name, email, password, and role are required.' });
    }

    if (!['student', 'alumni'].includes(role)) {
      return res.status(400).json({ message: 'Role must be student or alumni.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    if (!validateDomain(normalizedEmail)) {
      return res.status(400).json({ message: 'Email must be from an official college domain (@acet.ac.in, @acoe.edu.in, or @aec.edu.in).' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      if (existing.isVerified) {
        // Account is fully active — tell the user to log in
        return res.status(409).json({
          message: 'An account with this email already exists. Please log in.',
          alreadyVerified: true,
        });
      }

      // Account exists but is NOT verified — resend a fresh OTP so the student
      // can continue without being permanently blocked.
      // Reset the resend counter so old abandoned sessions don't block re-registration.
      await EmailVerification.findOneAndUpdate(
        { email: normalizedEmail },
        { $set: { resendCount: 0 } }
      );
      // background=true: save OTP to DB first, then fire email async so we
      // respond immediately and avoid Render cold-start + SMTP timeouts.
      await sendVerificationOTP(normalizedEmail, existing.name, true, true);
      return res.status(200).json({
        message: 'An unverified account already exists for this email. A new OTP has been sent. Please verify your email to continue.',
        email: normalizedEmail,
        requiresVerification: true,
      });
    }

    const user = new User({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role,
      department: department?.trim(),
      graduationYear: parseInt(graduationYear),
      currentCompany: currentCompany?.trim(),
      currentRole: currentRole?.trim(),
      skills: Array.isArray(skills) ? skills : [],
      linkedinUrl: linkedinUrl?.trim(),
    });

    await user.save();

    // Create role-specific profile
    if (role === 'student') {
      await StudentProfile.create({ user: user._id });
    } else {
      await AlumniProfile.create({
        user: user._id,
        currentCompany: currentCompany?.trim(),
        currentRole: currentRole?.trim(),
        skills: Array.isArray(skills) ? skills : [],
        linkedinUrl: linkedinUrl?.trim(),
      });
    }

    // Generate OTP and save to DB synchronously, then send email in background.
    // This ensures the HTTP response is returned before SMTP delivery completes,
    // preventing Render cold-start + SMTP latency from triggering a 30s timeout.
    await sendVerificationOTP(normalizedEmail, name.trim(), false, true);

    res.status(201).json({
      message: 'Account created. Please check your email for a verification OTP.',
      email: normalizedEmail,
      requiresVerification: true,
    });
  } catch (error) {
    next(error);
  }
};

export const sendVerificationOTP = async (email, name, isResend = true, background = false) => {
  // Check resend limits
  const existing = await EmailVerification.findOne({ email });
  if (isResend && existing) {
    if (existing.resendCount >= MAX_RESENDS) {
      throw Object.assign(new Error('Maximum resend limit reached. Please wait or contact support.'), { statusCode: 429 });
    }
    const cooldown = 60 * 1000; // 1 minute between resends
    if (existing.lastResendAt && Date.now() - existing.lastResendAt.getTime() < cooldown) {
      throw Object.assign(new Error('Please wait 1 minute before requesting another OTP.'), { statusCode: 429 });
    }
  }

  const otp = generateOTP();
  const otpHash = EmailVerification.hashOTP(otp);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await EmailVerification.findOneAndUpdate(
    { email },
    {
      email,
      otpHash,
      expiresAt,
      attempts: 0,
      verified: false,
      $inc: { resendCount: isResend ? 1 : 0 },
      lastResendAt: isResend ? new Date() : undefined,
    },
    { upsert: true, new: true }
  );

  if (background) {
    // Fire-and-forget: respond to the client immediately, deliver email async.
    // If email fails, the OTP is still in DB and user can resend from OTP page.
    sendOTPEmailBackground(email, otp, name);
  } else {
    await sendOTPEmail(email, otp, name);
  }
};

export const resendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required.' });

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(404).json({ message: 'No account found with this email.' });
    if (user.isVerified) return res.status(400).json({ message: 'This account is already verified.' });

    await sendVerificationOTP(normalizedEmail, user.name, true);

    res.json({ message: 'A new OTP has been sent to your email.' });
  } catch (error) {
    next(error);
  }
};

export const verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required.' });

    const normalizedEmail = email.toLowerCase().trim();
    const verification = await EmailVerification.findOne({ email: normalizedEmail }).select('+otpHash');

    if (!verification) {
      return res.status(400).json({ message: 'No OTP found for this email. Please request a new one.' });
    }

    if (verification.verified) {
      return res.status(400).json({ message: 'This OTP has already been used.' });
    }

    if (verification.expiresAt < new Date()) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    if (verification.attempts >= MAX_ATTEMPTS) {
      return res.status(429).json({ message: 'Too many failed attempts. Please request a new OTP.' });
    }

    const isValid = verification.verifyOTP(otp.toString().trim());
    if (!isValid) {
      verification.attempts += 1;
      await verification.save();
      const remaining = MAX_ATTEMPTS - verification.attempts;
      return res.status(400).json({
        message: `Invalid OTP. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
      });
    }

    // Mark verified
    verification.verified = true;
    await verification.save();

    // Activate user account
    await User.findOneAndUpdate(
      { email: normalizedEmail },
      { isVerified: true }
    );

    const user = await User.findOne({ email: normalizedEmail });
    const token = generateToken(user._id);

    res.json({
      message: 'Email verified successfully. Welcome to GradLink!',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        graduationYear: user.graduationYear,
        avatar: user.avatar,
        themePreference: user.themePreference,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        message: 'Please verify your email address before logging in.',
        requiresVerification: true,
        email: normalizedEmail,
      });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Your account has been deactivated. Please contact an administrator.' });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: 'JWT_SECRET is not configured. Please contact the administrator.' });
    }

    const token = generateToken(user._id);

    res.json({
      message: 'Login successful.',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        graduationYear: user.graduationYear,
        avatar: user.avatar,
        themePreference: user.themePreference,
        currentCompany: user.currentCompany,
        currentRole: user.currentRole,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new passwords are required.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters.' });
    }

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect.' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully.' });
  } catch (error) {
    next(error);
  }
};
