import { test, expect } from '@playwright/test';
import { io as ioClient } from 'socket.io-client';

const API_BASE = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

async function getAuthToken(request: any, email: string) {
  await request.post(`${API_BASE}/auth/request-otp`, { data: { email } });
  const verifyRes = await request.post(`${API_BASE}/auth/verify-otp`, {
    data: { email, otp: '123456' },
  });
  const json = await verifyRes.json();
  return { token: json.data.token, user: json.data.user };
}

test.describe('Socket.io Real-Time Event Verification', () => {
  test('Socket.io: Authenticates via JWT handshake and joins dedicated user room', async ({ request }) => {
    const user = await getAuthToken(request, 'socket.user1@campus.edu');

    const socket = ioClient(SOCKET_URL, {
      auth: { token: user.token },
      transports: ['websocket'],
    });

    await new Promise<void>((resolve, reject) => {
      socket.on('connect', () => {
        expect(socket.connected).toBe(true);
        resolve();
      });
      socket.on('connect_error', reject);
    });

    socket.disconnect();
  });

  test('Socket.io: chat message:new event delivered in real-time to active conversation room', async ({ request }) => {
    const user1 = await getAuthToken(request, 'alice.chat@campus.edu');
    const user2 = await getAuthToken(request, 'bob.chat@campus.edu');

    // Create 1-on-1 conversation
    const convRes = await request.post(`${API_BASE}/conversations`, {
      headers: { Authorization: `Bearer ${user1.token}` },
      data: { recipientId: user2.user.id },
    });
    const conv = (await convRes.json()).data;

    // Connect User 2 to Socket.io and join conversation room
    const socket2 = ioClient(SOCKET_URL, {
      auth: { token: user2.token },
      transports: ['websocket'],
    });

    await new Promise<void>((resolve) => socket2.on('connect', resolve));
    socket2.emit('chat:join', conv.id);

    // Listen for message:new
    const messagePromise = new Promise<any>((resolve) => {
      socket2.on('message:new', (msg) => {
        resolve(msg);
      });
    });

    // User 1 sends message via REST API
    const sentText = 'Hey Bob, checking real-time web sockets!';
    await request.post(`${API_BASE}/conversations/${conv.id}/messages`, {
      headers: { Authorization: `Bearer ${user1.token}` },
      data: { content: sentText },
    });

    const receivedMessage = await messagePromise;
    expect(receivedMessage.conversationId).toBe(conv.id);
    expect(receivedMessage.content).toBe(sentText);
    expect(receivedMessage.sender.name).toBe(user1.user.name);

    socket2.disconnect();
  });

  test('Socket.io: notification:new delivered in real-time to user personal room', async ({ request }) => {
    const user = await getAuthToken(request, 'notif.receiver@campus.edu');

    const socket = ioClient(SOCKET_URL, {
      auth: { token: user.token },
      transports: ['websocket'],
    });

    await new Promise<void>((resolve) => socket.on('connect', resolve));

    // Listen for notification:new
    const notifPromise = new Promise<any>((resolve) => {
      socket.on('notification:new', (notif) => {
        resolve(notif);
      });
    });

    // Trigger an action that dispatches a notification: report an item or receive chat
    const sender = await getAuthToken(request, 'notif.sender@campus.edu');
    const convRes = await request.post(`${API_BASE}/conversations`, {
      headers: { Authorization: `Bearer ${sender.token}` },
      data: { recipientId: user.user.id },
    });
    const conv = (await convRes.json()).data;

    await request.post(`${API_BASE}/conversations/${conv.id}/messages`, {
      headers: { Authorization: `Bearer ${sender.token}` },
      data: { content: 'Wake up notification test!' },
    });

    const notif = await notifPromise;
    expect(notif.userId).toBe(user.user.id);
    expect(notif.title).toContain('New message');

    socket.disconnect();
  });

  test('Socket.io: ride:updated emitted in real-time when a passenger joins a ride', async ({ request }) => {
    const driver = await getAuthToken(request, 'ride.driver@campus.edu');
    const passenger = await getAuthToken(request, 'ride.rider@campus.edu');

    // Create ride
    const rideRes = await request.post(`${API_BASE}/rides`, {
      headers: { Authorization: `Bearer ${driver.token}` },
      data: {
        origin: 'Library',
        destination: 'Railway Station',
        departureTime: new Date(Date.now() + 100000).toISOString(),
        totalSeats: 3,
        estimatedFare: 45,
      },
    });
    const rideBody = await rideRes.json();
    expect(rideRes.status()).toBe(201);
    const ride = rideBody.data;

    // Connect driver socket and subscribe to ride room
    const driverSocket = ioClient(SOCKET_URL, {
      auth: { token: driver.token },
      transports: ['websocket'],
    });

    await new Promise<void>((resolve) => driverSocket.on('connect', resolve));
    driverSocket.emit('ride:subscribe', ride.id);

    // Listen for ride:updated
    const updatePromise = new Promise<any>((resolve) => {
      driverSocket.on('ride:updated', (data) => {
        resolve(data);
      });
    });

    // Passenger joins the ride
    await request.post(`${API_BASE}/rides/${ride.id}/join`, {
      headers: { Authorization: `Bearer ${passenger.token}` },
    });

    const updateData = await updatePromise;
    expect(updateData.id).toBe(ride.id);
    expect(updateData.availableSeats).toBe(1); // was 2, now 1

    driverSocket.disconnect();
  });
});
