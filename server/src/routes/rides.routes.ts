import { Router, Response, NextFunction } from 'express';
import { prisma } from '../prisma';
import { authenticateUser, optionalAuth, AuthRequest } from '../middleware/auth';
import { HttpError } from '../errors';
import { notificationService } from '../services/notification.service';
import { getSocketIO } from '../socket';
import { parsePagination, buildPaginationMeta } from '../utils/pagination';

const router = Router();

// POST /api/rides - Create a new ride
router.post('/', authenticateUser, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { origin, destination, departureTime, totalSeats, estimatedFare, notes } = req.body;

    if (!origin || !destination || !departureTime || !totalSeats) {
      throw new HttpError(
        400,
        'BAD_REQUEST',
        'origin, destination, departureTime, and totalSeats are required'
      );
    }

    const seats = parseInt(totalSeats, 10);
    if (isNaN(seats) || seats < 1) {
      throw new HttpError(400, 'BAD_REQUEST', 'totalSeats must be an integer greater than 0');
    }

    const depDate = new Date(departureTime);
    if (isNaN(depDate.getTime())) {
      throw new HttpError(400, 'BAD_REQUEST', 'Invalid departureTime format');
    }

    const fare = estimatedFare ? parseFloat(estimatedFare) : 0.0;

    // Use transaction to create ride, member, and ride group conversation
    const newRide = await prisma.$transaction(async (tx: any) => {
      // Creator takes 1 seat
      const availableSeats = Math.max(0, seats - 1);
      const status = availableSeats === 0 ? 'FULL' : 'OPEN';

      const ride = await tx.ride.create({
        data: {
          creatorId: user.id,
          origin: origin.trim(),
          destination: destination.trim(),
          departureTime: depDate,
          totalSeats: seats,
          availableSeats,
          estimatedFare: fare,
          status,
          notes: notes ? notes.trim() : null,
        },
      });

      // Add creator as the first ride member
      await tx.rideMember.create({
        data: {
          rideId: ride.id,
          userId: user.id,
        },
      });

      // Automatically create a dedicated ride group chat
      const conversation = await tx.conversation.create({
        data: {
          isGroup: true,
          title: `Ride: ${ride.origin} → ${ride.destination}`,
          rideId: ride.id,
        },
      });

      // Add creator to the conversation
      await tx.conversationMember.create({
        data: {
          conversationId: conversation.id,
          userId: user.id,
        },
      });

      return ride;
    });

    res.status(201).json({
      data: newRide,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/rides - List rides with optional filters
router.get('/', optionalAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { origin, destination, status, paginated } = req.query as Record<string, string>;
    const { page, limit, skip } = parsePagination(req);

    const where: any = {};
    if (status) {
      where.status = String(status);
    } else {
      // Default to OPEN rides if not specified
      where.status = 'OPEN';
    }
    if (origin) where.origin = String(origin);
    if (destination) where.destination = String(destination);

    const [rides, total] = await Promise.all([
      prisma.ride.findMany({
        skip,
        take: limit,
      where,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            department: true,
            year: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
                department: true,
                year: true,
              },
            },
          },
        },
      },
      }),
      prisma.ride.count({ where }),
    ]);

    const meta = buildPaginationMeta(total, page, limit);

    res.setHeader('X-Total-Count', total.toString());
    res.setHeader('X-Total-Pages', meta.totalPages.toString());
    res.setHeader('X-Current-Page', page.toString());
    res.setHeader('X-Page-Size', limit.toString());

    if (paginated === 'true') {
      res.json({
        data: {
          items: rides,
          meta,
        },
      });
    } else {
      res.json({
        data: rides,
      });
    }
  } catch (err) {
    next(err);
  }
});

