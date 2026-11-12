import User from '../models/User.js';
import StudentProfile from '../models/StudentProfile.js';
import AlumniProfile from '../models/AlumniProfile.js';
import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';
import { Readable } from 'stream';

function getAvatarBucket() {
  if (!mongoose.connection.db) throw new Error('Database not connected.');
  return new GridFSBucket(mongoose.connection.db, { bucketName: 'avatars' });
}

// GET /api/profile/me
export const getMyProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    let profile;
    if (user.role === 'student') {
      profile = await StudentProfile.findOne({ user: user._id });
    } else if (user.role === 'alumni') {
      profile = await AlumniProfile.findOne({ user: user._id });
    }
    res.json({ user, profile });
  } catch (error) {
    next(error);
  }
};

// PUT /api/profile/me
export const updateMyProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    // ── Backend validation for student academic fields ───────────────────
    if (user.role === 'student') {
      const { backlogs, percentage, cgpa } = req.body;
      if (backlogs !== undefined) {
        const b = Number(backlogs);
        if (!Number.isInteger(b) || b < 0 || b > 14) {
          return res.status(400).json({ message: 'Active Backlogs must be a whole number between 0 and 14.' });
        }
      }
      if (percentage !== undefined && percentage !== '') {
        const p = Number(percentage);
        if (isNaN(p) || p < 0 || p > 100) {
          return res.status(400).json({ message: 'Percentage must be between 0 and 100.' });
        }
      }
      if (cgpa !== undefined && cgpa !== '') {
        const c = Number(cgpa);
        if (isNaN(c) || c < 0 || c > 10) {
          return res.status(400).json({ message: 'CGPA must be between 0 and 10.' });
        }
      }
    }

    // Update user fields
    const userFields = ['name', 'avatar', 'themePreference'];
    userFields.forEach((field) => {
      if (req.body[field] !== undefined) user[field] = req.body[field];
    });

    if (user.role === 'student') {
      // Students can update department and graduationYear on their User record
      const studentUserFields = ['department', 'graduationYear'];
      studentUserFields.forEach((f) => { if (req.body[f] !== undefined) user[f] = req.body[f]; });
    }
    if (user.role === 'alumni') {
      const alumniUserFields = ['currentCompany', 'currentRole', 'skills', 'linkedinUrl', 'department', 'graduationYear'];
      alumniUserFields.forEach((f) => { if (req.body[f] !== undefined) user[f] = req.body[f]; });
    }

    await user.save();

    // Update profile
    if (user.role === 'student') {
      const allowedStudentFields = [
        'bio', 'cgpa', 'percentage', 'backlogs', 'skills', 'projects',
        'certifications', 'achievements', 'education',
        'preferredRoles', 'preferredLocations', 'jobTypePreference',
        'linkedinUrl', 'githubUrl', 'portfolioUrl',
      ];
      const profileUpdate = {};
      allowedStudentFields.forEach((f) => {
        if (req.body[f] !== undefined) profileUpdate[f] = req.body[f];
      });
      await StudentProfile.findOneAndUpdate(
        { user: user._id },
        { $set: profileUpdate },
        { new: true, upsert: true }
      );
    } else if (user.role === 'alumni') {
      const allowedAlumniFields = [
        'bio', 'currentCompany', 'currentRole', 'skills', 'workExperience',
        'careerJourney', 'education', 'projects', 'certifications',
        'achievements', 'mentorshipAvailable', 'mentorshipAreas',
        'mentorshipInterests', 'areasOfExpertise',
        'linkedinUrl', 'githubUrl', 'portfolioUrl',
      ];
      const profileUpdate = {};
      allowedAlumniFields.forEach((f) => {
        if (req.body[f] !== undefined) profileUpdate[f] = req.body[f];
      });
      await AlumniProfile.findOneAndUpdate(
        { user: user._id },
        { $set: profileUpdate },
        { new: true, upsert: true }
      );
    }

    const updatedUser = await User.findById(user._id);
    let profile;
    if (user.role === 'student') profile = await StudentProfile.findOne({ user: user._id });
    else if (user.role === 'alumni') profile = await AlumniProfile.findOne({ user: user._id });

    res.json({ message: 'Profile updated successfully.', user: updatedUser, profile });
  } catch (error) {
    next(error);
  }
};

