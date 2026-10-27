import { Router } from 'express';
import {
  getNotifications, markAllRead, markOneRead,
} from '../controllers/notificationController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, getNotifications);
router.patch('/read-all', authenticate, markAllRead);
router.patch('/:id/read', authenticate, markOneRead);

export default router;
