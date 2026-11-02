import express, { Request, Response } from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';

import { env } from './config/env';
import { globalLimiter } from './middlewares/rateLimiter';
import { errorHandler } from './middlewares/errorHandler';
import { startExpiryCron } from './services/cron.service';
import { sendSuccess } from './utils/response';

// Route imports
import authRoutes from './routes/auth.routes';
import uploadRoutes from './routes/upload.routes';
import lostRoutes from './routes/lost.routes';
import foundRoutes from './routes/found.routes';
import listingRoutes from './routes/listing.routes';
import wishlistRoutes from './routes/wishlist.routes';
import reportRoutes from './routes/report.routes';

const app = express();
const server = http.createServer(app);

// Socket.io initialization with CORS
const io = new SocketIOServer(server, {
  cors: {
    origin: env.CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Security & global middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow serving uploaded images across origins
  })
);
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(globalLimiter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve local uploads
app.use('/uploads', express.static(env.UPLOAD_DIR));

// Health checks conforming to response envelope
app.get('/', (_req: Request, res: Response) => {
  sendSuccess(res, {
    name: 'CampusLoop API',
    status: 'healthy',
    version: '1.0.0',
    phase: 1,
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health', (_req: Request, res: Response) => {
  sendSuccess(res, {
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Mount Phase 1 API Routers
app.use('/api/auth', authRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/lost', lostRoutes);
app.use('/api/found', foundRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api', reportRoutes); // handles /api/reports and /api/admin/*

// Socket.io connection handlers
io.on('connection', (socket) => {
  socket.on('chat:join', (conversationId: string) => {
    socket.join(`conversation:${conversationId}`);
  });

  socket.on('chat:leave', (conversationId: string) => {
    socket.leave(`conversation:${conversationId}`);
  });

  socket.on('ride:subscribe', (rideId: string) => {
    socket.join(`ride:${rideId}`);
  });

  socket.on('ride:unsubscribe', (rideId: string) => {
    socket.leave(`ride:${rideId}`);
  });
});

// 404 handler for unknown routes
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'The requested endpoint does not exist',
    },
  });
});

// Centralized error handling
app.use(errorHandler);

// Start expiry cron job
if (env.NODE_ENV !== 'test') {
  startExpiryCron();
}

// Export app, server, and io for testing and socket events
export { app, server, io };

// Start listening if run directly
if (env.NODE_ENV !== 'test') {
  server.listen(env.PORT, () => {
    console.log(`🚀 CampusLoop Server running on http://localhost:${env.PORT}`);
  });
}
