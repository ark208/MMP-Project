import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { authenticate, optionalAuth } from '../middlewares/auth';
import { validateBody } from '../middlewares/validate';
import { AppError, sendSuccess } from '../utils/response';

const router = Router();

// Validation Schemas
export const createLostSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  category: z.string().min(1, 'Category is required'),
  location: z.string().min(1, 'Location is required'),
  dateLost: z.string().datetime({ message: 'dateLost must be a valid ISO datetime string' }),
  imageUrl: z.string().url('Invalid image URL').optional().nullable(),
});

export const updateLostStatusSchema = z.object({
  status: z.enum(['open', 'reunited', 'closed'], {
    errorMap: () => ({ message: 'Status must be one of: open, reunited, closed' }),
  }),
});

/**
 * POST /api/lost
 * Report a lost item (30-day default expiry)
 */
router.post(
  '/',
  authenticate,
  validateBody(createLostSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user!;
      const { title, description, category, location, dateLost, imageUrl } = req.body;

      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

      const lostItem = await prisma.lostItem.create({
        data: {
          userId: user.id,
          title,
          description,
          category,
          location,
          dateLost: new Date(dateLost),
          imageUrl: imageUrl || null,
          status: 'open',
          isExpired: false,
          expiresAt,
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
        },
      });

      sendSuccess(res, lostItem, 201);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/lost
 * List lost items with category, status, q filters
 */
router.get(
  '/',
  optionalAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { category, status, q, page = '1', limit = '20' } = req.query as Record<string, string>;
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
      const skip = (pageNum - 1) * limitNum;

      const where: any = {
        isExpired: false,
      };

      if (category) {
        where.category = { equals: category, mode: 'insensitive' };
      }

      if (status) {
        where.status = { equals: status, mode: 'insensitive' };
      } else {
        where.status = 'open';
      }

      if (q) {
        where.OR = [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { location: { contains: q, mode: 'insensitive' } },
        ];
      }

      const items = await prisma.lostItem.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
        },
      });

      sendSuccess(res, items);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/lost/:id
 * Retrieve a specific lost item
 */
router.get(
  '/:id',
  optionalAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const item = await prisma.lostItem.findUnique({
        where: { id },
        include: {
          user: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
        },
      });

      if (!item) {
        throw new AppError(404, 'NOT_FOUND', 'Lost item not found');
      }

      sendSuccess(res, item);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PATCH /api/lost/:id/status
 * Update status (open, reunited, closed). Owner or admin only.
 */
router.patch(
  '/:id/status',
  authenticate,
  validateBody(updateLostStatusSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const { status } = req.body;
      const user = req.user!;

      const item = await prisma.lostItem.findUnique({ where: { id } });
      if (!item) {
        throw new AppError(404, 'NOT_FOUND', 'Lost item not found');
      }

      if (item.userId !== user.id && user.role !== 'ADMIN') {
        throw new AppError(403, 'FORBIDDEN', 'You do not have permission to update this item');
      }

      const updated = await prisma.lostItem.update({
        where: { id },
        data: { status },
      });

      sendSuccess(res, updated);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
