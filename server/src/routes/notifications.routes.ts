import { Router, Response, NextFunction } from 'express';
import { prisma } from '../prisma';
import { authenticateUser, AuthRequest } from '../middleware/auth';
import { HttpError } from '../errors';

const router = Router();

// GET /api/notifications - List user notifications
router.get('/', authenticateUser, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      data: notifications,
    });
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
