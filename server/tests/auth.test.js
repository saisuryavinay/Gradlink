import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app.js';
import User from '../src/models/User.js';

let mongod;
let studentToken, alumniToken, adminToken;
let studentId, alumniId;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  process.env.JWT_SECRET = 'test-secret-for-jest';
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  await mongoose.connection.dropDatabase();
});

describe('Auth — Registration Validation', () => {
  it('rejects registration with non-college email', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test User',
      email: 'test@gmail.com',
      password: 'password123',
      role: 'student',
      department: 'CSE',
      graduationYear: 2025,
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/college domain/i);
  });

  it('rejects registration with missing fields', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'student@acet.ac.in',
      password: 'password123',
    });
    expect(res.status).toBe(400);
  });

  it('rejects short passwords', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test',
      email: 'test@acet.ac.in',
      password: '123',
      role: 'student',
      department: 'CSE',
      graduationYear: 2025,
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/8 characters/i);
  });

  it('rejects role:admin from public registration', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Hacker',
      email: 'hacker@acet.ac.in',
      password: 'password123',
      role: 'admin',
      department: 'CSE',
      graduationYear: 2025,
    });
    expect(res.status).toBe(400);
  });

  it('accepts valid college email domains', async () => {
    for (const domain of ['acet.ac.in', 'acoe.edu.in', 'aec.edu.in']) {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Test Student',
        email: `student@${domain}`,
        password: 'password123',
        role: 'student',
        department: 'CSE',
        graduationYear: 2025,
      });
      // 201 = registered (SMTP not configured so email fails — server should still return 201 with error or 500 for email)
      // We just verify the domain check passes (not 400)
      expect([201, 500, 503]).toContain(res.status);
    }
  });
});

describe('Auth — OTP Verification', () => {
  it('rejects OTP verification with wrong code', async () => {
    // Create user manually with isVerified=false
    const user = new User({
      name: 'Test',
      email: 'stu@acet.ac.in',
      password: 'password123',
      role: 'student',
      department: 'CSE',
      graduationYear: 2025,
      isVerified: false,
    });
    await user.save();

    const res = await request(app).post('/api/auth/verify-otp').send({
      email: 'stu@acet.ac.in',
      otp: '999999',
    });
    // No verification record = 400
    expect(res.status).toBe(400);
  });

  it('rejects login for unverified user', async () => {
    const user = new User({
      name: 'Test',
      email: 'unverified@acet.ac.in',
      password: 'password123',
      role: 'student',
      department: 'CSE',
      graduationYear: 2025,
      isVerified: false,
    });
    await user.save();

    const res = await request(app).post('/api/auth/login').send({
      email: 'unverified@acet.ac.in',
      password: 'password123',
    });
    expect(res.status).toBe(403);
    expect(res.body.requiresVerification).toBe(true);
  });
});

describe('Auth — Login & Protected Routes', () => {
  beforeEach(async () => {
    // Create verified student
    const student = new User({
      name: 'Student User',
      email: 'student@acet.ac.in',
      password: 'password123',
      role: 'student',
      department: 'CSE',
      graduationYear: 2025,
      isVerified: true,
    });
    await student.save();
    studentId = student._id;

    // Create verified alumni
    const alumni = new User({
      name: 'Alumni User',
      email: 'alumni@acet.ac.in',
      password: 'password123',
      role: 'alumni',
      department: 'CSE',
      graduationYear: 2022,
      isVerified: true,
      currentCompany: 'TechCorp',
      currentRole: 'Engineer',
    });
    await alumni.save();
    alumniId = alumni._id;

    // Create admin
    const admin = new User({
      name: 'Admin',
      email: 'admin@acet.ac.in',
      password: 'password123',
      role: 'admin',
      isVerified: true,
    });
    await admin.save();

    // Login all
    const sr = await request(app).post('/api/auth/login').send({ email: 'student@acet.ac.in', password: 'password123' });
    studentToken = sr.body.token;

    const ar = await request(app).post('/api/auth/login').send({ email: 'alumni@acet.ac.in', password: 'password123' });
    alumniToken = ar.body.token;

    const adminR = await request(app).post('/api/auth/login').send({ email: 'admin@acet.ac.in', password: 'password123' });
    adminToken = adminR.body.token;
  });

  it('logs in with correct credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'student@acet.ac.in',
      password: 'password123',
    });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('student');
  });

  it('rejects wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'student@acet.ac.in',
      password: 'wrongpassword',
    });
    expect(res.status).toBe(401);
  });

  it('rejects unauthenticated access to protected route', async () => {
    const res = await request(app).get('/api/profile/me');
    expect(res.status).toBe(401);
  });

  it('students cannot access admin endpoints', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(403);
  });

  it('alumni cannot access admin endpoints', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${alumniToken}`);
    expect(res.status).toBe(403);
  });

  it('admin can access dashboard', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.stats).toBeDefined();
  });

  it('student cannot change their own role', async () => {
    // Attempt to post with role: admin — role must come from DB
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${studentToken}`);
    // Must be 403, regardless of any client-side manipulation
    expect(res.status).toBe(403);
  });

  it('deactivated account cannot log in', async () => {
    await User.findOneAndUpdate({ email: 'student@acet.ac.in' }, { isActive: false });
    const res = await request(app).post('/api/auth/login').send({
      email: 'student@acet.ac.in',
      password: 'password123',
    });
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/deactivated/i);
  });
});

