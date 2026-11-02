import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validateBody } from '../middlewares/validate';
import { AppError, sendSuccess } from '../utils/response';
import { parsePagination, buildPaginationMeta } from '../utils/pagination';

const router = Router();

const updateMatchStatusSchema = z.object({
  status: z.enum(['PENDING', 'ACCEPTED', 'DISMISSED']),
});

/**
 * GET /api/matches
 * List matches for items belonging to the current user (with pagination)
 */
router.get('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { status, paginated } = req.query as Record<string, string>;
    const { page, limit, skip } = parsePagination(req);

    // Find all lost items and found items owned by user
    const [userLostItems, userFoundItems] = await Promise.all([
      prisma.lostItem.findMany({ where: { userId: user.id }, select: { id: true } }),
      prisma.foundItem.findMany({ where: { userId: user.id }, select: { id: true } }),
    ]);

    const lostIds = userLostItems.map((i: any) => i.id);
    const foundIds = userFoundItems.map((i: any) => i.id);

    const where: any = {
      OR: [
        { lostItemId: { in: lostIds } },
        { foundItemId: { in: foundIds } },
      ],
    };

    if (status) {
      where.status = status.toUpperCase();
    }

    if (!(prisma as any).match) {
      return sendSuccess(res, paginated === 'true' ? { items: [], meta: buildPaginationMeta(0, page, limit) } : []);
    }

    const [matches, total] = await Promise.all([
      (prisma as any).match.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ score: 'desc' }, { createdAt: 'desc' }],
        include: {
          lostItem: {
            include: {
              user: {
                select: { id: true, name: true, avatarUrl: true },
              },
            },
          },
          foundItem: {
            include: {
              user: {
                select: { id: true, name: true, avatarUrl: true },
              },
            },
          },
        },
      }),
      (prisma as any).match.count({ where }),
    ]);

    // Sanitize found item secretAnswer
    const sanitizedMatches = matches.map((m: any) => {
      if (m.foundItem && m.foundItem.secretAnswer) {
        const { secretAnswer, ...safeFound } = m.foundItem;
        return { ...m, foundItem: safeFound };
      }
      return m;
    });

    const meta = buildPaginationMeta(total, page, limit);

    res.setHeader('X-Total-Count', total.toString());
    res.setHeader('X-Total-Pages', meta.totalPages.toString());
    res.setHeader('X-Current-Page', page.toString());
    res.setHeader('X-Page-Size', limit.toString());

    if (paginated === 'true') {
      sendSuccess(res, { items: sanitizedMatches, meta });
    } else {
      sendSuccess(res, sanitizedMatches);
    }
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/matches/:id
 * Retrieve a specific match with side-by-side lost and found item comparison
 */
router.get('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    if (!(prisma as any).match) {
      throw new AppError(404, 'NOT_FOUND', 'Match not found');
    }

    const match = await (prisma as any).match.findUnique({
      where: { id: String(id) },
      include: {
        lostItem: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
        foundItem: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
      },
    });

    if (!match) {
      throw new AppError(404, 'NOT_FOUND', 'Match not found');
    }

    // Permission check: User must own either the lost item or found item, or be ADMIN
    const isLostOwner = match.lostItem.userId === user.id;
    const isFoundOwner = match.foundItem.userId === user.id;
    const isAdmin = user.role === 'ADMIN';

    if (!isLostOwner && !isFoundOwner && !isAdmin) {
      throw new AppError(403, 'FORBIDDEN', 'You do not have permission to view this match');
    }

    // Hide secretAnswer from foundItem
    if (match.foundItem?.secretAnswer) {
      delete match.foundItem.secretAnswer;
    }

    sendSuccess(res, match);
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/matches/:id/status
 * Update status of match ("ACCEPTED" / "DISMISSED")
 */
router.patch(
  '/:id/status',
  authenticate,
  validateBody(updateMatchStatusSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const user = req.user!;

      if (!(prisma as any).match) {
        throw new AppError(404, 'NOT_FOUND', 'Match not found');
      }

      const match = await (prisma as any).match.findUnique({
        where: { id: String(id) },
        include: {
          lostItem: true,
          foundItem: true,
        },
      });

      if (!match) {
        throw new AppError(404, 'NOT_FOUND', 'Match not found');
      }

      const isLostOwner = match.lostItem.userId === user.id;
      const isFoundOwner = match.foundItem.userId === user.id;
      const isAdmin = user.role === 'ADMIN';

      if (!isLostOwner && !isFoundOwner && !isAdmin) {
        throw new AppError(403, 'FORBIDDEN', 'You do not have permission to update this match');
      }

      const updated = await (prisma as any).match.update({
        where: { id: String(id) },
        data: { status },
      });

      sendSuccess(res, updated);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
