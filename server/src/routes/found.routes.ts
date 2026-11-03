import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma';
import { authenticate, optionalAuth } from '../middlewares/auth';
import { validateBody } from '../middlewares/validate';
import { AppError, sendSuccess } from '../utils/response';
import { matchingService } from '../services/matching.service';
import { parsePagination, buildPaginationMeta } from '../utils/pagination';

const router = Router();

// Validation Schemas
export const createFoundSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  category: z.string().min(1, 'Category is required'),
  location: z.string().min(1, 'Location is required'),
  dateFound: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'dateFound must be a valid date string' }),
  imageUrl: z
    .string()
    .url('Invalid image URL')
    .optional()
    .nullable()
    .or(z.literal(''))
    .transform((val) => (val === '' ? null : val)),
  holdingLocation: z
    .string()
    .min(1, 'Holding location is required')
    .default('with finder'),
  secretQuestion: z.string().min(3, 'Secret question must be at least 3 characters'),
  secretAnswer: z.string().min(1, 'Secret answer is required for ownership verification'),
});

export const claimFoundSchema = z.object({
  answer: z.string().min(1, 'Verification answer is required'),
  note: z.string().optional(),
  proofImageUrl: z
    .string()
    .optional()
    .nullable()
    .or(z.literal(''))
    .transform((val) => (val === '' ? null : val)),
});

export const updateFoundStatusSchema = z.object({
  status: z
    .string()
    .transform((val) => {
      const v = val.toLowerCase().trim();
      return v === 'resolved' ? 'reunited' : v;
    })
    .pipe(z.enum(['open', 'reunited'])),
});

/**
 * POST /api/found
 * Report a found item with holding location, secret question & hashed answer
 * Triggers smart auto-matching against open lost items
 */
