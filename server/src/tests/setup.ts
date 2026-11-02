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
};

export function resetMemoryDb() {
  memoryDb.users = [];
  memoryDb.otpTokens = [];
  memoryDb.lostItems = [];
  memoryDb.foundItems = [];
  memoryDb.listings = [];
  memoryDb.wishlists = [];
  memoryDb.reports = [];
}

// Mock Prisma for deterministic tests without requiring live PostgreSQL daemon
jest.mock('../config/prisma', () => {
  const crypto = require('crypto');

  return {
    prisma: {
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
    },
  };
});

beforeEach(() => {
  resetMemoryDb();
});

