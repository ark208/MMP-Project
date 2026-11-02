import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

let ioInstance: SocketIOServer | null = null;

export function setSocketIO(io: SocketIOServer) {
  ioInstance = io;
}

export function getSocketIO(): SocketIOServer | null {
  return ioInstance;
}

export function configureSocketIO(io: SocketIOServer) {
  setSocketIO(io);

  // JWT Authentication on the socket handshake
  io.use((socket: Socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        (socket.handshake.headers?.authorization
          ? socket.handshake.headers.authorization.replace('Bearer ', '')
          : null);

      if (!token) {
        return next(new Error('Authentication error: Missing token'));
      }

      const decoded = jwt.verify(token, env.JWT_SECRET) as any;
      socket.data.user = decoded;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid or expired token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user;
    if (user?.id) {
      // Auto-join personal room for direct notification alerts
      socket.join(`user:${user.id}`);
      console.log(`[Socket] Authenticated user ${user.name || user.id} joined user:${user.id}`);
    }

    // Join / Leave Conversation Room
    socket.on('chat:join', (conversationId: string) => {
      socket.join(`conversation:${conversationId}`);
      console.log(`[Socket] ${user?.name || socket.id} joined conversation:${conversationId}`);
    });

    socket.on('chat:leave', (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
      console.log(`[Socket] ${user?.name || socket.id} left conversation:${conversationId}`);
    });

    // Subscribe / Unsubscribe to Real-Time Ride Updates
    socket.on('ride:subscribe', (rideId: string) => {
      socket.join(`ride:${rideId}`);
      console.log(`[Socket] ${user?.name || socket.id} subscribed to ride:${rideId}`);
    });

    socket.on('ride:unsubscribe', (rideId: string) => {
      socket.leave(`ride:${rideId}`);
      console.log(`[Socket] ${user?.name || socket.id} unsubscribed from ride:${rideId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });
}
