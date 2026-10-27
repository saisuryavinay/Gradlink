import { Router } from 'express';
import {
  createUpdate, getUpdates, updatePlacementUpdate, deletePlacementUpdate, publishUpdate,
  createEvent, getEvents, updateEvent, deleteEvent, publishEvent,
} from '../controllers/updatesController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// Placement updates
router.post('/placement', authenticate, authorize('admin'), createUpdate);
router.get('/placement', authenticate, getUpdates);
router.put('/placement/:id', authenticate, authorize('admin'), updatePlacementUpdate);
router.delete('/placement/:id', authenticate, authorize('admin'), deletePlacementUpdate);
router.patch('/placement/:id/publish', authenticate, authorize('admin'), publishUpdate);

// Events
router.post('/events', authenticate, authorize('admin'), createEvent);
router.get('/events', authenticate, getEvents);
router.put('/events/:id', authenticate, authorize('admin'), updateEvent);
router.delete('/events/:id', authenticate, authorize('admin'), deleteEvent);
router.patch('/events/:id/publish', authenticate, authorize('admin'), publishEvent);

export default router;
