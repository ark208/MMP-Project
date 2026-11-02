import request from 'supertest';
import { app } from '../index';
import { memoryDb } from './setup';
import bcrypt from 'bcryptjs';

describe('Lost & Found Endpoints (/api/lost, /api/found)', () => {
  let studentToken: string;
  let finderToken: string;
  let studentId: string;
  let finderId: string;

  beforeEach(async () => {
    // Register Student User
    const salt = await bcrypt.genSalt(10);
    const studentOtpHash = await bcrypt.hash('123456', salt);
    memoryDb.otpTokens.push({
      email: 'student@campus.edu',
      otpHash: studentOtpHash,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    const studentLogin = await request(app)
      .post('/api/auth/verify-otp')
      .send({ email: 'student@campus.edu', otp: '123456' });

    studentToken = studentLogin.body.data.token;
    studentId = studentLogin.body.data.user.id;

    // Register Finder User
    const finderOtpHash = await bcrypt.hash('123456', salt);
    memoryDb.otpTokens.push({
      email: 'finder@campus.edu',
      otpHash: finderOtpHash,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    const finderLogin = await request(app)
      .post('/api/auth/verify-otp')
      .send({ email: 'finder@campus.edu', otp: '123456' });

    finderToken = finderLogin.body.data.token;
    finderId = finderLogin.body.data.user.id;
  });

  describe('Lost Items Flow', () => {
    it('should create a lost item with 30-day default expiry and open status', async () => {
      const payload = {
        title: 'Sony WH-1000XM4 Headphones',
        description: 'Black headphones left on 3rd floor library desk',
        category: 'Electronics',
        location: 'Central Library Floor 3',
        dateLost: new Date().toISOString(),
      };

      const res = await request(app)
        .post('/api/lost')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.title).toBe(payload.title);
      expect(res.body.data.status).toBe('open');
      expect(res.body.data.isExpired).toBe(false);
      expect(new Date(res.body.data.expiresAt).getTime()).toBeGreaterThan(Date.now());
    });

    it('should list open lost items with category filter', async () => {
      // Seed lost items
      await request(app)
        .post('/api/lost')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          title: 'Sony Headphones',
          description: 'Black headphones',
          category: 'Electronics',
          location: 'Library',
          dateLost: new Date().toISOString(),
        });

      await request(app)
        .post('/api/lost')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          title: 'Calculus Textbook',
          description: 'Math textbook',
          category: 'Books',
          location: 'Hall B',
          dateLost: new Date().toISOString(),
        });

      const res = await request(app).get('/api/lost?category=Electronics');
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].category).toBe('Electronics');
    });

    it('should update lost item status to reunited', async () => {
      const createRes = await request(app)
        .post('/api/lost')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          title: 'Lost Backpack',
          description: 'Blue backpack',
          category: 'Bags',
          location: 'Gym',
          dateLost: new Date().toISOString(),
        });

      const itemId = createRes.body.data.id;

      const updateRes = await request(app)
        .patch(`/api/lost/${itemId}/status`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ status: 'reunited' });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.status).toBe('reunited');
    });
  });

  describe('Found Items & Secret Question Claim Flow', () => {
    it('should register a found item with holding location and hide secret answer in responses', async () => {
      const payload = {
        title: 'AirPods Pro Case',
        description: 'White case found under chair 12',
        category: 'Electronics',
        location: 'Science Auditorium',
        dateFound: new Date().toISOString(),
        holdingLocation: 'security office',
        secretQuestion: 'What engraving is on the front of the case?',
        secretAnswer: 'Rocket ship',
      };

      const res = await request(app)
        .post('/api/found')
        .set('Authorization', `Bearer ${finderToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.data.holdingLocation).toBe('security office');
      expect(res.body.data.secretQuestion).toBe(payload.secretQuestion);
      // Secret answer must NEVER be returned to the client
      expect(res.body.data.secretAnswer).toBeUndefined();
    });

    it('should reject a claim when the secret answer is incorrect', async () => {
      // 1. Finder creates found item
      const createRes = await request(app)
        .post('/api/found')
        .set('Authorization', `Bearer ${finderToken}`)
        .send({
          title: 'Car Keys with Lanyard',
          description: 'Honda keys with red lanyard',
          category: 'Keys',
          location: 'North Parking Lot',
          dateFound: new Date().toISOString(),
          holdingLocation: 'with finder',
          secretQuestion: 'What keychain is attached to the ring?',
          secretAnswer: 'Eiffel Tower',
        });

      const itemId = createRes.body.data.id;

      // 2. Student attempts claim with wrong answer
      const claimRes = await request(app)
        .post(`/api/found/${itemId}/claim`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ answer: 'Statue of Liberty' });

      expect(claimRes.status).toBe(400);
      expect(claimRes.body.error.code).toBe('CLAIM_FAILED');
      expect(claimRes.body.error.message).toContain('Incorrect answer');
    });

    it('should approve a claim with the correct secret answer and reveal finder contact details', async () => {
      // 1. Finder creates found item
      const createRes = await request(app)
        .post('/api/found')
        .set('Authorization', `Bearer ${finderToken}`)
        .send({
          title: 'Hydro Flask Water Bottle',
          description: 'Blue bottle found in cafeteria',
          category: 'Personal Belongings',
          location: 'Dining Hall',
          dateFound: new Date().toISOString(),
          holdingLocation: 'with finder',
          secretQuestion: 'What sticker is on the bottom of the bottle?',
          secretAnswer: 'Yosemite',
        });

      const itemId = createRes.body.data.id;

      // 2. Student submits correct answer (case-insensitive)
      const claimRes = await request(app)
        .post(`/api/found/${itemId}/claim`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ answer: 'yosemite' });

      expect(claimRes.status).toBe(200);
      expect(claimRes.body.data.success).toBe(true);
      expect(claimRes.body.data.finderContact).toBeDefined();
      expect(claimRes.body.data.finderContact.email).toBe('finder@campus.edu');
      expect(claimRes.body.data.finderContact.holdingLocation).toBe('with finder');
      expect(claimRes.body.data.item.status).toBe('reunited');
    });
  });
});

