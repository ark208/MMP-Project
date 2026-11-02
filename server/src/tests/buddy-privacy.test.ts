import request from 'supertest';
import { app } from '../index';
import { prisma } from '../prisma';
import { generateToken } from '../middleware/auth';
import { resetMemoryDb } from './setup';

describe('Train Buddy Radar - Privacy & Matching Rule Tests', () => {
  beforeEach(async () => {
    resetMemoryDb();
  });

  it('guarantees PNR and seat numbers are NEVER stored or returned upon posting a trip', async () => {
    const student = await prisma.user.create({
      data: {
        email: 'privacy.test@campus.edu',
        name: 'Privacy Minded Student',
        phone: '+15559998888',
        department: 'Cybersecurity',
        year: '4th Year',
      },
    });
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
        pnr: '9876543210', // SENSITIVE: MUST NOT BE STORED
        seat: '42B', // SENSITIVE: MUST NOT BE STORED
        coach: 'B4', // SENSITIVE: MUST NOT BE STORED
      });

    expect(postRes.status).toBe(201);
    const data = postRes.body.data;

    // Verify response does not contain PNR or seat
    expect(data.pnr).toBeUndefined();
    expect(data.seat).toBeUndefined();
    expect(data.coach).toBeUndefined();
    expect(data.trainNumber).toBe('12951');
    expect(data.fromStation).toBe('NDLS');
    expect(data.toStation).toBe('BCT');
    expect(data.date).toBe('2026-11-25');

    // Verify database record directly
    const stored = await prisma.trainTrip.findUnique({
      where: { id: data.id },
    });
    expect((stored as any).pnr).toBeUndefined();
    expect((stored as any).seat).toBeUndefined();
    expect((stored as any).coach).toBeUndefined();
  });

  it('buddy matching rule: matches users on same train + date + route, returning ONLY name, department, year (NEVER email or phone)', async () => {
    // 1. Create User A (Requester)
    const userA = await prisma.user.create({
      data: {
        email: 'usera.private@campus.edu',
        name: 'Alice Johnson',
        phone: '+15551111111', // Private contact
        department: 'Biochemistry',
        year: '3rd Year',
      },
    });

    // 2. Create User B (Matching Buddy)
    const userB = await prisma.user.create({
      data: {
        email: 'userb.buddy@campus.edu',
        name: 'Bob Smith',
        phone: '+15552222222', // Private contact
        department: 'Mechanical Engineering',
        year: '2nd Year',
      },
    });

    // 3. Create User C (Different train)
    const userC = await prisma.user.create({
      data: {
        email: 'userc.other@campus.edu',
        name: 'Charlie Brown',
        phone: '+15553333333',
        department: 'Physics',
        year: '1st Year',
      },
    });

    // 4. Create User D (Same train, different date)
    const userD = await prisma.user.create({
      data: {
        email: 'userd.diffdate@campus.edu',
        name: 'Diana Prince',
        phone: '+15554444444',
        department: 'Mathematics',
        year: '4th Year',
      },
    });

    const tokenA = generateToken(userA);
    const tokenB = generateToken(userB);
    const tokenC = generateToken(userC);
    const tokenD = generateToken(userD);

    // User A posts trip
    const tripARes = await request(app)
      .post('/api/trips')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        trainNumber: '12002',
        fromStation: 'NDLS',
        toStation: 'BPL',
        date: '2026-11-28',
      });
    const tripAId = tripARes.body.data.id;

    // User B posts matching trip (same train, date, route)
    await request(app)
      .post('/api/trips')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        trainNumber: '12002',
        fromStation: 'NDLS',
        toStation: 'BPL',
        date: '2026-11-28',
      });

    // User C posts trip with different train number
    await request(app)
      .post('/api/trips')
      .set('Authorization', `Bearer ${tokenC}`)
      .send({
        trainNumber: '99999',
        fromStation: 'NDLS',
        toStation: 'BPL',
        date: '2026-11-28',
      });

    // User D posts trip with different date
    await request(app)
      .post('/api/trips')
      .set('Authorization', `Bearer ${tokenD}`)
      .send({
        trainNumber: '12002',
        fromStation: 'NDLS',
        toStation: 'BPL',
        date: '2026-12-05',
      });

    // 5. User A calls GET /api/trips/:id/buddies
    const buddiesRes = await request(app)
      .get(`/api/trips/${tripAId}/buddies`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(buddiesRes.status).toBe(200);
    const buddies = buddiesRes.body.data;

    // Exactly 1 buddy should be returned (User B)
    expect(buddies.length).toBe(1);

    const buddy = buddies[0];
    expect(buddy.trip.trainNumber).toBe('12002');
    expect(buddy.trip.fromStation).toBe('NDLS');
    expect(buddy.trip.toStation).toBe('BPL');
    expect(buddy.trip.date).toBe('2026-11-28');

    // PRIVACY VERIFICATION:
    const buddyUser = buddy.trip.user;
    expect(buddyUser).toBeDefined();

    // Allowed public display info:
    expect(buddyUser.name).toBe('Bob Smith');
    expect(buddyUser.department).toBe('Mechanical Engineering');
    expect(buddyUser.year).toBe('2nd Year');

    // STRICTLY FORBIDDEN:
    expect(buddyUser.email).toBeUndefined();
    expect(buddyUser.phone).toBeUndefined();
    expect(buddy.trip.pnr).toBeUndefined();
    expect(buddy.trip.seat).toBeUndefined();
  });
});
