import request from 'supertest';
import { app } from '../index';
import { prisma } from '../config/prisma';
import { generateToken } from '../middleware/auth';
import {
  calculateTrigramSimilarity,
  calculateTfIdfCosineSimilarity,
  scoreCategory,
  scoreText,
  scoreLocation,
  scoreTime,
  scoreLostAndFoundItem,
  DEFAULT_MATCH_THRESHOLD,
} from '../services/matching.service';

describe('Smart Lost/Found Matching Service', () => {
  describe('Unit Tests: Scoring Logic Module', () => {
    describe('Trigram Similarity', () => {
      it('returns 1.0 for identical strings', () => {
        expect(calculateTrigramSimilarity('AirPods Pro', 'AirPods Pro')).toBe(1.0);
      });

      it('returns high similarity for minor typos or plural differences', () => {
        const sim = calculateTrigramSimilarity('AirPods Pro', 'AirPod Pro');
        expect(sim).toBeGreaterThan(0.6);
      });

      it('returns 0 for completely unrelated strings', () => {
        const sim = calculateTrigramSimilarity('Water Bottle', 'MacBook Laptop');
        expect(sim).toBe(0);
      });
    });

    describe('TF-IDF / Cosine Similarity', () => {
      it('calculates word overlap and filters common stopwords', () => {
        const textA = 'Lost my black Sony headphones in the library';
        const textB = 'Found Sony black headphones near the cafeteria';
        const result = calculateTfIdfCosineSimilarity(textA, textB);

        expect(result.similarity).toBeGreaterThan(0.6);
        expect(result.matchingKeywords).toContain('sony');
        expect(result.matchingKeywords).toContain('black');
        expect(result.matchingKeywords).toContain('headphones');
        // Stopwords like 'in', 'the', 'my' must be filtered
        expect(result.matchingKeywords).not.toContain('the');
        expect(result.matchingKeywords).not.toContain('in');
      });

      it('returns 0 for disjoint word sets', () => {
        const result = calculateTfIdfCosineSimilarity('Calculus Textbook', 'Hydro Flask Blue');
        expect(result.similarity).toBe(0);
        expect(result.matchingKeywords).toHaveLength(0);
      });
    });

    describe('Category Scoring', () => {
      it('returns 1.0 with reason for matching category', () => {
        const result = scoreCategory('Electronics', 'electronics');
        expect(result.score).toBe(1.0);
        expect(result.reason).toContain('Matching category: Electronics');
      });

      it('returns 0.3 for other/miscellaneous fallback', () => {
        const result = scoreCategory('Electronics', 'Other');
        expect(result.score).toBe(0.3);
      });

      it('returns 0 for incompatible categories', () => {
        const result = scoreCategory('Books', 'Electronics');
        expect(result.score).toBe(0);
      });
    });

    describe('Text Scoring (Title & Description)', () => {
      it('yields high score and reasons for closely matching title and description', () => {
        const lost = {
          title: 'Black AirPods Pro with carabiner',
          description: 'Left in Student Union second floor lounge',
        };
        const found = {
          title: 'AirPods Pro black case',
          description: 'Found under the couch in Student Union lounge',
        };

        const result = scoreText(lost, found);
        expect(result.score).toBeGreaterThan(0.5);
        expect(result.reason).toBeDefined();
        expect(result.reason).toMatch(/similarity/i);
      });
    });

    describe('Location Proximity Scoring', () => {
      it('returns 1.0 for exact location match', () => {
        const result = scoreLocation('Student Union', 'Student Union');
        expect(result.score).toBe(1.0);
        expect(result.reason).toContain('Exact location match');
      });

      it('returns high score for shared campus landmarks', () => {
        const result = scoreLocation('Student Union 2nd floor lounge', 'Student Union Cafe');
        expect(result.score).toBeGreaterThanOrEqual(0.7);
        expect(result.reason).toContain('Nearby location');
      });

      it('returns 0 for completely distinct locations', () => {
        const result = scoreLocation('Sports Complex Gym', 'North Gate Parking');
        expect(result.score).toBe(0);
      });
    });

    describe('Time Proximity Scoring', () => {
      it('returns 1.0 when reported within 6 hours', () => {
        const now = new Date('2026-11-01T14:00:00.000Z');
        const twoHoursLater = new Date('2026-11-01T16:00:00.000Z');

        const result = scoreTime(now, twoHoursLater);
        expect(result.score).toBe(1.0);
        expect(result.reason).toContain('Reported within 2 hours of each other');
      });

      it('returns 0.85 when reported within 24 hours', () => {
        const day1 = new Date('2026-11-01T10:00:00.000Z');
        const day2 = new Date('2026-11-02T04:00:00.000Z');

        const result = scoreTime(day1, day2);
        expect(result.score).toBe(0.85);
        expect(result.reason).toContain('Reported within');
      });

      it('returns 0 for events separated by more than 2 weeks', () => {
        const date1 = new Date('2026-10-01T10:00:00.000Z');
        const date2 = new Date('2026-11-01T10:00:00.000Z');

        const result = scoreTime(date1, date2);
        expect(result.score).toBe(0);
      });
    });

    describe('Overall Item Scorer (scoreLostAndFoundItem)', () => {
      it('identifies a high-probability match above default threshold', () => {
        const lost = {
          id: 'lost_1',
          userId: 'usr_1',
          title: 'Black AirPods Pro with blue carabiner',
          description: 'Lost on 2nd floor lounge of Student Union',
          category: 'Electronics',
          location: 'Student Union',
          dateLost: new Date('2026-11-01T14:00:00.000Z'),
        };

        const found = {
          id: 'found_1',
          userId: 'usr_2',
          title: 'AirPods Pro in black case',
          description: 'Found under chair in Student Union lounge',
          category: 'Electronics',
          location: 'Student Union',
          dateFound: new Date('2026-11-01T15:30:00.000Z'),
        };

        const match = scoreLostAndFoundItem(lost, found);

        expect(match.isMatch).toBe(true);
        expect(match.score).toBeGreaterThanOrEqual(DEFAULT_MATCH_THRESHOLD);
        expect(match.reasons.length).toBeGreaterThanOrEqual(3);
        expect(match.reasons.some((r) => r.includes('Electronics'))).toBe(true);
        expect(match.reasons.some((r) => r.includes('Student Union'))).toBe(true);
      });

      it('rejects completely different items', () => {
        const lost = {
          id: 'lost_2',
          userId: 'usr_1',
          title: 'Leather Wallet Brown',
          description: 'Lost near the athletic field',
          category: 'Accessories',
          location: 'Athletic Field',
          dateLost: new Date('2026-11-01T14:00:00.000Z'),
        };

        const found = {
          id: 'found_2',
          userId: 'usr_2',
          title: 'Chemistry 101 Textbook',
          description: 'Found in Science Hall room 204',
          category: 'Books',
          location: 'Science Hall',
          dateFound: new Date('2026-11-01T15:30:00.000Z'),
        };

        const match = scoreLostAndFoundItem(lost, found);

        expect(match.isMatch).toBe(false);
        expect(match.score).toBeLessThan(DEFAULT_MATCH_THRESHOLD);
      });

      it('respects custom threshold option', () => {
        const lost = {
          id: 'lost_3',
          userId: 'usr_1',
          title: 'Water Bottle',
          description: 'Metal bottle left in library',
          category: 'Other',
          location: 'Library',
          dateLost: new Date('2026-11-01T12:00:00.000Z'),
        };

        const found = {
          id: 'found_3',
          userId: 'usr_2',
          title: 'Hydroflask Bottle',
          description: 'Flask found in Library 1st floor',
          category: 'Other',
          location: 'Library',
          dateFound: new Date('2026-11-01T14:00:00.000Z'),
        };

        // With strict threshold of 0.9, might fail
        const strictMatch = scoreLostAndFoundItem(lost, found, { threshold: 0.95 });
        expect(strictMatch.isMatch).toBe(false);

        // With lenient threshold of 0.3, passes
        const lenientMatch = scoreLostAndFoundItem(lost, found, { threshold: 0.3 });
        expect(lenientMatch.isMatch).toBe(true);
      });
    });
  });

  describe('Integration: Auto-Matching on Creation & Match Endpoints', () => {
    let userA: any;
    let userB: any;
    let tokenA: string;
    let tokenB: string;

    beforeEach(async () => {
      userA = await prisma.user.create({
        data: {
          email: 'alice@campus.edu',
          name: 'Alice Cooper',
          role: 'USER',
        },
      });

      userB = await prisma.user.create({
        data: {
          email: 'bob@campus.edu',
          name: 'Bob Marley',
          role: 'USER',
        },
      });

      tokenA = generateToken(userA);
      tokenB = generateToken(userB);
    });

    it('creates a Match record and notifies both users when matching FoundItem is reported', async () => {
      // 1. Alice reports a lost item
      const lostRes = await request(app)
        .post('/api/lost')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          title: 'Sony WH-1000XM4 Headphones',
          description: 'Silver noise canceling headphones in a black zippered case',
          category: 'Electronics',
          location: 'Library 2nd Floor Quiet Study',
          dateLost: new Date('2026-11-01T14:00:00.000Z').toISOString(),
        });

      expect(lostRes.status).toBe(201);
      const lostItemId = lostRes.body.data.id;

      // 2. Bob registers a found item matching Alice's description
      const foundRes = await request(app)
        .post('/api/found')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({
          title: 'Sony Noise Canceling Headphones Found',
          description: 'Found silver Sony headphones in zippered case on 2nd floor library table',
          category: 'Electronics',
          location: 'Library 2nd Floor',
          dateFound: new Date('2026-11-01T15:00:00.000Z').toISOString(),
          holdingLocation: 'security office',
          secretQuestion: 'What color is the zipper on the case?',
          secretAnswer: 'Red',
        });

      expect(foundRes.status).toBe(201);

      // Wait a tick for async matching to execute
      await new Promise((resolve) => setTimeout(resolve, 100));

      // 3. Verify notifications were created for both users
      const notifsA = await prisma.notification.findMany({ where: { userId: userA.id } });
      expect(notifsA.length).toBeGreaterThanOrEqual(1);
      expect(notifsA[0].type).toBe('MATCH');
      expect(notifsA[0].title).toBe('Possible Item Match!');

      const notifsB = await prisma.notification.findMany({ where: { userId: userB.id } });
      expect(notifsB.length).toBeGreaterThanOrEqual(1);
      expect(notifsB[0].type).toBe('MATCH');

      // 4. Verify Alice can query her matches via GET /api/matches
      const matchRes = await request(app)
        .get('/api/matches')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(matchRes.status).toBe(200);
      expect(matchRes.body.data.length).toBeGreaterThanOrEqual(1);

      const match = matchRes.body.data[0];
      expect(match.lostItemId).toBe(lostItemId);
      expect(match.score).toBeGreaterThanOrEqual(DEFAULT_MATCH_THRESHOLD);
      expect(match.reasons.length).toBeGreaterThan(0);
      expect(match.status).toBe('PENDING');

      // 5. Verify match details via GET /api/matches/:id
      const detailRes = await request(app)
        .get(`/api/matches/${match.id}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(detailRes.status).toBe(200);
      expect(detailRes.body.data.lostItem.title).toContain('Sony');
      expect(detailRes.body.data.foundItem.title).toContain('Sony');
      // Secret answer must be hidden
      expect(detailRes.body.data.foundItem.secretAnswer).toBeUndefined();

      // 6. Alice marks the match as ACCEPTED
      const updateRes = await request(app)
        .patch(`/api/matches/${match.id}/status`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ status: 'ACCEPTED' });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.status).toBe('ACCEPTED');
    });
  });
});

