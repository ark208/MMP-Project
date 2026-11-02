import type {
  User,
  LostItem,
  FoundItem,
  Listing,
  ItemStatus,
  FoundStatus,
  HoldingLocation,
  ListingCondition,
  ListingStatus,
  TrainTrip,
  TrainBuddyMatch,
  Ride,
  RideMember,
  Conversation,
  Message,
  Notification,
} from '@docs/types';

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
  trainTrips: TrainTrip[];
  rides: Ride[];
  conversations: Conversation[];
  messages: Message[];
  notifications: Notification[];
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

export const INITIAL_TRAIN_TRIPS: TrainTrip[] = [
  {
    id: 'trip_001',
    userId: 'usr_alex_001',
    user: {
      id: 'usr_alex_001',
      name: 'Alex Chen',
      email: 'student@campus.edu',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    },
    trainNumber: '12951',
    trainName: 'Mumbai Rajdhani Express',
    originStation: 'NDLS',
    destinationStation: 'BCT',
    departureDate: '2026-11-20',
    departureTime: '16:55',
    notes: 'Heading home for the winter semester break!',
    createdAt: '2026-11-01T10:00:00.000Z',
    updatedAt: '2026-11-01T10:00:00.000Z',
  },
  {
    id: 'trip_002',
    userId: 'usr_rohan_002',
    user: {
      id: 'usr_rohan_002',
      name: 'Rohan Verma',
      email: 'rohan.v@campus.edu',
      avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80',
    },
    trainNumber: '12951',
    trainName: 'Mumbai Rajdhani Express',
    originStation: 'NDLS',
    destinationStation: 'BCT',
    departureDate: '2026-11-20',
    departureTime: '16:55',
    notes: 'Have 2 bags, looking for someone in Coach B4 or nearby.',
    createdAt: '2026-11-01T11:30:00.000Z',
    updatedAt: '2026-11-01T11:30:00.000Z',
  },
  {
    id: 'trip_003',
    userId: 'usr_priya_003',
    user: {
      id: 'usr_priya_003',
      name: 'Priya Sharma',
      email: 'priya.s@campus.edu',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
    },
    trainNumber: '12951',
    trainName: 'Mumbai Rajdhani Express',
    originStation: 'NDLS',
    destinationStation: 'BCT',
    departureDate: '2026-11-20',
    departureTime: '16:55',
    notes: 'Traveling with my violin case!',
    createdAt: '2026-11-01T12:00:00.000Z',
    updatedAt: '2026-11-01T12:00:00.000Z',
  },
  {
    id: 'trip_004',
    userId: 'usr_ananya_004',
    user: {
      id: 'usr_ananya_004',
      name: 'Ananya Patel',
      email: 'ananya.p@campus.edu',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
    },
    trainNumber: '12002',
    trainName: 'Bhopal Shatabdi',
    originStation: 'NDLS',
    destinationStation: 'BPL',
    departureDate: '2026-11-22',
    departureTime: '06:00',
    notes: 'Quick weekend trip.',
    createdAt: '2026-11-01T14:00:00.000Z',
    updatedAt: '2026-11-01T14:00:00.000Z',
  },
];

