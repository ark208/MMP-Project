import request from 'supertest';
import { app } from '../index';
import { memoryDb } from './setup';
import bcrypt from 'bcryptjs';

describe('Auth Endpoints (/api/auth)', () => {
  describe('POST /api/auth/request-otp', () => {
    it('should reject email from an unapproved domain', async () => {
      const res = await request(app)
        .post('/api/auth/request-otp')
        .send({ email: 'intruder@gmail.com' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.code).toBe('INVALID_EMAIL_DOMAIN');
      expect(res.body.error.message).toContain('Only university email addresses');
    });

    it('should reject invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/request-otp')
        .send({ email: 'not-an-email' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should accept valid @campus.edu email and store hashed OTP with expiry', async () => {
      const res = await request(app)
        .post('/api/auth/request-otp')
        .send({ email: 'student@campus.edu' });

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.message).toBe('OTP sent successfully');
      expect(res.body.data.email).toBe('student@campus.edu');

      // Verify OTP was saved in DB
      expect(memoryDb.otpTokens.length).toBe(1);
      const tokenRecord = memoryDb.otpTokens[0];
      expect(tokenRecord.email).toBe('student@campus.edu');
      expect(tokenRecord.otpHash).toBeDefined();
      expect(new Date(tokenRecord.expiresAt).getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('POST /api/auth/verify-otp', () => {
    it('should reject an incorrect OTP', async () => {
      // Seed OTP
      const salt = await bcrypt.genSalt(10);
      const otpHash = await bcrypt.hash('654321', salt);
      memoryDb.otpTokens.push({
        email: 'student@campus.edu',
        otpHash,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      });

      const res = await request(app)
        .post('/api/auth/verify-otp')
        .send({ email: 'student@campus.edu', otp: '999999' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_OTP');
    });

    it('should verify correct OTP, create user on first login, and return JWT token', async () => {
      const plainOtp = '789123';
      const salt = await bcrypt.genSalt(10);
      const otpHash = await bcrypt.hash(plainOtp, salt);
      memoryDb.otpTokens.push({
        email: 'newstudent@campus.edu',
        otpHash,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      });

      const res = await request(app)
        .post('/api/auth/verify-otp')
        .send({ email: 'newstudent@campus.edu', otp: plainOtp });

      expect(res.status).toBe(200);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe('newstudent@campus.edu');
      expect(res.body.data.user.role).toBe('USER');

      // User must now exist in DB
      expect(memoryDb.users.some((u) => u.email === 'newstudent@campus.edu')).toBe(true);
    });
  });

  describe('GET /api/me', () => {
    it('should reject requests without authorization token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return profile for valid Bearer token', async () => {
      // 1. Verify OTP to get token
      const plainOtp = '123456';
      const salt = await bcrypt.genSalt(10);
      const otpHash = await bcrypt.hash(plainOtp, salt);
      memoryDb.otpTokens.push({
        email: 'alex@campus.edu',
        otpHash,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      });

      const loginRes = await request(app)
        .post('/api/auth/verify-otp')
        .send({ email: 'alex@campus.edu', otp: plainOtp });

      const token = loginRes.body.data.token;

      // 2. Fetch /api/auth/me
      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(meRes.status).toBe(200);
      expect(meRes.body.data.email).toBe('alex@campus.edu');

      // 3. Update profile via PATCH /api/me
      const patchRes = await request(app)
        .patch('/api/me')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Alex Rivera',
          department: 'Computer Science',
          year: '4th Year',
          phone: '+15551234567',
        });

      expect(patchRes.status).toBe(200);
      expect(patchRes.body.data.name).toBe('Alex Rivera');
      expect(patchRes.body.data.department).toBe('Computer Science');
      expect(patchRes.body.data.year).toBe('4th Year');
      expect(patchRes.body.data.phone).toBe('+15551234567');
    });
  });
});

