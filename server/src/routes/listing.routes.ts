import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { authenticate, optionalAuth } from '../middlewares/auth';
import { validateBody } from '../middlewares/validate';
import { AppError, sendSuccess } from '../utils/response';

const router = Router();

// Validation Schemas
export const createListingSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  price: z.number().positive('Price must be greater than zero'),
  category: z.string().min(1, 'Category is required'),
  condition: z.enum(['new', 'like new', 'used'], {
    errorMap: () => ({ message: 'Condition must be: new, like new, or used' }),
  }),
  imageUrls: z.array(z.string().url('Invalid image URL')).default([]),
});

export const updateListingSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().min(5).optional(),
  price: z.number().positive().optional(),
  category: z.string().min(1).optional(),
  condition: z.enum(['new', 'like new', 'used']).optional(),
  imageUrls: z.array(z.string().url()).optional(),
  status: z.enum(['available', 'reserved', 'sold']).optional(),
});

/**
 * POST /api/listings
 * Create marketplace listing with 30-day default expiry
 */
router.post(
  '/',
  authenticate,
  validateBody(createListingSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user!;
      const { title, description, price, category, condition, imageUrls } = req.body;

      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

      const listing = await prisma.listing.create({
        data: {
          sellerId: user.id,
          title,
          description,
          price,
          category,
          condition,
          imageUrls,
          status: 'available',
          isExpired: false,
          expiresAt,
        },
        include: {
          seller: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
        },
      });

      sendSuccess(res, listing, 201);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/listings
 * Filtered search with pagination & wishlist indicator
 */
router.get(
  '/',
  optionalAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const {
        category,
        minPrice,
        maxPrice,
        condition,
        q,
        page = '1',
        limit = '20',
      } = req.query as Record<string, string>;

      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
      const skip = (pageNum - 1) * limitNum;

      const where: any = {
        isExpired: false,
        status: { not: 'sold' },
      };

      if (category) {
        where.category = { equals: category, mode: 'insensitive' };
      }

      if (condition) {
        where.condition = { equals: condition, mode: 'insensitive' };
      }

      if (minPrice || maxPrice) {
        where.price = {};
        if (minPrice) where.price.gte = parseFloat(minPrice);
        if (maxPrice) where.price.lte = parseFloat(maxPrice);
      }

      if (q) {
        where.OR = [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { category: { contains: q, mode: 'insensitive' } },
        ];
      }

      const [items, total] = await Promise.all([
        prisma.listing.findMany({
          where,
          skip,
          take: limitNum,
          orderBy: { createdAt: 'desc' },
          include: {
            seller: {
              select: { id: true, name: true, avatarUrl: true },
            },
          },
        }),
        prisma.listing.count({ where }),
      ]);

      // If user is authenticated, query wishlist items
      let wishlistedIds = new Set<string>();
      if (req.user) {
        const wishlists = await prisma.wishlist.findMany({
          where: {
            userId: req.user.id,
            listingId: { in: items.map((i) => i.id) },
          },
          select: { listingId: true },
        });
        wishlistedIds = new Set(wishlists.map((w) => w.listingId));
      }

      const formatted = items.map((item) => ({
        ...item,
        isWishlisted: wishlistedIds.has(item.id),
      }));

      sendSuccess(res, {
        items: formatted,
        meta: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum) || 1,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/listings/:id
 * Retrieve single listing
 */
router.get(
  '/:id',
  optionalAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const listing = await prisma.listing.findUnique({
        where: { id },
        include: {
          seller: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
        },
      });

      if (!listing) {
        throw new AppError(404, 'NOT_FOUND', 'Listing not found');
      }

      let isWishlisted = false;
      if (req.user) {
        const wish = await prisma.wishlist.findUnique({
          where: {
            userId_listingId: {
              userId: req.user.id,
              listingId: id,
            },
          },
        });
        isWishlisted = Boolean(wish);
      }

      sendSuccess(res, { ...listing, isWishlisted });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PATCH /api/listings/:id
 * Update listing. Seller or admin only.
 */
router.patch(
  '/:id',
  authenticate,
  validateBody(updateListingSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const user = req.user!;

      const existing = await prisma.listing.findUnique({ where: { id } });
      if (!existing) {
        throw new AppError(404, 'NOT_FOUND', 'Listing not found');
      }

      if (existing.sellerId !== user.id && user.role !== 'ADMIN') {
        throw new AppError(403, 'FORBIDDEN', 'You do not have permission to modify this listing');
      }

      const updated = await prisma.listing.update({
        where: { id },
        data: req.body,
      });

      sendSuccess(res, updated);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * DELETE /api/listings/:id
 * Remove listing. Seller or admin only.
 */
router.delete(
  '/:id',
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const user = req.user!;

      const existing = await prisma.listing.findUnique({ where: { id } });
      if (!existing) {
        throw new AppError(404, 'NOT_FOUND', 'Listing not found');
      }

      if (existing.sellerId !== user.id && user.role !== 'ADMIN') {
        throw new AppError(403, 'FORBIDDEN', 'You do not have permission to delete this listing');
      }

      await prisma.listing.delete({ where: { id } });

      sendSuccess(res, { id, deleted: true });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/listings/:id/wishlist
 * Add listing to user's wishlist
 */
router.post(
  '/:id/wishlist',
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const user = req.user!;

      const listing = await prisma.listing.findUnique({ where: { id } });
      if (!listing) {
        throw new AppError(404, 'NOT_FOUND', 'Listing not found');
      }

      await prisma.wishlist.upsert({
        where: {
          userId_listingId: {
            userId: user.id,
            listingId: id,
          },
        },
        create: {
          userId: user.id,
          listingId: id,
        },
        update: {},
      });

      sendSuccess(res, { listingId: id, isWishlisted: true });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * DELETE /api/listings/:id/wishlist
 * Remove listing from user's wishlist
 */
router.delete(
  '/:id/wishlist',
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const user = req.user!;

      await prisma.wishlist.deleteMany({
        where: {
          userId: user.id,
          listingId: id,
        },
      });

      sendSuccess(res, { listingId: id, isWishlisted: false });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
