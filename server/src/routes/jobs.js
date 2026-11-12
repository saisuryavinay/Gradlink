import { Router } from 'express';
import {
  createJob, getJobs, getJob, reviewJob, getPendingJobs,
  deleteJob, updateJob, saveJob, unsaveJob, getSavedJobs,
  applyToJob, confirmExternalApplication, getMyApplications,
  getJobApplications, updateApplicationStatus, getMyJobSubmissions,
} from '../controllers/jobController.js';
import { downloadApplicationPDF } from '../controllers/applicationController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// ── Static / prefixed routes MUST come before /:id ──────────────────────────
router.get('/pending', authenticate, authorize('admin'), getPendingJobs);
router.get('/saved', authenticate, authorize('student'), getSavedJobs);
router.get('/my-applications', authenticate, authorize('student'), getMyApplications);
router.get('/my-submissions', authenticate, authorize('alumni'), getMyJobSubmissions);

// Applications sub-routes — keep BEFORE /:id to avoid param collision
router.patch('/applications/:id/status', authenticate, authorize('admin'), updateApplicationStatus);
router.get('/applications/:id/pdf', authenticate, authorize('student'), downloadApplicationPDF);

// ── CRUD ─────────────────────────────────────────────────────────────────────
router.post('/', authenticate, authorize('admin', 'alumni'), createJob);
router.get('/', authenticate, getJobs);
router.get('/:id', authenticate, getJob);
router.put('/:id', authenticate, authorize('admin'), updateJob);
router.delete('/:id', authenticate, authorize('admin', 'alumni'), deleteJob);
router.patch('/:id/review', authenticate, authorize('admin'), reviewJob);

// Saved jobs
router.post('/:id/save', authenticate, authorize('student'), saveJob);
router.delete('/:id/save', authenticate, authorize('student'), unsaveJob);

// Apply (internal)
router.post('/:id/apply', authenticate, authorize('student'), applyToJob);
// Confirm external application (self-reported by student)
router.post('/:id/confirm-external', authenticate, authorize('student'), confirmExternalApplication);
router.get('/:id/applications', authenticate, authorize('admin'), getJobApplications);

export default router;
