import crypto from 'crypto';
import bcrypt from 'bcryptjs';

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
  matches: [] as any[],
  notificationPreferences: [] as any[],
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
  memoryDb.matches = [];
  memoryDb.notificationPreferences = [];
}

let isSeeded = false;

export async function seedMemoryDb() {
  if (isSeeded && memoryDb.users.length > 0) return;
  resetMemoryDb();

  const adminUser = {
    id: 'usr_admin',
    email: 'admin@campus.edu',
    name: 'Dean Martinez',
    department: 'Campus Safety',
    year: 'Staff',
    role: 'ADMIN',
    phone: '+15550001111',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    isBanned: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const studentUser = {
    id: 'usr_student',
    email: 'student@campus.edu',
    name: 'Alex Rivera',
    department: 'Computer Science',
    year: '3rd Year',
    role: 'USER',
    phone: '+15550002222',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    isBanned: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const finderUser = {
    id: 'usr_finder',
    email: 'finder@campus.edu',
    name: 'Sam Chen',
    department: 'Mechanical Engineering',
    year: '2nd Year',
    role: 'USER',
    phone: '+15550003333',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    isBanned: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const peerUser = {
    id: 'usr_peer',
    email: 'sarah@campus.edu',
    name: 'Sarah Jenkins',
    department: 'Physics',
    year: '4th Year',
    role: 'USER',
    phone: '+15550004444',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    isBanned: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  memoryDb.users.push(adminUser, studentUser, finderUser, peerUser);

  const expiry30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  // Lost items
  memoryDb.lostItems.push(
    {
      id: 'lost_001',
      userId: studentUser.id,
      title: 'Sony WH-1000XM4 Noise-Cancelling Headphones',
      description: 'Matte black over-ear headphones left in the 3rd floor quiet study cubicle near bookshelf #4.',
      category: 'Electronics',
      location: 'Central Library Floor 3',
      dateLost: new Date(Date.now() - 18 * 60 * 60 * 1000),
      imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
      status: 'open',
      isExpired: false,
      expiresAt: expiry30Days,
      createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000),
      updatedAt: new Date(),
    },
    {
      id: 'lost_002',
      userId: peerUser.id,
      title: 'Hydro Flask Water Bottle (Teal, 32oz)',
      description: 'Has various national park stickers on it and a small dent at the bottom.',
      category: 'Personal Belongings',
      location: 'Student Union Cafeteria',
      dateLost: new Date(Date.now() - 48 * 60 * 60 * 1000),
      imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500',
      status: 'open',
      isExpired: false,
      expiresAt: expiry30Days,
      createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
      updatedAt: new Date(),
    }
  );

  // Found items
  const salt = await bcrypt.genSalt(10);
  const hashedAnswer1 = await bcrypt.hash('totoro', salt);
  const hashedAnswer2 = await bcrypt.hash('4321', salt);

  const foundItem1 = {
    id: 'found_001',
    userId: finderUser.id,
    title: 'Matte Black Wireless Earbuds Case',
    description: 'Found under desk row 4 after the CS101 lecture. Turned in for safekeeping.',
    category: 'Electronics',
    location: 'Science Complex Auditorium B',
    dateFound: new Date(Date.now() - 4 * 60 * 60 * 1000),
    imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500',
    holdingLocation: 'with finder',
    secretQuestion: 'What cartoon sticker is on the back of the case?',
    secretAnswer: hashedAnswer1, // plain: "totoro"
    status: 'open',
    isExpired: false,
    expiresAt: expiry30Days,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    updatedAt: new Date(),
  };

  const foundItem2 = {
    id: 'found_002',
    userId: studentUser.id,
    title: 'Silver TI-84 Plus CE Calculator',
    description: 'Found in the math lab. Turned in to the department administrative desk.',
    category: 'Electronics',
    location: 'Math Building Room 204',
    dateFound: new Date(Date.now() - 12 * 60 * 60 * 1000),
    imageUrl: 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=500',
    holdingLocation: 'department',
    secretQuestion: 'What are the last 4 digits etched on the back cover?',
    secretAnswer: hashedAnswer2, // plain: "4321"
    status: 'open',
    isExpired: false,
    expiresAt: expiry30Days,
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    updatedAt: new Date(),
  };

  memoryDb.foundItems.push(foundItem1, foundItem2);

  // Train trips
  memoryDb.trainTrips.push(
    {
      id: 'trip_001',
      userId: studentUser.id,
      trainNumber: '12951',
      trainName: 'Mumbai Rajdhani Express',
      fromStation: 'NDLS',
      toStation: 'BCT',
      date: '2026-11-20',
      departureTime: '16:55',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'trip_002',
      userId: finderUser.id,
      trainNumber: '12951',
      trainName: 'Mumbai Rajdhani Express',
      fromStation: 'NDLS',
      toStation: 'BCT',
      date: '2026-11-20',
      departureTime: '16:55',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  );

  // Rides
  const demoRide = {
    id: 'ride_001',
    creatorId: studentUser.id,
    origin: 'Campus North Gate',
    destination: 'International Airport Terminal 2',
    departureTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    totalSeats: 4,
    availableSeats: 2,
    estimatedFare: 60.0,
    status: 'OPEN',
    notes: 'Split Uber XL fare. Leaving promptly at 5:30 AM.',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  memoryDb.rides.push(demoRide);
  memoryDb.rideMembers.push(
    { id: 'rm_1', rideId: demoRide.id, userId: studentUser.id, joinedAt: new Date() },
    { id: 'rm_2', rideId: demoRide.id, userId: finderUser.id, joinedAt: new Date() }
  );

  // Conversations
  const rideConv = {
    id: 'conv_ride_001',
    isGroup: true,
    title: 'Ride to Airport Terminal 2',
    rideId: demoRide.id,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  memoryDb.conversations.push(rideConv);
  memoryDb.conversationMembers.push(
    { id: 'cm_1', conversationId: rideConv.id, userId: studentUser.id, joinedAt: new Date() },
    { id: 'cm_2', conversationId: rideConv.id, userId: finderUser.id, joinedAt: new Date() }
  );
  memoryDb.messages.push({
    id: 'msg_001',
    conversationId: rideConv.id,
    senderId: studentUser.id,
    content: 'Hey everyone, please be at North Gate by 5:25 AM!',
    createdAt: new Date(),
  });

  const directConv = {
    id: 'conv_direct_001',
    isGroup: false,
    title: null,
    rideId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  memoryDb.conversations.push(directConv);
  memoryDb.conversationMembers.push(
    { id: 'cm_3', conversationId: directConv.id, userId: studentUser.id, joinedAt: new Date() },
    { id: 'cm_4', conversationId: directConv.id, userId: peerUser.id, joinedAt: new Date() }
  );
  memoryDb.messages.push({
    id: 'msg_002',
    conversationId: directConv.id,
    senderId: peerUser.id,
    content: 'Hi! Do you still have that textbook available?',
    createdAt: new Date(),
  });

  // Listings
  const listing1 = {
    id: 'list_001',
    sellerId: peerUser.id,
    title: 'Organic Chemistry: Structure and Function (8th Edition)',
    description: 'Hardcover textbook. First 3 chapters lightly highlighted in yellow, binding in perfect shape.',
    price: 45.0,
    category: 'Books',
    condition: 'like new',
    imageUrls: ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500'],
    status: 'available',
    isExpired: false,
    expiresAt: expiry30Days,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const listing2 = {
    id: 'list_002',
    sellerId: studentUser.id,
    title: 'Dell 24" UltraSharp 1080p Monitor with HDMI Cable',
    description: 'Used for one semester in the dorms. No dead pixels, includes power and HDMI cables.',
    price: 85.0,
    category: 'Electronics',
    condition: 'used',
    imageUrls: ['https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500'],
    status: 'available',
    isExpired: false,
    expiresAt: expiry30Days,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const listing3 = {
    id: 'list_003',
    sellerId: finderUser.id,
    title: 'Dorm Desk Lamp with USB-C Charging Port',
    description: 'Adjustable gooseneck LED lamp with 3 color temperatures and dimmer.',
    price: 18.0,
    category: 'Dorm Essentials',
    condition: 'new',
    imageUrls: ['https://images.unsplash.com/photo-1534972195531-a756b1126f24?w=500'],
    status: 'available',
    isExpired: false,
    expiresAt: expiry30Days,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  memoryDb.listings.push(listing1, listing2, listing3);

  // Wishlist
  memoryDb.wishlists.push({
    id: 'wish_001',
    userId: studentUser.id,
    listingId: listing1.id,
    createdAt: new Date(),
  });

  // Report
  memoryDb.reports.push({
    id: 'rep_001',
    reporterId: studentUser.id,
    targetType: 'LISTING',
    targetId: listing3.id,
    reason: 'Duplicate listing / spam test',
    details: 'Checking report pipeline in dev',
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Notifications
  memoryDb.notifications.push(
    {
      id: 'notif_001',
      userId: studentUser.id,
      title: 'New Train Buddy Radar Alert!',
      message: 'Sam Chen is also traveling on Train #12951 (NDLS → BCT) on 2026-11-20.',
      type: 'MATCH',
      link: '/train-buddy',
      isRead: false,
      createdAt: new Date(),
    },
    {
      id: 'notif_002',
      userId: finderUser.id,
      title: 'New Train Buddy Radar Alert!',
      message: 'Alex Rivera is also traveling on Train #12951 (NDLS → BCT) on 2026-11-20.',
      type: 'MATCH',
      link: '/train-buddy',
      isRead: false,
      createdAt: new Date(),
    }
  );

  isSeeded = true;
}

export const inMemoryPrisma: any = {
  $transaction: async (cbOrArray: any) => {
    if (typeof cbOrArray === 'function') {
      return cbOrArray(inMemoryPrisma);
    }
    return Promise.all(cbOrArray);
  },

  user: {
    findUnique: async ({ where }: any) => {
      if (where.id) return memoryDb.users.find((u) => u.id === where.id) || null;
      if (where.email) return memoryDb.users.find((u) => u.email === where.email) || null;
      return null;
    },
    findFirst: async ({ where }: any) => {
      if (where?.email) return memoryDb.users.find((u) => u.email === where.email) || null;
      return memoryDb.users[0] || null;
    },
    create: async ({ data }: any) => {
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
    },
    update: async ({ where, data }: any) => {
      const index = memoryDb.users.findIndex((u) => u.id === where.id);
      if (index === -1) throw new Error('Record not found');
      memoryDb.users[index] = { ...memoryDb.users[index], ...data, updatedAt: new Date() };
      return memoryDb.users[index];
    },
    deleteMany: async () => {
      memoryDb.users = [];
      return { count: 0 };
    },
    count: async () => memoryDb.users.length,
  },

  otpToken: {
    findFirst: async ({ where }: any) => {
      return (
        memoryDb.otpTokens
          .slice()
          .reverse()
          .find((t) => t.email === where.email && new Date(t.expiresAt) > new Date()) || null
      );
    },
    create: async ({ data }: any) => {
      const token = {
        id: `otp_${crypto.randomBytes(4).toString('hex')}`,
        createdAt: new Date(),
        ...data,
      };
      memoryDb.otpTokens.push(token);
      return token;
    },
    deleteMany: async ({ where }: any = {}) => {
      if (where?.email) {
        memoryDb.otpTokens = memoryDb.otpTokens.filter((t) => t.email !== where.email);
      } else {
        memoryDb.otpTokens = [];
      }
      return { count: 0 };
    },
  },

  lostItem: {
    create: async ({ data }: any) => {
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
    },
    findMany: async ({ where, skip, take }: any = {}) => {
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
      if (where?.userId) {
        results = results.filter((i) => i.userId === where.userId);
      }
      if (typeof skip === 'number' && typeof take === 'number') {
        results = results.slice(skip, skip + take);
      } else if (typeof take === 'number') {
        results = results.slice(0, take);
      }
      return results.map((item) => {
        const user = memoryDb.users.find((u) => u.id === item.userId);
        return {
          ...item,
          user: user
            ? { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl }
            : undefined,
        };
      });
    },
    findUnique: async ({ where }: any) => {
      const item = memoryDb.lostItems.find((i) => i.id === where.id);
      if (!item) return null;
      const user = memoryDb.users.find((u) => u.id === item.userId);
      return {
        ...item,
        user: user
          ? { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl }
          : undefined,
      };
    },
    update: async ({ where, data }: any) => {
      const index = memoryDb.lostItems.findIndex((i) => i.id === where.id);
      if (index === -1) throw new Error('Record not found');
      memoryDb.lostItems[index] = {
        ...memoryDb.lostItems[index],
        ...data,
        updatedAt: new Date(),
      };
      return memoryDb.lostItems[index];
    },
    count: async ({ where }: any = {}) => {
      let results = memoryDb.lostItems.slice();
      if (where?.status) {
        results = results.filter((i) => i.status.toLowerCase() === where.status.toLowerCase());
      }
      return results.length;
    },
    delete: async ({ where }: any) => {
      const index = memoryDb.lostItems.findIndex((i) => i.id === where.id);
      if (index === -1) throw new Error('Record not found');
      const [removed] = memoryDb.lostItems.splice(index, 1);
      return removed;
    },
    deleteMany: async () => {
      memoryDb.lostItems = [];
      return { count: 0 };
    },
  },

  foundItem: {
    create: async ({ data }: any) => {
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
    },
    findMany: async ({ where, skip, take }: any = {}) => {
      let results = memoryDb.foundItems.slice();
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
      if (where?.userId) {
        results = results.filter((i) => i.userId === where.userId);
      }
      if (typeof skip === 'number' && typeof take === 'number') {
        results = results.slice(skip, skip + take);
      } else if (typeof take === 'number') {
        results = results.slice(0, take);
      }
      return results.map((item) => {
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
      });
    },
    findUnique: async ({ where, include }: any) => {
      const item = memoryDb.foundItems.find((i) => i.id === where.id);
      if (!item) return null;
      const user = memoryDb.users.find((u) => u.id === item.userId);
      let userData: any = undefined;
      if (include?.user) {
        if (include.user.select) {
          userData = {};
          if (include.user.select.id) userData.id = user?.id;
          if (include.user.select.name) userData.name = user?.name;
          if (include.user.select.avatarUrl) userData.avatarUrl = user?.avatarUrl;
          if (include.user.select.email) userData.email = user?.email;
          if (include.user.select.phone) userData.phone = user?.phone;
        } else {
          userData = user
            ? {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                avatarUrl: user.avatarUrl,
              }
            : undefined;
        }
      }
      return {
        ...item,
        user: userData,
      };
    },
    update: async ({ where, data }: any) => {
      const index = memoryDb.foundItems.findIndex((i) => i.id === where.id);
      if (index === -1) throw new Error('Record not found');
      memoryDb.foundItems[index] = {
        ...memoryDb.foundItems[index],
        ...data,
        updatedAt: new Date(),
      };
      return memoryDb.foundItems[index];
    },
    delete: async ({ where }: any) => {
      const index = memoryDb.foundItems.findIndex((i) => i.id === where.id);
      if (index === -1) throw new Error('Record not found');
      const [removed] = memoryDb.foundItems.splice(index, 1);
      return removed;
    },
    count: async ({ where }: any = {}) => {
      let results = memoryDb.foundItems.slice();
      if (where?.status) {
        results = results.filter((i) => i.status.toLowerCase() === where.status.toLowerCase());
      }
      return results.length;
    },
    deleteMany: async () => {
      memoryDb.foundItems = [];
      return { count: 0 };
    },
  },

  listing: {
    create: async ({ data }: any) => {
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
    },
    findMany: async ({ where, skip, take }: any = {}) => {
      let results = memoryDb.listings.slice();
      if (where?.isExpired !== undefined) {
        results = results.filter((l) => l.isExpired === where.isExpired);
      }
      if (where?.status?.equals) {
        results = results.filter((l) => l.status.toLowerCase() === where.status.equals.toLowerCase());
      }
      if (typeof skip === 'number' && typeof take === 'number') {
        results = results.slice(skip, skip + take);
      } else if (typeof take === 'number') {
        results = results.slice(0, take);
      }
      return results.map((item) => {
        const user = memoryDb.users.find((u) => u.id === item.sellerId);
        return {
          ...item,
          seller: user
            ? { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl }
            : undefined,
        };
      });
    },
    findUnique: async ({ where }: any) => {
      const item = memoryDb.listings.find((i) => i.id === where.id);
      if (!item) return null;
      const user = memoryDb.users.find((u) => u.id === item.sellerId);
      return {
        ...item,
        seller: user
          ? { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl }
          : undefined,
      };
    },
    update: async ({ where, data }: any) => {
      const index = memoryDb.listings.findIndex((i) => i.id === where.id);
      if (index === -1) throw new Error('Record not found');
      memoryDb.listings[index] = {
        ...memoryDb.listings[index],
        ...data,
        updatedAt: new Date(),
      };
      return memoryDb.listings[index];
    },
    delete: async ({ where }: any) => {
      const index = memoryDb.listings.findIndex((i) => i.id === where.id);
      if (index === -1) throw new Error('Record not found');
      const [removed] = memoryDb.listings.splice(index, 1);
      return removed;
    },
    count: async ({ where }: any = {}) => {
      let results = memoryDb.listings.slice();
      if (where?.status) {
        results = results.filter((l) => l.status.toLowerCase() === where.status.toLowerCase());
      }
      return results.length;
    },
    deleteMany: async () => {
      memoryDb.listings = [];
      return { count: 0 };
    },
  },

  wishlist: {
    upsert: async ({ create }: any) => {
      const existing = memoryDb.wishlists.find(
        (w) => w.userId === create.userId && w.listingId === create.listingId
      );
      if (existing) return existing;
      const wish = { id: `wish_${Date.now()}`, ...create, createdAt: new Date() };
      memoryDb.wishlists.push(wish);
      return wish;
    },
    create: async ({ data }: any) => {
      const wish = { id: `wish_${Date.now()}`, ...data, createdAt: new Date() };
      memoryDb.wishlists.push(wish);
      return wish;
    },
    findMany: async ({ where }: any) => {
      return memoryDb.wishlists
        .filter((w) => w.userId === where.userId)
        .map((w) => ({
          ...w,
          listing: memoryDb.listings.find((l) => l.id === w.listingId),
        }));
    },
    findUnique: async ({ where }: any) => {
      const { userId, listingId } = where.userId_listingId;
      return (
        memoryDb.wishlists.find((w) => w.userId === userId && w.listingId === listingId) || null
      );
    },
    delete: async ({ where }: any) => {
      const { userId, listingId } = where.userId_listingId;
      memoryDb.wishlists = memoryDb.wishlists.filter(
        (w) => !(w.userId === userId && w.listingId === listingId)
      );
      return { count: 1 };
    },
    deleteMany: async ({ where }: any = {}) => {
      if (where?.userId && where?.listingId) {
        memoryDb.wishlists = memoryDb.wishlists.filter(
          (w) => !(w.userId === where.userId && w.listingId === where.listingId)
        );
      } else {
        memoryDb.wishlists = [];
      }
      return { count: 1 };
    },
  },

  report: {
    create: async ({ data }: any) => {
      const rep = {
        id: `rep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'pending',
        ...data,
      };
      memoryDb.reports.push(rep);
      return rep;
    },
    findMany: async ({ where }: any = {}) => {
      let results = memoryDb.reports.slice();
      if (where?.status) {
        results = results.filter((r) => r.status.toLowerCase() === where.status.toLowerCase());
      }
      if (where?.targetType) {
        results = results.filter((r) => r.targetType.toUpperCase() === where.targetType.toUpperCase());
      }
      return results.map((r) => {
        const reporter = memoryDb.users.find((u) => u.id === r.reporterId);
        return {
          ...r,
          reporter: reporter ? { id: reporter.id, name: reporter.name, email: reporter.email } : undefined,
        };
      });
    },
    count: async (args: any = {}) => {
      const where = args?.where;
      let results = memoryDb.reports.slice();
      if (where?.status) {
        results = results.filter((r) => r.status && r.status.toLowerCase() === where.status.toLowerCase());
      }
      return results.length;
    },
    updateMany: async ({ where, data }: any = {}) => {
      let count = 0;
      memoryDb.reports.forEach((r) => {
        if (
          (!where?.targetType || r.targetType === where.targetType) &&
          (!where?.targetId || r.targetId === where.targetId) &&
          (!where?.status || r.status === where.status)
        ) {
          Object.assign(r, data, { updatedAt: new Date() });
          count++;
        }
      });
      return { count };
    },
    deleteMany: async () => {
      memoryDb.reports = [];
      return { count: 0 };
    },
  },

  trainTrip: {
    create: async ({ data }: any) => {
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
    },
    findMany: async ({ where, include }: any = {}) => {
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
    },
    findUnique: async ({ where, include }: any) => {
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
    },
    delete: async ({ where }: any) => {
      const index = memoryDb.trainTrips.findIndex((t) => t.id === where.id);
      if (index === -1) throw new Error('Record not found');
      const [removed] = memoryDb.trainTrips.splice(index, 1);
      return removed;
    },
    deleteMany: async () => {
      memoryDb.trainTrips = [];
      return { count: 0 };
    },
  },

  ride: {
    create: async ({ data }: any) => {
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
    },
    findMany: async ({ where, include }: any = {}) => {
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
    },
    findUnique: async ({ where, include }: any) => {
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
    },
    update: async ({ where, data }: any) => {
      const index = memoryDb.rides.findIndex((r) => r.id === where.id);
      if (index === -1) {
        const err: any = new Error('Record not found');
        err.code = 'P2025';
        throw err;
      }

      const current = memoryDb.rides[index];
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
    },
    delete: async ({ where }: any) => {
      const index = memoryDb.rides.findIndex((r) => r.id === where.id);
      if (index === -1) throw new Error('Record not found');
      const [removed] = memoryDb.rides.splice(index, 1);
      return removed;
    },
    count: async ({ where }: any = {}) => {
      let results = memoryDb.rides.slice();
      if (where?.status) {
        results = results.filter((r) => r.status === where.status);
      }
      return results.length;
    },
    deleteMany: async () => {
      memoryDb.rides = [];
      return { count: 0 };
    },
  },

  rideMember: {
    create: async ({ data }: any) => {
      const member = {
        id: `rm_${crypto.randomBytes(4).toString('hex')}`,
        rideId: data.rideId,
        userId: data.userId,
        joinedAt: new Date(),
      };
      memoryDb.rideMembers.push(member);
      return member;
    },
    findMany: async ({ where }: any = {}) => {
      let results = memoryDb.rideMembers.slice();
      if (where?.rideId) results = results.filter((m) => m.rideId === where.rideId);
      if (where?.userId) results = results.filter((m) => m.userId === where.userId);
      return results;
    },
    delete: async ({ where }: any) => {
      const { rideId, userId } = where.rideId_userId;
      const index = memoryDb.rideMembers.findIndex(
        (m) => m.rideId === rideId && m.userId === userId
      );
      if (index === -1) throw new Error('Record not found');
      const [removed] = memoryDb.rideMembers.splice(index, 1);
      return removed;
    },
    deleteMany: async () => {
      memoryDb.rideMembers = [];
      return { count: 0 };
    },
  },

  conversation: {
    create: async ({ data }: any) => {
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
    },
    findMany: async ({ where }: any = {}) => {
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
    },
    findUnique: async ({ where }: any) => {
      if (where.id) {
        return memoryDb.conversations.find((c) => c.id === where.id) || null;
      }
      if (where.rideId) {
        return memoryDb.conversations.find((c) => c.rideId === where.rideId) || null;
      }
      return null;
    },
    deleteMany: async () => {
      memoryDb.conversations = [];
      return { count: 0 };
    },
  },

  conversationMember: {
    create: async ({ data }: any) => {
      const cm = {
        id: `cm_${crypto.randomBytes(4).toString('hex')}`,
        conversationId: data.conversationId,
        userId: data.userId,
        joinedAt: new Date(),
      };
      memoryDb.conversationMembers.push(cm);
      return cm;
    },
    createMany: async ({ data }: any) => {
      for (const item of data) {
        memoryDb.conversationMembers.push({
          id: `cm_${crypto.randomBytes(4).toString('hex')}`,
          conversationId: item.conversationId,
          userId: item.userId,
          joinedAt: new Date(),
        });
      }
      return { count: data.length };
    },
    findMany: async ({ where }: any = {}) => {
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
    },
    findUnique: async ({ where }: any) => {
      const { conversationId, userId } = where.conversationId_userId;
      return (
        memoryDb.conversationMembers.find(
          (cm) => cm.conversationId === conversationId && cm.userId === userId
        ) || null
      );
    },
    delete: async ({ where }: any) => {
      const { conversationId, userId } = where.conversationId_userId;
      const index = memoryDb.conversationMembers.findIndex(
        (cm) => cm.conversationId === conversationId && cm.userId === userId
      );
      if (index === -1) throw new Error('Record not found');
      const [removed] = memoryDb.conversationMembers.splice(index, 1);
      return removed;
    },
    deleteMany: async () => {
      memoryDb.conversationMembers = [];
      return { count: 0 };
    },
  },

  message: {
    create: async ({ data, include }: any) => {
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
    },
    findMany: async ({ where, include, take }: any = {}) => {
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
    },
    deleteMany: async () => {
      memoryDb.messages = [];
      return { count: 0 };
    },
  },

  notification: {
    create: async ({ data }: any) => {
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
    },
    findMany: async ({ where }: any = {}) => {
      let results = memoryDb.notifications.slice();
      if (where?.userId) {
        results = results.filter((n) => n.userId === where.userId);
      }
      return results.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    },
    update: async ({ where, data }: any) => {
      const index = memoryDb.notifications.findIndex((n) => n.id === where.id);
      if (index === -1) throw new Error('Record not found');
      memoryDb.notifications[index] = {
        ...memoryDb.notifications[index],
        ...data,
      };
      return memoryDb.notifications[index];
    },
    updateMany: async ({ where, data }: any) => {
      let count = 0;
      memoryDb.notifications.forEach((n) => {
        if (!where?.userId || n.userId === where.userId) {
          Object.assign(n, data);
          count++;
        }
      });
      return { count };
    },
    count: async ({ where }: any = {}) => {
      let results = memoryDb.notifications.slice();
      if (where?.userId) {
        results = results.filter((n) => n.userId === where.userId);
      }
      if (where?.isRead !== undefined) {
        results = results.filter((n) => n.isRead === where.isRead);
      }
      return results.length;
    },
    deleteMany: async () => {
      memoryDb.notifications = [];
      return { count: 0 };
    },
  },

  match: {
    create: async ({ data }: any) => {
      const match = {
        id: `match_${crypto.randomBytes(4).toString('hex')}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'PENDING',
        ...data,
      };
      memoryDb.matches.push(match);
      return match;
    },
    upsert: async ({ where, update, create }: any) => {
      const existingIndex = memoryDb.matches.findIndex(
        (m) =>
          m.lostItemId === where?.lostItemId_foundItemId?.lostItemId &&
          m.foundItemId === where?.lostItemId_foundItemId?.foundItemId
      );
      if (existingIndex !== -1) {
        memoryDb.matches[existingIndex] = {
          ...memoryDb.matches[existingIndex],
          ...update,
          updatedAt: new Date(),
        };
        return memoryDb.matches[existingIndex];
      }
      const match = {
        id: `match_${crypto.randomBytes(4).toString('hex')}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'PENDING',
        ...create,
      };
      memoryDb.matches.push(match);
      return match;
    },
    findMany: async ({ where, include, skip, take }: any = {}) => {
      let results = memoryDb.matches.slice();
      if (where?.OR) {
        const lostIn = where.OR.find((cond: any) => cond.lostItemId)?.lostItemId?.in || [];
        const foundIn = where.OR.find((cond: any) => cond.foundItemId)?.foundItemId?.in || [];
        results = results.filter(
          (m) => lostIn.includes(m.lostItemId) || foundIn.includes(m.foundItemId)
        );
      }
      if (where?.status) {
        results = results.filter((m) => m.status.toUpperCase() === where.status.toUpperCase());
      }
      if (typeof skip === 'number' && typeof take === 'number') {
        results = results.slice(skip, skip + take);
      }
      return results.map((m) => {
        const res = { ...m };
        if (include?.lostItem) {
          const lost = memoryDb.lostItems.find((l) => l.id === m.lostItemId);
          res.lostItem = lost ? { ...lost, user: memoryDb.users.find((u) => u.id === lost.userId) } : null;
        }
        if (include?.foundItem) {
          const found = memoryDb.foundItems.find((f) => f.id === m.foundItemId);
          res.foundItem = found ? { ...found, user: memoryDb.users.find((u) => u.id === found.userId) } : null;
        }
        return res;
      });
    },
    findUnique: async ({ where, include }: any) => {
      const match = memoryDb.matches.find((m) => m.id === where.id);
      if (!match) return null;
      const res = { ...match };
      if (include?.lostItem) {
        const lost = memoryDb.lostItems.find((l) => l.id === match.lostItemId);
        res.lostItem = lost ? { ...lost, user: memoryDb.users.find((u) => u.id === lost.userId) } : null;
      }
      if (include?.foundItem) {
        const found = memoryDb.foundItems.find((f) => f.id === match.foundItemId);
        res.foundItem = found ? { ...found, user: memoryDb.users.find((u) => u.id === found.userId) } : null;
      }
      return res;
    },
    update: async ({ where, data }: any) => {
      const index = memoryDb.matches.findIndex((m) => m.id === where.id);
      if (index === -1) throw new Error('Record not found');
      memoryDb.matches[index] = { ...memoryDb.matches[index], ...data, updatedAt: new Date() };
      return memoryDb.matches[index];
    },
    count: async ({ where }: any = {}) => {
      let results = memoryDb.matches.slice();
      if (where?.OR) {
        const lostIn = where.OR.find((cond: any) => cond.lostItemId)?.lostItemId?.in || [];
        const foundIn = where.OR.find((cond: any) => cond.foundItemId)?.foundItemId?.in || [];
        results = results.filter(
          (m) => lostIn.includes(m.lostItemId) || foundIn.includes(m.foundItemId)
        );
      }
      return results.length;
    },
    deleteMany: async () => {
      memoryDb.matches = [];
      return { count: 0 };
    },
  },

  notificationPreference: {
    findUnique: async ({ where }: any) => {
      return memoryDb.notificationPreferences.find((p) => p.userId === where.userId) || null;
    },
    upsert: async ({ where, update, create }: any) => {
      const index = memoryDb.notificationPreferences.findIndex((p) => p.userId === where.userId);
      if (index !== -1) {
        memoryDb.notificationPreferences[index] = {
          ...memoryDb.notificationPreferences[index],
          ...update,
          updatedAt: new Date(),
        };
        return memoryDb.notificationPreferences[index];
      }
      const pref = {
        id: `pref_${crypto.randomBytes(4).toString('hex')}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...create,
      };
      memoryDb.notificationPreferences.push(pref);
      return pref;
    },
    deleteMany: async () => {
      memoryDb.notificationPreferences = [];
      return { count: 0 };
    },
  },
};
