import rateLimit from 'express-rate-limit';
import { sendError } from '../utils/response';

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(res, 429, 'TOO_MANY_REQUESTS', 'Too many requests. Please try again later.');
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Limit each IP to 15 auth requests per window
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(res, 429, 'TOO_MANY_REQUESTS', 'Too many authentication attempts. Please try again in 15 minutes.');
  },
});