router.post(
  '/',
  authenticate,
  validateBody(createFoundSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user!;
      const {
        title,
        description,
        category,
        location,
        dateFound,
        imageUrl,
        holdingLocation,
        secretQuestion,
        secretAnswer,
      } = req.body;

      // Hash secret answer before storing
      const salt = await bcrypt.genSalt(10);
      const hashedSecretAnswer = await bcrypt.hash(secretAnswer.trim().toLowerCase(), salt);

      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

      const foundItem = await prisma.foundItem.create({
        data: {
          userId: user.id,
          title,
          description,
          category,
          location,
          dateFound: new Date(dateFound),
          imageUrl: imageUrl || null,
          holdingLocation,
          secretQuestion,
          secretAnswer: hashedSecretAnswer,
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

      // Trigger auto-matching asynchronously
      matchingService.matchNewFoundItem(foundItem).catch((matchErr) => {
        console.error('[FoundRoutes] Auto-matching failed:', matchErr);
      });

      // Omit secretAnswer from response
      const { secretAnswer: _, ...sanitized } = foundItem;

      sendSuccess(res, sanitized, 201);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/found
 * List found items with category, status, q filters (secretAnswer omitted)
 */
router.get(
  '/',
  optionalAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { category, status, q, paginated } = req.query as Record<string, string>;
      const { page, limit, skip } = parsePagination(req);

      const where: any = {
        isExpired: false,
      };

      if (category && category.toUpperCase() !== 'ALL') {
        where.category = { equals: category, mode: 'insensitive' };
      }

      if (status && status.toUpperCase() !== 'ALL') {
        const normStatus = status.toLowerCase() === 'resolved' ? 'reunited' : status.toLowerCase();
        where.status = { equals: normStatus, mode: 'insensitive' };
      }

      if (q) {
        where.OR = [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { location: { contains: q, mode: 'insensitive' } },
        ];
      }

      const [items, total] = await Promise.all([
        prisma.foundItem.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: { id: true, name: true, avatarUrl: true }, // Keep email/phone hidden
            },
          },
        }),
        prisma.foundItem.count({ where }),
      ]);

      const meta = buildPaginationMeta(total, page, limit);

      res.setHeader('X-Total-Count', total.toString());
      res.setHeader('X-Total-Pages', meta.totalPages.toString());
      res.setHeader('X-Current-Page', page.toString());
      res.setHeader('X-Page-Size', limit.toString());

      // Remove secretAnswer
      const sanitized = items.map(({ secretAnswer, ...rest }: any) => rest);

      if (paginated === 'true') {
        sendSuccess(res, { items: sanitized, meta });
      } else {
        sendSuccess(res, sanitized);
      }
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/found/:id
 * Retrieve a specific found item with secret question (secretAnswer omitted)
 */
router.get(
  '/:id',
  optionalAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const item = await prisma.foundItem.findUnique({
        where: { id },
        include: {
          user: {
            select: { id: true, name: true, avatarUrl: true }, // Finder identity protected
          },
        },
      });

      if (!item) {
        throw new AppError(404, 'NOT_FOUND', 'Found item not found');
      }

      // Omit secretAnswer and ensure finder email/phone are never leaked before claim
      const { secretAnswer: _, ...sanitized } = item;
      if (sanitized.user) {
        sanitized.user = {
          id: sanitized.user.id,
          name: sanitized.user.name,
          avatarUrl: sanitized.user.avatarUrl || null,
        };
      }

      sendSuccess(res, sanitized);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/found/:id/claim
 * Submit secret question answer to verify ownership
 * If correct, mark item reunited and reveal finder's contact details & holding location
 */
router.post(
  '/:id/claim',
  authenticate,
  validateBody(claimFoundSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const { answer, note } = req.body;
      const user = req.user!;

      const item = (await prisma.foundItem.findUnique({
        where: { id },
        include: {
          user: {
            select: { id: true, name: true, email: true, phone: true },
          },
        },
      })) as any;

      if (!item) {
        throw new AppError(404, 'NOT_FOUND', 'Found item not found');
      }

      if (item.status === 'reunited') {
        throw new AppError(400, 'ALREADY_REUNITED', 'This item has already been claimed and reunited with its owner.');
      }

      if (item.userId === user.id) {
        throw new AppError(400, 'CANNOT_CLAIM_OWN_ITEM', 'You cannot submit a claim for an item you reported yourself.');
      }

      // Check secret answer
      const isAnswerCorrect = await bcrypt.compare(
        answer.trim().toLowerCase(),
        item.secretAnswer
      );

      if (!isAnswerCorrect) {
        throw new AppError(
          400,
          'CLAIM_FAILED',
          'Incorrect answer to the secret verification question. Please check and try again.'
        );
      }

      // Mark item as reunited and claimed
      const updatedItem = await prisma.foundItem.update({
        where: { id },
        data: {
          status: 'reunited',
          claimedByUserId: user.id,
          claimNote: note || 'Verified via secret answer',
        },
      });

      sendSuccess(res, {
        success: true,
        message: 'Claim verified! You answered the secret question correctly.',
        finderContact: {
          name: item.user.name,
          email: item.user.email,
          phone: item.user.phone || 'Not provided',
          holdingLocation: item.holdingLocation,
        },
        item: {
          id: updatedItem.id,
          status: updatedItem.status,
          claimedByUserId: updatedItem.claimedByUserId,
          claimNote: updatedItem.claimNote,
          updatedAt: updatedItem.updatedAt,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PATCH /api/found/:id/status
 * Update status of found item (open, reunited). Finder or admin only.
 */
router.patch(
  '/:id/status',
  authenticate,
  validateBody(updateFoundStatusSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const { status } = req.body;
      const user = req.user!;

      const item = await prisma.foundItem.findUnique({ where: { id } });
      if (!item) {
        throw new AppError(404, 'NOT_FOUND', 'Found item not found');
      }

      if (item.userId !== user.id && user.role !== 'ADMIN') {
        throw new AppError(403, 'FORBIDDEN', 'You do not have permission to update this item');
      }

      const updated = await prisma.foundItem.update({
        where: { id },
        data: { status },
      });

      const { secretAnswer: _, ...sanitized } = updated;
      sendSuccess(res, sanitized);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
