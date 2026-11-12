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

// ── Trust Proxy ────────────────────────────────────────────────────────────────
// CRITICAL for Render (and any reverse-proxy host).
//
// Without this, Express sees req.ip as the internal Render load-balancer IP
// for EVERY user. All users share one rate-limit counter, so ~300 combined
// requests from anyone trips the limiter and blocks the entire platform.
//
// Setting trust proxy = 1 tells Express to trust exactly one proxy hop and
// read the real client IP from the X-Forwarded-For header that Render injects.
// Each user then gets their own independent rate-limit counter.
app.set('trust proxy', 1);

// Security
app.use(helmet());

// CORS
// Hardcoded production origins - safe to commit (these are public URLs, not secrets).
// To allow additional origins without redeploying, set CLIENT_URL as a comma-separated
// list in the Render environment variables.
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://gradlink-three.vercel.app',
  'https://gradlink-five.vercel.app',
  'https://gradlink.me',
  'https://www.gradlink.me',
  ...(process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(',').map((o) => o.trim()).filter(Boolean)
    : []),
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: Origin ${origin} not allowed.`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.options('*', cors(corsOptions));
app.use(cors(corsOptions));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Rate Limiters ──────────────────────────────────────────────────────────────
// Rate limiters are disabled in test environment to prevent 429 in Jest.
//
// With trust proxy correctly set above, each limiter uses the real client IP
// so individual users are limited independently.
//
// Design principles:
//  - Global limiter:   generous — covers all routes, stops DoS / scrapers.
//  - Login limiter:    strict   — prevents brute-force password guessing.
//  - Register limiter: strict   — prevents account-creation spam.
//  - OTP limiter:      moderate — allows reasonable email verification retries.
//  - GET /auth/me is intentionally NOT under a strict limiter: it is a
//    read-only token check fired on every dashboard page load.
// ──────────────────────────────────────────────────────────────────────────────
const isTest = process.env.NODE_ENV === 'test';

// Global — 600 req / 15 min per real client IP.
// A React SPA fires 5–10 API calls per page load; 600 leaves comfortable headroom.
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTest ? 1_000_000 : 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Please try again later.' },
  skip: () => isTest,
});
app.use(globalLimiter);

// Login — 15 attempts / 15 min per IP.
// Covers accidental typos while blocking automated brute-force.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTest ? 1_000_000 : 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Please wait 15 minutes and try again.' },
  skip: () => isTest,
});

// Registration — 10 attempts / 1 hour per IP.
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isTest ? 1_000_000 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many registration attempts. Please try again in an hour.' },
  skip: () => isTest,
});

// OTP (verify + resend) — 30 attempts / 15 min per IP.
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTest ? 1_000_000 : 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many OTP requests. Please wait a moment and try again.' },
  skip: () => isTest,
});

// ── Health check ───────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Routes ─────────────────────────────────────────────────────────────────────
// Per-route limiters are mounted BEFORE the router so they only apply to their
// specific path. The router itself has no additional auth-wide rate limiter so
// GET /api/auth/me (dashboard token check) is only subject to the global limiter.
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/register', registerLimiter);
app.use('/api/auth/verify-otp', otpLimiter);
app.use('/api/auth/resend-otp', otpLimiter);
app.use('/api/auth', authRoutes);

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
