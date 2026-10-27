import { Router } from 'express';
import {
  getDashboardStats, getUsers, deactivateUser, reactivateUser,
  toggleMentorshipRestrict, adminResetPassword, getAllApplications,
  exportStudentsCSV, exportStudentProfilePDF,
} from '../controllers/adminController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// All admin routes require admin role
router.use(authenticate, authorize('admin'));

router.get('/dashboard', getDashboardStats);
router.get('/users', getUsers);
router.patch('/users/:id/deactivate', deactivateUser);
router.patch('/users/:id/reactivate', reactivateUser);
router.patch('/users/:id/mentorship-restrict', toggleMentorshipRestrict);
router.patch('/users/:id/reset-password', adminResetPassword);
router.get('/applications', getAllApplications);
router.get('/reports/students-csv', exportStudentsCSV);
router.get('/reports/student-profile-pdf/:studentId', exportStudentProfilePDF);

export default router;
