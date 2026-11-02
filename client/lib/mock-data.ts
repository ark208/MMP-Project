import type { User, LostItem, FoundItem, Listing, ItemStatus, FoundStatus, HoldingLocation, ListingCondition, ListingStatus } from '@docs/types';

export interface ExtendedFoundItem extends FoundItem {
  secretQuestion: string;
  keptAt?: string;
  claimAnswer?: string;
}

export interface MockStore {
  user: User;
  token: string;
  lostItems: LostItem[];
  foundItems: ExtendedFoundItem[];
  listings: Listing[];
  wishlistIds: string[];
}

export const DEFAULT_USER: User = {
  id: 'usr_alex_001',
  email: 'student@campus.edu',
  name: 'Alex Chen',
  phone: '+1 (555) 234-5678',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  role: 'USER',
  isBanned: false,
  createdAt: '2026-09-01T08:00:00.000Z',
  updatedAt: '2026-11-01T12:00:00.000Z',
};

export const INITIAL_LOST_ITEMS: LostItem[] = [
  {
    id: 'lost_001',
    userId: 'usr_alex_001',
    user: {
      id: 'usr_alex_001',
      name: 'Alex Chen',
      email: 'student@campus.edu',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    },
    title: 'Black AirPods Pro (2nd Gen) with carabiner',
    description: 'Left them on a couch on the 2nd floor of Student Union, near the gaming lounge. Case has a matte black Spigen shell and a blue metallic carabiner.',
    category: 'Electronics',
    location: 'Student Union, 2nd Floor',
    dateLost: '2026-11-01T14:30:00.000Z',
    imageUrl: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=600&q=80',
    status: 'OPEN',
    createdAt: '2026-11-01T15:00:00.000Z',
    updatedAt: '2026-11-01T15:00:00.000Z',
  },
  {
    id: 'lost_002',
    userId: 'usr_priya_002',
    user: {
      id: 'usr_priya_002',
      name: 'Priya Sharma',
      email: 'priya.s@campus.edu',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
    },
    title: 'Casio FX-991EX Scientific Calculator',
    description: 'Black scientific calculator with a small gold star sticker on the back battery cover. Misplaced right after the MATH 201 mid-term exam.',
    category: 'Stationery',
    location: 'Main Library, 3rd Floor Desk 34',
    dateLost: '2026-10-31T17:15:00.000Z',
    imageUrl: 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&w=600&q=80',
    status: 'OPEN',
    createdAt: '2026-10-31T18:00:00.000Z',
    updatedAt: '2026-10-31T18:00:00.000Z',
  },
  {
    id: 'lost_003',
    userId: 'usr_marcus_003',
    user: {
      id: 'usr_marcus_003',
      name: 'Marcus Williams',
      email: 'marcus.w@campus.edu',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    },
    title: 'Blue Hydro Flask (32oz Wide Mouth)',
    description: 'Cobalt blue bottle with national park stickers and a boot sleeve. Left near bench press #3 in the campus sports complex.',
    category: 'Personal',
    location: 'Campus Sports Complex Gym',
    dateLost: '2026-10-30T19:00:00.000Z',
    imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&q=80',
    status: 'OPEN',
    createdAt: '2026-10-30T19:45:00.000Z',
    updatedAt: '2026-10-30T19:45:00.000Z',
  },
  {
    id: 'lost_004',
    userId: 'usr_alex_001',
    user: {
      id: 'usr_alex_001',
      name: 'Alex Chen',
      email: 'student@campus.edu',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    },
    title: 'Brown Leather Cardholder with Student ID',
    description: 'Bellroy slim sleeve with University ID card for Alex Chen and laundry card. Reward offered for recovery!',
    category: 'Accessories',
    location: 'Engineering Block Cafe',
    dateLost: '2026-10-28T11:20:00.000Z',
    imageUrl: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=600&q=80',
    status: 'RESOLVED',
    createdAt: '2026-10-28T12:00:00.000Z',
    updatedAt: '2026-10-29T10:00:00.000Z',
  },
];

