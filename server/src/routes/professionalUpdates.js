import { Router } from 'express';
import {
  createUpdate, getUpdates, getMyUpdates, editUpdate, deleteUpdate, reviewUpdate,
} from '../controllers/professionalUpdateController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.post('/', authenticate, authorize('alumni'), createUpdate);
router.get('/', authenticate, getUpdates);
router.get('/mine', authenticate, authorize('alumni'), getMyUpdates);
router.put('/:id', authenticate, authorize('alumni'), editUpdate);
router.delete('/:id', authenticate, authorize('alumni', 'admin'), deleteUpdate);
router.patch('/:id/review', authenticate, authorize('admin'), reviewUpdate);

export default router;
