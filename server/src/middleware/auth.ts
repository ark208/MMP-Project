// Thin bridge: exposes the same API surface the Phase-2 routes expect
// (authenticateUser, AuthRequest, generateToken, requireRole, optionalAuth)
// while delegating JWT verification to the same env.JWT_SECRET the remote uses.
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/response';
import { User } from '@prisma/client';

// Extend Express Request so req.user is the full Prisma User (matching remote's declaration)
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export interface AuthRequest extends Request {
  user?: User;
}

export function generateToken(user: { id: string; email: string; name: string; role?: string }): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role || 'USER',
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as any }
  );
}

export async function authenticateUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next(new AppError(401, 'UNAUTHORIZED', 'Authorization header missing or invalid'));
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as any;
    const user = await prisma.user.findUnique({ where: { id: payload.id } });

    if (!user) {
      next(new AppError(401, 'UNAUTHORIZED', 'User associated with token no longer exists'));
      return;
    }

    if (user.isBanned) {
      next(new AppError(403, 'FORBIDDEN', 'Your account has been banned from CampusLoop'));
      return;
    }

    req.user = user;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      next(new AppError(401, 'UNAUTHORIZED', 'Token has expired. Please log in again.'));
      return;
    }
    next(new AppError(401, 'UNAUTHORIZED', 'Invalid or expired JWT token'));
  }
}

// Alias so callers that import `authenticate` (remote routes) also work
export { authenticateUser as authenticate };

export async function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const payload: any = jwt.verify(token, env.JWT_SECRET);
      const user = await prisma.user.findUnique({ where: { id: payload.id } });
      if (user && !user.isBanned) {
        req.user = user;
      }
    }
  } catch {
    // Ignore invalid optional token
  }
  next();
}

export function requireRole(role: 'ADMIN' | 'USER') {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError(401, 'UNAUTHORIZED', 'Authentication required'));
      return;
    }
    if (req.user.role !== role && req.user.role !== 'ADMIN') {
      next(new AppError(403, 'FORBIDDEN', 'Insufficient permissions'));
      return;
    }
    next();
  };
}
