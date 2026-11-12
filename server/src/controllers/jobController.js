import Job from '../models/Job.js';
import SavedJob from '../models/SavedJob.js';
import JobApplication from '../models/JobApplication.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import StudentProfile from '../models/StudentProfile.js';

const checkEligibility = (job, user, studentProfile) => {
  const reasons = [];

  if (job.eligibleDepartments?.length && !job.eligibleDepartments.includes(user.department)) {
    reasons.push(`Your department (${user.department}) is not eligible. Eligible: ${job.eligibleDepartments.join(', ')}`);
  }
  if (job.eligibleGraduationYears?.length && !job.eligibleGraduationYears.includes(user.graduationYear)) {
    reasons.push(`Your graduation year (${user.graduationYear}) is not eligible.`);
  }
  if (studentProfile) {
    const score = studentProfile.cgpa ?? (studentProfile.percentage != null ? studentProfile.percentage / 10 : null);
    if (job.minCGPA && (score == null || score < job.minCGPA)) {
      reasons.push(`Minimum CGPA required: ${job.minCGPA}. Your CGPA: ${studentProfile.cgpa ?? 'not set'}`);
    }
    if (job.minPercentage && (studentProfile.percentage == null || studentProfile.percentage < job.minPercentage)) {
      reasons.push(`Minimum percentage required: ${job.minPercentage}%. Your percentage: ${studentProfile.percentage ?? 'not set'}`);
    }
    if (job.maxBacklogs != null && (studentProfile.backlogs ?? 0) > job.maxBacklogs) {
      reasons.push(`Maximum backlogs allowed: ${job.maxBacklogs}. Your backlogs: ${studentProfile.backlogs}`);
    }
  }

  return { eligible: reasons.length === 0, reasons };
};

// POST /api/jobs — admin creates, alumni submits
export const createJob = async (req, res, next) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const isAlumni = req.user.role === 'alumni';

    if (!isAdmin && !isAlumni) {
      return res.status(403).json({ message: 'Only admins and alumni can post jobs.' });
    }

    const {
      company, title, description, location, jobType, category,
      requiredSkills, eligibleDepartments, eligibleGraduationYears,
      minCGPA, minPercentage, maxBacklogs, additionalEligibility,
      applicationMethod, externalUrl, applicationFormFields, deadline,
    } = req.body;

    // Alumni can only post alumni-posted jobs
    if (isAlumni && category !== 'alumni-posted') {
      return res.status(400).json({ message: 'Alumni can only submit alumni-posted job vacancies.' });
    }

    if (applicationMethod === 'external' && !externalUrl) {
      return res.status(400).json({ message: 'External URL is required for external application method.' });
    }

    const job = await Job.create({
      company: company?.trim(),
      title: title?.trim(),
      description: description?.trim(),
      location: location?.trim(),
      jobType,
      category,
      requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : [],
      eligibleDepartments: Array.isArray(eligibleDepartments) ? eligibleDepartments : [],
      eligibleGraduationYears: Array.isArray(eligibleGraduationYears) ? eligibleGraduationYears.map(Number) : [],
      minCGPA: minCGPA ? parseFloat(minCGPA) : undefined,
      minPercentage: minPercentage ? parseFloat(minPercentage) : undefined,
      maxBacklogs: maxBacklogs != null ? parseInt(maxBacklogs) : 0,
      additionalEligibility: additionalEligibility?.trim(),
      applicationMethod,
      externalUrl: externalUrl?.trim(),
      applicationFormFields: Array.isArray(applicationFormFields) ? applicationFormFields : [],
      deadline: new Date(deadline),
      status: isAdmin ? 'approved' : 'pending',
      postedBy: req.user._id,
    });

    res.status(201).json({
      message: isAdmin
        ? 'Job posted successfully.'
        : 'Job submitted for administrator review.',
      job,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/jobs — list jobs
export const getJobs = async (req, res, next) => {
  try {
    const { category, expired, page = 1, limit = 12, search } = req.query;
    const now = new Date();
    const query = { status: 'approved' };

    if (category) query.category = category;

    if (expired === 'true') {
      query.deadline = { $lt: now };
    } else {
      query.deadline = { $gte: now };
    }

    if (search) {
      query.$or = [
        { company: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Job.countDocuments(query);
    const jobs = await Job.find(query)
      .populate('postedBy', 'name currentCompany')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    res.json({ jobs, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    next(error);
  }
};

// GET /api/jobs/:id
export const getJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id).populate('postedBy', 'name currentCompany');
    if (!job) return res.status(404).json({ message: 'Job not found.' });

    let eligibility = null;
    if (req.user?.role === 'student') {
      const profile = await StudentProfile.findOne({ user: req.user._id });
      eligibility = checkEligibility(job, req.user, profile);
    }

    res.json({ job, eligibility });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/jobs/:id/approve — admin approves/rejects
export const reviewJob = async (req, res, next) => {
  try {
    const { status, adminNote } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be approved or rejected.' });
    }

    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found.' });

    job.status = status;
    if (adminNote) job.adminNote = adminNote;
    if (status === 'approved') job.approvedAt = new Date();
    else job.rejectedAt = new Date();
    await job.save();

    // Notify the alumni who submitted
    const poster = await User.findById(job.postedBy);
    if (poster?.role === 'alumni') {
      await Notification.create({
        recipient: job.postedBy,
        type: status === 'approved' ? 'job_approved' : 'job_rejected',
        title: status === 'approved' ? 'Job Vacancy Approved' : 'Job Vacancy Rejected',
        message: status === 'approved'
          ? `Your job posting "${job.title}" at ${job.company} has been approved and is now visible to students.`
          : `Your job posting "${job.title}" at ${job.company} was not approved.`,
        link: '/dashboard/jobs',
      });
    }

    res.json({ message: `Job ${status}.`, job });
  } catch (error) {
    next(error);
  }
};

// GET /api/jobs/pending — admin
export const getPendingJobs = async (req, res, next) => {
  try {
    const jobs = await Job.find({ status: 'pending' })
      .populate('postedBy', 'name email currentCompany department')
      .sort({ createdAt: -1 });
    res.json({ jobs });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/jobs/:id — admin only
export const deleteJob = async (req, res, next) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found.' });
    res.json({ message: 'Job deleted.' });
  } catch (error) {
    next(error);
  }
};

// PUT /api/jobs/:id — admin updates
export const updateJob = async (req, res, next) => {
  try {
    const job = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!job) return res.status(404).json({ message: 'Job not found.' });
    res.json({ message: 'Job updated.', job });
  } catch (error) {
    next(error);
  }
};

// --- Saved Jobs ---
export const saveJob = async (req, res, next) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, status: 'approved' });
    if (!job) return res.status(404).json({ message: 'Job not found.' });

    await SavedJob.create({ student: req.user._id, job: req.params.id });
    res.status(201).json({ message: 'Job saved.' });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'Job already saved.' });
    next(error);
  }
};

