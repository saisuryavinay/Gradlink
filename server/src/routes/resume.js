import { Router } from 'express';
import {
  analyzeResume, deleteResumeFile, getMyAnalyses, downloadResumeFile,
} from '../controllers/resumeController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { uploadResume, handleUploadError } from '../middleware/upload.js';

const router = Router();

router.post('/analyze', authenticate, authorize('student'), uploadResume, handleUploadError, analyzeResume);
router.get('/my-analyses', authenticate, authorize('student'), getMyAnalyses);
router.delete('/:analysisId', authenticate, authorize('student'), deleteResumeFile);
router.get('/download/:fileId', authenticate, downloadResumeFile);

export default router;