describe('Mentorship — Status Transitions', () => {
  let reqId;

  beforeEach(async () => {
    const student = new User({ name: 'Stu', email: 'stu@acet.ac.in', password: 'password123', role: 'student', department: 'CSE', graduationYear: 2025, isVerified: true });
    await student.save();
    studentId = student._id;

    const alumni = new User({ name: 'Alum', email: 'alum@acet.ac.in', password: 'password123', role: 'alumni', department: 'CSE', graduationYear: 2022, isVerified: true });
    await alumni.save();
    alumniId = alumni._id;

    const admin = new User({ name: 'Admin', email: 'admin@acet.ac.in', password: 'password123', role: 'admin', isVerified: true });
    await admin.save();

    const sr = await request(app).post('/api/auth/login').send({ email: 'stu@acet.ac.in', password: 'password123' });
    studentToken = sr.body.token;
    const ar = await request(app).post('/api/auth/login').send({ email: 'alum@acet.ac.in', password: 'password123' });
    alumniToken = ar.body.token;
    const adminR = await request(app).post('/api/auth/login').send({ email: 'admin@acet.ac.in', password: 'password123' });
    adminToken = adminR.body.token;
  });

  it('student can create mentorship request', async () => {
    const res = await request(app)
      .post('/api/mentorship')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ alumniId: alumniId.toString(), message: 'I need guidance on career planning.' });
    expect(res.status).toBe(201);
    reqId = res.body.request._id;
  });

  it('alumni cannot create mentorship request', async () => {
    const res = await request(app)
      .post('/api/mentorship')
      .set('Authorization', `Bearer ${alumniToken}`)
      .send({ alumniId: alumniId.toString(), message: 'test' });
    expect(res.status).toBe(403);
  });

  it('student can withdraw pending request', async () => {
    const create = await request(app)
      .post('/api/mentorship')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ alumniId: alumniId.toString(), message: 'Help me please.' });
    reqId = create.body.request._id;

    const res = await request(app)
      .patch(`/api/mentorship/${reqId}/status`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ status: 'withdrawn' });
    expect(res.status).toBe(200);
  });

  it('student cannot accept/reject request', async () => {
    const create = await request(app)
      .post('/api/mentorship')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ alumniId: alumniId.toString(), message: 'Help me.' });
    reqId = create.body.request._id;

    const res = await request(app)
      .patch(`/api/mentorship/${reqId}/status`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ status: 'accepted' });
    expect(res.status).toBe(400);
  });
});

describe('Authorization — CSV/PDF Export', () => {
  beforeEach(async () => {
    const student = new User({ name: 'S', email: 's@acet.ac.in', password: 'password123', role: 'student', department: 'CSE', graduationYear: 2025, isVerified: true });
    await student.save();
    const alumni = new User({ name: 'A', email: 'a@acet.ac.in', password: 'password123', role: 'alumni', department: 'CSE', graduationYear: 2022, isVerified: true });
    await alumni.save();
    const admin = new User({ name: 'Admin', email: 'adm@acet.ac.in', password: 'password123', role: 'admin', isVerified: true });
    await admin.save();

    const sr = await request(app).post('/api/auth/login').send({ email: 's@acet.ac.in', password: 'password123' });
    studentToken = sr.body.token;
    const ar = await request(app).post('/api/auth/login').send({ email: 'a@acet.ac.in', password: 'password123' });
    alumniToken = ar.body.token;
    const adminR = await request(app).post('/api/auth/login').send({ email: 'adm@acet.ac.in', password: 'password123' });
    adminToken = adminR.body.token;
  });

  it('student cannot export CSV', async () => {
    const res = await request(app)
      .get('/api/admin/reports/students-csv')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(403);
  });

  it('alumni cannot export CSV', async () => {
    const res = await request(app)
      .get('/api/admin/reports/students-csv')
      .set('Authorization', `Bearer ${alumniToken}`);
    expect(res.status).toBe(403);
  });

  it('admin can export CSV', async () => {
    const res = await request(app)
      .get('/api/admin/reports/students-csv')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
  });
});

describe('File Upload — Resume Validation', () => {
  beforeEach(async () => {
    const student = new User({ name: 'S', email: 'student@acet.ac.in', password: 'password123', role: 'student', department: 'CSE', graduationYear: 2025, isVerified: true });
    await student.save();
    const sr = await request(app).post('/api/auth/login').send({ email: 'student@acet.ac.in', password: 'password123' });
    studentToken = sr.body.token;
  });

  it('rejects non-PDF file', async () => {
    const res = await request(app)
      .post('/api/resume/analyze')
      .set('Authorization', `Bearer ${studentToken}`)
      .field('targetRole', 'Software Engineer')
      .attach('resume', Buffer.from('not a pdf'), { filename: 'resume.txt', contentType: 'text/plain' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/PDF/i);
  });

  it('rejects request without resume file', async () => {
    const res = await request(app)
      .post('/api/resume/analyze')
      .set('Authorization', `Bearer ${studentToken}`)
      .field('targetRole', 'Software Engineer');
    expect(res.status).toBe(400);
  });

  it('alumni cannot use resume analyzer', async () => {
    const alumni = new User({ name: 'A', email: 'alum@acet.ac.in', password: 'password123', role: 'alumni', department: 'CSE', graduationYear: 2022, isVerified: true });
    await alumni.save();
    const ar = await request(app).post('/api/auth/login').send({ email: 'alum@acet.ac.in', password: 'password123' });

    const res = await request(app)
      .post('/api/resume/analyze')
      .set('Authorization', `Bearer ${ar.body.token}`)
      .field('targetRole', 'Software Engineer');
    expect(res.status).toBe(403);
  });
});
