import { Router } from 'express';
import {
  getMyProfile, updateMyProfile, getAlumniDirectory,
  getAlumniProfile, getStudentProfile, requestDeactivation,
  uploadAvatarPhoto, getAvatarPhoto, removeAvatarPhoto,
} from '../controllers/profileController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { uploadAvatar, handleUploadError } from '../middleware/upload.js';

const router = Router();

router.get('/me', authenticate, getMyProfile);
router.put('/me', authenticate, updateMyProfile);
router.post('/deactivate-request', authenticate, requestDeactivation);

// Avatar routes
router.post('/avatar', authenticate, uploadAvatar, handleUploadError, uploadAvatarPhoto);
router.get('/avatar/:userId', getAvatarPhoto);  // public — no auth needed (for img src)
router.delete('/avatar', authenticate, removeAvatarPhoto);

router.get('/alumni', authenticate, getAlumniDirectory);
router.get('/alumni/:id', authenticate, getAlumniProfile);
router.get('/student/:id', authenticate, authorize('admin'), getStudentProfile);

export default router;
