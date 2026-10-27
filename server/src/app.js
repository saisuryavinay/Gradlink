import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import mentorshipRoutes from './routes/mentorship.js';
import jobRoutes from './routes/jobs.js';
import updatesRoutes from './routes/updates.js';
import professionalUpdateRoutes from './routes/professionalUpdates.js';
import notificationRoutes from './routes/notifications.js';
import resumeRoutes from './routes/resume.js';
import adminRoutes from './routes/admin.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Security
app.use(helmet());

// CORS
// CLIENT_URL can be a comma-separated list of allowed origins, e.g.:
//   CLIENT_URL=https://gradlink.vercel.app,https://gradlink-git-main-user.vercel.app
const allowedOrigins = [
  'http://localhost:5173',
  ...(process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(',').map((o) => o.trim()).filter(Boolean)
    : []),
];
app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server requests (no origin) and listed origins
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: Origin ${origin} not allowed.`));
    }
  },
  credentials: true,
}));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiters — disabled in test environment to prevent 429 in Jest
const isTest = process.env.NODE_ENV === 'test';

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTest ? 1000000 : 300,
  message: { message: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTest,
});
app.use(globalLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTest ? 1000000 : 20,
  message: { message: 'Too many authentication attempts. Please try again later.' },
  skip: () => isTest,
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/mentorship', mentorshipRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/updates', updatesRoutes);
app.use('/api/professional-updates', professionalUpdateRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/admin', adminRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.path} not found.` });
});

// Error handler
app.use(errorHandler);

export default app;
