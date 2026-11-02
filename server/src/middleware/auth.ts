import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma';
import { HttpError } from '../errors';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-replace-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: string;
  department?: string | null;
  year?: string | null;
  isBanned?: boolean;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export function generateToken(user: { id: string; email: string; name: string; role?: string }): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role || 'USER',
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN as any }
  );
}

export async function authenticateUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new HttpError(401, 'UNAUTHORIZED', 'Authorization header missing or invalid');
    }

    const token = authHeader.split(' ')[1];
    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      throw new HttpError(401, 'UNAUTHORIZED', 'Invalid or expired JWT token');
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
    });

    if (!user) {
      throw new HttpError(401, 'UNAUTHORIZED', 'User associated with token no longer exists');
    }

    if (user.isBanned) {
      throw new HttpError(403, 'FORBIDDEN', 'Your account has been banned from CampusLoop');
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
      year: user.year,
      isBanned: user.isBanned,
    };

    next();
  } catch (err) {
    next(err);
  }
}

export function requireRole(role: 'ADMIN' | 'USER') {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new HttpError(401, 'UNAUTHORIZED', 'Authentication required'));
    }
    if (req.user.role !== role && req.user.role !== 'ADMIN') {
      return next(new HttpError(403, 'FORBIDDEN', 'Insufficient permissions'));
    }
    next();
  };
}

export async function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const payload: any = jwt.verify(token, JWT_SECRET);
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
