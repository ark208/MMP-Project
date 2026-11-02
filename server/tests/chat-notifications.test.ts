import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { io as ClientIO } from 'socket.io-client';
import { app, server } from '../src/index';
import { prisma } from '../src/prisma';
import { generateToken } from '../src/middleware/auth';

describe('Chat, Fare-Split & Notifications Tests', () => {
  beforeEach(async () => {
    if ((prisma as any).reset) {
      (prisma as any).reset();
    }
  });

  it('calculates real-time fare split equally among passengers and creator', async () => {
    const creator = await prisma.user.create({
      data: { email: 'creator.fare@campus.edu', name: 'Fare Creator' },
    });
    const passenger1 = await prisma.user.create({
      data: { email: 'p1@campus.edu', name: 'Passenger 1' },
    });
    const passenger2 = await prisma.user.create({
      data: { email: 'p2@campus.edu', name: 'Passenger 2' },
    });

    const cToken = generateToken(creator);
    const p1Token = generateToken(passenger1);
    const p2Token = generateToken(passenger2);

    // Create ride with estimatedFare = 90.00, totalSeats = 3
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

    const rideId = rideRes.body.data.id;

    // 2 passengers join
    await request(app)
      .post(`/api/rides/${rideId}/join`)
      .set('Authorization', `Bearer ${p1Token}`)
      .send();

    await request(app)
      .post(`/api/rides/${rideId}/join`)
      .set('Authorization', `Bearer ${p2Token}`)
      .send();

    // Call GET /api/rides/:id/fare-split
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
    }
  });

  it('strictly protects contact details (email and phone) in chat conversations and message history', async () => {
    const userA = await prisma.user.create({
      data: {
        email: 'chata@campus.edu',
        name: 'Chatter Alice',
        phone: '+15554445555',
        department: 'Art History',
        year: '2nd Year',
      },
    });

    const userB = await prisma.user.create({
      data: {
        email: 'chatb@campus.edu',
        name: 'Chatter Bob',
        phone: '+15556667777',
        department: 'Music',
        year: '3rd Year',
      },
    });

    const tokenA = generateToken(userA);
    const tokenB = generateToken(userB);

    // Create 1-to-1 conversation
    const convRes = await request(app)
      .post('/api/conversations')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ recipientId: userB.id });

    expect(convRes.status).toBe(201);
    const convId = convRes.body.data.id;

    // Send a message
    const msgRes = await request(app)
      .post(`/api/conversations/${convId}/messages`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ content: 'Hey Bob, did you find the textbook?' });

    expect(msgRes.status).toBe(201);
    const msgData = msgRes.body.data;
    expect(msgData.content).toBe('Hey Bob, did you find the textbook?');

    // Verify sender contact privacy on message creation response
    expect(msgData.sender.name).toBe('Chatter Alice');
    expect(msgData.sender.email).toBeUndefined();
    expect(msgData.sender.phone).toBeUndefined();

    // Fetch conversation message history as userB
    const historyRes = await request(app)
      .get(`/api/conversations/${convId}/messages`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(historyRes.status).toBe(200);
    const history = historyRes.body.data;
    expect(history.length).toBe(1);

    // Verify sender contact privacy in retrieved history
    const historySender = history[0].sender;
    expect(historySender.name).toBe('Chatter Alice');
    expect(historySender.email).toBeUndefined();
    expect(historySender.phone).toBeUndefined();
  });

  it('notification service creates notification and marks as read', async () => {
    const user = await prisma.user.create({
      data: { email: 'notif.user@campus.edu', name: 'Notif User' },
    });
    const token = generateToken(user);

    // Create notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: 'New Passenger Joined!',
        message: 'A batchmate joined your ride.',
        type: 'RIDE',
        link: '/rides/123',
      },
    });

    // Fetch notifications
    const getRes = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${token}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.data.length).toBe(1);
    const notifId = getRes.body.data[0].id;
    expect(getRes.body.data[0].isRead).toBe(false);

    // Mark as read
    const readRes = await request(app)
      .patch(`/api/notifications/${notifId}/read`)
      .set('Authorization', `Bearer ${token}`);

    expect(readRes.status).toBe(200);
    expect(readRes.body.data.isRead).toBe(true);
  });
});
