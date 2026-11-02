import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { authenticate } from '../middlewares/auth';
import { sendSuccess } from '../utils/response';

const router = Router();

/**
 * GET /api/wishlist
 * Fetches all wishlisted listings for current user
 */
router.get(
  '/',
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user!;
      const wishlists = await prisma.wishlist.findMany({
        where: { userId: user.id },
        include: {
          listing: {
            include: {
              seller: {
                select: { id: true, name: true, avatarUrl: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const items = wishlists.map((w) => ({
        ...w.listing,
        isWishlisted: true,
      }));

      sendSuccess(res, items);
    } catch (err) {
      next(err);
    }
  }
);

export default router;

