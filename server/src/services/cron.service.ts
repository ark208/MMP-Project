import cron from 'node-cron';
import { prisma } from '../config/prisma';

export async function runExpiryCheckNow(): Promise<{
  expiredLost: number;
  expiredFound: number;
  expiredListings: number;
}> {
  const now = new Date();

  const [lostResult, foundResult, listingResult] = await Promise.all([
    // Expire open lost items
    prisma.lostItem.updateMany({
      where: {
        expiresAt: { lte: now },
        isExpired: false,
        status: 'open',
      },
      data: {
        isExpired: true,
        status: 'closed',
      },
    }),
    // Expire open found items
    prisma.foundItem.updateMany({
      where: {
        expiresAt: { lte: now },
        isExpired: false,
        status: 'open',
      },
      data: {
        isExpired: true,
      },
    }),
    // Expire available listings
    prisma.listing.updateMany({
      where: {
        expiresAt: { lte: now },
        isExpired: false,
        status: 'available',
      },
      data: {
        isExpired: true,
      },
    }),
  ]);

  return {
    expiredLost: lostResult.count,
    expiredFound: foundResult.count,
    expiredListings: listingResult.count,
  };
}

let cronTask: cron.ScheduledTask | null = null;

export function startExpiryCron(): cron.ScheduledTask {
  // Run every hour: '0 * * * *'
  cronTask = cron.schedule('0 * * * *', async () => {
    try {
      const results = await runExpiryCheckNow();
      if (results.expiredLost > 0 || results.expiredFound > 0 || results.expiredListings > 0) {
        console.log(
          `🕒 [Expiry Cron] Processed expired items: Lost: ${results.expiredLost}, Found: ${results.expiredFound}, Listings: ${results.expiredListings}`
        );
      }
    } catch (err) {
      console.error('❌ [Expiry Cron] Error running post expiry check:', err);
    }
  });

  return cronTask;
}

export function stopExpiryCron(): void {
  if (cronTask) {
    cronTask.stop();
  }
}