// GET /api/rides/:id - Get a specific ride
router.get('/:id', optionalAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const ride = await prisma.ride.findUnique({
      where: { id: String(id) },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            department: true,
            year: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
                department: true,
                year: true,
              },
            },
          },
        },
      },
    });

    if (!ride) {
      throw new HttpError(404, 'NOT_FOUND', 'Ride not found');
    }

    res.json({
      data: ride,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/rides/:id/join - Join a ride with race-condition safety & transactions
router.post('/:id/join', authenticateUser, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id: rideId } = req.params;
    const user = req.user!;

    // Execute atomic join inside transaction
    const { updatedRide, wasFull } = await prisma.$transaction(async (tx: any) => {
      // 1. Fetch current ride state
      const ride = await tx.ride.findUnique({
        where: { id: rideId },
        include: { members: true },
      });

      if (!ride) {
        throw new HttpError(404, 'NOT_FOUND', 'Ride not found');
      }

      if (ride.status !== 'OPEN') {
        throw new HttpError(409, 'CONFLICT', `Ride is not open for joining (Status: ${ride.status})`);
      }

      if (ride.availableSeats <= 0) {
        throw new HttpError(409, 'CONFLICT', 'No seats available on this ride');
      }

      // Check if user is already a member
      const isMember = ride.members.some((m: any) => m.userId === user.id);
      if (isMember) {
        throw new HttpError(409, 'CONFLICT', 'You are already a member of this ride');
      }

      const nextAvailableSeats = ride.availableSeats - 1;
      const nextStatus = nextAvailableSeats === 0 ? 'FULL' : 'OPEN';

      // 2. Concurrency-safe atomic decrement
      let updated;
      try {
        updated = await tx.ride.update({
          where: {
            id: rideId,
            availableSeats: ride.availableSeats, // Concurrency guard
          },
          data: {
            availableSeats: nextAvailableSeats,
            status: nextStatus,
          },
        });
      } catch (e: any) {
        if (e.code === 'P2025') {
          throw new HttpError(409, 'CONFLICT', 'Seat was taken concurrently. Please try again.');
        }
        throw e;
      }

      // 3. Create RideMember record
      await tx.rideMember.create({
        data: {
          rideId,
          userId: user.id,
        },
      });

      // 4. Add user to the ride group chat if exists
      const conversation = await tx.conversation.findUnique({
        where: { rideId },
      });
      if (conversation) {
        const existingMember = await tx.conversationMember.findUnique({
          where: {
            conversationId_userId: {
              conversationId: conversation.id,
              userId: user.id,
            },
          },
        });
        if (!existingMember) {
          await tx.conversationMember.create({
            data: {
              conversationId: conversation.id,
              userId: user.id,
            },
          });
        }
      }

      return { updatedRide: updated, wasFull: nextStatus === 'FULL' };
    });

    // Send notifications and emit Socket.io events outside transaction
    try {
      await notificationService.notifyPassengerJoined(updatedRide, user);
      if (wasFull) {
        await notificationService.notifyRideFull(updatedRide);
      }

      const io = getSocketIO();
      if (io) {
        io.to(`ride:${rideId}`).emit('ride:updated', {
          id: updatedRide.id,
          availableSeats: updatedRide.availableSeats,
          status: updatedRide.status,
          updatedAt: updatedRide.updatedAt,
        });
      }
    } catch (notifErr) {
      console.warn('[Rides] Notification or socket error on join:', notifErr);
    }

    res.json({
      data: {
        id: updatedRide.id,
        availableSeats: updatedRide.availableSeats,
        status: updatedRide.status,
        joined: true,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/rides/:id/leave - Leave a joined ride
router.post('/:id/leave', authenticateUser, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id: rideId } = req.params;
    const user = req.user!;

    const updatedRide = await prisma.$transaction(async (tx: any) => {
      const ride = await tx.ride.findUnique({
        where: { id: rideId },
        include: { members: true },
      });

      if (!ride) {
        throw new HttpError(404, 'NOT_FOUND', 'Ride not found');
      }

      if (ride.creatorId === user.id) {
        throw new HttpError(
          400,
          'BAD_REQUEST',
          'Ride creator cannot leave the ride. Update ride status to CANCELLED instead.'
        );
      }

      const isMember = ride.members.some((m: any) => m.userId === user.id);
      if (!isMember) {
        throw new HttpError(404, 'NOT_FOUND', 'You are not a passenger in this ride');
      }

      // Remove member
      await tx.rideMember.delete({
        where: {
          rideId_userId: {
            rideId,
            userId: user.id,
          },
        },
      });

      // Remove from ride conversation
      const conv = await tx.conversation.findUnique({ where: { rideId } });
      if (conv) {
        try {
          await tx.conversationMember.delete({
            where: {
              conversationId_userId: {
                conversationId: conv.id,
                userId: user.id,
              },
            },
          });
        } catch {
          // ignore
        }
      }

      // Increment available seats
      const nextAvailableSeats = Math.min(ride.totalSeats, ride.availableSeats + 1);
      // If was FULL, becomes OPEN
      const nextStatus = ride.status === 'FULL' ? 'OPEN' : ride.status;

      const updated = await tx.ride.update({
        where: { id: rideId },
        data: {
          availableSeats: nextAvailableSeats,
          status: nextStatus,
        },
      });

      return updated;
    });

    // Emit socket event
    const io = getSocketIO();
    if (io) {
      io.to(`ride:${rideId}`).emit('ride:updated', {
        id: updatedRide.id,
        availableSeats: updatedRide.availableSeats,
        status: updatedRide.status,
        updatedAt: updatedRide.updatedAt,
      });
    }

    res.json({
      data: {
        id: updatedRide.id,
        availableSeats: updatedRide.availableSeats,
        status: updatedRide.status,
        left: true,
      },
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/rides/:id/status - Status flow: OPEN -> FULL -> IN_PROGRESS -> COMPLETED -> CANCELLED
router.patch('/:id/status', authenticateUser, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const user = req.user!;
    const { status } = req.body;

    const validStatuses = ['OPEN', 'FULL', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
    if (!status || !validStatuses.includes(status)) {
      throw new HttpError(
        400,
        'BAD_REQUEST',
        `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      );
    }

    const ride = await prisma.ride.findUnique({ where: { id: String(id) } });
    if (!ride) {
      throw new HttpError(404, 'NOT_FOUND', 'Ride not found');
    }

    if (ride.creatorId !== user.id && user.role !== 'ADMIN') {
      throw new HttpError(403, 'FORBIDDEN', 'Only the ride creator or admin can update ride status');
    }

    const updated = await prisma.ride.update({
      where: { id: String(id) },
      data: { status },
    });

    const io = getSocketIO();
    if (io) {
      io.to(`ride:${id}`).emit('ride:updated', {
        id: updated.id,
        status: updated.status,
        updatedAt: updated.updatedAt,
      });
    }

    res.json({
      data: {
        id: updated.id,
        status: updated.status,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/rides/:id/fare-split - Takes estimated total fare and returns each member's share
router.get('/:id/fare-split', authenticateUser, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { totalFare: overrideFare } = req.query;

    const ride = await prisma.ride.findUnique({
      where: { id: String(id) },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    }) as any;

    if (!ride) {
      throw new HttpError(404, 'NOT_FOUND', 'Ride not found');
    }

    // Determine total fare: custom query param or ride estimatedFare
    const totalFare = overrideFare ? parseFloat(String(overrideFare)) : ride.estimatedFare;
    const passengerCount = ride.members.length > 0 ? ride.members.length : 1;
    const farePerPerson = parseFloat((totalFare / passengerCount).toFixed(2));

    const participants = ride.members.map((m: any) => ({
      userId: m.userId,
      name: m.user?.name || 'Passenger',
      amount: farePerPerson,
    }));

    res.json({
      data: {
        rideId: ride.id,
        totalFare,
        passengerCount,
        farePerPerson,
        participants,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
