import request from 'supertest';
import { app } from '../index';
import { prisma } from '../prisma';
import { generateToken } from '../middleware/auth';
import { resetMemoryDb } from './setup';

describe('Ride Splitting - Seat-Count Race Condition Tests', () => {
  beforeEach(async () => {
    resetMemoryDb();
  });

  it('prevents overbooking when multiple users concurrently join a ride with only 1 seat available', async () => {
    // 1. Create ride creator
    const creator = await prisma.user.create({
      data: {
        email: 'creator@campus.edu',
        name: 'Ride Creator',
        department: 'Economics',
        year: '4th Year',
      },
    });
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
    expect(rideRes.body.data.totalSeats).toBe(2);
    expect(rideRes.body.data.availableSeats).toBe(1);
    expect(rideRes.body.data.status).toBe('OPEN');

    // 3. Create 5 distinct passengers who will simultaneously attempt to book the single remaining seat
    const passengers = [];
    for (let i = 1; i <= 5; i++) {
      const passenger = await prisma.user.create({
        data: {
          email: `racer${i}@campus.edu`,
          name: `Racer ${i}`,
          department: 'Computer Science',
          year: '2nd Year',
        },
      });
      passengers.push({
        user: passenger,
        token: generateToken(passenger),
      });
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
    // Exactly ONE passenger should succeed (HTTP 200)
    // The remaining 4 passengers must fail with HTTP 409 Conflict (no seats / race conflict)
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
      data: { email: 'driver@campus.edu', name: 'Driver Dan' },
    });
    const passenger = await prisma.user.create({
      data: { email: 'rider@campus.edu', name: 'Rider Ray' },
    });

    const driverToken = generateToken(creator);
    const riderToken = generateToken(passenger);

    // Create ride with 2 total seats (1 available)
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

    const rideId = createRes.body.data.id;
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
});
