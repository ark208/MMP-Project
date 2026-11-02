/**
 * Shared TypeScript definitions for CampusLoop
 * Single source of truth for both client and server applications.
 */

// -------------------------------------------------------------------------
// Envelope & Common Types
// -------------------------------------------------------------------------

export interface ApiResponse<T> {
  data: T;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiErrorResponse {
  error: ApiError;
}

export type ApiResult<T> = ApiResponse<T> | ApiErrorResponse;

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedData<T> {
  items: T[];
  meta: PaginationMeta;
}

// -------------------------------------------------------------------------
// User & Auth
// -------------------------------------------------------------------------

export type UserRole = 'USER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  avatarUrl?: string | null;
  role: UserRole;
  isBanned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  token: string;
  user: User;
}

// -------------------------------------------------------------------------
// Module 1: Lost & Found
// -------------------------------------------------------------------------

export type ItemStatus = 'open' | 'reunited' | 'closed' | 'OPEN' | 'RESOLVED' | 'CLOSED';
export type FoundStatus = 'open' | 'reunited' | 'OPEN' | 'CLAIMED' | 'RESOLVED';
export type HoldingLocation = 'with finder' | 'security office' | 'department';

export interface LostItem {
  id: string;
  userId: string;
  user?: Pick<User, 'id' | 'name' | 'email' | 'avatarUrl'>;
  title: string;
  description: string;
  category: string;
  location: string;
  dateLost: string;
  imageUrl?: string | null;
  status: ItemStatus;
  isExpired?: boolean;
  expiresAt?: string;
  matchedFoundItemId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FoundItem {
  id: string;
  userId: string;
  user?: Pick<User, 'id' | 'name' | 'email' | 'avatarUrl' | 'phone'>;
  title: string;
  description: string;
  category: string;
  location: string;
  dateFound: string;
  imageUrl?: string | null;
  holdingLocation: HoldingLocation;
  secretQuestion: string;
  secretAnswer?: string; // Hashed on server; never sent in public API responses
  status: FoundStatus;
  claimedByUserId?: string | null;
  claimedByUser?: Pick<User, 'id' | 'name' | 'email' | 'avatarUrl'> | null;
  claimNote?: string | null;
  isExpired?: boolean;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClaimRequest {
  answer: string;
  note?: string;
}

export interface ClaimVerificationResponse {
  success: boolean;
  message: string;
  finderContact: {
    name: string;
    email: string;
    phone: string;
    holdingLocation: HoldingLocation;
  };
  item: Partial<FoundItem>;
}

// -------------------------------------------------------------------------
// Module 2: Train Buddy Radar
// -------------------------------------------------------------------------

export interface TrainTrip {
  id: string;
  userId: string;
  user?: Pick<User, 'id' | 'name' | 'email' | 'avatarUrl'>;
  trainNumber: string;
  trainName: string;
  originStation: string;
  destinationStation: string;
  departureDate: string;
  departureTime: string;
  coach?: string | null;
  seat?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TrainBuddyMatch {
  trip: TrainTrip;
  isSameCoach: boolean;
  distanceHours: number;
}

// -------------------------------------------------------------------------
// Module 3: Ride Splitting
// -------------------------------------------------------------------------

export type RideStatus = 'OPEN' | 'FULL' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface RidePassenger {
  id: string;
  rideId: string;
  userId: string;
  user?: Pick<User, 'id' | 'name' | 'email' | 'avatarUrl'>;
  joinedAt: string;
}

export interface Ride {
  id: string;
  creatorId: string;
  creator?: Pick<User, 'id' | 'name' | 'email' | 'avatarUrl'>;
  origin: string;
  destination: string;
  departureTime: string;
  totalSeats: number;
  availableSeats: number;
  estimatedFare: number;
  status: RideStatus;
  notes?: string | null;
  passengers?: RidePassenger[];
  createdAt: string;
  updatedAt: string;
}

export interface FareSplitParticipant {
  userId: string;
  name: string;
  amount: number;
}

export interface FareSplitInfo {
  rideId: string;
  totalFare: number;
  passengerCount: number;
  farePerPerson: number;
  participants: FareSplitParticipant[];
}

// -------------------------------------------------------------------------
// Module 4: Campus Marketplace
// -------------------------------------------------------------------------

export type ListingCondition = 'new' | 'like new' | 'used' | 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR';
export type ListingStatus = 'available' | 'reserved' | 'sold' | 'AVAILABLE' | 'RESERVED' | 'SOLD';

export interface Listing {
  id: string;
  sellerId: string;
  seller?: Pick<User, 'id' | 'name' | 'email' | 'avatarUrl'>;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: ListingCondition;
  imageUrls: string[];
  status: ListingStatus;
  isWishlisted?: boolean;
  isExpired?: boolean;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListingFilterQuery {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  q?: string;
  page?: number;
  limit?: number;
}

// -------------------------------------------------------------------------
// In-App Chat
// -------------------------------------------------------------------------

export interface Conversation {
  id: string;
  participantIds: string[];
  participants?: Pick<User, 'id' | 'name' | 'email' | 'avatarUrl'>[];
  lastMessage?: Message | null;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  sender?: Pick<User, 'id' | 'name' | 'email' | 'avatarUrl'>;
  content: string;
  createdAt: string;
}

// -------------------------------------------------------------------------
// Notifications
// -------------------------------------------------------------------------

export type NotificationType = 'MATCH' | 'CLAIM' | 'CHAT' | 'RIDE' | 'SYSTEM';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}

// -------------------------------------------------------------------------
// Reports & Admin
// -------------------------------------------------------------------------

export type ReportTargetType = 'USER' | 'LOST' | 'FOUND' | 'LISTING' | 'RIDE';
export type ReportStatus = 'PENDING' | 'RESOLVED' | 'DISMISSED';

export interface Report {
  id: string;
  reporterId: string;
  reporter?: Pick<User, 'id' | 'name' | 'email' | 'avatarUrl'>;
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  details?: string | null;
  status: ReportStatus;
  createdAt: string;
  updatedAt: string;
}

// -------------------------------------------------------------------------
// Socket.io Real-Time Events
// -------------------------------------------------------------------------

export interface ServerToClientEvents {
  'message:new': (message: Message) => void;
  'notification:new': (notification: Notification) => void;
  'ride:updated': (ride: Ride) => void;
}

export interface ClientToServerEvents {
  'chat:join': (conversationId: string) => void;
  'chat:leave': (conversationId: string) => void;
  'ride:subscribe': (rideId: string) => void;
  'ride:unsubscribe': (rideId: string) => void;
}

