import request from 'supertest';
import { app } from '../index';
import { prisma } from '../config/prisma';
import { generateToken } from '../middleware/auth';

describe('Reports, Admin Moderation & Basic Analytics', () => {
  let adminUser: any;
  let normalUser: any;
  let targetUser: any;
  let adminToken: string;
  let normalToken: string;

  beforeEach(async () => {
    adminUser = await prisma.user.create({
      data: {
        email: 'admin@campus.edu',
        name: 'Campus Admin',
        role: 'ADMIN',
      },
    });

    normalUser = await prisma.user.create({
      data: {
        email: 'student@campus.edu',
        name: 'Regular Student',
        role: 'USER',
      },
    });

    targetUser = await prisma.user.create({
      data: {
        email: 'spammer@campus.edu',
        name: 'Spam User',
        role: 'USER',
      },
    });

    adminToken = generateToken(adminUser);
    normalToken = generateToken(normalUser);
  });

  describe('POST /api/reports (Report Any Post or User)', () => {
    it('creates a report against a marketplace listing', async () => {
      const listing = await prisma.listing.create({
        data: {
          sellerId: targetUser.id,
          title: 'Suspicious Cheap iPhone',
          description: 'Selling brand new sealed iPhone for $50',
          price: 50.0,
          category: 'Electronics',
          condition: 'new',
          imageUrls: [],
          status: 'available',
          isExpired: false,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      const res = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${normalToken}`)
        .send({
          targetType: 'LISTING',
          targetId: listing.id,
          reason: 'Suspected scam / counterfeit item',
          details: 'Price is unrealistic and account was created today',
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toMatchObject({
        targetType: 'LISTING',
        targetId: listing.id,
        reason: 'Suspected scam / counterfeit item',
        status: 'pending',
      });
    });

    it('creates a report against a user', async () => {
      const res = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${normalToken}`)
        .send({
          targetType: 'USER',
          targetId: targetUser.id,
          reason: 'Harassment and abusive chat messages',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.targetType).toBe('USER');
      expect(res.body.data.targetId).toBe(targetUser.id);
    });

    it('returns 404 when reporting a target that does not exist', async () => {
      const res = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${normalToken}`)
        .send({
          targetType: 'LOST_ITEM',
          targetId: 'non_existent_lost_id',
          reason: 'Inappropriate content',
        });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('requires authentication to submit a report', async () => {
      const res = await request(app)
        .post('/api/reports')
        .send({
          targetType: 'USER',
          targetId: targetUser.id,
          reason: 'Spam',
        });

      expect(res.status).toBe(401);
    });
  });

  describe('Role-Checking Middleware & Admin Routes', () => {
    it('blocks non-admin users from accessing /api/admin/reports with 403 FORBIDDEN', async () => {
      const res = await request(app)
        .get('/api/admin/reports')
        .set('Authorization', `Bearer ${normalToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('allows admin users to view all reports with filtering via GET /api/admin/reports', async () => {
      await prisma.report.create({
        data: {
          reporterId: normalUser.id,
          targetType: 'LISTING',
          targetId: 'list_123',
          reason: 'Copyright infringement',
          status: 'pending',
        },
      });

      const res = await request(app)
        .get('/api/admin/reports?status=pending')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].reason).toBe('Copyright infringement');
      expect(res.body.data[0].reporter.email).toBe('student@campus.edu');
    });

    it('allows admin to delete offending posts via DELETE /api/admin/posts/:type/:id', async () => {
      const badListing = await prisma.listing.create({
        data: {
          sellerId: targetUser.id,
          title: 'Offensive T-shirt',
          description: 'Violates campus policy',
          price: 15.0,
          category: 'Clothing',
          condition: 'used',
          imageUrls: [],
          status: 'available',
          isExpired: false,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      const res = await request(app)
        .delete(`/api/admin/posts/listing/${badListing.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({
        type: 'listing',
        id: badListing.id,
        deleted: true,
      });

      // Confirm listing was removed from DB
      const check = await prisma.listing.findUnique({ where: { id: badListing.id } });
      expect(check).toBeNull();
    });

    it('allows admin to ban a user and prevents banned user from accessing protected endpoints', async () => {
      // 1. Admin bans the user
      const banRes = await request(app)
        .patch(`/api/admin/users/${targetUser.id}/ban`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          isBanned: true,
          reason: 'Spamming fake listings',
        });

      expect(banRes.status).toBe(200);
      expect(banRes.body.data.isBanned).toBe(true);

      // 2. Generate token for banned user and attempt request
      const bannedUserToken = generateToken({
        id: targetUser.id,
        email: targetUser.email,
        name: targetUser.name,
      });

      const meRes = await request(app)
        .get('/api/me')
        .set('Authorization', `Bearer ${bannedUserToken}`);

      expect(meRes.status).toBe(403);
      expect(meRes.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('GET /api/admin/analytics (Admin Platform Metrics)', () => {
    it('blocks non-admin users with 403', async () => {
      const res = await request(app)
        .get('/api/admin/analytics')
        .set('Authorization', `Bearer ${normalToken}`);

      expect(res.status).toBe(403);
    });

    it('computes correct platform analytics for admins', async () => {
      // Seed some test metrics:
      // 1. Reunited lost item
      await prisma.lostItem.create({
        data: {
          userId: normalUser.id,
          title: 'Reunited Glasses',
          description: 'Found my glasses',
          category: 'Accessories',
          location: 'Library',
          dateLost: new Date(),
          status: 'reunited',
          isExpired: false,
          expiresAt: new Date(),
        },
      });

      // 2. Reunited found item
      await prisma.foundItem.create({
        data: {
          userId: adminUser.id,
          title: 'Reunited Umbrella',
          description: 'Owner collected it',
          category: 'Other',
          location: 'Main Gate',
          dateFound: new Date(),
          holdingLocation: 'with finder',
          secretQuestion: 'Color?',
          secretAnswer: 'hash',
          status: 'reunited',
          isExpired: false,
          expiresAt: new Date(),
        },
      });

      // 3. Completed ride
      await prisma.ride.create({
        data: {
          creatorId: normalUser.id,
          origin: 'Dorm A',
          destination: 'Airport',
          departureTime: new Date(),
          totalSeats: 3,
          availableSeats: 0,
          estimatedFare: 45.0,
          status: 'COMPLETED',
        },
      });

      // 4. Active listing
      await prisma.listing.create({
        data: {
          sellerId: normalUser.id,
          title: 'Biology Book',
          description: 'Good condition',
          price: 25.0,
          category: 'Books',
          condition: 'used',
          imageUrls: [],
          status: 'available',
          isExpired: false,
          expiresAt: new Date(Date.now() + 1000000),
        },
      });

      await prisma.report.create({
        data: {
          reporterId: normalUser.id,
          targetType: 'LISTING',
          targetId: 'list_pending',
          reason: 'Fake item',
          status: 'pending',
        },
      });

      const res = await request(app)
        .get('/api/admin/analytics')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({
        itemsReunited: expect.any(Number),
        ridesCompleted: expect.any(Number),
        activeListings: expect.any(Number),
        reportsPending: expect.any(Number),
      });

      expect(res.body.data.itemsReunited).toBeGreaterThanOrEqual(2);
      expect(res.body.data.ridesCompleted).toBeGreaterThanOrEqual(1);
      expect(res.body.data.activeListings).toBeGreaterThanOrEqual(1);
      expect(res.body.data.reportsPending).toBeGreaterThanOrEqual(1);
      expect(res.body.data.breakdown.totalUsers).toBeGreaterThanOrEqual(3);
    });
  });
});
