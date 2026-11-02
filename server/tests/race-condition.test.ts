import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/index';
import { prisma } from '../src/prisma';
import { generateToken } from '../src/middleware/auth';

/**
 * Race-Condition & Seat-Count Tests
 *
 * These tests use a real PostgreSQL database via Prisma transactions.
 * Each test creates its own isolated users with unique emails (suffixed with
 * a unique run timestamp) to ensure re-runability without conflicts.
 */

const SUFFIX = `rc-${Date.now()}`;

// Ids to clean up
const userIds: string[] = [];
const rideIds: string[] = [];

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  // Clean up in dependency order
  await prisma.notification.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.message.deleteMany({ where: { senderId: { in: userIds } } });

  // Remove ride-linked conversations first
  for (const rideId of rideIds) {
    const conv = await prisma.conversation.findUnique({ where: { rideId } });
    if (conv) {
      await prisma.conversationMember.deleteMany({ where: { conversationId: conv.id } });
      await prisma.conversation.delete({ where: { id: conv.id } }).catch(() => {});
    }
    await prisma.rideMember.deleteMany({ where: { rideId } });
    await prisma.ride.delete({ where: { id: rideId } }).catch(() => {});
  }

  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
});

describe('Ride Sharing — Seat-Count Race Condition Tests', () => {
  it('prevents overbooking when multiple users concurrently join a ride with only 1 seat available', async () => {
    // 1. Create ride creator
    const creator = await prisma.user.create({
      data: {
        email: `creator-${SUFFIX}@campus.edu`,
        name: 'Ride Creator',
        department: 'Economics',
        year: '4th Year',
      },
    });
    userIds.push(creator.id);
    const creatorToken = generateToken(creator);

    // 2. Create a ride with totalSeats = 2 (Creator occupies 1, so availableSeats = 1)
    const rideRes = await request(app)
      .post('/api/rides')
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({
        origin: 'North Campus Gate 1',
        destination: 'Airport Terminal 3',
        departureTime: new Date(Date.now() + 86400000).toISOString(),
        totalSeats: 2,
        estimatedFare: 60.0,
        notes: 'Strict departure at 6 AM',
      });

    expect(rideRes.status).toBe(201);
    const rideId = rideRes.body.data.id;
    rideIds.push(rideId);

    expect(rideRes.body.data.totalSeats).toBe(2);
    expect(rideRes.body.data.availableSeats).toBe(1);
    expect(rideRes.body.data.status).toBe('OPEN');

    // 3. Create 5 distinct passengers who will simultaneously attempt to book the single remaining seat
    const passengers: Array<{ id: string; token: string }> = [];
    for (let i = 1; i <= 5; i++) {
      const passenger = await prisma.user.create({
        data: {
          email: `racer${i}-${SUFFIX}@campus.edu`,
          name: `Racer ${i}`,
          department: 'Computer Science',
          year: '2nd Year',
        },
      });
      userIds.push(passenger.id);
      passengers.push({ id: passenger.id, token: generateToken(passenger) });
    }

    // 4. Trigger concurrent join requests simultaneously using Promise.all
    const joinPromises = passengers.map((p) =>
      request(app)
        .post(`/api/rides/${rideId}/join`)
        .set('Authorization', `Bearer ${p.token}`)
        .send()
    );

    const results = await Promise.all(joinPromises);

    // 5. Analyze results:
    //    Exactly ONE passenger should succeed (HTTP 200)
    //    The remaining 4 passengers must fail with HTTP 409 Conflict
    const successfulJoins = results.filter((r) => r.status === 200);
    const failedJoins = results.filter((r) => r.status === 409);

    expect(successfulJoins.length).toBe(1);
    expect(failedJoins.length).toBe(4);

    expect(successfulJoins[0].body.data.joined).toBe(true);
    expect(successfulJoins[0].body.data.availableSeats).toBe(0);
    expect(successfulJoins[0].body.data.status).toBe('FULL');

    // Verify error code on all failed requests
    for (const fail of failedJoins) {
      expect(fail.body.error).toBeDefined();
      expect(fail.body.error.code).toBe('CONFLICT');
    }

    // 6. Verify final database state: seats must never go negative or overbook
    const finalRide = await prisma.ride.findUnique({
      where: { id: rideId },
      include: { members: true },
    });

    expect(finalRide).toBeDefined();
    expect(finalRide!.availableSeats).toBe(0);
    expect(finalRide!.status).toBe('FULL');
    expect(finalRide!.members.length).toBe(2); // Creator + exactly 1 passenger
  });

  it('correctly manages status transition from OPEN -> FULL and back to OPEN on member leave', async () => {
    // 1. Create creator and passenger
    const creator = await prisma.user.create({
      data: { email: `driver-${SUFFIX}@campus.edu`, name: 'Driver Dan' },
    });
    const passenger = await prisma.user.create({
      data: { email: `rider-${SUFFIX}@campus.edu`, name: 'Rider Ray' },
    });
    userIds.push(creator.id, passenger.id);

    const driverToken = generateToken(creator);
    const riderToken = generateToken(passenger);

    // Create ride with 2 total seats (1 available after creator takes 1)
    const createRes = await request(app)
      .post('/api/rides')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({
        origin: 'Library',
        destination: 'Downtown Station',
        departureTime: new Date(Date.now() + 3600000).toISOString(),
        totalSeats: 2,
        estimatedFare: 30.0,
      });

    expect(createRes.status).toBe(201);
    const rideId = createRes.body.data.id;
    rideIds.push(rideId);
    expect(createRes.body.data.status).toBe('OPEN');

    // Join ride -> becomes FULL
    const joinRes = await request(app)
      .post(`/api/rides/${rideId}/join`)
      .set('Authorization', `Bearer ${riderToken}`)
      .send();

    expect(joinRes.status).toBe(200);
    expect(joinRes.body.data.status).toBe('FULL');
    expect(joinRes.body.data.availableSeats).toBe(0);

    // Leave ride -> becomes OPEN again with 1 available seat
    const leaveRes = await request(app)
      .post(`/api/rides/${rideId}/leave`)
      .set('Authorization', `Bearer ${riderToken}`)
      .send();

    expect(leaveRes.status).toBe(200);
    expect(leaveRes.body.data.left).toBe(true);
    expect(leaveRes.body.data.availableSeats).toBe(1);
    expect(leaveRes.body.data.status).toBe('OPEN');
  });

  it('rejects joining a non-existent ride with 404', async () => {
    const user = await prisma.user.create({
      data: { email: `notfound-joiner-${SUFFIX}@campus.edu`, name: 'Ghost Joiner' },
    });
    userIds.push(user.id);
    const token = generateToken(user);

    const res = await request(app)
      .post('/api/rides/nonexistent-ride-id-xyz/join')
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('rejects joining a FULL ride with 409', async () => {
    const creator = await prisma.user.create({
      data: { email: `full-ride-creator-${SUFFIX}@campus.edu`, name: 'Full Creator' },
    });
    const p1 = await prisma.user.create({
      data: { email: `full-p1-${SUFFIX}@campus.edu`, name: 'P1 Full' },
    });
    const p2 = await prisma.user.create({
      data: { email: `full-p2-${SUFFIX}@campus.edu`, name: 'P2 Full' },
    });
    userIds.push(creator.id, p1.id, p2.id);

    const cToken = generateToken(creator);
    const p1Token = generateToken(p1);
    const p2Token = generateToken(p2);

    // 1-seat ride (creator takes the only seat)
    const rideRes = await request(app)
      .post('/api/rides')
      .set('Authorization', `Bearer ${cToken}`)
      .send({
        origin: 'A',
        destination: 'B',
        departureTime: new Date(Date.now() + 7200000).toISOString(),
        totalSeats: 1,
        estimatedFare: 20,
      });

    expect(rideRes.status).toBe(201);
    const rideId = rideRes.body.data.id;
    rideIds.push(rideId);
    // With 1 totalSeat, creator takes it, availableSeats=0 -> status=FULL immediately
    expect(rideRes.body.data.status).toBe('FULL');

    const joinAttempt = await request(app)
      .post(`/api/rides/${rideId}/join`)
      .set('Authorization', `Bearer ${p1Token}`)
      .send();

    expect(joinAttempt.status).toBe(409);
    expect(joinAttempt.body.error.code).toBe('CONFLICT');
  });
});
