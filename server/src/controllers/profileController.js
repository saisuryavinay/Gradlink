import User from '../models/User.js';
import StudentProfile from '../models/StudentProfile.js';
import AlumniProfile from '../models/AlumniProfile.js';

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