export const unsaveJob = async (req, res, next) => {
  try {
    await SavedJob.findOneAndDelete({ student: req.user._id, job: req.params.id });
    res.json({ message: 'Job removed from saved jobs.' });
  } catch (error) {
    next(error);
  }
};

export const getSavedJobs = async (req, res, next) => {
  try {
    const now = new Date();
    const saved = await SavedJob.find({ student: req.user._id })
      .populate({
        path: 'job',
        match: { status: 'approved' },
        populate: { path: 'postedBy', select: 'name currentCompany' },
      })
      .sort({ createdAt: -1 });

    const validSaved = saved.filter((s) => s.job !== null);
    res.json({ savedJobs: validSaved });
  } catch (error) {
    next(error);
  }
};

// --- Applications ---
export const applyToJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found.' });
    if (job.status !== 'approved') return res.status(400).json({ message: 'This job is not available.' });
    if (job.deadline < new Date()) return res.status(400).json({ message: 'This job deadline has passed.' });
    if (job.applicationMethod !== 'internal') {
      return res.status(400).json({ message: 'This job uses an external application method.' });
    }

    const studentProfile = await StudentProfile.findOne({ user: req.user._id });
    const { eligible, reasons } = checkEligibility(job, req.user, studentProfile);
    if (!eligible) {
      return res.status(403).json({ message: 'You are not eligible for this job.', reasons });
    }

    const application = await JobApplication.create({
      student: req.user._id,
      job: req.params.id,
      formData: req.body.formData || {},
    });

    res.status(201).json({ message: 'Application submitted.', application });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'You have already applied to this job.' });
    next(error);
  }
};

// POST /api/jobs/:id/confirm-external
// Student self-confirms they completed an external application.
// Creates a JobApplication record with status 'submitted'.
// Idempotent: returns 200 if already confirmed (no duplicate created).
export const confirmExternalApplication = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found.' });
    if (job.status !== 'approved') return res.status(400).json({ message: 'This job is not available.' });
    if (job.applicationMethod !== 'external') {
      return res.status(400).json({ message: 'This endpoint is only for external application jobs.' });
    }

    // Check if already confirmed — return early instead of creating a duplicate
    const existing = await JobApplication.findOne({
      student: req.user._id,
      job: req.params.id,
    });
    if (existing) {
      return res.status(200).json({
        message: 'You have already confirmed this application.',
        application: existing,
        alreadyApplied: true,
      });
    }

    const application = await JobApplication.create({
      student: req.user._id,
      job: req.params.id,
      status: 'submitted',
      formData: {},
    });

    res.status(201).json({
      message: 'External application confirmed and recorded.',
      application,
    });
  } catch (error) {
    if (error.code === 11000) {
      // Race condition: duplicate key — fetch and return existing record
      const existing = await JobApplication.findOne({ student: req.user._id, job: req.params.id });
      return res.status(200).json({
        message: 'Application already confirmed.',
        application: existing,
        alreadyApplied: true,
      });
    }
    next(error);
  }
};

export const getMyApplications = async (req, res, next) => {
  try {
    const apps = await JobApplication.find({ student: req.user._id })
      .populate('job', 'company title jobType location deadline category status')
      .sort({ createdAt: -1 });
    res.json({ applications: apps });
  } catch (error) {
    next(error);
  }
};

export const getJobApplications = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = { job: req.params.id };
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await JobApplication.countDocuments(query);
    const apps = await JobApplication.find(query)
      .populate('student', 'name email avatar department graduationYear')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    res.json({ applications: apps, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    next(error);
  }
};

export const updateApplicationStatus = async (req, res, next) => {
  try {
    const { status, adminNote } = req.body;
    const validStatuses = ['submitted', 'pending', 'shortlisted', 'rejected', 'selected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status.' });
    }

    const update = { status };
    if (adminNote !== undefined) update.adminNote = adminNote;

    const app = await JobApplication.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!app) return res.status(404).json({ message: 'Application not found.' });

    res.json({ message: 'Application status updated.', application: app });
  } catch (error) {
    next(error);
  }
};

// GET /api/jobs/alumni-submissions — alumni sees their own submissions
export const getMyJobSubmissions = async (req, res, next) => {
  try {
    const jobs = await Job.find({ postedBy: req.user._id }).sort({ createdAt: -1 });
    res.json({ jobs });
  } catch (error) {
    next(error);
  }
};
