import { prisma } from '../config/prisma';

// Memory tables
export const memoryDb = {
  users: [] as any[],
  otpTokens: [] as any[],
  lostItems: [] as any[],
  foundItems: [] as any[],
  listings: [] as any[],
  wishlists: [] as any[],
  reports: [] as any[],
  trainTrips: [] as any[],
  rides: [] as any[],
  rideMembers: [] as any[],
  conversations: [] as any[],
  conversationMembers: [] as any[],
  messages: [] as any[],
  notifications: [] as any[],
};

export function resetMemoryDb() {
  memoryDb.users = [];
  memoryDb.otpTokens = [];
  memoryDb.lostItems = [];
  memoryDb.foundItems = [];
  memoryDb.listings = [];
  memoryDb.wishlists = [];
  memoryDb.reports = [];
  memoryDb.trainTrips = [];
  memoryDb.rides = [];
  memoryDb.rideMembers = [];
  memoryDb.conversations = [];
  memoryDb.conversationMembers = [];
  memoryDb.messages = [];
  memoryDb.notifications = [];
}

// Mock Prisma for deterministic tests without requiring live PostgreSQL daemon
jest.mock('../config/prisma', () => {
  const crypto = require('crypto');

  const mockPrisma: any = {
    $transaction: jest.fn(async (cbOrArray: any) => {
      if (typeof cbOrArray === 'function') {
        return cbOrArray(mockPrisma);
      }
      return Promise.all(cbOrArray);
    }),

    user: {
      findUnique: jest.fn(async ({ where }: any) => {
        if (where.id) return memoryDb.users.find((u) => u.id === where.id) || null;
        if (where.email) return memoryDb.users.find((u) => u.email === where.email) || null;
        return null;
      }),
      findFirst: jest.fn(async ({ where }: any) => {
        if (where.email) return memoryDb.users.find((u) => u.email === where.email) || null;
        return memoryDb.users[0] || null;
      }),
      create: jest.fn(async ({ data }: any) => {
        const user = {
          id: `usr_${crypto.randomBytes(4).toString('hex')}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          phone: null,
          avatarUrl: null,
          role: 'USER',
          isBanned: false,
          ...data,
        };
        memoryDb.users.push(user);
        return user;
      }),
      update: jest.fn(async ({ where, data }: any) => {
        const index = memoryDb.users.findIndex((u) => u.id === where.id);
        if (index === -1) throw new Error('Record not found');
        memoryDb.users[index] = { ...memoryDb.users[index], ...data, updatedAt: new Date() };
        return memoryDb.users[index];
      }),
      deleteMany: jest.fn(async () => {
        memoryDb.users = [];
        return { count: 0 };
      }),
    },

    otpToken: {
      findFirst: jest.fn(async ({ where }: any) => {
        return (
          memoryDb.otpTokens
            .slice()
            .reverse()
            .find((t) => t.email === where.email && new Date(t.expiresAt) > new Date()) || null
        );
      }),
      create: jest.fn(async ({ data }: any) => {
        const token = {
          id: `otp_${crypto.randomBytes(4).toString('hex')}`,
          createdAt: new Date(),
          ...data,
        };
        memoryDb.otpTokens.push(token);
        return token;
      }),
      deleteMany: jest.fn(async ({ where }: any = {}) => {
        if (where?.email) {
          memoryDb.otpTokens = memoryDb.otpTokens.filter((t) => t.email !== where.email);
        } else {
          memoryDb.otpTokens = [];
        }
        return { count: 0 };
      }),
    },

    lostItem: {
      create: jest.fn(async ({ data }: any) => {
        const user = memoryDb.users.find((u) => u.id === data.userId);
        const item = {
          id: `lost_${crypto.randomBytes(4).toString('hex')}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          status: 'open',
          isExpired: false,
          ...data,
          user: user
            ? { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl }
            : undefined,
        };
        memoryDb.lostItems.push(item);
        return item;
      }),
      findMany: jest.fn(async ({ where }: any = {}) => {
        let results = memoryDb.lostItems.slice();
        if (where?.category?.equals) {
          results = results.filter(
            (i) => i.category.toLowerCase() === where.category.equals.toLowerCase()
          );
        }
        if (where?.status?.equals) {
          results = results.filter(
            (i) => i.status.toLowerCase() === where.status.equals.toLowerCase()
          );
        }
        return results;
      }),
      findUnique: jest.fn(async ({ where }: any) => {
        const item = memoryDb.lostItems.find((i) => i.id === where.id);
        if (!item) return null;
        const user = memoryDb.users.find((u) => u.id === item.userId);
        return {
          ...item,
          user: user
            ? { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl }
            : undefined,
        };
      }),
      update: jest.fn(async ({ where, data }: any) => {
        const index = memoryDb.lostItems.findIndex((i) => i.id === where.id);
        if (index === -1) throw new Error('Record not found');
        memoryDb.lostItems[index] = {
          ...memoryDb.lostItems[index],
          ...data,
          updatedAt: new Date(),
        };
        return memoryDb.lostItems[index];
      }),
      count: jest.fn(async () => memoryDb.lostItems.length),
      deleteMany: jest.fn(async () => {
        memoryDb.lostItems = [];
        return { count: 0 };
      }),
    },

    foundItem: {
      create: jest.fn(async ({ data }: any) => {
        const user = memoryDb.users.find((u) => u.id === data.userId);
        const item = {
          id: `found_${crypto.randomBytes(4).toString('hex')}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          status: 'open',
          isExpired: false,
          claimedByUserId: null,
          claimNote: null,
          ...data,
          user: user
            ? {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                avatarUrl: user.avatarUrl,
              }
            : undefined,
        };
        memoryDb.foundItems.push(item);
        return item;
      }),
      findMany: jest.fn(async ({ where }: any = {}) => {
        let results = memoryDb.foundItems.slice();
        if (where?.category?.equals) {
          results = results.filter(
            (i) => i.category.toLowerCase() === where.category.equals.toLowerCase()
          );
        }
        return results;
      }),
      findUnique: jest.fn(async ({ where }: any) => {
        const item = memoryDb.foundItems.find((i) => i.id === where.id);
        if (!item) return null;
        const user = memoryDb.users.find((u) => u.id === item.userId);
        return {
          ...item,
          user: user
            ? {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                avatarUrl: user.avatarUrl,
              }
            : undefined,
        };
      }),
      update: jest.fn(async ({ where, data }: any) => {
        const index = memoryDb.foundItems.findIndex((i) => i.id === where.id);
        if (index === -1) throw new Error('Record not found');
        memoryDb.foundItems[index] = {
          ...memoryDb.foundItems[index],
          ...data,
          updatedAt: new Date(),
        };
        return memoryDb.foundItems[index];
      }),
      deleteMany: jest.fn(async () => {
        memoryDb.foundItems = [];
        return { count: 0 };
      }),
    },

    listing: {
      create: jest.fn(async ({ data }: any) => {
        const user = memoryDb.users.find((u) => u.id === data.sellerId);
        const item = {
          id: `list_${crypto.randomBytes(4).toString('hex')}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          status: 'available',
          isExpired: false,
          ...data,
          seller: user
            ? { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl }
            : undefined,
        };
        memoryDb.listings.push(item);
        return item;
      }),
      findMany: jest.fn(async () => memoryDb.listings.slice()),
      findUnique: jest.fn(async ({ where }: any) => {
        const item = memoryDb.listings.find((i) => i.id === where.id);
        if (!item) return null;
        const user = memoryDb.users.find((u) => u.id === item.sellerId);
        return {
          ...item,
          seller: user
            ? { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl }
            : undefined,
        };
      }),
      update: jest.fn(async ({ where, data }: any) => {
        const index = memoryDb.listings.findIndex((i) => i.id === where.id);
        if (index === -1) throw new Error('Record not found');
        memoryDb.listings[index] = {
          ...memoryDb.listings[index],
          ...data,
          updatedAt: new Date(),
        };
        return memoryDb.listings[index];
      }),
      delete: jest.fn(async ({ where }: any) => {
        const index = memoryDb.listings.findIndex((i) => i.id === where.id);
        if (index === -1) throw new Error('Record not found');
        const [removed] = memoryDb.listings.splice(index, 1);
        return removed;
      }),
      count: jest.fn(async () => memoryDb.listings.length),
      deleteMany: jest.fn(async () => {
        memoryDb.listings = [];
        return { count: 0 };
      }),
    },

    wishlist: {
      upsert: jest.fn(async ({ create }: any) => {
        const existing = memoryDb.wishlists.find(
          (w) => w.userId === create.userId && w.listingId === create.listingId
        );
        if (existing) return existing;
        const wish = { id: `wish_${Date.now()}`, ...create, createdAt: new Date() };
        memoryDb.wishlists.push(wish);
        return wish;
      }),
      findMany: jest.fn(async ({ where }: any) => {
        return memoryDb.wishlists
          .filter((w) => w.userId === where.userId)
          .map((w) => ({
            ...w,
            listing: memoryDb.listings.find((l) => l.id === w.listingId),
          }));
      }),
      findUnique: jest.fn(async ({ where }: any) => {
        const { userId, listingId } = where.userId_listingId;
        return (
          memoryDb.wishlists.find((w) => w.userId === userId && w.listingId === listingId) || null
        );
      }),
      deleteMany: jest.fn(async ({ where }: any) => {
        memoryDb.wishlists = memoryDb.wishlists.filter(
          (w) => !(w.userId === where.userId && w.listingId === where.listingId)
        );
        return { count: 1 };
      }),
    },

    report: {
      create: jest.fn(async ({ data }: any) => {
        const rep = {
          id: `rep_${Date.now()}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          status: 'pending',
          ...data,
        };
        memoryDb.reports.push(rep);
        return rep;
      }),
      findMany: jest.fn(async () => memoryDb.reports.slice()),
      deleteMany: jest.fn(async () => {
        memoryDb.reports = [];
        return { count: 0 };
      }),
    },

    // ─── Phase 2 Models ─────────────────────────────────────────────────────

    trainTrip: {
      create: jest.fn(async ({ data }: any) => {
        // Enforce strict privacy: never store pnr, seat, or coach
        const trip = {
          id: `trip_${crypto.randomBytes(4).toString('hex')}`,
          userId: data.userId,
          trainNumber: data.trainNumber,
          trainName: data.trainName || null,
          fromStation: data.fromStation,
          toStation: data.toStation,
          date: data.date,
          departureTime: data.departureTime || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        memoryDb.trainTrips.push(trip);
        return trip;
      }),
      findMany: jest.fn(async ({ where, include }: any = {}) => {
        let results = memoryDb.trainTrips.slice();
        if (where?.userId) {
          if (typeof where.userId === 'object' && where.userId.not) {
            results = results.filter((t) => t.userId !== where.userId.not);
          } else {
            results = results.filter((t) => t.userId === where.userId);
          }
        }
        if (where?.trainNumber) {
          results = results.filter((t) => t.trainNumber === where.trainNumber);
        }
        if (where?.date) {
          results = results.filter((t) => t.date === where.date);
        }
        if (where?.fromStation) {
          results = results.filter((t) => t.fromStation === where.fromStation);
        }
        if (where?.toStation) {
          results = results.filter((t) => t.toStation === where.toStation);
        }

        if (include?.user) {
          return results.map((t) => {
            const u = memoryDb.users.find((user) => user.id === t.userId);
            return {
              ...t,
              user: u
                ? {
                    id: u.id,
                    name: u.name,
                    department: u.department,
                    year: u.year,
                    avatarUrl: u.avatarUrl,
                  }
                : undefined,
            };
          });
        }
        return results;
      }),
      findUnique: jest.fn(async ({ where, include }: any) => {
        const trip = memoryDb.trainTrips.find((t) => t.id === where.id);
        if (!trip) return null;
        if (include?.user) {
          const u = memoryDb.users.find((user) => user.id === trip.userId);
          return {
            ...trip,
            user: u
              ? {
                  id: u.id,
                  name: u.name,
                  department: u.department,
                  year: u.year,
                  avatarUrl: u.avatarUrl,
                }
              : undefined,
          };
        }
        return trip;
      }),
      delete: jest.fn(async ({ where }: any) => {
        const index = memoryDb.trainTrips.findIndex((t) => t.id === where.id);
        if (index === -1) throw new Error('Record not found');
        const [removed] = memoryDb.trainTrips.splice(index, 1);
        return removed;
      }),
      deleteMany: jest.fn(async () => {
        memoryDb.trainTrips = [];
        return { count: 0 };
      }),
    },

    ride: {
      create: jest.fn(async ({ data }: any) => {
        const ride = {
          id: `ride_${crypto.randomBytes(4).toString('hex')}`,
          creatorId: data.creatorId,
          origin: data.origin,
          destination: data.destination,
          departureTime: new Date(data.departureTime),
          totalSeats: data.totalSeats,
          availableSeats: data.availableSeats,
          estimatedFare: data.estimatedFare,
          status: data.status,
          notes: data.notes || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        memoryDb.rides.push(ride);
        return ride;
      }),
      findMany: jest.fn(async ({ where, include }: any = {}) => {
        let results = memoryDb.rides.slice();
        if (where?.status) {
          results = results.filter((r) => r.status === where.status);
        }
        if (where?.origin) {
          results = results.filter((r) => r.origin === where.origin);
        }
        if (where?.destination) {
          results = results.filter((r) => r.destination === where.destination);
        }

        return results.map((r) => {
          const res: any = { ...r };
          if (include?.creator) {
            const cr = memoryDb.users.find((u) => u.id === r.creatorId);
            res.creator = cr
              ? {
                  id: cr.id,
                  name: cr.name,
                  avatarUrl: cr.avatarUrl,
                  department: cr.department,
                  year: cr.year,
                }
              : undefined;
          }
          if (include?.members) {
            const members = memoryDb.rideMembers.filter((m) => m.rideId === r.id);
            res.members = members.map((m) => {
              const u = memoryDb.users.find((user) => user.id === m.userId);
              return {
                ...m,
                user: u
                  ? {
                      id: u.id,
                      name: u.name,
                      avatarUrl: u.avatarUrl,
                      department: u.department,
                      year: u.year,
                    }
                  : undefined,
              };
            });
          }
          return res;
        });
      }),
      findUnique: jest.fn(async ({ where, include }: any) => {
        const ride = memoryDb.rides.find((r) => r.id === where.id);
        if (!ride) return null;
        const res: any = { ...ride };
        if (include?.creator) {
          const cr = memoryDb.users.find((u) => u.id === ride.creatorId);
          res.creator = cr
            ? {
                id: cr.id,
                name: cr.name,
                avatarUrl: cr.avatarUrl,
                department: cr.department,
                year: cr.year,
              }
            : undefined;
        }
        if (include?.members) {
          const members = memoryDb.rideMembers.filter((m) => m.rideId === ride.id);
          res.members = members.map((m) => {
            const u = memoryDb.users.find((user) => user.id === m.userId);
            return {
              ...m,
              user: u
                ? {
                    id: u.id,
                    name: u.name,
                    avatarUrl: u.avatarUrl,
                    department: u.department,
                    year: u.year,
                  }
                : undefined,
            };
          });
        }
        return res;
      }),
      update: jest.fn(async ({ where, data }: any) => {
        const index = memoryDb.rides.findIndex((r) => r.id === where.id);
        if (index === -1) {
          const err: any = new Error('Record not found');
          err.code = 'P2025';
          throw err;
        }

        const current = memoryDb.rides[index];
        // Race condition / optimistic concurrency check
        if (where.availableSeats !== undefined && current.availableSeats !== where.availableSeats) {
          const err: any = new Error('Concurrency conflict on availableSeats');
          err.code = 'P2025';
          throw err;
        }

        memoryDb.rides[index] = {
          ...current,
          ...data,
          updatedAt: new Date(),
        };
        return memoryDb.rides[index];
      }),
      deleteMany: jest.fn(async () => {
        memoryDb.rides = [];
        return { count: 0 };
      }),
    },

    rideMember: {
      create: jest.fn(async ({ data }: any) => {
        const member = {
          id: `rm_${crypto.randomBytes(4).toString('hex')}`,
          rideId: data.rideId,
          userId: data.userId,
          joinedAt: new Date(),
        };
        memoryDb.rideMembers.push(member);
        return member;
      }),
      findMany: jest.fn(async ({ where }: any = {}) => {
        let results = memoryDb.rideMembers.slice();
        if (where?.rideId) results = results.filter((m) => m.rideId === where.rideId);
        if (where?.userId) results = results.filter((m) => m.userId === where.userId);
        return results;
      }),
      delete: jest.fn(async ({ where }: any) => {
        const { rideId, userId } = where.rideId_userId;
        const index = memoryDb.rideMembers.findIndex(
          (m) => m.rideId === rideId && m.userId === userId
        );
        if (index === -1) throw new Error('Record not found');
        const [removed] = memoryDb.rideMembers.splice(index, 1);
        return removed;
      }),
      deleteMany: jest.fn(async () => {
        memoryDb.rideMembers = [];
        return { count: 0 };
      }),
    },

    conversation: {
      create: jest.fn(async ({ data }: any) => {
        const conv = {
          id: `conv_${crypto.randomBytes(4).toString('hex')}`,
          isGroup: data.isGroup || false,
          title: data.title || null,
          rideId: data.rideId || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        memoryDb.conversations.push(conv);
        return conv;
      }),
      findMany: jest.fn(async ({ where }: any = {}) => {
        let results = memoryDb.conversations.slice();
        if (where?.members?.some?.userId) {
          const uid = where.members.some.userId;
          const myConvIds = memoryDb.conversationMembers
            .filter((cm) => cm.userId === uid)
            .map((cm) => cm.conversationId);
          results = results.filter((c) => myConvIds.includes(c.id));
        }

        return results.map((conv) => {
          const members = memoryDb.conversationMembers
            .filter((cm) => cm.conversationId === conv.id)
            .map((cm) => {
              const u = memoryDb.users.find((user) => user.id === cm.userId);
              return {
                ...cm,
                user: u
                  ? {
                      id: u.id,
                      name: u.name,
                      avatarUrl: u.avatarUrl,
                      department: u.department,
                      year: u.year,
                    }
                  : undefined,
              };
            });

          const msgs = memoryDb.messages.filter((m) => m.conversationId === conv.id);
          const lastMessage = msgs.length > 0 ? msgs[msgs.length - 1] : null;

          return {
            ...conv,
            members,
            lastMessage,
          };
        });
      }),
      findUnique: jest.fn(async ({ where }: any) => {
        if (where.id) {
          return memoryDb.conversations.find((c) => c.id === where.id) || null;
        }
        if (where.rideId) {
          return memoryDb.conversations.find((c) => c.rideId === where.rideId) || null;
        }
        return null;
      }),
      deleteMany: jest.fn(async () => {
        memoryDb.conversations = [];
        return { count: 0 };
      }),
    },

    conversationMember: {
      create: jest.fn(async ({ data }: any) => {
        const cm = {
          id: `cm_${crypto.randomBytes(4).toString('hex')}`,
          conversationId: data.conversationId,
          userId: data.userId,
          joinedAt: new Date(),
        };
        memoryDb.conversationMembers.push(cm);
        return cm;
      }),
      createMany: jest.fn(async ({ data }: any) => {
        for (const item of data) {
          memoryDb.conversationMembers.push({
            id: `cm_${crypto.randomBytes(4).toString('hex')}`,
            conversationId: item.conversationId,
            userId: item.userId,
            joinedAt: new Date(),
          });
        }
        return { count: data.length };
      }),
      findMany: jest.fn(async ({ where }: any = {}) => {
        let results = memoryDb.conversationMembers.slice();
        if (where?.userId) results = results.filter((cm) => cm.userId === where.userId);
        if (where?.conversationId) {
          if (where.conversationId.in) {
            results = results.filter((cm) => where.conversationId.in.includes(cm.conversationId));
          } else {
            results = results.filter((cm) => cm.conversationId === where.conversationId);
          }
        }
        return results;
      }),
      findUnique: jest.fn(async ({ where }: any) => {
        const { conversationId, userId } = where.conversationId_userId;
        return (
          memoryDb.conversationMembers.find(
            (cm) => cm.conversationId === conversationId && cm.userId === userId
          ) || null
        );
      }),
      delete: jest.fn(async ({ where }: any) => {
        const { conversationId, userId } = where.conversationId_userId;
        const index = memoryDb.conversationMembers.findIndex(
          (cm) => cm.conversationId === conversationId && cm.userId === userId
        );
        if (index === -1) throw new Error('Record not found');
        const [removed] = memoryDb.conversationMembers.splice(index, 1);
        return removed;
      }),
      deleteMany: jest.fn(async () => {
        memoryDb.conversationMembers = [];
        return { count: 0 };
      }),
    },

    message: {
      create: jest.fn(async ({ data, include }: any) => {
        const msg = {
          id: `msg_${crypto.randomBytes(4).toString('hex')}`,
          conversationId: data.conversationId,
          senderId: data.senderId,
          content: data.content,
          createdAt: new Date(),
        };
        memoryDb.messages.push(msg);

        if (include?.sender) {
          const u = memoryDb.users.find((user) => user.id === msg.senderId);
          return {
            ...msg,
            sender: u
              ? {
                  id: u.id,
                  name: u.name,
                  avatarUrl: u.avatarUrl,
                  department: u.department,
                  year: u.year,
                }
              : undefined,
          };
        }
        return msg;
      }),
      findMany: jest.fn(async ({ where, include, take }: any = {}) => {
        let results = memoryDb.messages.slice();
        if (where?.conversationId) {
          results = results.filter((m) => m.conversationId === where.conversationId);
        }
        if (where?.createdAt?.lt) {
          results = results.filter((m) => new Date(m.createdAt) < new Date(where.createdAt.lt));
        }

        if (take) {
          results = results.slice(0, take);
        }

        if (include?.sender) {
          return results.map((m) => {
            const u = memoryDb.users.find((user) => user.id === m.senderId);
            return {
              ...m,
              sender: u
                ? {
                    id: u.id,
                    name: u.name,
                    avatarUrl: u.avatarUrl,
                    department: u.department,
                    year: u.year,
                  }
                : undefined,
            };
          });
        }
        return results;
      }),
      deleteMany: jest.fn(async () => {
        memoryDb.messages = [];
        return { count: 0 };
      }),
    },

    notification: {
      create: jest.fn(async ({ data }: any) => {
        const notif = {
          id: `notif_${crypto.randomBytes(4).toString('hex')}`,
          userId: data.userId,
          title: data.title,
          message: data.message,
          type: data.type || 'SYSTEM',
          link: data.link || null,
          isRead: false,
          createdAt: new Date(),
        };
        memoryDb.notifications.push(notif);
        return notif;
      }),
      findMany: jest.fn(async ({ where }: any = {}) => {
        let results = memoryDb.notifications.slice();
        if (where?.userId) {
          results = results.filter((n) => n.userId === where.userId);
        }
        return results.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }),
      update: jest.fn(async ({ where, data }: any) => {
        const index = memoryDb.notifications.findIndex((n) => n.id === where.id);
        if (index === -1) throw new Error('Record not found');
        memoryDb.notifications[index] = {
          ...memoryDb.notifications[index],
          ...data,
        };
        return memoryDb.notifications[index];
      }),
      updateMany: jest.fn(async ({ where, data }: any) => {
        let count = 0;
        memoryDb.notifications.forEach((n) => {
          if (!where?.userId || n.userId === where.userId) {
            Object.assign(n, data);
            count++;
          }
        });
        return { count };
      }),
      deleteMany: jest.fn(async () => {
        memoryDb.notifications = [];
        return { count: 0 };
      }),
    },
  };

  return {
    prisma: mockPrisma,
  };
});

beforeEach(() => {
  resetMemoryDb();
});