export const INITIAL_FOUND_ITEMS: ExtendedFoundItem[] = [
  {
    id: 'found_101',
    userId: 'usr_elena_004',
    user: {
      id: 'usr_elena_004',
      name: 'Elena Rostova',
      email: 'elena.r@campus.edu',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
    },
    title: 'Silver MacBook Air M2 13-inch',
    description: 'Found unattended at a study booth in Tech Hub. Laptop is password protected with a transparent hard shell.',
    category: 'Electronics',
    location: 'Tech Hub, 2nd Floor Reading Room',
    dateFound: '2026-11-01T16:00:00.000Z',
    imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80',
    holdingLocation: 'security office',
    status: 'OPEN',
    secretQuestion: 'What stickers or engravings are under or on the transparent shell?',
    keptAt: 'Campus Security Central Office - Room 102',
    createdAt: '2026-11-01T16:30:00.000Z',
    updatedAt: '2026-11-01T16:30:00.000Z',
  },
  {
    id: 'found_102',
    userId: 'usr_jordan_005',
    user: {
      id: 'usr_jordan_005',
      name: 'Jordan Lee',
      email: 'jordan.l@campus.edu',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    },
    title: 'Set of 3 Dorm Keys with Marvel Keychain',
    description: 'Found on grass walkway between Hall of Residence 3 and Dining Hall B. Has two brass keys, one silver key, and a rubber figurine.',
    category: 'Personal',
    location: 'Walkway between Hall 3 and Dining B',
    dateFound: '2026-11-01T09:15:00.000Z',
    imageUrl: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=600&q=80',
    holdingLocation: 'department',
    status: 'OPEN',
    secretQuestion: 'Which Marvel character figurine is on the keychain and what color is the ring?',
    keptAt: 'Hostel 3 Front Desk Reception',
    createdAt: '2026-11-01T10:00:00.000Z',
    updatedAt: '2026-11-01T10:00:00.000Z',
  },
  {
    id: 'found_103',
    userId: 'usr_alex_001',
    user: {
      id: 'usr_alex_001',
      name: 'Alex Chen',
      email: 'student@campus.edu',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    },
    title: 'Moleskine Hardcover Grid Notebook & Parker Pen',
    description: 'Black notebook with handwritten engineering diagrams and physics equations. Found in lecture hall desk drawer.',
    category: 'Stationery',
    location: 'Lecture Hall 4, Row G',
    dateFound: '2026-10-31T13:30:00.000Z',
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
    holdingLocation: 'with finder',
    status: 'OPEN',
    secretQuestion: 'What name or course code is written on the inner front page?',
    keptAt: 'Student Union Information Desk',
    createdAt: '2026-10-31T14:00:00.000Z',
    updatedAt: '2026-10-31T14:00:00.000Z',
  },
  {
    id: 'found_104',
    userId: 'usr_sam_006',
    user: {
      id: 'usr_sam_006',
      name: 'Sam Taylor',
      email: 'sam.t@campus.edu',
      avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=300&q=80',
    },
    title: 'North Face Recon Backpack (Black)',
    description: 'Left on chair in campus central cafeteria during lunch hour.',
    category: 'Bags',
    location: 'Central Cafeteria Zone C',
    dateFound: '2026-10-29T13:00:00.000Z',
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80',
    holdingLocation: 'security office',
    status: 'CLAIMED',
    claimedByUserId: 'usr_david_007',
    claimNote: 'Has my gym clothes inside and a gym tag with locker number 88.',
    secretQuestion: 'What color is the inner lining and what brand gym shaker is inside?',
    keptAt: 'Lost & Found Locker #4, Security Wing',
    createdAt: '2026-10-29T14:00:00.000Z',
    updatedAt: '2026-10-30T11:00:00.000Z',
  },
];

