import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

import { configureSocketIO } from './socket';
import { authenticateUser, AuthRequest } from './middleware/auth';
import { HttpError } from './errors';
import authRoutes from './routes/auth.routes';
import tripsRoutes from './routes/trips.routes';
import ridesRoutes from './routes/rides.routes';
import chatRoutes from './routes/chat.routes';
import notificationsRoutes from './routes/notifications.routes';

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

// Configure Socket.io with JWT Handshake Auth and Event Handlers
configureSocketIO(io);

// Middleware
app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health & Root check conforming to response envelope
app.get('/', (_req: Request, res: Response) => {
  res.json({
    data: {
      name: 'CampusLoop API',
      status: 'healthy',
      version: '2.0.0',
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

// GET /api/me - Authenticated user profile
app.get('/api/me', authenticateUser, (req: AuthRequest, res: Response) => {
  res.json({
    data: req.user,
  });
});

// Mount Module Routes
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripsRoutes);
app.use('/api/rides', ridesRoutes);
app.use('/api/conversations', chatRoutes);
app.use('/api/notifications', notificationsRoutes);

// 404 handler conforming to error response envelope
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'The requested endpoint does not exist',
      details: null,
    },
  });
});

// Global error handler conforming to error response envelope
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_SERVER_ERROR';
  const message = err.message || 'Internal server error occurred';
  const details = err.details || null;

  if (statusCode >= 500 && process.env.NODE_ENV !== 'test') {
    console.error('[ServerError]', err);
  }

  res.status(statusCode).json({
    error: {
      code,
      message,
      details,
    },
  });
});

// Export io and server for application modules & tests
export { app, server, io };

// Start listening if run directly
if (process.env.NODE_ENV !== 'test' && require.main === module) {
  server.listen(PORT, () => {
    console.log(`🚀 CampusLoop Server running on http://localhost:${PORT}`);
  });
}
