import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { io as ClientIO, type Socket as ClientSocket } from 'socket.io-client';
import { server, io } from '../src/index';
import { prisma } from '../src/prisma';
import { generateToken } from '../src/middleware/auth';

/**
 * Socket.io Handshake JWT Authentication & Real-Time Event Tests
 *
 * These tests start the HTTP server on an ephemeral port, connect real
 * socket.io clients, and verify:
 *   1. Unauthenticated / invalid-token connections are rejected
 *   2. Valid JWT connections succeed and join personal notification rooms
 *   3. Real-time `notification:new` and `ride:updated` events are received
 */

const SUFFIX = `sa-${Date.now()}`;
const userIds: string[] = [];

let serverPort: number;
let httpServer: ReturnType<typeof server.listen>;

beforeAll(async () => {
  // Start the HTTP server on an ephemeral OS-assigned port
  await new Promise<void>((resolve) => {
    httpServer = server.listen(0, () => {
      serverPort = (httpServer.address() as any).port;
      resolve();
    });
  });
});

afterAll(async () => {
  // Close HTTP server first so no more socket connections
  await new Promise<void>((resolve) => httpServer.close(() => resolve()));
  // Clean up test users (do NOT call prisma.$disconnect — global setup handles it)
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
});

describe('Socket.io Handshake JWT Authentication & Events', () => {
  it('rejects connection when handshake token is missing', async () => {
    const errMsg = await new Promise<string>((resolve) => {
      const client: ClientSocket = ClientIO(`http://localhost:${serverPort}`, {
        autoConnect: true,
        transports: ['websocket'],
        reconnection: false,
      });
      // Attach error handler BEFORE any rejection propagates
      client.on('connect_error', (err: Error) => {
        client.disconnect();
        resolve(err.message);
      });
    });
    expect(errMsg).toContain('Authentication error');
  });

  it('rejects connection when token is malformed / invalid', async () => {
    const errMsg = await new Promise<string>((resolve) => {
      const client: ClientSocket = ClientIO(`http://localhost:${serverPort}`, {
        autoConnect: true,
        transports: ['websocket'],
        reconnection: false,
        auth: { token: 'invalid.malformed.token' },
      });
      client.on('connect_error', (err: Error) => {
        client.disconnect();
        resolve(err.message);
      });
    });
    expect(errMsg).toContain('Authentication error');
  });

  it('successfully authenticates with a valid JWT and joins personal user room', async () => {
    const user = await prisma.user.create({
      data: { email: `socket-user-${SUFFIX}@campus.edu`, name: 'Socket Tester' },
    });
    userIds.push(user.id);
    const token = generateToken(user);

    await new Promise<void>((resolve, reject) => {
      const client: ClientSocket = ClientIO(`http://localhost:${serverPort}`, {
        autoConnect: true,
        transports: ['websocket'],
        reconnection: false,
        auth: { token },
      });
      client.on('connect', () => {
        expect(client.connected).toBe(true);
        // Emit room events that authenticated users can do
        client.emit('chat:join', 'conv_test_integration');
        client.emit('ride:subscribe', 'ride_test_integration');
        client.disconnect();
        resolve();
      });
      client.on('connect_error', (err) => {
        reject(new Error(`Unexpected connect_error: ${err.message}`));
      });
    });
  });

  it('receives notification:new event in personal user room after authentication', async () => {
    const user = await prisma.user.create({
      data: { email: `socket-notif-${SUFFIX}@campus.edu`, name: 'Notif Socket User' },
    });
    userIds.push(user.id);
    const token = generateToken(user);

    const received = await new Promise<any>((resolve, reject) => {
      const client: ClientSocket = ClientIO(`http://localhost:${serverPort}`, {
        autoConnect: true,
        transports: ['websocket'],
        reconnection: false,
        auth: { token },
      });

      client.on('connect', () => {
        // Listen for notification
        client.on('notification:new', (payload) => {
          client.disconnect();
          resolve(payload);
        });

        // Server emits to user's personal room (slight delay to ensure room join)
        setTimeout(() => {
          io.to(`user:${user.id}`).emit('notification:new', {
            id: `notif-test-${SUFFIX}`,
            userId: user.id,
            title: 'Integration Test Alert',
            message: 'Socket notification test',
            type: 'SYSTEM',
            isRead: false,
          });
        }, 100);
      });

      client.on('connect_error', (err) => reject(new Error(err.message)));
      setTimeout(() => reject(new Error('Timeout waiting for notification:new')), 5000);
    });

    expect(received.id).toBe(`notif-test-${SUFFIX}`);
    expect(received.title).toBe('Integration Test Alert');
    expect(received.userId).toBe(user.id);
  });

  it('receives ride:updated events after subscribing to a ride room', async () => {
    const user = await prisma.user.create({
      data: { email: `socket-ride-${SUFFIX}@campus.edu`, name: 'Ride Socket User' },
    });
    userIds.push(user.id);
    const token = generateToken(user);

    const rideRoomId = `ride-integration-${SUFFIX}`;

    const received = await new Promise<any>((resolve, reject) => {
      const client: ClientSocket = ClientIO(`http://localhost:${serverPort}`, {
        autoConnect: true,
        transports: ['websocket'],
        reconnection: false,
        auth: { token },
      });

      client.on('connect', () => {
        client.emit('ride:subscribe', rideRoomId);

        client.on('ride:updated', (payload) => {
          client.disconnect();
          resolve(payload);
        });

        // Emit after a brief delay so the socket has joined the room
        setTimeout(() => {
          io.to(`ride:${rideRoomId}`).emit('ride:updated', {
            id: rideRoomId,
            status: 'FULL',
            availableSeats: 0,
          });
        }, 150);
      });

      client.on('connect_error', (err) => reject(new Error(err.message)));
      setTimeout(() => reject(new Error('Timeout waiting for ride:updated')), 5000);
    });

    expect(received.id).toBe(rideRoomId);
    expect(received.status).toBe('FULL');
  });
});
