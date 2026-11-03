import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { authenticateUser, AuthRequest } from '../middleware/auth';
import { notificationService } from '../services/notification.service';
import { parsePagination, buildPaginationMeta } from '../utils/pagination';

const router = Router();

const updatePreferencesSchema = z.object({
  emailMatches: z.boolean().optional(),
  emailRideJoins: z.boolean().optional(),
  emailMessages: z.boolean().optional(),
  whatsappMatches: z.boolean().optional(),
  whatsappRideJoins: z.boolean().optional(),
  whatsappMessages: z.boolean().optional(),
  whatsappNumber: z.string().nullable().optional(),
});

// GET /api/notifications/preferences - Get notification preferences for current user
router.get('/preferences', authenticateUser, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const preferences = await notificationService.getUserPreferences(user.id);
    res.json({
      data: preferences,
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/notifications/preferences - Update notification preferences
router.patch('/preferences', authenticateUser, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const validated = updatePreferencesSchema.parse(req.body);
    const updated = await notificationService.updateUserPreferences(user.id, validated);
    res.json({
      data: updated,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/notifications - List user notifications with pagination
router.get('/', authenticateUser, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { paginated } = req.query as Record<string, string>;
    const { page, limit, skip } = parsePagination(req);

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: user.id },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where: { userId: user.id } }),
      prisma.notification.count({ where: { userId: user.id, isRead: false } }),
    ]);

    const meta = buildPaginationMeta(total, page, limit);

    res.setHeader('X-Total-Count', total.toString());
    res.setHeader('X-Unread-Count', unreadCount.toString());
    res.setHeader('X-Total-Pages', meta.totalPages.toString());
    res.setHeader('X-Current-Page', page.toString());
    res.setHeader('X-Page-Size', limit.toString());

    if (paginated === 'true') {
      res.json({
        data: {
          items: notifications,
          unreadCount,
          meta,
        },
      });
    } else {
      res.json({
        data: notifications,
      });
    }
  } catch (err) {
    next(err);
  }
});

// PATCH /api/notifications/:id/read - Mark notification as read
router.patch('/:id/read', authenticateUser, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const notif = await prisma.notification.update({
      where: { id: String(id) },
      data: { isRead: true },
    });

    res.json({
      data: {
        id: notif.id,
        isRead: true,
      },
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/notifications/read-all - Mark all as read
router.patch('/read-all', authenticateUser, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;

    const result = await prisma.notification.updateMany({
      where: { userId: user.id },
      data: { isRead: true },
    });

    res.json({
      data: {
        markedReadCount: result.count,
        success: true,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
