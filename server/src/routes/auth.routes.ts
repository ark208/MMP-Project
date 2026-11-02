import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { sendOtpEmail } from '../services/email.service';
import { AppError, sendSuccess } from '../utils/response';
import { authenticate } from '../middlewares/auth';
import { validateBody } from '../middlewares/validate';
import { authLimiter } from '../middlewares/rateLimiter';

const router = Router();

// Validation Schemas
export const requestOtpSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export const verifyOtpSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  otp: z.string().regex(/^\d{6}$/, 'OTP must be exactly 6 digits'),
});

/**
 * POST /api/auth/request-otp
 * Validates domain, generates 6-digit OTP, hashes it, stores with 10-min expiry, sends email
 */
router.post(
  '/request-otp',
  authLimiter,
  validateBody(requestOtpSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const email = req.body.email.toLowerCase().trim();

      // Check email domain
      const emailDomain = email.split('@')[1];
      const allowedDomain = env.ALLOWED_EMAIL_DOMAIN.toLowerCase();
      const isAllowed =
        emailDomain === allowedDomain || emailDomain?.endsWith(`.${allowedDomain}`);

      if (!isAllowed) {
        throw new AppError(
          400,
          'INVALID_EMAIL_DOMAIN',
          `Only university email addresses ending with @${env.ALLOWED_EMAIL_DOMAIN} are permitted.`
        );
      }

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      // Hash OTP using bcrypt
      const salt = await bcrypt.genSalt(10);
      const otpHash = await bcrypt.hash(otp, salt);

      // Clean up previous tokens for this email
      await prisma.otpToken.deleteMany({ where: { email } });

      // Save new token with 10-minute expiry
      await prisma.otpToken.create({
        data: {
          email,
          otpHash,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        },
      });

      // Send via Nodemailer (logs to console in dev mode)
      await sendOtpEmail(email, otp);

      sendSuccess(res, {
        message: 'OTP sent successfully',
        email,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/auth/verify-otp
 * Validates OTP, creates user on first login, returns JWT
 */
router.post(
  '/verify-otp',
  authLimiter,
  validateBody(verifyOtpSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const email = req.body.email.toLowerCase().trim();
      const otp = req.body.otp.trim();

      // Retrieve latest active token record
      const tokenRecord = await prisma.otpToken.findFirst({
        where: {
          email,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
      });

      let isOtpValid = false;

      if (tokenRecord) {
        isOtpValid = await bcrypt.compare(otp, tokenRecord.otpHash);
      }

      // Dev & test fallback OTP 123456
      if (!isOtpValid && env.NODE_ENV !== 'production' && otp === '123456') {
        const emailDomain = email.split('@')[1];
        if (
          emailDomain === env.ALLOWED_EMAIL_DOMAIN ||
          emailDomain?.endsWith(`.${env.ALLOWED_EMAIL_DOMAIN}`)
        ) {
          isOtpValid = true;
        }
      }

      if (!isOtpValid) {
        throw new AppError(400, 'INVALID_OTP', 'Invalid or expired verification code');
      }

      // Remove consumed tokens
      await prisma.otpToken.deleteMany({ where: { email } });

      // Find or create user
      let user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        const namePart = email.split('@')[0].replace(/[._-]/g, ' ');
        const formattedName = namePart
          .split(' ')
          .map((s: string) => s.charAt(0).toUpperCase() + s.slice(1))
          .join(' ') || 'Campus Student';

        user = await prisma.user.create({
          data: {
            email,
            name: formattedName,
            role: email.startsWith('admin@') ? 'ADMIN' : 'USER',
          },
        });
      }

      if (user.isBanned) {
        throw new AppError(403, 'FORBIDDEN', 'Your account has been suspended by an administrator');
      }

      // Sign JWT
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        env.JWT_SECRET,
        { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions
      );

      sendSuccess(res, {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          avatarUrl: user.avatarUrl,
          role: user.role,
          isBanned: user.isBanned,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/me
 * Retrieves profile of currently authenticated user
 */
router.get(
  '/me',
  authenticate,
  (req: Request, res: Response): void => {
    sendSuccess(res, req.user);
  }
);

export default router;
