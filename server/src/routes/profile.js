import { Router } from 'express';
import {
  getMyProfile, updateMyProfile, getAlumniDirectory,
  getAlumniProfile, getStudentProfile, requestDeactivation,
} from '../controllers/profileController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.get('/me', authenticate, getMyProfile);
router.put('/me', authenticate, updateMyProfile);
router.post('/deactivate-request', authenticate, requestDeactivation);
router.get('/alumni', authenticate, getAlumniDirectory);
router.get('/alumni/:id', authenticate, getAlumniProfile);
router.get('/student/:id', authenticate, authorize('admin'), getStudentProfile);

export default router;
