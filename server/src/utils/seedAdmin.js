import User from '../models/User.js';

/**
 * Seed or synchronize the administrator account from environment variables.
 * Safe to call on every server startup — idempotent and prevents duplicate accounts.
 */
export const seedAdmin = async () => {
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD?.trim();

  if (!adminEmail || !adminPassword) {
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount === 0) {
      console.warn('[SEED] No admin account exists and ADMIN_EMAIL / ADMIN_PASSWORD are not set in environment.');
    }
    return;
  }

  if (adminPassword.length < 8) {
    console.error('[SEED] ADMIN_PASSWORD must be at least 8 characters long.');
    return;
  }

  try {
    // 1. Check if user with adminEmail exists
    let userByEmail = await User.findOne({ email: adminEmail }).select('+password');

    if (userByEmail) {
      let needsSave = false;
      if (userByEmail.role !== 'admin') {
        userByEmail.role = 'admin';
        needsSave = true;
      }
      if (!userByEmail.isVerified) {
        userByEmail.isVerified = true;
        needsSave = true;
      }
      if (!userByEmail.isActive) {
        userByEmail.isActive = true;
        needsSave = true;
      }

      // Check if password matches
      const isPasswordMatch = await userByEmail.comparePassword(adminPassword);
      if (!isPasswordMatch) {
        userByEmail.password = adminPassword; // pre-save hook will hash it
        needsSave = true;
      }

      if (needsSave) {
        await userByEmail.save();
        console.log(`[SEED] Admin account (${adminEmail}) updated and verified successfully.`);
      } else {
        console.log(`[SEED] Admin account (${adminEmail}) is up to date.`);
      }
      return;
    }

    // 2. Check if an admin account exists under a different email
    const existingAdmin = await User.findOne({ role: 'admin' }).select('+password');
    if (existingAdmin) {
      // Sync to the configured ADMIN_EMAIL and ADMIN_PASSWORD
      existingAdmin.email = adminEmail;
      existingAdmin.password = adminPassword;
      existingAdmin.isVerified = true;
      existingAdmin.isActive = true;
      await existingAdmin.save();
      console.log(`[SEED] Existing admin account synchronized to ${adminEmail}.`);
      return;
    }

    // 3. Create a new admin account
    const newAdmin = new User({
      name: 'Administrator',
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      isVerified: true,
      isActive: true,
    });

    await newAdmin.save();
    console.log(`[SEED] Admin account created successfully for ${adminEmail}.`);
  } catch (error) {
    console.error('[SEED] Failed to seed admin account:', error.message);
  }
};

export default seedAdmin;

