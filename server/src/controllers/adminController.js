import User from '../models/User.js';
import Job from '../models/Job.js';
import JobApplication from '../models/JobApplication.js';
import StudentProfile from '../models/StudentProfile.js';
import AlumniProfile from '../models/AlumniProfile.js';
import MentorshipRequest from '../models/MentorshipRequest.js';
import { createObjectCsvStringifier } from 'csv-writer';
import PDFDocument from 'pdfkit';

// GET /api/admin/dashboard
export const getDashboardStats = async (req, res, next) => {
  try {
    const now = new Date();

    const [
      totalStudents,
      totalAlumni,
      activeJobs,
      pendingJobApprovals,
      totalApplications,
      shortlisted,
      selected,
      upcomingDeadlines,
    ] = await Promise.all([
      User.countDocuments({ role: 'student', isActive: true }),
      User.countDocuments({ role: 'alumni', isActive: true }),
      Job.countDocuments({ status: 'approved', deadline: { $gte: now } }),
      Job.countDocuments({ status: 'pending' }),
      JobApplication.countDocuments(),
      JobApplication.countDocuments({ status: 'shortlisted' }),
      JobApplication.countDocuments({ status: 'selected' }),
      Job.find({ status: 'approved', deadline: { $gte: now, $lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) } })
        .select('company title deadline')
        .sort({ deadline: 1 })
        .limit(5),
    ]);

    res.json({
      stats: { totalStudents, totalAlumni, activeJobs, pendingJobApprovals, totalApplications, shortlisted, selected },
      upcomingDeadlines,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/users
export const getUsers = async (req, res, next) => {
  try {
    const { role, department, graduationYear, isActive, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (role) query.role = role;
    if (department) query.department = { $regex: department, $options: 'i' };
    if (graduationYear) query.graduationYear = parseInt(graduationYear);
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    res.json({ users, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/users/:id/deactivate
export const deactivateUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot deactivate your own account.' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({ message: 'Account deactivated.', user });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/users/:id/reactivate
export const reactivateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: true, deactivationRequestedAt: null }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({ message: 'Account reactivated.', user });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/users/:id/mentorship-restrict
export const toggleMentorshipRestrict = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role !== 'alumni') return res.status(404).json({ message: 'Alumni not found.' });
    user.mentorshipRestricted = !user.mentorshipRestricted;
    await user.save();
    res.json({ message: `Mentorship ${user.mentorshipRestricted ? 'restricted' : 'unrestricted'}.`, user });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/users/:id/reset-password
export const adminResetPassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters.' });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password reset successfully.' });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/applications
export const getAllApplications = async (req, res, next) => {
  try {
    const { jobId, status, search, page = 1, limit = 20 } = req.query;
    const query = {};
    if (jobId) query.job = jobId;
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await JobApplication.countDocuments(query);
    let apps = await JobApplication.find(query)
      .populate('student', 'name email avatar department graduationYear')
      .populate('job', 'company title category deadline')
      .select('+adminNote')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    if (search) {
      const s = search.toLowerCase();
      apps = apps.filter(
        (a) => a.student?.name?.toLowerCase().includes(s) || a.student?.email?.toLowerCase().includes(s)
      );
    }

    res.json({ applications: apps, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/reports/students-csv
export const exportStudentsCSV = async (req, res, next) => {
  try {
    const students = await User.find({ role: 'student' }).select('name email department graduationYear isActive');
    const profiles = await StudentProfile.find({ user: { $in: students.map((s) => s._id) } });
    const profileMap = Object.fromEntries(profiles.map((p) => [p.user.toString(), p]));
    const applications = await JobApplication.find({ status: 'selected' }).select('student');
    const selectedStudents = new Set(applications.map((a) => a.student.toString()));
    const shortlistedStudents = new Set(
      (await JobApplication.find({ status: 'shortlisted' }).select('student')).map((a) => a.student.toString())
    );

    const records = students.map((s) => {
      const profile = profileMap[s._id.toString()];
      const isSelected = selectedStudents.has(s._id.toString());
      const isShortlisted = shortlistedStudents.has(s._id.toString());
      return {
        name: s.name,
        email: s.email,
        department: s.department || '',
        graduationYear: s.graduationYear || '',
        cgpa: profile?.cgpa ?? '',
        percentage: profile?.percentage ?? '',
        backlogs: profile?.backlogs ?? '',
        placementStatus: isSelected ? 'Placed' : isShortlisted ? 'In Progress' : 'Not Placed',
      };
    });

    const csvStringifier = createObjectCsvStringifier({
      header: [
        { id: 'name', title: 'Name' },
        { id: 'email', title: 'Email' },
        { id: 'department', title: 'Department' },
        { id: 'graduationYear', title: 'Graduation Year' },
        { id: 'cgpa', title: 'CGPA' },
        { id: 'percentage', title: 'Percentage' },
        { id: 'backlogs', title: 'Backlogs' },
        { id: 'placementStatus', title: 'Placement Status' },
      ],
    });

    const csv = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=students_placement.csv');
    res.send(csv);
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/reports/student-profile-pdf/:studentId
export const exportStudentProfilePDF = async (req, res, next) => {
  try {
    const user = await User.findOne({ _id: req.params.studentId, role: 'student' });
    if (!user) return res.status(404).json({ message: 'Student not found.' });

    const profile = await StudentProfile.findOne({ user: user._id });

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${user.name.replace(/\s+/g, '_')}_profile.pdf`);
    doc.pipe(res);

    // Header
    doc.fontSize(20).fillColor('#1D4ED8').text('GradLink — Student Placement Profile', { align: 'center' });
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(560, doc.y).stroke('#CBD5E1');
    doc.moveDown(0.5);

    // Student details
    const field = (label, value) => {
      if (value == null || value === '' || (Array.isArray(value) && value.length === 0)) return;
      doc.fontSize(11).fillColor('#374151').font('Helvetica-Bold').text(`${label}: `, { continued: true });
      doc.font('Helvetica').fillColor('#111827').text(Array.isArray(value) ? value.join(', ') : String(value));
    };

    doc.fontSize(14).fillColor('#1E40AF').font('Helvetica-Bold').text('Personal Information');
    doc.moveDown(0.3);
    field('Name', user.name);
    field('Department', user.department);
    field('Graduation Year', user.graduationYear);
    field('Email', user.email);
    doc.moveDown();

    doc.fontSize(14).fillColor('#1E40AF').font('Helvetica-Bold').text('Academic Details');
    doc.moveDown(0.3);
    field('CGPA', profile?.cgpa);
    field('Percentage', profile?.percentage ? `${profile.percentage}%` : null);
    field('Backlogs', profile?.backlogs ?? 0);
    doc.moveDown();

    if (profile?.skills?.length) {
      doc.fontSize(14).fillColor('#1E40AF').font('Helvetica-Bold').text('Skills');
      doc.moveDown(0.3);
      field('Skills', profile.skills);
      doc.moveDown();
    }

    if (profile?.preferredRoles?.length) {
      doc.fontSize(14).fillColor('#1E40AF').font('Helvetica-Bold').text('Preferences');
      doc.moveDown(0.3);
      field('Preferred Roles', profile.preferredRoles);
      field('Preferred Locations', profile.preferredLocations);
      field('Job Type', profile.jobTypePreference);
      doc.moveDown();
    }

    if (profile?.projects?.length) {
      doc.fontSize(14).fillColor('#1E40AF').font('Helvetica-Bold').text('Projects');
      doc.moveDown(0.3);
      profile.projects.forEach((p) => {
        doc.fontSize(11).fillColor('#374151').font('Helvetica-Bold').text(p.title);
        if (p.description) doc.font('Helvetica').text(p.description);
        if (p.technologies?.length) doc.font('Helvetica').fillColor('#6B7280').text(`Technologies: ${p.technologies.join(', ')}`);
        doc.moveDown(0.3);
      });
    }

    if (profile?.certifications?.length) {
      doc.fontSize(14).fillColor('#1E40AF').font('Helvetica-Bold').text('Certifications');
      doc.moveDown(0.3);
      profile.certifications.forEach((c) => {
        doc.fontSize(11).font('Helvetica').fillColor('#374151').text(`${c.title} — ${c.issuer} (${c.year})`);
      });
      doc.moveDown();
    }

    doc.moveDown();
    doc.fontSize(10).fillColor('#9CA3AF').text(`Generated by GradLink on ${new Date().toLocaleDateString()}`, { align: 'center' });

    doc.end();
  } catch (error) {
    next(error);
  }
};