// GET /api/profile/alumni — searchable alumni directory
export const getAlumniDirectory = async (req, res, next) => {
  try {
    const { name, role, graduationYear, company, skills, page = 1, limit = 12 } = req.query;

    const query = { role: 'alumni', isActive: true, isVerified: true };

    if (name) query.name = { $regex: name, $options: 'i' };
    if (role) query.currentRole = { $regex: role, $options: 'i' };
    if (company) query.currentCompany = { $regex: company, $options: 'i' };
    if (graduationYear) query.graduationYear = parseInt(graduationYear);
    if (skills) {
      const skillList = skills.split(',').map((s) => s.trim());
      query.skills = { $in: skillList.map((s) => new RegExp(s, 'i')) };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await User.countDocuments(query);
    const alumni = await User.find(query)
      .select('name avatar department graduationYear currentCompany currentRole skills')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    res.json({ alumni, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    next(error);
  }
};

// GET /api/profile/alumni/:id — view one alumni profile (no private data)
export const getAlumniProfile = async (req, res, next) => {
  try {
    const user = await User.findOne({
      _id: req.params.id,
      role: 'alumni',
      isActive: true,
      isVerified: true,
    }).select('-email');  // Never expose email in public directory

    if (!user) return res.status(404).json({ message: 'Alumni profile not found.' });

    const profile = await AlumniProfile.findOne({ user: user._id });

    res.json({ user, profile });
  } catch (error) {
    next(error);
  }
};

// GET /api/profile/student/:id — admin only
export const getStudentProfile = async (req, res, next) => {
  try {
    const user = await User.findOne({ _id: req.params.id, role: 'student' });
    if (!user) return res.status(404).json({ message: 'Student not found.' });

    const profile = await StudentProfile.findOne({ user: user._id });
    res.json({ user, profile });
  } catch (error) {
    next(error);
  }
};

// POST /api/profile/deactivate-request — user requests deactivation
export const requestDeactivation = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { deactivationRequestedAt: new Date() });
    res.json({ message: 'Deactivation request submitted. An administrator will process your request.' });
  } catch (error) {
    next(error);
  }
};

// POST /api/profile/avatar — upload a profile photo
export const uploadAvatarPhoto = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No image file uploaded.' });

    const user = await User.findById(req.user._id);
    const bucket = getAvatarBucket();

    // Delete old GridFS avatar file if one exists
    if (user.avatarFileId) {
      try {
        await bucket.delete(new mongoose.Types.ObjectId(user.avatarFileId));
      } catch {
        // If old file is missing, that's fine — continue
      }
    }

    // Upload new image to GridFS
    const filename = `avatar_${user._id}_${Date.now()}${require_ext(req.file.originalname)}`;
    const uploadStream = bucket.openUploadStream(filename, {
      contentType: req.file.mimetype,
      metadata: { userId: user._id, uploadedAt: new Date() },
    });

    const readable = Readable.from(req.file.buffer);
    await new Promise((resolve, reject) => {
      readable.pipe(uploadStream);
      uploadStream.on('finish', resolve);
      uploadStream.on('error', reject);
    });

    const fileId = uploadStream.id;

    // Save fileId on user — avatar field set to 'photo' as sentinel
    user.avatarFileId = fileId;
    user.avatar = 'photo'; // signals that a custom photo is set
    await user.save();

    const updatedUser = await User.findById(user._id);
    res.json({
      message: 'Profile photo uploaded successfully.',
      user: updatedUser,
      avatarFileId: fileId.toString(),
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/profile/avatar/:userId — stream the avatar image
export const getAvatarPhoto = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId).select('avatarFileId avatar');
    if (!user || !user.avatarFileId || user.avatar !== 'photo') {
      return res.status(404).json({ message: 'No profile photo set.' });
    }

    const bucket = getAvatarBucket();
    const fileId = new mongoose.Types.ObjectId(user.avatarFileId);

    // Check file exists
    const files = await bucket.find({ _id: fileId }).toArray();
    if (!files.length) return res.status(404).json({ message: 'Photo not found.' });

    res.setHeader('Content-Type', files[0].metadata?.contentType || files[0].contentType || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour cache
    bucket.openDownloadStream(fileId).pipe(res);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/profile/avatar — remove profile photo, revert to initials
export const removeAvatarPhoto = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (user.avatarFileId) {
      try {
        const bucket = getAvatarBucket();
        await bucket.delete(new mongoose.Types.ObjectId(user.avatarFileId));
      } catch {
        // Missing file — ignore
      }
    }

    user.avatarFileId = null;
    user.avatar = 'avatar_1'; // revert to initials-based avatar
    await user.save();

    const updatedUser = await User.findById(user._id);
    res.json({ message: 'Profile photo removed.', user: updatedUser });
  } catch (error) {
    next(error);
  }
};

// Helper — get extension from original filename
function require_ext(filename) {
  const idx = filename.lastIndexOf('.');
  return idx >= 0 ? filename.slice(idx).toLowerCase() : '.jpg';
}