export const INITIAL_LISTINGS: Listing[] = [
  {
    id: 'list_301',
    sellerId: 'usr_alex_001',
    seller: {
      id: 'usr_alex_001',
      name: 'Alex Chen',
      email: 'student@campus.edu',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    },
    title: 'Calculus: Early Transcendentals (9th Edition - Stewart)',
    description: 'Hardcover textbook required for MATH 101/102. Pristine condition with no highlighting or pencil markings inside. Can meet anywhere on campus!',
    price: 45.0,
    category: 'Books',
    condition: 'LIKE_NEW',
    imageUrls: [
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=600&q=80',
    ],
    status: 'AVAILABLE',
    isWishlisted: true,
    createdAt: '2026-11-01T10:00:00.000Z',
    updatedAt: '2026-11-01T10:00:00.000Z',
  },
  {
    id: 'list_302',
    sellerId: 'usr_priya_002',
    seller: {
      id: 'usr_priya_002',
      name: 'Priya Sharma',
      email: 'priya.s@campus.edu',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
    },
    title: 'Ergonomic Mesh Desk Chair (High Back)',
    description: 'Breathable mesh back with adjustable lumbar support and flip-up arms. Perfect for dorm study setups. Selling because moving to a furnished apartment.',
    price: 65.0,
    category: 'Furniture',
    condition: 'GOOD',
    imageUrls: [
      'https://images.unsplash.com/photo-1580481077195-c3a821a5060f?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1505797149-43b0069ec26b?auto=format&fit=crop&w=600&q=80',
    ],
    status: 'AVAILABLE',
    isWishlisted: false,
    createdAt: '2026-10-31T15:30:00.000Z',
    updatedAt: '2026-10-31T15:30:00.000Z',
  },
  {
    id: 'list_303',
    sellerId: 'usr_marcus_003',
    seller: {
      id: 'usr_marcus_003',
      name: 'Marcus Williams',
      email: 'marcus.w@campus.edu',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    },
    title: 'Logitech MX Master 3S Wireless Performance Mouse',
    description: 'Graphite color. Ultra-quiet clicks, 8K DPI sensor, works on any surface including glass. Includes USB-C charging cable and Bolt receiver.',
    price: 55.0,
    category: 'Electronics',
    condition: 'LIKE_NEW',
    imageUrls: [
      'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=600&q=80',
    ],
    status: 'AVAILABLE',
    isWishlisted: false,
    createdAt: '2026-10-30T12:00:00.000Z',
    updatedAt: '2026-10-30T12:00:00.000Z',
  },
  {
    id: 'list_304',
    sellerId: 'usr_elena_004',
    seller: {
      id: 'usr_elena_004',
      name: 'Elena Rostova',
      email: 'elena.r@campus.edu',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
    },
    title: 'Instant Pot Duo 7-in-1 Mini (3 Quart)',
    description: 'Compact 3-quart electric pressure cooker. Ideal for dorm cooking, rice, soups, and meal prep. Fully sanitized with stainless steel inner pot.',
    price: 35.0,
    category: 'Appliances',
    condition: 'GOOD',
    imageUrls: [
      'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80',
    ],
    status: 'AVAILABLE',
    isWishlisted: true,
    createdAt: '2026-10-29T18:00:00.000Z',
    updatedAt: '2026-10-29T18:00:00.000Z',
  },
  {
    id: 'list_305',
    sellerId: 'usr_jordan_005',
    seller: {
      id: 'usr_jordan_005',
      name: 'Jordan Lee',
      email: 'jordan.l@campus.edu',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    },
    title: 'Apple iPad 9th Gen 64GB (Space Gray) + Apple Pencil',
    description: 'Great for taking notes in GoodNotes or Notability. Comes with paper-like matte screen protector already applied and a magnetic trifold case.',
    price: 220.0,
    category: 'Electronics',
    condition: 'LIKE_NEW',
    imageUrls: [
      'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1561154464-82e9adf32764?auto=format&fit=crop&w=600&q=80',
    ],
    status: 'AVAILABLE',
    isWishlisted: false,
    createdAt: '2026-10-28T14:30:00.000Z',
    updatedAt: '2026-10-28T14:30:00.000Z',
  },
  {
    id: 'list_306',
    sellerId: 'usr_alex_001',
    seller: {
      id: 'usr_alex_001',
      name: 'Alex Chen',
      email: 'student@campus.edu',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    },
    title: 'TI-84 Plus CE Color Graphing Calculator (Rose Gold)',
    description: 'Rechargeable battery, color backlit display. Approved for SAT/ACT/AP and all campus engineering calculus exams. Charger cable included.',
    price: 70.0,
    category: 'Electronics',
    condition: 'LIKE_NEW',
    imageUrls: [
      'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&w=600&q=80',
    ],
    status: 'RESERVED',
    isWishlisted: false,
    createdAt: '2026-10-27T16:00:00.000Z',
    updatedAt: '2026-10-28T10:00:00.000Z',
  },
  {
    id: 'list_307',
    sellerId: 'usr_sam_006',
    seller: {
      id: 'usr_sam_006',
      name: 'Sam Taylor',
      email: 'sam.t@campus.edu',
      avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=300&q=80',
    },
    title: 'Adjustable Aluminum Laptop Riser Stand',
    description: 'Foldable ergonomic stand for laptops up to 16 inches. Sturdy aluminum alloy, improves airflow and eye-level posture.',
    price: 18.0,
    category: 'Accessories',
    condition: 'NEW',
    imageUrls: [
      'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80',
    ],
    status: 'AVAILABLE',
    isWishlisted: false,
    createdAt: '2026-10-26T11:00:00.000Z',
    updatedAt: '2026-10-26T11:00:00.000Z',
  },
];

const STORAGE_KEY = 'campusloop_mock_store_v1';

export function getMockStore(): MockStore {
  if (typeof window === 'undefined') {
    return {
      user: DEFAULT_USER,
      token: 'mock_jwt_token_alex_chen_2026',
      lostItems: INITIAL_LOST_ITEMS,
      foundItems: INITIAL_FOUND_ITEMS,
      listings: INITIAL_LISTINGS,
      wishlistIds: ['list_301', 'list_304'],
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed;
    }
  } catch (err) {
    console.warn('Failed to parse mock store from localStorage, resetting:', err);
  }

  const initial: MockStore = {
    user: DEFAULT_USER,
    token: 'mock_jwt_token_alex_chen_2026',
    lostItems: INITIAL_LOST_ITEMS,
    foundItems: INITIAL_FOUND_ITEMS,
    listings: INITIAL_LISTINGS,
    wishlistIds: ['list_301', 'list_304'],
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  } catch (e) {
    // ignore
  }

  return initial;
}

export function saveMockStore(store: MockStore): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (err) {
    console.error('Failed to save mock store to localStorage:', err);
  }
}
