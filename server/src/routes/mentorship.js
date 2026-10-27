import { Router } from 'express';
import {
  createRequest, getRequests, updateRequestStatus, adminGetRequests,
} from '../controllers/mentorshipController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.post('/', authenticate, authorize('student'), createRequest);
router.get('/', authenticate, getRequests);
router.patch('/:id/status', authenticate, updateRequestStatus);
router.get('/admin/all', authenticate, authorize('admin'), adminGetRequests);

export default router;
