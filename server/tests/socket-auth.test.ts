import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { io as ClientIO, Socket as ClientSocket } from 'socket.io-client';
import { createServer } from 'http';
import express from 'express';
import { Server as SocketIOServer } from 'socket.io';
import request from 'supertest';
import { app, server, io } from '../src/index';
import { prisma } from '../src/prisma';
import { generateToken } from '../src/middleware/auth';

describe('Socket.io Handshake JWT Authentication & Events', () => {
  let serverPort: number;
  let httpServer: any;

  beforeAll(async () => {
    // Start listening on an ephemeral port for socket tests
    await new Promise<void>((resolve) => {
      httpServer = server.listen(0, () => {
        serverPort = (httpServer.address() as any).port;
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (httpServer) {
      await new Promise<void>((resolve) => httpServer.close(resolve));
    }
  });

  it('rejects socket connection when handshake token is missing or invalid', async () => {
    // Attempt 1: No token
    const clientWithoutToken = ClientIO(`http://localhost:${serverPort}`, {
      autoConnect: true,
      transports: ['websocket'],
    });

    const error1 = await new Promise((resolve) => {
      clientWithoutToken.on('connect_error', (err) => resolve(err.message));
    });
    expect(error1).toContain('Authentication error');
    clientWithoutToken.disconnect();

    // Attempt 2: Invalid token
    const clientWithInvalidToken = ClientIO(`http://localhost:${serverPort}`, {
      autoConnect: true,
      transports: ['websocket'],
      auth: { token: 'invalid_malformed_token' },
    });

    const error2 = await new Promise((resolve) => {
      clientWithInvalidToken.on('connect_error', (err) => resolve(err.message));
    });
    expect(error2).toContain('Authentication error');
    clientWithInvalidToken.disconnect();
  });

  it('successfully authenticates with valid JWT and receives real-time room events', async () => {
    const user = await prisma.user.create({
      data: { email: 'socket.user@campus.edu', name: 'Socket Tester' },
    });
    const token = generateToken(user);

    const client: ClientSocket = ClientIO(`http://localhost:${serverPort}`, {
      autoConnect: true,
      transports: ['websocket'],
      auth: { token },
    });

    // Verify successful connection
    await new Promise<void>((resolve, reject) => {
      client.on('connect', () => resolve());
      client.on('connect_error', (err) => reject(err));
    });

    expect(client.connected).toBe(true);

    // Join conversation room
    client.emit('chat:join', 'conv_test_123');

    // Subscribe to ride room
    client.emit('ride:subscribe', 'ride_test_456');

    // Test receiving notification:new in personal user room
    const notifPromise = new Promise<any>((resolve) => {
      client.on('notification:new', (payload) => resolve(payload));
    });

    io.to(`user:${user.id}`).emit('notification:new', {
      id: 'notif_socket_01',
      title: 'Real-Time Alert',
    });

    const receivedNotif = await notifPromise;
    expect(receivedNotif.id).toBe('notif_socket_01');

    client.disconnect();
  });
});
