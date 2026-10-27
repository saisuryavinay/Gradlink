import { Router } from 'express';
import { register, login, verifyOTP, resendOTP, getMe, changePassword } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.get('/me', authenticate, getMe);
router.post('/change-password', authenticate, changePassword);

export default router;
