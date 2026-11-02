import 'dotenv/config';
import express, { Request, Response } from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';

// Shared config / middleware / services (remote)
import { env } from './config/env';
import { globalLimiter } from './middlewares/rateLimiter';
import { errorHandler } from './middlewares/errorHandler';
import { sanitizeInput } from './middlewares/sanitize';
import { startExpiryCron } from './services/cron.service';
import { sendSuccess } from './utils/response';

// Socket + auth (yours)
import { configureSocketIO } from './socket';
import { authenticateUser, AuthRequest } from './middleware/auth';

// Route imports
import authRoutes from './routes/auth.routes';
import tripsRoutes from './routes/trips.routes';
import ridesRoutes from './routes/rides.routes';
import chatRoutes from './routes/chat.routes';
import notificationsRoutes from './routes/notifications.routes';
import uploadRoutes from './routes/upload.routes';
import lostRoutes from './routes/lost.routes';
import foundRoutes from './routes/found.routes';
import listingRoutes from './routes/listing.routes';
import wishlistRoutes from './routes/wishlist.routes';
import reportRoutes from './routes/report.routes';
import matchRoutes from './routes/match.routes';

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

// Socket.io with JWT handshake auth and event handlers
configureSocketIO(io);

// Security & global middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow serving uploaded images across origins
  })
);
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(globalLimiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input sanitization pass
app.use(sanitizeInput);

// Serve local uploads
app.use('/uploads', express.static(env.UPLOAD_DIR));

// Health checks
app.get('/', (_req: Request, res: Response) => {
  sendSuccess(res, {
    name: 'CampusLoop API',
    status: 'healthy',
    version: '3.0.0',
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

// GET /api/me - authenticated user profile
app.get('/api/me', authenticateUser, (req: AuthRequest, res: Response) => {
  res.json({ data: req.user });
});

// Mount module routes
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripsRoutes);
app.use('/api/rides', ridesRoutes);
app.use('/api/conversations', chatRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/lost', lostRoutes);
app.use('/api/found', foundRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api', reportRoutes); // handles /api/reports, /api/admin/reports, /api/admin/posts/:type/:id, /api/admin/users/:id/ban, /api/admin/analytics

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'The requested endpoint does not exist',
      details: null,
    },
  });
});

// Centralized error handling
app.use(errorHandler);

// Start expiry cron job
if (env.NODE_ENV !== 'test') {
  startExpiryCron();
}

// Server listen if not imported for testing
if (process.env.NODE_ENV !== 'test') {
  server.listen(env.PORT, () => {
    console.log(`🚀 CampusLoop Server running on port ${env.PORT}`);
    console.log(`📡 WebSocket ready on ws://localhost:${env.PORT}`);
    console.log(`🔗 Allowed domain: @${env.ALLOWED_EMAIL_DOMAIN}`);
  });
}

export { app, server, io };
