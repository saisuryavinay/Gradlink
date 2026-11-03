import 'dotenv/config';
import app from './app.js';
import { connectDB } from './config/db.js';
import { seedAdmin } from './utils/seedAdmin.js';

const PORT = process.env.PORT || 5000;

// Validate critical env vars
const requiredVars = ['JWT_SECRET'];
const missing = requiredVars.filter((v) => !process.env[v]);
if (missing.length > 0) {
  console.error(`[CONFIG] Missing required environment variables: ${missing.join(', ')}`);
  console.error('[CONFIG] Please create a .env file based on .env.example');
  process.exit(1);
}

// Optional warnings
if (!process.env.MONGODB_URI) {
  console.warn('[CONFIG] MONGODB_URI is not set. Database features will be unavailable.');
}
if (!process.env.GEMINI_API_KEY) {
  console.warn('[CONFIG] GEMINI_API_KEY is not set. AI Resume Analyzer will be unavailable.');
}
if (!process.env.SMTP_USER) {
  console.warn('[CONFIG] SMTP_USER is not set. Email verification will be unavailable.');
}

const startServer = async () => {
  await connectDB();
  await seedAdmin();

  app.listen(PORT, () => {
    console.log(`[SERVER] GradLink API running on http://localhost:${PORT}`);
    console.log(`[SERVER] Environment: ${process.env.NODE_ENV || 'development'}`);
  });
};

startServer();
