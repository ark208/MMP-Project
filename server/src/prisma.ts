import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient | any };

// In-Memory Database Store for testing and offline development
class InMemoryPrisma {
  users: any[] = [];
  trainTrips: any[] = [];
  rides: any[] = [];
  rideMembers: any[] = [];
  conversations: any[] = [];
  conversationMembers: any[] = [];
  messages: any[] = [];
  notifications: any[] = [];

  private lockPromise: Promise<void> = Promise.resolve();

  constructor() {
    this.seedDefaults();
  }

  seedDefaults() {
    this.users = [
      {
        id: 'usr_admin',
        email: 'admin@campus.edu',
        name: 'Campus Admin',
        department: 'Administration',
        year: 'Staff',
        phone: '+15550001111',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
        role: 'ADMIN',
        isBanned: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'usr_alex',
        email: 'alex@campus.edu',
        name: 'Alex Rivera',
        department: 'Computer Science',
        year: '3rd Year',
        phone: '+15550002222',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
        role: 'USER',
        isBanned: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'usr_sam',
        email: 'sam@campus.edu',
        name: 'Sam Chen',
        department: 'Mechanical Engineering',
        year: '2nd Year',
        phone: '+15550003333',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
        role: 'USER',
        isBanned: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'usr_jordan',
        email: 'jordan@campus.edu',
        name: 'Jordan Lee',
        department: 'Physics',
        year: '4th Year',
        phone: '+15550004444',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
        role: 'USER',
        isBanned: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  }

  reset() {
    this.users = [];
    this.trainTrips = [];
    this.rides = [];
    this.rideMembers = [];
    this.conversations = [];
    this.conversationMembers = [];
    this.messages = [];
    this.notifications = [];
    this.seedDefaults();
  }

  user = {
    findUnique: async ({ where }: { where: { id?: string; email?: string } }) => {
      return (
        this.users.find(
          (u) => (where.id && u.id === where.id) || (where.email && u.email === where.email)
        ) || null
      );
    },
    findMany: async (args?: any) => {
      let result = [...this.users];
      if (args?.where?.id?.in) {
        result = result.filter((u) => args.where.id.in.includes(u.id));
      }
      return result;
    },
    create: async ({ data }: { data: any }) => {
      const newUser = {
        id: data.id || `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        role: 'USER',
        isBanned: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data,
      };
      this.users.push(newUser);
      return newUser;
    },
    update: async ({ where, data }: { where: { id: string }; data: any }) => {
      const user = this.users.find((u) => u.id === where.id);
      if (!user) throw new Error('User not found');
      Object.assign(user, data, { updatedAt: new Date() });
      return user;
    },
    deleteMany: async () => {
      this.users = [];
      return { count: 0 };
    },
  };

  trainTrip = {
    create: async ({ data }: { data: any }) => {
      // PNR and seat number must NOT be stored
      const { pnr, seat, coach, ...safeData } = data;
      const trip = {
        id: safeData.id || `trip_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...safeData,
      };
      this.trainTrips.push(trip);
      return trip;
    },
    findUnique: async ({ where }: { where: { id: string } }) => {
      const trip = this.trainTrips.find((t) => t.id === where.id);
      if (!trip) return null;
      const user = this.users.find((u) => u.id === trip.userId);
      return { ...trip, user };
    },
    findMany: async (args?: any) => {
      let result = [...this.trainTrips];
      if (args?.where) {
        const w = args.where;
        if (w.userId) {
          if (typeof w.userId === 'object' && w.userId.not) {
            result = result.filter((t) => t.userId !== w.userId.not);
          } else {
            result = result.filter((t) => t.userId === w.userId);
          }
        }
        if (w.trainNumber) {
          result = result.filter((t) => t.trainNumber === w.trainNumber);
        }
        if (w.date) {
          result = result.filter((t) => t.date === w.date);
        }
        if (w.fromStation) {
          result = result.filter((t) => t.fromStation === w.fromStation);
        }
        if (w.toStation) {
          result = result.filter((t) => t.toStation === w.toStation);
        }
      }

      // Handle user relation include/select
      return result.map((trip) => {
        const fullUser = this.users.find((u) => u.id === trip.userId);
        let userResult = fullUser;

        if (args?.include?.user?.select) {
          const select = args.include.user.select;
          userResult = {} as any;
          for (const key of Object.keys(select)) {
            if (select[key]) {
              (userResult as any)[key] = fullUser ? fullUser[key] : undefined;
            }
          }
        }

        return { ...trip, user: userResult };
      });
    },
    delete: async ({ where }: { where: { id: string } }) => {
      const idx = this.trainTrips.findIndex((t) => t.id === where.id);
      if (idx === -1) throw new Error('Trip not found');
      const removed = this.trainTrips.splice(idx, 1)[0];
      return removed;
    },
    deleteMany: async () => {
      this.trainTrips = [];
      return { count: 0 };
    },
  };

  ride = {
    create: async ({ data }: { data: any }) => {
      const ride = {
        id: data.id || `ride_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        status: data.status || 'OPEN',
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data,
      };
      this.rides.push(ride);
      return ride;
    },
    findUnique: async ({ where, include }: { where: { id: string }; include?: any }) => {
      const ride = this.rides.find((r) => r.id === where.id);
      if (!ride) return null;

      let enriched: any = { ...ride };
      if (include?.creator) {
        enriched.creator = this.users.find((u) => u.id === ride.creatorId);
      }
      if (include?.members) {
        enriched.members = this.rideMembers
          .filter((m) => m.rideId === ride.id)
          .map((m) => ({
            ...m,
            user: include?.members?.include?.user
              ? this.users.find((u) => u.id === m.userId)
              : undefined,
          }));
      }
      return enriched;
    },
    findMany: async (args?: any) => {
      let result = [...this.rides];
      if (args?.where) {
        const w = args.where;
        if (w.status) result = result.filter((r) => r.status === w.status);
        if (w.origin) result = result.filter((r) => r.origin.includes(w.origin));
        if (w.destination) result = result.filter((r) => r.destination.includes(w.destination));
      }

      return result.map((ride) => {
        const creator = this.users.find((u) => u.id === ride.creatorId);
        const members = this.rideMembers
          .filter((m) => m.rideId === ride.id)
          .map((m) => ({
            ...m,
            user: this.users.find((u) => u.id === m.userId),
          }));
        return { ...ride, creator, members };
      });
    },
    update: async ({ where, data }: { where: any; data: any }) => {
      const ride = this.rides.find((r) => r.id === where.id);
      if (!ride) throw new Error('Ride not found');

      // Optimistic concurrency safety check
      if (where.availableSeats !== undefined && ride.availableSeats !== where.availableSeats) {
        const err: any = new Error('Record to update not found (concurrent update conflict)');
        err.code = 'P2025';
        throw err;
      }

      Object.assign(ride, data, { updatedAt: new Date() });
      return ride;
    },
    delete: async ({ where }: { where: { id: string } }) => {
      const idx = this.rides.findIndex((r) => r.id === where.id);
      if (idx === -1) throw new Error('Ride not found');
      return this.rides.splice(idx, 1)[0];
    },
    deleteMany: async () => {
      this.rides = [];
      return { count: 0 };
    },
  };

  rideMember = {
    create: async ({ data }: { data: any }) => {
      const member = {
        id: data.id || `rm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        joinedAt: new Date(),
        ...data,
      };
      this.rideMembers.push(member);
      return member;
    },
    findUnique: async ({ where }: { where: { rideId_userId?: { rideId: string; userId: string } } }) => {
      if (where.rideId_userId) {
        const { rideId, userId } = where.rideId_userId;
        return this.rideMembers.find((m) => m.rideId === rideId && m.userId === userId) || null;
      }
      return null;
    },
    findMany: async ({ where, include }: any) => {
      let result = [...this.rideMembers];
      if (where?.rideId) result = result.filter((m) => m.rideId === where.rideId);
      if (where?.userId) result = result.filter((m) => m.userId === where.userId);

      return result.map((m) => ({
        ...m,
        user: include?.user ? this.users.find((u) => u.id === m.userId) : undefined,
      }));
    },
    delete: async ({ where }: { where: { rideId_userId: { rideId: string; userId: string } } }) => {
      const { rideId, userId } = where.rideId_userId;
      const idx = this.rideMembers.findIndex((m) => m.rideId === rideId && m.userId === userId);
      if (idx === -1) throw new Error('Member not found');
      return this.rideMembers.splice(idx, 1)[0];
    },
    deleteMany: async () => {
      this.rideMembers = [];
      return { count: 0 };
    },
  };

  conversation = {
    create: async ({ data }: { data: any }) => {
      const conv = {
        id: data.id || `conv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        isGroup: data.isGroup || false,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data,
      };
      this.conversations.push(conv);
      return conv;
    },
    findUnique: async ({ where, include }: { where: { id?: string; rideId?: string }; include?: any }) => {
      const conv = this.conversations.find(
        (c) => (where.id && c.id === where.id) || (where.rideId && c.rideId === where.rideId)
      );
      if (!conv) return null;

      let enriched: any = { ...conv };
      if (include?.members) {
        enriched.members = this.conversationMembers
          .filter((m) => m.conversationId === conv.id)
          .map((m) => ({
            ...m,
            user: include?.members?.include?.user
              ? this.users.find((u) => u.id === m.userId)
              : undefined,
          }));
      }
      if (include?.messages) {
        enriched.messages = this.messages.filter((m) => m.conversationId === conv.id);
      }
      return enriched;
    },
    findFirst: async ({ where }: { where: any }) => {
      return (
        this.conversations.find((c) => {
          if (where.rideId && c.rideId !== where.rideId) return false;
          if (where.isGroup !== undefined && c.isGroup !== where.isGroup) return false;
          return true;
        }) || null
      );
    },
    findMany: async ({ where }: any) => {
      let convs = [...this.conversations];
      if (where?.members?.some?.userId) {
        const uId = where.members.some.userId;
        const myConvIds = this.conversationMembers
          .filter((m) => m.userId === uId)
          .map((m) => m.conversationId);
        convs = convs.filter((c) => myConvIds.includes(c.id));
      }

      return convs.map((conv) => {
        const members = this.conversationMembers
          .filter((m) => m.conversationId === conv.id)
          .map((m) => ({
            ...m,
            user: this.users.find((u) => u.id === m.userId),
          }));
        const lastMessage = this.messages
          .filter((m) => m.conversationId === conv.id)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];

        return { ...conv, members, lastMessage };
      });
    },
    deleteMany: async () => {
      this.conversations = [];
      return { count: 0 };
    },
  };

  conversationMember = {
    create: async ({ data }: { data: any }) => {
      const member = {
        id: data.id || `cm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        joinedAt: new Date(),
        ...data,
      };
      this.conversationMembers.push(member);
      return member;
    },
    createMany: async ({ data }: { data: any[] }) => {
      for (const item of data) {
        this.conversationMembers.push({
          id: `cm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          joinedAt: new Date(),
          ...item,
        });
      }
      return { count: data.length };
    },
    findUnique: async ({
      where,
    }: {
      where: { conversationId_userId?: { conversationId: string; userId: string } };
    }) => {
      if (where.conversationId_userId) {
        const { conversationId, userId } = where.conversationId_userId;
        return (
          this.conversationMembers.find(
            (m) => m.conversationId === conversationId && m.userId === userId
          ) || null
        );
      }
      return null;
    },
    findMany: async ({ where }: any) => {
      let result = [...this.conversationMembers];
      if (where?.conversationId) {
        result = result.filter((m) => m.conversationId === where.conversationId);
      }
      if (where?.userId) {
        result = result.filter((m) => m.userId === where.userId);
      }
      return result;
    },
    delete: async ({
      where,
    }: {
      where: { conversationId_userId: { conversationId: string; userId: string } };
    }) => {
      const { conversationId, userId } = where.conversationId_userId;
      const idx = this.conversationMembers.findIndex(
        (m) => m.conversationId === conversationId && m.userId === userId
      );
      if (idx === -1) throw new Error('Member not found');
      return this.conversationMembers.splice(idx, 1)[0];
    },
    deleteMany: async () => {
      this.conversationMembers = [];
      return { count: 0 };
    },
  };

  message = {
    create: async ({ data, include }: { data: any; include?: any }) => {
      const msg = {
        id: data.id || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        createdAt: new Date(),
        ...data,
      };
      this.messages.push(msg);

      let enriched: any = { ...msg };
      if (include?.sender) {
        const fullUser = this.users.find((u) => u.id === msg.senderId);
        if (include.sender.select) {
          const select = include.sender.select;
          const filtered: any = {};
          for (const key of Object.keys(select)) {
            if (select[key]) filtered[key] = fullUser ? fullUser[key] : undefined;
          }
          enriched.sender = filtered;
        } else {
          enriched.sender = fullUser;
        }
      }
      return enriched;
    },
    findMany: async ({ where, include, orderBy, take }: any) => {
      let result = this.messages.filter((m) => m.conversationId === where.conversationId);
      if (where?.createdAt?.lt) {
        result = result.filter((m) => m.createdAt < where.createdAt.lt);
      }

      result.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      if (take) {
        result = result.slice(-take);
      }

      return result.map((msg) => {
        const fullUser = this.users.find((u) => u.id === msg.senderId);
        let sender: any = fullUser;
        if (include?.sender?.select) {
          const select = include.sender.select;
          sender = {};
          for (const key of Object.keys(select)) {
            if (select[key]) sender[key] = fullUser ? fullUser[key] : undefined;
          }
        }
        return { ...msg, sender };
      });
    },
    deleteMany: async () => {
      this.messages = [];
      return { count: 0 };
    },
  };

  notification = {
    create: async ({ data }: { data: any }) => {
      const notif = {
        id: data.id || `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        isRead: false,
        createdAt: new Date(),
        ...data,
      };
      this.notifications.push(notif);
      return notif;
    },
    findMany: async ({ where, orderBy }: any) => {
      let result = this.notifications.filter((n) => n.userId === where.userId);
      result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      return result;
    },
    update: async ({ where, data }: { where: { id: string }; data: any }) => {
      const notif = this.notifications.find((n) => n.id === where.id);
      if (!notif) throw new Error('Notification not found');
      Object.assign(notif, data);
      return notif;
    },
    updateMany: async ({ where, data }: { where: { userId: string }; data: any }) => {
      let count = 0;
      this.notifications
        .filter((n) => n.userId === where.userId)
        .forEach((n) => {
          Object.assign(n, data);
          count++;
        });
      return { count };
    },
    deleteMany: async () => {
      this.notifications = [];
      return { count: 0 };
    },
  };

  // Transaction support with mutual exclusion queue to guarantee race-condition safety
  async $transaction<T>(fn: (tx: any) => Promise<T>): Promise<T> {
    let releaseLock: () => void = () => {};
    const previousLock = this.lockPromise;
    this.lockPromise = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });

    try {
      await previousLock;
      const result = await fn(this);
      return result;
    } finally {
      releaseLock();
    }
  }

  async $disconnect() {}
}

const isProduction = process.env.NODE_ENV === 'production';
const useRealPostgres = process.env.DATABASE_URL && !process.env.USE_IN_MEMORY_DB && isProduction;

export const prisma =
  globalForPrisma.prisma ||
  (useRealPostgres ? new PrismaClient() : (new InMemoryPrisma() as unknown as PrismaClient));

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
