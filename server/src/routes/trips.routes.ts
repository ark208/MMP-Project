import { Router, Response, NextFunction } from 'express';
import { prisma } from '../prisma';
import { authenticateUser, AuthRequest } from '../middleware/auth';
import { HttpError } from '../errors';
import { notificationService } from '../services/notification.service';

const router = Router();

// POST /api/trips - Post an upcoming train journey
router.post('/', authenticateUser, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const {
      trainNumber,
      trainName,
      fromStation,
      originStation,
      toStation,
      destinationStation,
      date,
      departureDate,
      departureTime,
    } = req.body;

    const from = fromStation || originStation;
    const to = toStation || destinationStation;
    const tripDate = date || departureDate;

    if (!trainNumber || !from || !to || !tripDate) {
      throw new HttpError(
        400,
        'BAD_REQUEST',
        'trainNumber, fromStation, toStation, and date are required'
      );
    }

    // PNR and seat number must NOT be stored in the database
    const trip = await prisma.trainTrip.create({
      data: {
        userId: user.id,
        trainNumber: String(trainNumber).trim(),
        trainName: trainName || null,
        fromStation: String(from).trim().toUpperCase(),
        toStation: String(to).trim().toUpperCase(),
        date: String(tripDate).trim(),
        departureTime: departureTime || null,
      },
    });

    // Check for existing matching buddies to trigger proactive notifications
    try {
      const existingBuddies = await prisma.trainTrip.findMany({
        where: {
          trainNumber: trip.trainNumber,
          date: trip.date,
          fromStation: trip.fromStation,
          toStation: trip.toStation,
          userId: { not: user.id },
        },
      });

      for (const buddyTrip of existingBuddies) {
        await notificationService.notifyTrainBuddyMatch(
          buddyTrip.userId,
          trip,
          user.name
        );
      }
    } catch (notifErr) {
      console.warn('[Trips] Could not send buddy alerts:', notifErr);
    }

    res.status(201).json({
      data: trip,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/trips/mine - Retrieve journeys for authenticated user
router.get('/mine', authenticateUser, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const trips = await prisma.trainTrip.findMany({
      where: { userId: user.id },
    });

    res.json({
      data: trips,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/trips/:id/buddies - Discovers train buddies on same train + date + route
// Privacy Rule: Return only display name and department/year, never email or phone.
router.get('/:id/buddies', authenticateUser, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const currentTrip = await prisma.trainTrip.findUnique({
      where: { id: String(id) },
    });

    if (!currentTrip) {
      throw new HttpError(404, 'NOT_FOUND', 'Train journey not found');
    }

    // Find other trips matching exact trainNumber + date + route
    const matchingTrips = await prisma.trainTrip.findMany({
      where: {
        trainNumber: currentTrip.trainNumber,
        date: currentTrip.date,
        fromStation: currentTrip.fromStation,
        toStation: currentTrip.toStation,
        userId: { not: user.id },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            department: true,
            year: true,
            avatarUrl: true,
            // STRICT PRIVACY: email, phone, isBanned are NEVER selected
          },
        },
      },
    });

    // Format according to API contract & privacy rule
    const buddies = matchingTrips.map((bt: any) => {
      // Ensure phone and email are stripped even if present
      const safeUser = bt.user
        ? {
            id: bt.user.id,
            name: bt.user.name,
            department: bt.user.department || 'Undecided',
            year: bt.user.year || 'Student',
            avatarUrl: bt.user.avatarUrl || null,
          }
        : null;

      return {
        trip: {
          id: bt.id,
          userId: bt.userId,
          trainNumber: bt.trainNumber,
          trainName: bt.trainName,
          fromStation: bt.fromStation,
          originStation: bt.fromStation,
          toStation: bt.toStation,
          destinationStation: bt.toStation,
          date: bt.date,
          departureDate: bt.date,
          departureTime: bt.departureTime,
          user: safeUser,
        },
        isSameCoach: false,
        distanceHours: 0,
      };
    });

    res.json({
      data: buddies,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/trips/:id - Delete a posted train trip
router.delete('/:id', authenticateUser, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const trip = await prisma.trainTrip.findUnique({ where: { id: String(id) } });
    if (!trip) {
      throw new HttpError(404, 'NOT_FOUND', 'Train trip not found');
    }

    if (trip.userId !== user.id && user.role !== 'ADMIN') {
      throw new HttpError(403, 'FORBIDDEN', 'You do not have permission to delete this trip');
    }

    await prisma.trainTrip.delete({ where: { id: String(id) } });

    res.json({
      data: {
        id,
        deleted: true,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