export const INITIAL_RIDES: Ride[] = [
  {
    id: 'ride_001',
    creatorId: 'usr_sarah_005',
    creator: {
      id: 'usr_sarah_005',
      name: 'Sarah Connor',
      email: 'sarah.c@campus.edu',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
    },
    origin: 'Main Gate',
    destination: 'Airport Terminal 3',
    departureTime: new Date(Date.now() + 86400000).toISOString(),
    totalSeats: 4,
    availableSeats: 2,
    estimatedFare: 80.0,
    status: 'OPEN',
    notes: 'Early morning flight! 1 medium suitcase max.',
    passengers: [
      {
        id: 'rp_1',
        rideId: 'ride_001',
        userId: 'usr_sarah_005',
        user: { id: 'usr_sarah_005', name: 'Sarah Connor' },
        joinedAt: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 'rp_2',
        rideId: 'ride_001',
        userId: 'usr_david_006',
        user: { id: 'usr_david_006', name: 'David Miller' },
        joinedAt: new Date(Date.now() - 1800000).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: 'ride_002',
    creatorId: 'usr_emma_007',
    creator: {
      id: 'usr_emma_007',
      name: 'Emma Watson',
      email: 'emma.w@campus.edu',
      avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80',
    },
    origin: 'Hostels',
    destination: 'Downtown Railway Junction',
    departureTime: new Date(Date.now() + 172800000).toISOString(),
    totalSeats: 3,
    availableSeats: 0,
    estimatedFare: 45.0,
    status: 'FULL',
    notes: 'Uber XL booked. Ready to split.',
    passengers: [
      {
        id: 'rp_3',
        rideId: 'ride_002',
        userId: 'usr_emma_007',
        user: { id: 'usr_emma_007', name: 'Emma Watson' },
        joinedAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 'rp_4',
        rideId: 'ride_002',
        userId: 'usr_alex_001',
        user: { id: 'usr_alex_001', name: 'Alex Chen' },
        joinedAt: new Date(Date.now() - 43200000).toISOString(),
      },
      {
        id: 'rp_5',
        rideId: 'ride_002',
        userId: 'usr_rohan_002',
        user: { id: 'usr_rohan_002', name: 'Rohan Verma' },
        joinedAt: new Date(Date.now() - 21600000).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 21600000).toISOString(),
  },
  {
    id: 'ride_003',
    creatorId: 'usr_alex_001',
    creator: {
      id: 'usr_alex_001',
      name: 'Alex Chen',
      email: 'student@campus.edu',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    },
    origin: 'Library',
    destination: 'City Mall',
    departureTime: new Date(Date.now() + 259200000).toISOString(),
    totalSeats: 4,
    availableSeats: 3,
    estimatedFare: 40.0,
    status: 'OPEN',
    notes: 'Grocery shopping and study break at Starbucks.',
    passengers: [
      {
        id: 'rp_6',
        rideId: 'ride_003',
        userId: 'usr_alex_001',
        user: { id: 'usr_alex_001', name: 'Alex Chen' },
        joinedAt: new Date(Date.now() - 10000000).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 10000000).toISOString(),
    updatedAt: new Date(Date.now() - 10000000).toISOString(),
  },
];

export const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv_001',
    participantIds: ['usr_alex_001', 'usr_rohan_002'],
    participants: [
      {
        id: 'usr_rohan_002',
        name: 'Rohan Verma',
        avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80',
      },
    ],
    lastMessage: {
      id: 'msg_002',
      conversationId: 'conv_001',
      senderId: 'usr_rohan_002',
      content: 'Hey Alex! Excited to share the train back home on the 20th.',
      createdAt: new Date(Date.now() - 1800000).toISOString(),
    },
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: 'conv_002',
    participantIds: ['usr_alex_001', 'usr_sarah_005', 'usr_david_006'],
    participants: [
      {
        id: 'usr_sarah_005',
        name: 'Sarah Connor',
        avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
      },
      {
        id: 'usr_david_006',
        name: 'David Miller',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
      },
    ],
    lastMessage: {
      id: 'msg_004',
      conversationId: 'conv_002',
      senderId: 'usr_sarah_005',
      content: 'Ride to Airport: Meet at Main Gate exactly at 6:15 AM!',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    createdAt: new Date(Date.now() - 14400000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

export const INITIAL_MESSAGES: Message[] = [
  {
    id: 'msg_001',
    conversationId: 'conv_001',
    senderId: 'usr_alex_001',
    sender: {
      id: 'usr_alex_001',
      name: 'Alex Chen',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    },
    content: 'Hi Rohan! Saw you are on Rajdhani #12951 too.',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'msg_002',
    conversationId: 'conv_001',
    senderId: 'usr_rohan_002',
    sender: {
      id: 'usr_rohan_002',
      name: 'Rohan Verma',
      avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80',
    },
    content: 'Hey Alex! Excited to share the train back home on the 20th.',
    createdAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: 'msg_003',
    conversationId: 'conv_002',
    senderId: 'usr_david_006',
    sender: {
      id: 'usr_david_006',
      name: 'David Miller',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    },
    content: 'Is there enough trunk space for 2 bags?',
    createdAt: new Date(Date.now() - 5400000).toISOString(),
  },
  {
    id: 'msg_004',
    conversationId: 'conv_002',
    senderId: 'usr_sarah_005',
    sender: {
      id: 'usr_sarah_005',
      name: 'Sarah Connor',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
    },
    content: 'Ride to Airport: Meet at Main Gate exactly at 6:15 AM!',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

export const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif_001',
    userId: 'usr_alex_001',
    title: 'New Train Buddy Radar Alert!',
    message: 'Rohan Verma & Priya Sharma are also traveling on Train #12951 (NDLS → BCT) on 2026-11-20.',
    type: 'MATCH',
    link: '/trips',
    isRead: false,
    createdAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: 'notif_002',
    userId: 'usr_alex_001',
    title: 'New Passenger Joined!',
    message: 'Emma Watson joined your ride to City Mall.',
    type: 'RIDE',
    link: '/rides',
    isRead: false,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 'notif_003',
    userId: 'usr_alex_001',
    title: 'New message from Rohan Verma',
    message: 'Hey Alex! Excited to share the train back home on the 20th.',
    type: 'CHAT',
    link: '/chat',
    isRead: true,
    createdAt: new Date(Date.now() - 14400000).toISOString(),
  },
  {
    id: 'notif_004',
    userId: 'usr_alex_001',
    title: 'Item Match Found',
    message: 'A found item matching "AirPods Pro" was registered at the Security Office.',
    type: 'MATCH',
    link: '/lost-found',
    isRead: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

const STORAGE_KEY = 'campusloop_mock_store_v2';

export function getMockStore(): MockStore {
  if (typeof window === 'undefined') {
    return {
      user: DEFAULT_USER,
      token: 'mock_jwt_token_alex_chen_2026',
      lostItems: INITIAL_LOST_ITEMS,
      foundItems: INITIAL_FOUND_ITEMS,
      listings: INITIAL_LISTINGS,
      wishlistIds: ['list_301', 'list_304'],
      trainTrips: INITIAL_TRAIN_TRIPS,
      rides: INITIAL_RIDES,
      conversations: INITIAL_CONVERSATIONS,
      messages: INITIAL_MESSAGES,
      notifications: INITIAL_NOTIFICATIONS,
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Ensure phase 2 collections are present if reading older cache
      if (!parsed.trainTrips) parsed.trainTrips = INITIAL_TRAIN_TRIPS;
      if (!parsed.rides) parsed.rides = INITIAL_RIDES;
      if (!parsed.conversations) parsed.conversations = INITIAL_CONVERSATIONS;
      if (!parsed.messages) parsed.messages = INITIAL_MESSAGES;
      if (!parsed.notifications) parsed.notifications = INITIAL_NOTIFICATIONS;
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
    trainTrips: INITIAL_TRAIN_TRIPS,
    rides: INITIAL_RIDES,
    conversations: INITIAL_CONVERSATIONS,
    messages: INITIAL_MESSAGES,
    notifications: INITIAL_NOTIFICATIONS,
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
