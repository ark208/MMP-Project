import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { authenticate, requireRole } from '../middlewares/auth';
import { validateBody } from '../middlewares/validate';
import { AppError, sendSuccess } from '../utils/response';

const router = Router();

export const createReportSchema = z.object({
  targetType: z.enum(['USER', 'LOST', 'FOUND', 'LISTING', 'RIDE']),
  targetId: z.string().min(1, 'targetId is required'),
  reason: z.string().min(3, 'Reason must be at least 3 characters'),
  details: z.string().optional().nullable(),
});

/**
 * POST /api/reports
 * Submit a moderation report
 */
router.post(
  '/',
  authenticate,
  validateBody(createReportSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user!;
      const { targetType, targetId, reason, details } = req.body;

      const report = await prisma.report.create({
        data: {
          reporterId: user.id,
          targetType,
          targetId,
          reason,
          details: details || null,
          status: 'pending',
        },
      });

      sendSuccess(res, report, 201);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/admin/reports
 * Fetch reports queue (Admin only)
 */
router.get(
  '/admin/reports',
  authenticate,
  requireRole('ADMIN'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { status, targetType } = req.query as Record<string, string>;
      const where: any = {};
      if (status) where.status = status;
      if (targetType) where.targetType = targetType;

      const reports = await prisma.report.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          reporter: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      sendSuccess(res, reports);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * DELETE /api/admin/posts/:type/:id
 * Admin moderation removal of flagged content
 */
router.delete(
  '/admin/posts/:type/:id',
  authenticate,
  requireRole('ADMIN'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const type = req.params.type as string;
      const id = req.params.id as string;
      const normalizedType = type.toLowerCase();

      switch (normalizedType) {
        case 'lost':
          await prisma.lostItem.delete({ where: { id } });
          break;
        case 'found':
          await prisma.foundItem.delete({ where: { id } });
          break;
        case 'listing':
          await prisma.listing.delete({ where: { id } });
          break;
        case 'ride':
          await prisma.ride.delete({ where: { id } });
          break;
        default:
          throw new AppError(400, 'INVALID_TYPE', 'Type must be: lost, found, listing, or ride');
      }

      sendSuccess(res, { type: normalizedType, id, deleted: true });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PATCH /api/admin/users/:id/ban
 * Ban or unban user (Admin only)
 */
router.patch(
  '/admin/users/:id/ban',
  authenticate,
  requireRole('ADMIN'),
  validateBody(z.object({ isBanned: z.boolean() })),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const { isBanned } = req.body;

      const updatedUser = await prisma.user.update({
        where: { id },
        data: { isBanned },
        select: { id: true, isBanned: true, updatedAt: true },
      });

      sendSuccess(res, updatedUser);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
