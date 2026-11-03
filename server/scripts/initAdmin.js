/**
 * GradLink — Admin Initialization Script
 * 
 * Run once or when needed: npm run init-admin
 * 
 * Required environment variables:
 *   MONGODB_URI    — MongoDB connection string
 *   ADMIN_EMAIL    — Email for the admin account
 *   ADMIN_PASSWORD — Password for the admin account (min 8 characters)
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { seedAdmin } from '../src/utils/seedAdmin.js';

async function run() {
  if (!process.env.MONGODB_URI) {
    console.error('[INIT] MONGODB_URI is not set. Cannot connect to database.');
    process.exit(1);
  }
  if (!process.env.ADMIN_EMAIL) {
    console.error('[INIT] ADMIN_EMAIL is not set in .env');
    process.exit(1);
  }
  if (!process.env.ADMIN_PASSWORD) {
    console.error('[INIT] ADMIN_PASSWORD is not set in .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[INIT] Connected to MongoDB.');

    await seedAdmin();

    await mongoose.disconnect();
    console.log('[INIT] Done.');
  } catch (error) {
    console.error('[INIT] Error during initialization:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

run();
