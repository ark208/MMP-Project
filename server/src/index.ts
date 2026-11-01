import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

// Socket.io initialization with CORS
const io = new SocketIOServer(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Root & Health check conforming to response envelope
app.get('/', (_req: Request, res: Response) => {
  res.json({
    data: {
      name: 'CampusLoop API',
      status: 'healthy',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    },
  });
});

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    data: {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
  });
});

// Socket.io connection handlers
io.on('connection', (socket) => {
  console.log(`[Socket] User connected: ${socket.id}`);

  socket.on('chat:join', (conversationId: string) => {
    socket.join(`conversation:${conversationId}`);
    console.log(`[Socket] ${socket.id} joined conversation:${conversationId}`);
  });

  socket.on('chat:leave', (conversationId: string) => {
    socket.leave(`conversation:${conversationId}`);
    console.log(`[Socket] ${socket.id} left conversation:${conversationId}`);
  });

  socket.on('ride:subscribe', (rideId: string) => {
    socket.join(`ride:${rideId}`);
    console.log(`[Socket] ${socket.id} subscribed to ride:${rideId}`);
  });

  socket.on('ride:unsubscribe', (rideId: string) => {
    socket.leave(`ride:${rideId}`);
    console.log(`[Socket] ${socket.id} unsubscribed from ride:${rideId}`);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] User disconnected: ${socket.id}`);
  });
});

// 404 handler conforming to error response envelope
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'The requested endpoint does not exist',
    },
  });
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Error]', err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: err.message || 'Internal server error occurred',
    },
  });
});

// Export io and server for application modules
export { app, server, io };

// Start listening if run directly
if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`🚀 CampusLoop Server running on http://localhost:${PORT}`);
  });
}

