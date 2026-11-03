import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { authenticate, requireRole } from '../middlewares/auth';
import { validateBody } from '../middlewares/validate';
import { AppError, sendSuccess } from '../utils/response';
import { parsePagination, buildPaginationMeta } from '../utils/pagination';

const router = Router();

// Normalizes target types to standard enum
const normalizeTargetType = (val: string): string => {
  const norm = val.toUpperCase().trim().replace(/[-\s]/g, '_');
  if (norm === 'LOST') return 'LOST_ITEM';
  if (norm === 'FOUND') return 'FOUND_ITEM';
  if (norm === 'MARKETPLACE') return 'LISTING';
  return norm;
};

export const createReportSchema = z.object({
  targetType: z
    .string()
    .transform(normalizeTargetType)
    .pipe(z.enum(['USER', 'LOST_ITEM', 'FOUND_ITEM', 'LISTING', 'RIDE'])),
  targetId: z.string().min(1, 'targetId is required'),
  reason: z.string().min(3, 'Reason must be at least 3 characters'),
  details: z.string().optional().nullable(),
});

export const banUserSchema = z.object({
  isBanned: z.boolean().default(true),
  reason: z.string().optional(),
});

/**
 * Common handler for POST /api/reports
 */
async function handleCreateReport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const { targetType, targetId, reason, details } = req.body;

    // Verify target exists
    let targetExists = false;
    switch (targetType) {
      case 'USER': {
        const u = await prisma.user.findUnique({ where: { id: targetId } });
        targetExists = !!u;
        break;
      }
      case 'LOST_ITEM': {
        const item = await prisma.lostItem.findUnique({ where: { id: targetId } });
        targetExists = !!item;
        break;
      }
      case 'FOUND_ITEM': {
        const item = await prisma.foundItem.findUnique({ where: { id: targetId } });
        targetExists = !!item;
        break;
      }
      case 'LISTING': {
        const listing = await prisma.listing.findUnique({ where: { id: targetId } });
        targetExists = !!listing;
        break;
      }
      case 'RIDE': {
        const ride = await prisma.ride.findUnique({ where: { id: targetId } });
        targetExists = !!ride;
        break;
      }
    }

    if (!targetExists) {
      throw new AppError(404, 'NOT_FOUND', `Reported ${targetType} does not exist`);
    }

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

/**
 * POST /api/reports
 * Mount on both /reports and / so it works regardless of mount point
 */
router.post('/reports', authenticate, validateBody(createReportSchema), handleCreateReport);
router.post('/', authenticate, validateBody(createReportSchema), handleCreateReport);

/**
 * GET /api/admin/reports
 * Fetch reports queue with filtering & pagination (Admin only)
 */
router.get(
  '/admin/reports',
  authenticate,
  requireRole('ADMIN'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { status, targetType, paginated } = req.query as Record<string, string>;
      const { page, limit, skip } = parsePagination(req);

      const where: any = {};
      if (status) {
        where.status = status.toLowerCase();
      }
      if (targetType) {
        where.targetType = normalizeTargetType(targetType);
      }

      const [reports, total] = await Promise.all([
        prisma.report.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            reporter: {
              select: { id: true, name: true, email: true },
            },
          },
        }),
        prisma.report.count({ where }),
      ]);

      const meta = buildPaginationMeta(total, page, limit);

      res.setHeader('X-Total-Count', total.toString());
      res.setHeader('X-Total-Pages', meta.totalPages.toString());
      res.setHeader('X-Current-Page', page.toString());
      res.setHeader('X-Page-Size', limit.toString());

      if (paginated === 'true') {
        sendSuccess(res, { items: reports, meta });
      } else {
        sendSuccess(res, reports);
      }
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
      const normalizedType = type.toLowerCase().trim();

      switch (normalizedType) {
        case 'lost':
        case 'lost_item':
          await prisma.lostItem.delete({ where: { id } });
          break;
        case 'found':
        case 'found_item':
          await prisma.foundItem.delete({ where: { id } });
          break;
        case 'listing':
        case 'marketplace':
          await prisma.listing.delete({ where: { id } });
          break;
        case 'ride':
          await prisma.ride.delete({ where: { id } });
          break;
        default:
          throw new AppError(400, 'INVALID_TYPE', 'Type must be: lost, found, listing, or ride');
      }

      // Mark any associated reports as resolved
      const reportTargetType =
        normalizedType === 'lost' || normalizedType === 'lost_item'
          ? 'LOST_ITEM'
          : normalizedType === 'found' || normalizedType === 'found_item'
          ? 'FOUND_ITEM'
          : normalizedType === 'listing'
          ? 'LISTING'
          : 'RIDE';

      await prisma.report.updateMany({
        where: { targetType: reportTargetType, targetId: id, status: 'pending' },
        data: { status: 'reviewed' },
      });

      sendSuccess(res, { type: normalizedType, id, deleted: true });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PATCH /api/admin/users/:id/ban
 * Ban or unban user account from the platform (Admin only)
 */
router.patch(
  '/admin/users/:id/ban',
  authenticate,
  requireRole('ADMIN'),
  validateBody(banUserSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const { isBanned } = req.body;

      const userExists = await prisma.user.findUnique({ where: { id } });
      if (!userExists) {
        throw new AppError(404, 'NOT_FOUND', 'User not found');
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: { isBanned },
        select: { id: true, isBanned: true, updatedAt: true },
      });

      // Also mark pending reports against this user as reviewed
      if (isBanned) {
        await prisma.report.updateMany({
          where: { targetType: 'USER', targetId: id, status: 'pending' },
          data: { status: 'reviewed' },
        });
      }

      sendSuccess(res, updatedUser);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/admin/analytics (and /admin/stats)
 * Basic platform analytics for admins:
 * - Items reunited (lost & found)
 * - Rides completed
 * - Active listings
 * - Reports pending
 */
async function handleGetAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const [
      lostReunited,
      foundReunited,
      ridesCompleted,
      activeListings,
      reportsPending,
      totalUsers,
      activeRides,
      totalMatches,
    ] = await Promise.all([
      prisma.lostItem.count({ where: { status: 'reunited' } }),
      prisma.foundItem.count({ where: { status: 'reunited' } }),
      prisma.ride.count({ where: { status: 'COMPLETED' } }),
      prisma.listing.count({ where: { status: 'available', isExpired: false } }),
      prisma.report.count({ where: { status: 'pending' } }),
      prisma.user.count(),
      prisma.ride.count({ where: { status: 'OPEN' } }),
      (prisma as any).match ? (prisma as any).match.count() : Promise.resolve(0),
    ]);

    const itemsReunited = lostReunited + foundReunited;

    sendSuccess(res, {
      itemsReunited,
      ridesCompleted,
      activeListings,
      reportsPending,
      breakdown: {
        lostItemsReunited: lostReunited,
        foundItemsReunited: foundReunited,
        totalUsers,
        activeRides,
        totalMatches,
      },
    });
  } catch (err) {
    next(err);
  }
}

router.get('/admin/analytics', authenticate, requireRole('ADMIN'), handleGetAnalytics);
router.get('/admin/stats', authenticate, requireRole('ADMIN'), handleGetAnalytics);

export default router;
