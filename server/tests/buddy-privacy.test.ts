import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/index';
import { prisma } from '../src/prisma';
import { generateToken } from '../src/middleware/auth';

/**
 * Train Buddy Radar — Privacy & Matching Rule Tests
 *
 * Privacy requirements (API_CONTRACT.md):
 *   - PNR and seat number must NEVER be stored in the database
 *   - Buddy response returns ONLY name, department, year — never email or phone
 *   - Matching is exact: trainNumber + date + fromStation + toStation
 */

const SUFFIX = `bp-${Date.now()}`;
const userIds: string[] = [];
const tripIds: string[] = [];

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.notification.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.trainTrip.deleteMany({ where: { id: { in: tripIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
});

describe('Train Buddy Radar — Privacy & Matching Rule Tests', () => {
  it('guarantees PNR and seat numbers are NEVER stored or returned upon posting a trip', async () => {
    const student = await prisma.user.create({
      data: {
        email: `privacy-${SUFFIX}@campus.edu`,
        name: 'Privacy Minded Student',
        phone: '+15559998888',
        department: 'Cybersecurity',
        year: '4th Year',
      },
    });
    userIds.push(student.id);
    const token = generateToken(student);

    // Attempt to send sensitive PNR and seat numbers in the request body
    const postRes = await request(app)
      .post('/api/trips')
      .set('Authorization', `Bearer ${token}`)
      .send({
        trainNumber: '12951',
        trainName: 'Rajdhani Express',
        fromStation: 'NDLS',
        toStation: 'BCT',
        date: '2026-11-25',
        departureTime: '16:55',
        pnr: '9876543210',   // SENSITIVE: MUST NOT BE STORED
        seat: '42B',         // SENSITIVE: MUST NOT BE STORED
        coach: 'B4',         // SENSITIVE: MUST NOT BE STORED
      });

    expect(postRes.status).toBe(201);
    const data = postRes.body.data;
    tripIds.push(data.id);

    // Response must not contain PNR or seat
    expect(data.pnr).toBeUndefined();
    expect(data.seat).toBeUndefined();
    expect(data.coach).toBeUndefined();

    // Allowed fields are present
    expect(data.trainNumber).toBe('12951');
    expect(data.fromStation).toBe('NDLS');
    expect(data.toStation).toBe('BCT');
    expect(data.date).toBe('2026-11-25');

    // Verify database record directly — pnr/seat/coach columns must not exist
    const stored = await prisma.trainTrip.findUnique({ where: { id: data.id } });
    expect(stored).toBeDefined();
    expect((stored as any).pnr).toBeUndefined();
    expect((stored as any).seat).toBeUndefined();
    expect((stored as any).coach).toBeUndefined();
  });

  it('buddy matching: matches users on same train + date + route and returns ONLY name, department, year (NEVER email or phone)', async () => {
    // User A — Requester
    const userA = await prisma.user.create({
      data: {
        email: `usera-${SUFFIX}@campus.edu`,
        name: 'Alice Johnson',
        phone: '+15551111111',
        department: 'Biochemistry',
        year: '3rd Year',
      },
    });

    // User B — Matching buddy (same train, date, route)
    const userB = await prisma.user.create({
      data: {
        email: `userb-${SUFFIX}@campus.edu`,
        name: 'Bob Smith',
        phone: '+15552222222',
        department: 'Mechanical Engineering',
        year: '2nd Year',
      },
    });

    // User C — Different train number (should NOT appear)
    const userC = await prisma.user.create({
      data: {
        email: `userc-${SUFFIX}@campus.edu`,
        name: 'Charlie Brown',
        phone: '+15553333333',
        department: 'Physics',
        year: '1st Year',
      },
    });

    // User D — Same train, different date (should NOT appear)
    const userD = await prisma.user.create({
      data: {
        email: `userd-${SUFFIX}@campus.edu`,
        name: 'Diana Prince',
        phone: '+15554444444',
        department: 'Mathematics',
        year: '4th Year',
      },
    });

    userIds.push(userA.id, userB.id, userC.id, userD.id);

    const tokenA = generateToken(userA);
    const tokenB = generateToken(userB);
    const tokenC = generateToken(userC);
    const tokenD = generateToken(userD);

    // User A posts trip
    const tripARes = await request(app)
      .post('/api/trips')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        trainNumber: `T-${SUFFIX}`,
        fromStation: 'NDLS',
        toStation: 'BPL',
        date: '2026-11-28',
      });
    expect(tripARes.status).toBe(201);
    const tripAId = tripARes.body.data.id;
    tripIds.push(tripAId);

    // User B posts matching trip (same train, date, route)
    const tripBRes = await request(app)
      .post('/api/trips')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        trainNumber: `T-${SUFFIX}`,
        fromStation: 'NDLS',
        toStation: 'BPL',
        date: '2026-11-28',
      });
    tripIds.push(tripBRes.body.data.id);

    // User C posts trip with a different train number
    const tripCRes = await request(app)
      .post('/api/trips')
      .set('Authorization', `Bearer ${tokenC}`)
      .send({
        trainNumber: 'DIFFERENT-TRAIN',
        fromStation: 'NDLS',
        toStation: 'BPL',
        date: '2026-11-28',
      });
    tripIds.push(tripCRes.body.data.id);

    // User D posts trip with different date
    const tripDRes = await request(app)
      .post('/api/trips')
      .set('Authorization', `Bearer ${tokenD}`)
      .send({
        trainNumber: `T-${SUFFIX}`,
        fromStation: 'NDLS',
        toStation: 'BPL',
        date: '2026-12-05', // Different date
      });
    tripIds.push(tripDRes.body.data.id);

    // User A calls GET /api/trips/:id/buddies
    const buddiesRes = await request(app)
      .get(`/api/trips/${tripAId}/buddies`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(buddiesRes.status).toBe(200);
    const buddies = buddiesRes.body.data;

    // Exactly 1 buddy should be returned (User B only)
    expect(buddies.length).toBe(1);

    const buddy = buddies[0];
    expect(buddy.trip.trainNumber).toBe(`T-${SUFFIX}`);
    expect(buddy.trip.fromStation).toBe('NDLS');
    expect(buddy.trip.toStation).toBe('BPL');
    expect(buddy.trip.date).toBe('2026-11-28');

    // === PRIVACY VERIFICATION ===
    const buddyUser = buddy.trip.user;
    expect(buddyUser).toBeDefined();

    // Allowed public display info
    expect(buddyUser.name).toBe('Bob Smith');
    expect(buddyUser.department).toBe('Mechanical Engineering');
    expect(buddyUser.year).toBe('2nd Year');

    // STRICTLY FORBIDDEN — must never appear
    expect(buddyUser.email).toBeUndefined();
    expect(buddyUser.phone).toBeUndefined();

    // PNR / seat must not be in trip response either
    expect(buddy.trip.pnr).toBeUndefined();
    expect(buddy.trip.seat).toBeUndefined();
  });

  it('returns empty buddy list when no matching trains exist', async () => {
    const loneUser = await prisma.user.create({
      data: {
        email: `lone-${SUFFIX}@campus.edu`,
        name: 'Lone Traveller',
        department: 'History',
        year: '1st Year',
      },
    });
    userIds.push(loneUser.id);
    const token = generateToken(loneUser);

    const tripRes = await request(app)
      .post('/api/trips')
      .set('Authorization', `Bearer ${token}`)
      .send({
        trainNumber: 'TOTALLY-UNIQUE-TRAIN-XYZ',
        fromStation: 'MUMBA',
        toStation: 'DELHI',
        date: '2026-12-31',
      });
    expect(tripRes.status).toBe(201);
    tripIds.push(tripRes.body.data.id);

    const buddiesRes = await request(app)
      .get(`/api/trips/${tripRes.body.data.id}/buddies`)
      .set('Authorization', `Bearer ${token}`);

    expect(buddiesRes.status).toBe(200);
    expect(buddiesRes.body.data).toHaveLength(0);
  });

  it('returns 404 when trip id does not exist', async () => {
    const user = await prisma.user.create({
      data: { email: `trip404-${SUFFIX}@campus.edu`, name: 'Trip 404 User' },
    });
    userIds.push(user.id);
    const token = generateToken(user);

    const res = await request(app)
      .get('/api/trips/nonexistent-trip-id-xyz/buddies')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
