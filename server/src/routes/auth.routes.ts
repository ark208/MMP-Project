import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma';
import { authenticateUser, generateToken, AuthRequest } from '../middleware/auth';
import { HttpError } from '../errors';

const router = Router();

// In-memory OTP storage for demonstration
const otpStore: Map<string, { otp: string; expires: number }> = new Map();

// POST /api/auth/request-otp
router.post('/request-otp', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    if (!email) {
      throw new HttpError(400, 'BAD_REQUEST', 'University email is required');
    }

    const normalized = email.toLowerCase().trim();
    if (!normalized.endsWith('.edu') && !normalized.endsWith('.ac.in') && !normalized.includes('campus')) {
      throw new HttpError(400, 'BAD_REQUEST', 'Only valid university email addresses (.edu) are allowed');
    }

    // Default demo OTP 123456
    const otp = '123456';
    otpStore.set(normalized, {
      otp,
      expires: Date.now() + 10 * 60 * 1000, // 10 minutes
    });

    res.json({
      data: {
        message: 'OTP sent successfully to your university email.',
        email: normalized,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      throw new HttpError(400, 'BAD_REQUEST', 'Email and OTP passcode are required');
    }

    const normalized = email.toLowerCase().trim();
    const stored = otpStore.get(normalized);

    // Accept demo OTP or stored OTP
    if (otp !== '123456' && (!stored || stored.otp !== otp || stored.expires < Date.now())) {
      throw new HttpError(400, 'BAD_REQUEST', 'Invalid or expired OTP passcode');
    }

    // Clean up used OTP
    otpStore.delete(normalized);

    // Upsert user profile
    let user = await prisma.user.findUnique({ where: { email: normalized } });
    if (!user) {
      const defaultName = normalized
        .split('@')[0]
        .replace(/[._]/g, ' ')
        .replace(/\b\w/g, (c: string) => c.toUpperCase());

      user = await prisma.user.create({
        data: {
          email: normalized,
          name: defaultName,
          role: 'USER',
          department: 'General Studies',
          year: '1st Year',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
        },
      });
    }

    const token = generateToken(user);

    res.json({
      data: {
        token,
        user,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
