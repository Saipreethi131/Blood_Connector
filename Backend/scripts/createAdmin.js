/**
 * CLI script to create the first admin account.
 * Usage: node scripts/createAdmin.js <email> <password> [name]
 * Example: node scripts/createAdmin.js admin@example.com MyPass123 "Super Admin"
 */
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

dotenv.config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../.env') });

import User from '../models/User.js';

const [, , email, password, name = 'Admin'] = process.argv;

if (!email || !password) {
  console.error('Usage: node scripts/createAdmin.js <email> <password> [name]');
  process.exit(1);
}

if (password.length < 6) {
  console.error('Password must be at least 6 characters');
  process.exit(1);
}

try {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const existing = await User.findOne({ email });
  if (existing) {
    console.error(`A user with email "${email}" already exists (role: ${existing.role})`);
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, 10);
  const admin = await User.create({
    name,
    email,
    password: hash,
    phone: `admin_${Date.now()}`,
    role: 'admin',
    isVerified: true,
    verificationStatus: 'approved'
  });

  console.log(`\n✅ Admin account created successfully!`);
  console.log(`   ID:    ${admin._id}`);
  console.log(`   Name:  ${admin.name}`);
  console.log(`   Email: ${admin.email}`);
  console.log(`\nYou can now log in at /login with these credentials.\n`);
} catch (err) {
  console.error('Error:', err.message);
} finally {
  await mongoose.disconnect();
  process.exit(0);
}
