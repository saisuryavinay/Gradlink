import MentorshipRequest from '../models/MentorshipRequest.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import StudentProfile from '../models/StudentProfile.js';

const VALID_TRANSITIONS = {
  student: {
    pending: ['withdrawn'],
  },
  alumni: {
    pending: ['accepted', 'rejected'],
  },
  admin: {
    pending: ['cancelled'],
    accepted: ['cancelled'],
  },
};

// POST /api/mentorship — student sends request
export const createRequest = async (req, res, next) => {
  try {
    const { alumniId, message } = req.body;

    if (!alumniId || !message) {
      return res.status(400).json({ message: 'Alumni ID and message are required.' });
    }

    const alumni = await User.findOne({ _id: alumniId, role: 'alumni', isActive: true, isVerified: true });
    if (!alumni) return res.status(404).json({ message: 'Alumni not found.' });

    if (alumni.mentorshipRestricted) {
      return res.status(403).json({ message: 'This alumni is not currently accepting mentorship requests.' });
    }

    // Check for existing pending/accepted request
    const existing = await MentorshipRequest.findOne({
      student: req.user._id,
      alumni: alumniId,
      status: { $in: ['pending', 'accepted'] },
    });
    if (existing) {
      return res.status(409).json({ message: 'You already have an active or pending request with this alumni.' });
    }

    const request = await MentorshipRequest.create({
      student: req.user._id,
      alumni: alumniId,
      message: message.trim(),
    });

    // Notify the alumni
    await Notification.create({
      recipient: alumniId,
      type: 'mentorship_request_received',
      title: 'New Mentorship Request',
      message: `${req.user.name} has sent you a mentorship request.`,
      link: '/dashboard/mentorship',
      data: { requestId: request._id },
    });

    res.status(201).json({ message: 'Mentorship request sent successfully.', request });
  } catch (error) {
    next(error);
  }
};

// GET /api/mentorship — list requests for current user
export const getRequests = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};

    if (req.user.role === 'student') query.student = req.user._id;
    else if (req.user.role === 'alumni') query.alumni = req.user._id;
    // Admin gets all

    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await MentorshipRequest.countDocuments(query);
    const requests = await MentorshipRequest.find(query)
      .populate('student', 'name email avatar department graduationYear')
      .populate('alumni', 'name avatar currentCompany currentRole department')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    // For alumni viewing requests, also attach student profile data
    const enriched = await Promise.all(
      requests.map(async (r) => {
        const obj = r.toObject();
        if (req.user.role === 'alumni' || req.user.role === 'admin') {
          const sp = await StudentProfile.findOne({ user: r.student?._id }).select(
            'cgpa percentage backlogs skills preferredRoles'
          );
          obj.studentProfile = sp;
        }
        return obj;
      })
    );

    res.json({ requests: enriched, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/mentorship/:id — update status
export const updateRequestStatus = async (req, res, next) => {
  try {
    const { status, alumniNote } = req.body;
    const request = await MentorshipRequest.findById(req.params.id);

    if (!request) return res.status(404).json({ message: 'Request not found.' });

    const role = req.user.role;
    const currentStatus = request.status;

    // Ownership checks
    if (role === 'student' && !request.student.equals(req.user._id)) {
      return res.status(403).json({ message: 'Access denied.' });
    }
    if (role === 'alumni' && !request.alumni.equals(req.user._id)) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    // Validate transition
    const allowed = VALID_TRANSITIONS[role]?.[currentStatus] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        message: `Cannot change status from "${currentStatus}" to "${status}".`,
      });
    }

    request.status = status;
    if (alumniNote) request.alumniNote = alumniNote;
    await request.save();

    // Send notification to student when alumni responds
    if (role === 'alumni') {
      const notifType = status === 'accepted' ? 'mentorship_request_accepted' : 'mentorship_request_rejected';
      const notifMessage = status === 'accepted'
        ? `${req.user.name} has accepted your mentorship request.`
        : `${req.user.name} has declined your mentorship request.`;

      await Notification.create({
        recipient: request.student,
        type: notifType,
        title: status === 'accepted' ? 'Mentorship Request Accepted' : 'Mentorship Request Declined',
        message: notifMessage,
        link: '/dashboard/mentorship',
        data: { requestId: request._id },
      });
    }

    res.json({ message: `Request ${status}.`, request });
  } catch (error) {
    next(error);
  }
};

// Admin filters
export const adminGetRequests = async (req, res, next) => {
  try {
    const { studentId, alumniId, department, status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;

    let studentIds;
    if (department) {
      const studentsInDept = await User.find({ department: { $regex: department, $options: 'i' }, role: 'student' }).select('_id');
      studentIds = studentsInDept.map((s) => s._id);
      query.student = { $in: studentIds };
    }
    if (studentId) query.student = studentId;
    if (alumniId) query.alumni = alumniId;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await MentorshipRequest.countDocuments(query);
    const requests = await MentorshipRequest.find(query)
      .populate('student', 'name email avatar department graduationYear')
      .populate('alumni', 'name avatar currentCompany currentRole department')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    res.json({ requests, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    next(error);
  }
};
