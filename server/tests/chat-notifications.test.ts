import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/index';
import { prisma } from '../src/prisma';
import { generateToken } from '../src/middleware/auth';

/**
 * Chat, Fare-Split & Notification Tests
 *
 * Privacy requirements:
 *   - Contact details (email, phone) must NEVER appear in message sender objects
 *   - Fare split divides equally among all ride members (creator + passengers)
 *   - Notification PATCH /read marks isRead = true
 */

const SUFFIX = `cn-${Date.now()}`;
const userIds: string[] = [];
const rideIds: string[] = [];
const convIds: string[] = [];

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  // Cleanup in dependency order
  await prisma.notification.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.message.deleteMany({ where: { senderId: { in: userIds } } });

  for (const convId of convIds) {
    await prisma.conversationMember.deleteMany({ where: { conversationId: convId } });
    await prisma.conversation.delete({ where: { id: convId } }).catch(() => {});
  }

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

describe('Chat, Fare-Split & Notifications Tests', () => {
  it('calculates real-time fare split equally among all ride members (creator + passengers)', async () => {
    const creator = await prisma.user.create({
      data: { email: `fare-creator-${SUFFIX}@campus.edu`, name: 'Fare Creator' },
    });
    const p1 = await prisma.user.create({
      data: { email: `fare-p1-${SUFFIX}@campus.edu`, name: 'Passenger 1' },
    });
    const p2 = await prisma.user.create({
      data: { email: `fare-p2-${SUFFIX}@campus.edu`, name: 'Passenger 2' },
    });
    userIds.push(creator.id, p1.id, p2.id);

    const cToken = generateToken(creator);
    const p1Token = generateToken(p1);
    const p2Token = generateToken(p2);

    // Create ride: estimatedFare=90, totalSeats=3
    const rideRes = await request(app)
      .post('/api/rides')
      .set('Authorization', `Bearer ${cToken}`)
      .send({
        origin: 'Campus North',
        destination: 'Airport',
        departureTime: new Date(Date.now() + 3600000).toISOString(),
        totalSeats: 3,
        estimatedFare: 90.0,
      });
    expect(rideRes.status).toBe(201);
    const rideId = rideRes.body.data.id;
    rideIds.push(rideId);

    // Two passengers join
    await request(app)
      .post(`/api/rides/${rideId}/join`)
      .set('Authorization', `Bearer ${p1Token}`)
      .send();
    await request(app)
      .post(`/api/rides/${rideId}/join`)
      .set('Authorization', `Bearer ${p2Token}`)
      .send();

    // Call fare-split
    const splitRes = await request(app)
      .get(`/api/rides/${rideId}/fare-split`)
      .set('Authorization', `Bearer ${cToken}`);

    expect(splitRes.status).toBe(200);
    const data = splitRes.body.data;

    expect(data.rideId).toBe(rideId);
    expect(data.totalFare).toBe(90.0);
    expect(data.passengerCount).toBe(3); // Creator + 2 passengers
    expect(data.farePerPerson).toBe(30.0);
    expect(data.participants.length).toBe(3);

    for (const part of data.participants) {
      expect(part.amount).toBe(30.0);
      expect(part.name).toBeDefined();
      // Privacy: no email/phone in participant objects
      expect(part.email).toBeUndefined();
      expect(part.phone).toBeUndefined();
    }
  });

  it('fare-split respects a custom totalFare query param', async () => {
    const creator = await prisma.user.create({
      data: { email: `fare-custom-creator-${SUFFIX}@campus.edu`, name: 'Custom Fare Creator' },
    });
    userIds.push(creator.id);
    const cToken = generateToken(creator);

    const rideRes = await request(app)
      .post('/api/rides')
      .set('Authorization', `Bearer ${cToken}`)
      .send({
        origin: 'Hostel',
        destination: 'City Centre',
        departureTime: new Date(Date.now() + 7200000).toISOString(),
        totalSeats: 3,
        estimatedFare: 90.0,
      });
    const rideId = rideRes.body.data.id;
    rideIds.push(rideId);

    // No extra passengers — only creator (1 member)
    const splitRes = await request(app)
      .get(`/api/rides/${rideId}/fare-split?totalFare=120`)
      .set('Authorization', `Bearer ${cToken}`);

    expect(splitRes.status).toBe(200);
    const data = splitRes.body.data;
    expect(data.totalFare).toBe(120.0);
    expect(data.passengerCount).toBe(1);
    expect(data.farePerPerson).toBe(120.0); // only creator
  });

  it('strictly protects contact details (email, phone) in chat conversations and message history', async () => {
    const userA = await prisma.user.create({
      data: {
        email: `chata-${SUFFIX}@campus.edu`,
        name: 'Chatter Alice',
        phone: '+15554445555',
        department: 'Art History',
        year: '2nd Year',
      },
    });
    const userB = await prisma.user.create({
      data: {
        email: `chatb-${SUFFIX}@campus.edu`,
        name: 'Chatter Bob',
        phone: '+15556667777',
        department: 'Music',
        year: '3rd Year',
      },
    });
    userIds.push(userA.id, userB.id);

    const tokenA = generateToken(userA);
    const tokenB = generateToken(userB);

    // Create 1-to-1 conversation
    const convRes = await request(app)
      .post('/api/conversations')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ recipientId: userB.id });

    expect(convRes.status).toBe(201);
    const convId = convRes.body.data.id;
    convIds.push(convId);

    // Send a message
    const msgRes = await request(app)
      .post(`/api/conversations/${convId}/messages`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ content: 'Hey Bob, did you find the textbook?' });

    expect(msgRes.status).toBe(201);
    const msgData = msgRes.body.data;
    expect(msgData.content).toBe('Hey Bob, did you find the textbook?');

    // Sender privacy on message create response
    expect(msgData.sender.name).toBe('Chatter Alice');
    expect(msgData.sender.email).toBeUndefined();
    expect(msgData.sender.phone).toBeUndefined();

    // Fetch message history as userB
    const historyRes = await request(app)
      .get(`/api/conversations/${convId}/messages`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(historyRes.status).toBe(200);
    const history = historyRes.body.data;
    expect(history.length).toBe(1);

    const historySender = history[0].sender;
    expect(historySender.name).toBe('Chatter Alice');
    expect(historySender.email).toBeUndefined();
    expect(historySender.phone).toBeUndefined();
  });

  it('non-participant cannot access conversation messages (403)', async () => {
    const userA = await prisma.user.create({
      data: { email: `403a-${SUFFIX}@campus.edu`, name: '403 User A' },
    });
    const userB = await prisma.user.create({
      data: { email: `403b-${SUFFIX}@campus.edu`, name: '403 User B' },
    });
    const outsider = await prisma.user.create({
      data: { email: `403c-${SUFFIX}@campus.edu`, name: '403 Outsider' },
    });
    userIds.push(userA.id, userB.id, outsider.id);

    const tokenA = generateToken(userA);
    const outsiderToken = generateToken(outsider);

    const convRes = await request(app)
      .post('/api/conversations')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ recipientId: userB.id });
    const convId = convRes.body.data.id;
    convIds.push(convId);

    const res = await request(app)
      .get(`/api/conversations/${convId}/messages`)
      .set('Authorization', `Bearer ${outsiderToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('duplicate conversation request returns existing conversation (200 not 201)', async () => {
    const userA = await prisma.user.create({
      data: { email: `dupA-${SUFFIX}@campus.edu`, name: 'Dup User A' },
    });
    const userB = await prisma.user.create({
      data: { email: `dupB-${SUFFIX}@campus.edu`, name: 'Dup User B' },
    });
    userIds.push(userA.id, userB.id);
    const tokenA = generateToken(userA);

    const first = await request(app)
      .post('/api/conversations')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ recipientId: userB.id });
    expect(first.status).toBe(201);
    convIds.push(first.body.data.id);

    const second = await request(app)
      .post('/api/conversations')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ recipientId: userB.id });
    // Should return 200 with same conversation id
    expect(second.status).toBe(200);
    expect(second.body.data.id).toBe(first.body.data.id);
  });

  it('notification service creates notification and marks it as read', async () => {
    const user = await prisma.user.create({
      data: { email: `notif-${SUFFIX}@campus.edu`, name: 'Notif User' },
    });
    userIds.push(user.id);
    const token = generateToken(user);

    // Create notification directly via Prisma (simulating notification service)
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: 'New Passenger Joined!',
        message: 'A batchmate joined your ride.',
        type: 'RIDE',
        link: '/rides/test123',
      },
    });

    // GET /api/notifications
    const getRes = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${token}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.data.length).toBeGreaterThanOrEqual(1);

    const notif = getRes.body.data.find((n: any) => n.userId === user.id);
    expect(notif).toBeDefined();
    expect(notif.isRead).toBe(false);
    expect(notif.type).toBe('RIDE');

    // PATCH /api/notifications/:id/read
    const readRes = await request(app)
      .patch(`/api/notifications/${notif.id}/read`)
      .set('Authorization', `Bearer ${token}`);
    expect(readRes.status).toBe(200);
    expect(readRes.body.data.isRead).toBe(true);
  });

  it('train buddy match triggers a MATCH notification to the existing traveller', async () => {
    const traveller = await prisma.user.create({
      data: { email: `traveller-${SUFFIX}@campus.edu`, name: 'Early Traveller' },
    });
    const newcomer = await prisma.user.create({
      data: { email: `newcomer-${SUFFIX}@campus.edu`, name: 'New Traveller' },
    });
    userIds.push(traveller.id, newcomer.id);

    const travellerToken = generateToken(traveller);
    const newcomerToken = generateToken(newcomer);

    const trainNum = `BUDDY-NOTIF-${SUFFIX}`;

    // Traveller posts a trip first
    const tripRes = await request(app)
      .post('/api/trips')
      .set('Authorization', `Bearer ${travellerToken}`)
      .send({
        trainNumber: trainNum,
        fromStation: 'STATION_A',
        toStation: 'STATION_B',
        date: '2026-12-10',
      });
    expect(tripRes.status).toBe(201);

    // Newcomer posts a matching trip — should trigger notification to traveller
    const newTripRes = await request(app)
      .post('/api/trips')
      .set('Authorization', `Bearer ${newcomerToken}`)
      .send({
        trainNumber: trainNum,
        fromStation: 'STATION_A',
        toStation: 'STATION_B',
        date: '2026-12-10',
      });
    expect(newTripRes.status).toBe(201);

    // Allow a short delay for async notification creation
    await new Promise((r) => setTimeout(r, 200));

    // Verify traveller received a MATCH notification
    const notifRes = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${travellerToken}`);
    expect(notifRes.status).toBe(200);

    const matchNotif = notifRes.body.data.find(
      (n: any) => n.type === 'MATCH' && n.userId === traveller.id
    );
    expect(matchNotif).toBeDefined();
    expect(matchNotif.title).toContain('Train Buddy');
  });
});
