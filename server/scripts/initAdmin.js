/**
 * GradLink — Admin Initialization Script
 * 
 * Run once: npm run init-admin
 * 
 * Required environment variables:
 *   MONGODB_URI    — MongoDB connection string
 *   ADMIN_EMAIL    — Email for the admin account (must be from allowed domain)
 *   ADMIN_PASSWORD — Password for the admin account (min 8 characters)
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../src/models/User.js';

const ALLOWED_DOMAINS = ['acet.ac.in', 'acoe.edu.in', 'aec.edu.in'];

async function initAdmin() {
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
  if (process.env.ADMIN_PASSWORD.length < 8) {
    console.error('[INIT] ADMIN_PASSWORD must be at least 8 characters.');
    process.exit(1);
  }

  const email = process.env.ADMIN_EMAIL.toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD.trim();
  // Admin accounts may use any email — domain restriction is for student/alumni only
  console.log(`[INIT] Creating admin with email: ${email}`);

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[INIT] Connected to MongoDB.');

    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log(`[INIT] An admin account already exists (${existingAdmin.email}). Initialization skipped.`);
      console.log('[INIT] To reset admin password, use the admin panel or contact the database administrator.');
      await mongoose.disconnect();
      return;
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.error(`[INIT] A user with email ${email} already exists as role: ${existingUser.role}`);
      await mongoose.disconnect();
      process.exit(1);
    }

    const admin = new User({
      name: 'Administrator',
      email,
      password,
      role: 'admin',
      isVerified: true,
      isActive: true,
    });
    // Use validateBeforeSave:false to skip the email domain validator for admin
    await admin.save({ validateBeforeSave: false });
    console.log(`[INIT] Admin account created successfully.`);
    console.log(`[INIT] Email: ${email}`);
    console.log('[INIT] IMPORTANT: Clear ADMIN_EMAIL and ADMIN_PASSWORD from your .env file after initialization.');
    console.log('[INIT] You can now log in at the GradLink admin portal.');

    await mongoose.disconnect();
  } catch (error) {
    console.error('[INIT] Error during initialization:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

initAdmin();
