import request from 'supertest';
import { app } from '../index';
import { prisma } from '../config/prisma';
import { generateToken } from '../middleware/auth';
import { sanitizeString, deepSanitize } from '../middlewares/sanitize';

describe('Performance, Security & Pagination Pass', () => {
  let user: any;
  let token: string;

  beforeEach(async () => {
    user = await prisma.user.create({
      data: {
        email: 'security@campus.edu',
        name: 'Sec Tester',
        role: 'USER',
      },
    });
    token = generateToken(user);
  });

  describe('Input Sanitization Unit & Integration', () => {
    it('strips script tags and malicious event handlers from strings', () => {
      const malicious = '<script>alert("XSS")</script>Hello <img src=x onerror=alert(1)>world';
      const clean = sanitizeString(malicious);
      expect(clean).not.toContain('<script>');
      expect(clean).not.toContain('onerror=');
      expect(clean).toContain('Hello world');
    });

    it('strips javascript: pseudo-protocols', () => {
      const malicious = 'javascript:alert("pwned")';
      const clean = sanitizeString(malicious);
      expect(clean).not.toContain('javascript:');
    });

    it('deepSanitizes nested objects and arrays', () => {
      const payload = {
        title: 'Safe Title <script>bad()</script>',
        nested: {
          note: '<iframe src="evil.com"></iframe>Details here',
          tags: ['tag1', '<script>steal()</script>tag2'],
        },
      };

      const cleaned = deepSanitize(payload);
      expect(cleaned.title).toBe('Safe Title');
      expect(cleaned.nested.note).toBe('Details here');
      expect(cleaned.nested.tags).toEqual(['tag1', 'tag2']);
    });

    it('sanitizes input on API endpoints (POST /api/lost)', async () => {
      const res = await request(app)
        .post('/api/lost')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'AirPods <script>alert("pwned")</script>',
          description: 'Lost in cafeteria <img src=x onerror=alert(1)> please return',
          category: 'Electronics',
          location: 'Cafeteria',
          dateLost: new Date().toISOString(),
        });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe('AirPods');
      expect(res.body.data.description).not.toContain('<img');
      expect(res.body.data.description).not.toContain('onerror');
      expect(res.body.data.description).toContain('Lost in cafeteria');
    });
  });

  describe('Pagination Across Frequently Queried Endpoints', () => {
    beforeEach(async () => {
      // Seed 5 items
      for (let i = 1; i <= 5; i++) {
        await prisma.lostItem.create({
          data: {
            userId: user.id,
            title: `Item Number ${i}`,
            description: `Description for item ${i}`,
            category: 'Books',
            location: 'Library',
            dateLost: new Date(),
            status: 'open',
            isExpired: false,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });
      }
    });

    it('sets pagination headers on GET /api/lost (X-Total-Count, X-Total-Pages, etc.)', async () => {
      const res = await request(app).get('/api/lost?limit=2&page=1');

      expect(res.status).toBe(200);
      expect(res.headers['x-total-count']).toBeDefined();
      expect(res.headers['x-current-page']).toBe('1');
      expect(res.headers['x-page-size']).toBe('2');
      expect(parseInt(res.headers['x-total-pages'], 10)).toBeGreaterThanOrEqual(3);
      expect(res.body.data.length).toBe(2);
    });

    it('returns { items, meta } structure when ?paginated=true query param is used', async () => {
      const res = await request(app).get('/api/lost?limit=2&page=2&paginated=true');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('items');
      expect(res.body.data).toHaveProperty('meta');
      expect(res.body.data.meta).toMatchObject({
        page: 2,
        limit: 2,
        total: expect.any(Number),
        totalPages: expect.any(Number),
        hasPrevPage: true,
      });
      expect(res.body.data.items.length).toBe(2);
    });

    it('sets pagination headers on GET /api/rides', async () => {
      await prisma.ride.create({
        data: {
          creatorId: user.id,
          origin: 'Campus North',
          destination: 'Airport',
          departureTime: new Date(),
          totalSeats: 3,
          availableSeats: 2,
          estimatedFare: 40.0,
          status: 'OPEN',
        },
      });

      const res = await request(app).get('/api/rides?limit=5&page=1');
      expect(res.status).toBe(200);
      expect(res.headers['x-total-count']).toBeDefined();
      expect(res.headers['x-current-page']).toBe('1');
    });
  });
});

