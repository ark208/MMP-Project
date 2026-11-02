import type {
  ApiResponse,
  ApiErrorResponse,
  User,
  AuthTokens,
  LostItem,
  FoundItem,
  Listing,
  ItemStatus,
  FoundStatus,
  ListingCondition,
  ListingFilterQuery,
  TrainTrip,
  TrainBuddyMatch,
  Ride,
  RideStatus,
  FareSplitInfo,
  Conversation,
  Message,
  Notification,
} from '@docs/types';
import {
  getMockStore,
  saveMockStore,
  DEFAULT_USER,
  ExtendedFoundItem,
} from './mock-data';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
export const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === 'true';

// Small async delay for realistic mock latency
const delay = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Standard fetch wrapper respecting the CampusLoop API contract envelope
 */
export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const json = await response.json();

  if (!response.ok) {
    const errorResponse = json as ApiErrorResponse;
    throw new Error(errorResponse.error?.message || `Request failed with status ${response.status}`);
  }

  return (json as ApiResponse<T>).data;
}

// -------------------------------------------------------------------------
// Auth API
// -------------------------------------------------------------------------
export const authApi = {
  async requestOtp(email: string): Promise<{ message: string; email: string }> {
    if (USE_MOCKS) {
      await delay();
      if (!email.toLowerCase().includes('.edu') && !email.toLowerCase().includes('campus')) {
        throw new Error('Please enter a valid university email address (.edu).');
      }
      return { message: 'OTP sent successfully to your university email.', email };
    }
    return apiFetch<{ message: string; email: string }>('/auth/request-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async verifyOtp(email: string, otp: string): Promise<AuthTokens> {
    if (USE_MOCKS) {
      await delay(200);
      if (otp.trim().length !== 6) {
        throw new Error('Invalid OTP. Please enter a 6-digit code.');
      }
      const store = getMockStore();
      const user: User = {
        ...store.user,
        email,
        name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      };
      const token = `mock_jwt_token_${Date.now()}`;
      store.user = user;
      store.token = token;
      saveMockStore(store);

      if (typeof window !== 'undefined') {
        localStorage.setItem('token', token);
        localStorage.setItem('campusloop_user', JSON.stringify(user));
      }

      return { token, user };
    }
    const result = await apiFetch<AuthTokens>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', result.token);
      localStorage.setItem('campusloop_user', JSON.stringify(result.user));
    }
    return result;
  },

  async getMe(): Promise<User> {
    if (USE_MOCKS) {
      await delay();
      const store = getMockStore();
      return store.user;
    }
    return apiFetch<User>('/me');
  },

  async updateProfile(updates: Partial<User>): Promise<User> {
    if (USE_MOCKS) {
      await delay();
      const store = getMockStore();
      store.user = {
        ...store.user,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      saveMockStore(store);
      if (typeof window !== 'undefined') {
        localStorage.setItem('campusloop_user', JSON.stringify(store.user));
      }
      return store.user;
    }
    return apiFetch<User>('/me', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('campusloop_user');
    }
  },

  getStoredToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  },

  getStoredUser(): User | null {
    if (typeof window === 'undefined') return null;
    try {
      const data = localStorage.getItem('campusloop_user');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },
};

// -------------------------------------------------------------------------
// Lost & Found API
// -------------------------------------------------------------------------
export const lostApi = {
  async list(filters?: { status?: string; category?: string; q?: string }): Promise<LostItem[]> {
    if (USE_MOCKS) {
      await delay();
      const store = getMockStore();
      let items = [...store.lostItems];

      if (filters?.status && filters.status !== 'ALL') {
        items = items.filter((item) => item.status === filters.status);
      }
      if (filters?.category && filters.category !== 'ALL') {
        items = items.filter(
          (item) => item.category.toLowerCase() === filters.category?.toLowerCase()
        );
      }
      if (filters?.q) {
        const query = filters.q.toLowerCase();
        items = items.filter(
          (item) =>
            item.title.toLowerCase().includes(query) ||
            item.description.toLowerCase().includes(query) ||
            item.location.toLowerCase().includes(query)
        );
      }
      return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    const params = new URLSearchParams();
    if (filters?.status && filters.status.toUpperCase() !== 'ALL') params.set('status', filters.status.toLowerCase());
    if (filters?.category && filters.category.toUpperCase() !== 'ALL') params.set('category', filters.category);
    if (filters?.q) params.set('q', filters.q);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiFetch<LostItem[]>(`/lost${query}`);
  },

  async get(id: string): Promise<LostItem> {
    if (USE_MOCKS) {
      await delay();
      const store = getMockStore();
      const item = store.lostItems.find((i) => i.id === id);
      if (!item) throw new Error('Lost item not found');
      return item;
    }
    return apiFetch<LostItem>(`/lost/${id}`);
  },

  async create(data: {
    title: string;
    description: string;
    category: string;
    location: string;
    dateLost: string;
    imageUrl?: string;
  }): Promise<LostItem> {
    if (USE_MOCKS) {
      await delay(200);
      const store = getMockStore();
      const newItem: LostItem = {
        id: `lost_${Date.now()}`,
        userId: store.user.id,
        user: {
          id: store.user.id,
          name: store.user.name,
          email: store.user.email,
          avatarUrl: store.user.avatarUrl,
        },
        title: data.title,
        description: data.description,
        category: data.category,
        location: data.location,
        dateLost: data.dateLost,
        imageUrl: data.imageUrl || null,
        status: 'OPEN',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      store.lostItems.unshift(newItem);
      saveMockStore(store);
      return newItem;
    }
    const payload = {
      ...data,
      imageUrl: data.imageUrl && data.imageUrl.trim() !== '' ? data.imageUrl : null,
    };
    return apiFetch<LostItem>('/lost', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateStatus(id: string, status: ItemStatus): Promise<LostItem> {
    if (USE_MOCKS) {
      await delay();
      const store = getMockStore();
      const index = store.lostItems.findIndex((i) => i.id === id);
      if (index === -1) throw new Error('Lost item not found');
      store.lostItems[index] = {
        ...store.lostItems[index],
        status,
        updatedAt: new Date().toISOString(),
      };
      saveMockStore(store);
      return store.lostItems[index];
    }
    return apiFetch<LostItem>(`/lost/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
};

export const foundApi = {
  async list(filters?: { status?: string; category?: string; q?: string }): Promise<ExtendedFoundItem[]> {
    if (USE_MOCKS) {
      await delay();
      const store = getMockStore();
      let items = [...store.foundItems];

      if (filters?.status && filters.status !== 'ALL') {
        items = items.filter((item) => item.status === filters.status);
      }
      if (filters?.category && filters.category !== 'ALL') {
        items = items.filter(
          (item) => item.category.toLowerCase() === filters.category?.toLowerCase()
        );
      }
      if (filters?.q) {
        const query = filters.q.toLowerCase();
        items = items.filter(
          (item) =>
            item.title.toLowerCase().includes(query) ||
            item.description.toLowerCase().includes(query) ||
            item.location.toLowerCase().includes(query)
        );
      }
      return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    const params = new URLSearchParams();
    if (filters?.status && filters.status.toUpperCase() !== 'ALL') params.set('status', filters.status.toLowerCase());
    if (filters?.category && filters.category.toUpperCase() !== 'ALL') params.set('category', filters.category);
    if (filters?.q) params.set('q', filters.q);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiFetch<ExtendedFoundItem[]>(`/found${query}`);
  },

  async get(id: string): Promise<ExtendedFoundItem> {
    if (USE_MOCKS) {
      await delay();
      const store = getMockStore();
      const item = store.foundItems.find((i) => i.id === id);
      if (!item) throw new Error('Found item not found');
      return item;
    }
    return apiFetch<ExtendedFoundItem>(`/found/${id}`);
  },

  async create(data: {
    title: string;
    description: string;
    category: string;
    location: string;
    dateFound: string;
    imageUrl?: string;
    holdingLocation?: any;
    secretQuestion?: string;
    secretAnswer?: string;
    keptAt?: string;
  }): Promise<ExtendedFoundItem> {
    if (USE_MOCKS) {
      await delay(200);
      const store = getMockStore();
      const newItem: ExtendedFoundItem = {
        id: `found_${Date.now()}`,
        userId: store.user.id,
        user: {
          id: store.user.id,
          name: store.user.name,
          email: store.user.email,
          avatarUrl: store.user.avatarUrl,
        },
        title: data.title,
        description: data.description,
        category: data.category,
        location: data.location,
        dateFound: data.dateFound,
        imageUrl: data.imageUrl || null,
        holdingLocation: data.holdingLocation || 'with finder',
        status: 'OPEN',
        secretQuestion: data.secretQuestion || 'What distinguishes this item?',
        keptAt: data.keptAt,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      store.foundItems.unshift(newItem);
      saveMockStore(store);
      return newItem;
    }
    const payload = {
      ...data,
      imageUrl: data.imageUrl && data.imageUrl.trim() !== '' ? data.imageUrl : null,
      holdingLocation: data.holdingLocation || 'with finder',
    };
    return apiFetch<ExtendedFoundItem>('/found', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async claim(
    id: string,
    data: { note: string; proofImageUrl?: string; answer?: string }
  ): Promise<any> {
    if (USE_MOCKS) {
      await delay(250);
      const store = getMockStore();
      const index = store.foundItems.findIndex((i) => i.id === id);
      if (index === -1) throw new Error('Found item not found');

      store.foundItems[index] = {
        ...store.foundItems[index],
        status: 'CLAIMED',
        claimedByUserId: store.user.id,
        claimedByUser: {
          id: store.user.id,
          name: store.user.name,
          email: store.user.email,
          avatarUrl: store.user.avatarUrl,
        },
        claimNote: data.note,
        claimAnswer: data.answer,
        updatedAt: new Date().toISOString(),
      };
      saveMockStore(store);
      return store.foundItems[index];
    }
    return apiFetch<any>(`/found/${id}/claim`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateStatus(id: string, status: FoundStatus): Promise<ExtendedFoundItem> {
    if (USE_MOCKS) {
      await delay();
      const store = getMockStore();
      const index = store.foundItems.findIndex((i) => i.id === id);
      if (index === -1) throw new Error('Found item not found');
      store.foundItems[index] = {
        ...store.foundItems[index],
        status,
        updatedAt: new Date().toISOString(),
      };
      saveMockStore(store);
      return store.foundItems[index];
    }
    return apiFetch<ExtendedFoundItem>(`/found/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
};

// -------------------------------------------------------------------------
// Marketplace API
// -------------------------------------------------------------------------
export const marketplaceApi = {
  async list(filters?: ListingFilterQuery & { condition?: string }): Promise<Listing[]> {
    if (USE_MOCKS) {
      await delay();
      const store = getMockStore();
      let items = store.listings.map((item) => ({
        ...item,
        isWishlisted: store.wishlistIds.includes(item.id),
      }));

      if (filters?.category && filters.category !== 'ALL') {
        items = items.filter(
          (item) => item.category.toLowerCase() === filters.category?.toLowerCase()
        );
      }
      if (filters?.condition && filters.condition !== 'ALL') {
        items = items.filter((item) => item.condition === filters.condition);
      }
      if (filters?.minPrice !== undefined) {
        items = items.filter((item) => item.price >= (filters.minPrice || 0));
      }
      if (filters?.maxPrice !== undefined) {
        items = items.filter((item) => item.price <= (filters.maxPrice || Infinity));
      }
      if (filters?.q) {
        const query = filters.q.toLowerCase();
        items = items.filter(
          (item) =>
            item.title.toLowerCase().includes(query) ||
            item.description.toLowerCase().includes(query)
        );
      }
      return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    const params = new URLSearchParams();
    if (filters?.category && filters.category.toUpperCase() !== 'ALL') params.set('category', filters.category);
    if (filters?.condition && filters.condition.toUpperCase() !== 'ALL') params.set('condition', filters.condition);
    if (filters?.minPrice !== undefined && !isNaN(filters.minPrice)) params.set('minPrice', filters.minPrice.toString());
    if (filters?.maxPrice !== undefined && !isNaN(filters.maxPrice)) params.set('maxPrice', filters.maxPrice.toString());
    if (filters?.q) params.set('q', filters.q);
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await apiFetch<any>(`/listings${query}`);
    return Array.isArray(res) ? res : res.items || [];
  },

  async get(id: string): Promise<Listing> {
    if (USE_MOCKS) {
      await delay();
      const store = getMockStore();
      const item = store.listings.find((i) => i.id === id);
      if (!item) throw new Error('Listing not found');
      return {
        ...item,
        isWishlisted: store.wishlistIds.includes(item.id),
      };
    }
    return apiFetch<Listing>(`/listings/${id}`);
  },

  async create(data: {
    title: string;
    description: string;
    price: number;
    category: string;
    condition: ListingCondition;
    imageUrls: string[];
  }): Promise<Listing> {
    if (USE_MOCKS) {
      await delay(200);
      const store = getMockStore();
      const newListing: Listing = {
        id: `list_${Date.now()}`,
        sellerId: store.user.id,
        seller: {
          id: store.user.id,
          name: store.user.name,
          email: store.user.email,
          avatarUrl: store.user.avatarUrl,
        },
        title: data.title,
        description: data.description,
        price: data.price,
        category: data.category,
        condition: data.condition,
        imageUrls: data.imageUrls.length > 0 ? data.imageUrls : [
          'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
        ],
        status: 'AVAILABLE',
        isWishlisted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      store.listings.unshift(newListing);
      saveMockStore(store);
      return newListing;
    }
    return apiFetch<Listing>('/listings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: string, updates: Partial<Listing>): Promise<Listing> {
    if (USE_MOCKS) {
      await delay();
      const store = getMockStore();
      const index = store.listings.findIndex((i) => i.id === id);
      if (index === -1) throw new Error('Listing not found');
      store.listings[index] = {
        ...store.listings[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      saveMockStore(store);
      return store.listings[index];
    }
    return apiFetch<Listing>(`/listings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  async delete(id: string): Promise<{ id: string; deleted: boolean }> {
    if (USE_MOCKS) {
      await delay();
      const store = getMockStore();
      store.listings = store.listings.filter((i) => i.id !== id);
      store.wishlistIds = store.wishlistIds.filter((wId) => wId !== id);
      saveMockStore(store);
      return { id, deleted: true };
    }
    return apiFetch<{ id: string; deleted: boolean }>(`/listings/${id}`, {
      method: 'DELETE',
    });
  },

  async toggleWishlist(id: string): Promise<{ listingId: string; isWishlisted: boolean }> {
    if (USE_MOCKS) {
      await delay(100);
      const store = getMockStore();
      const exists = store.wishlistIds.includes(id);
      if (exists) {
        store.wishlistIds = store.wishlistIds.filter((wId) => wId !== id);
      } else {
        store.wishlistIds.push(id);
      }
      saveMockStore(store);
      return { listingId: id, isWishlisted: !exists };
    }

    return apiFetch<{ listingId: string; isWishlisted: boolean }>(`/listings/${id}/wishlist`, {
      method: 'POST',
    });
  },

  async getWishlist(): Promise<Listing[]> {
    if (USE_MOCKS) {
      await delay();
      const store = getMockStore();
      return store.listings
        .filter((item) => store.wishlistIds.includes(item.id))
        .map((item) => ({ ...item, isWishlisted: true }));
    }
    return apiFetch<Listing[]>('/wishlist');
  },
};

// -------------------------------------------------------------------------
// Uploads API
// -------------------------------------------------------------------------
export const uploadsApi = {
  async uploadFile(file: File): Promise<{ url: string }> {
    if (USE_MOCKS) {
      await delay(300);
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve({ url: reader.result as string });
        };
        reader.readAsDataURL(file);
      });
    }

    const formData = new FormData();
    formData.append('file', file);
    return apiFetch<{ url: string }>('/uploads', {
      method: 'POST',
      body: formData,
    });
  },
};

// -------------------------------------------------------------------------
// Feed API
// -------------------------------------------------------------------------
export const feedApi = {
  async getSummary(): Promise<{
    lost: LostItem[];
    found: ExtendedFoundItem[];
    marketplace: Listing[];
  }> {
    const [lost, found, marketplace] = await Promise.all([
      lostApi.list({ status: 'OPEN' }),
      foundApi.list({ status: 'OPEN' }),
      marketplaceApi.list(),
    ]);

    return {
      lost: lost.slice(0, 4),
      found: found.slice(0, 4),
      marketplace: marketplace.slice(0, 4),
    };
  },
};

// -------------------------------------------------------------------------
// Train Buddy Radar API
// -------------------------------------------------------------------------
export const tripsApi = {
  async create(data: {
    trainNumber: string;
    trainName?: string;
    fromStation: string;
    toStation: string;
    date: string;
    departureTime?: string;
  }): Promise<TrainTrip> {
    if (USE_MOCKS) {
      await delay(200);
      const store = getMockStore();
      const newTrip: TrainTrip = {
        id: `trip_${Date.now()}`,
        userId: store.user.id,
        user: {
          id: store.user.id,
          name: store.user.name,
          email: store.user.email,
          avatarUrl: store.user.avatarUrl,
          department: store.user.department || 'Engineering',
          year: store.user.year || '3rd Year',
        },
        trainNumber: data.trainNumber.trim(),
        trainName: data.trainName || 'Express Journey',
        fromStation: data.fromStation.trim().toUpperCase(),
        toStation: data.toStation.trim().toUpperCase(),
        date: data.date,
        departureTime: data.departureTime || '12:00',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      store.trainTrips.unshift(newTrip);

      // Generate 2 realistic student peers for mock match demo
      store.buddiesMap[newTrip.id] = [
        {
          trip: {
            id: `tb_${Date.now()}_1`,
            userId: 'usr_mock_buddy_1',
            user: {
              id: 'usr_mock_buddy_1',
              name: 'Kabir Mehta',
              avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
              department: 'Computer Science',
              year: '3rd Year',
            },
            trainNumber: newTrip.trainNumber,
            trainName: newTrip.trainName,
            fromStation: newTrip.fromStation,
            toStation: newTrip.toStation,
            date: newTrip.date,
            departureTime: newTrip.departureTime,
          },
          isSameCoach: false,
          distanceHours: 0,
        },
        {
          trip: {
            id: `tb_${Date.now()}_2`,
            userId: 'usr_mock_buddy_2',
            user: {
              id: 'usr_mock_buddy_2',
              name: 'Sneha Rao',
              avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
              department: 'Data Science',
              year: '2nd Year',
            },
            trainNumber: newTrip.trainNumber,
            trainName: newTrip.trainName,
            fromStation: newTrip.fromStation,
            toStation: newTrip.toStation,
            date: newTrip.date,
            departureTime: newTrip.departureTime,
          },
          isSameCoach: false,
          distanceHours: 0,
        },
      ];

      // Add a simulated radar notification
      store.notifications.unshift({
        id: `notif_${Date.now()}`,
        userId: store.user.id,
        title: 'New Train Buddy Radar Alert!',
        message: `2 students are also on Train #${newTrip.trainNumber} (${newTrip.fromStation} → ${newTrip.toStation})!`,
        type: 'MATCH',
        link: '/train-buddy',
        isRead: false,
        createdAt: new Date().toISOString(),
      });

      saveMockStore(store);
      return newTrip;
    }

    return apiFetch<TrainTrip>('/trips', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async listMine(): Promise<TrainTrip[]> {
    if (USE_MOCKS) {
      await delay();
      const store = getMockStore();
      return store.trainTrips;
    }
    return apiFetch<TrainTrip[]>('/trips/mine');
  },

  async getBuddies(tripId: string): Promise<TrainBuddyMatch[]> {
    if (USE_MOCKS) {
      await delay(200);
      const store = getMockStore();
      return store.buddiesMap[tripId] || [];
    }
    return apiFetch<TrainBuddyMatch[]>(`/trips/${tripId}/buddies`);
  },

  async delete(tripId: string): Promise<{ id: string; deleted: boolean }> {
    if (USE_MOCKS) {
      await delay();
      const store = getMockStore();
      store.trainTrips = store.trainTrips.filter((t) => t.id !== tripId);
      delete store.buddiesMap[tripId];
      saveMockStore(store);
      return { id: tripId, deleted: true };
    }
    return apiFetch<{ id: string; deleted: boolean }>(`/trips/${tripId}`, {
      method: 'DELETE',
    });
  },
};

// -------------------------------------------------------------------------
// Ride Splitting API
// -------------------------------------------------------------------------
export const ridesApi = {
  async list(filters?: { origin?: string; destination?: string; status?: string }): Promise<Ride[]> {
    if (USE_MOCKS) {
      await delay();
      const store = getMockStore();
      let list = [...store.rides];

      if (filters?.status && filters.status !== 'ALL') {
        list = list.filter((r) => r.status === filters.status);
      }
      if (filters?.origin) {
        list = list.filter((r) => r.origin.toLowerCase().includes(filters.origin!.toLowerCase()));
      }
      if (filters?.destination) {
        list = list.filter((r) => r.destination.toLowerCase().includes(filters.destination!.toLowerCase()));
      }

      return list.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
    }

    const params = new URLSearchParams();
    if (filters?.status && filters.status !== 'ALL') params.set('status', filters.status);
    if (filters?.origin) params.set('origin', filters.origin);
    if (filters?.destination) params.set('destination', filters.destination);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiFetch<Ride[]>(`/rides${query}`);
  },

  async get(id: string): Promise<Ride> {
    if (USE_MOCKS) {
      await delay();
      const store = getMockStore();
      const ride = store.rides.find((r) => r.id === id);
      if (!ride) throw new Error('Ride not found');
      return ride;
    }
    return apiFetch<Ride>(`/rides/${id}`);
  },

  async create(data: {
    origin: string;
    destination: string;
    departureTime: string;
    totalSeats: number;
    estimatedFare: number;
    notes?: string;
  }): Promise<Ride> {
    if (USE_MOCKS) {
      await delay(200);
      const store = getMockStore();
      const seats = Number(data.totalSeats);
      const available = Math.max(0, seats - 1); // Creator occupies 1

      const newRide: Ride = {
        id: `ride_${Date.now()}`,
        creatorId: store.user.id,
        creator: {
          id: store.user.id,
          name: store.user.name,
          email: store.user.email,
          avatarUrl: store.user.avatarUrl,
          department: store.user.department || 'Engineering',
          year: store.user.year || '3rd Year',
        },
        origin: data.origin.trim(),
        destination: data.destination.trim(),
        departureTime: data.departureTime,
        totalSeats: seats,
        availableSeats: available,
        estimatedFare: Number(data.estimatedFare) || 0,
        status: available === 0 ? 'FULL' : 'OPEN',
        notes: data.notes ? data.notes.trim() : null,
        passengers: [
          {
            id: `rm_${Date.now()}`,
            rideId: `ride_${Date.now()}`,
            userId: store.user.id,
            user: {
              id: store.user.id,
              name: store.user.name,
              avatarUrl: store.user.avatarUrl,
            },
            joinedAt: new Date().toISOString(),
          },
        ],
        members: [
          {
            id: `rm_${Date.now()}`,
            rideId: `ride_${Date.now()}`,
            userId: store.user.id,
            user: {
              id: store.user.id,
              name: store.user.name,
              avatarUrl: store.user.avatarUrl,
            },
            joinedAt: new Date().toISOString(),
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      store.rides.unshift(newRide);

      // Create linked ride group chat
      const convId = `conv_ride_${newRide.id}`;
      store.conversations.unshift({
        id: convId,
        isGroup: true,
        title: `Ride: ${newRide.origin} → ${newRide.destination}`,
        rideId: newRide.id,
        participantIds: [store.user.id],
        participants: [
          {
            id: store.user.id,
            name: store.user.name,
            avatarUrl: store.user.avatarUrl,
            department: store.user.department,
            year: store.user.year,
          },
        ],
        lastMessage: {
          id: `msg_init_${Date.now()}`,
          conversationId: convId,
          senderId: store.user.id,
          content: `Ride group created. Leaving ${new Date(newRide.departureTime).toLocaleString()}.`,
          createdAt: new Date().toISOString(),
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      store.messages[convId] = [
        {
          id: `msg_init_${Date.now()}`,
          conversationId: convId,
          senderId: store.user.id,
          content: `Ride group created. Leaving ${new Date(newRide.departureTime).toLocaleString()}.`,
          createdAt: new Date().toISOString(),
        },
      ];

      saveMockStore(store);
      return newRide;
    }

    return apiFetch<Ride>('/rides', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async join(id: string): Promise<{ id: string; availableSeats: number; status: string; joined: boolean }> {
    if (USE_MOCKS) {
      await delay(200);
      const store = getMockStore();
      const index = store.rides.findIndex((r) => r.id === id);
      if (index === -1) throw new Error('Ride not found');

      const ride = store.rides[index];
      if (ride.availableSeats <= 0 || ride.status !== 'OPEN') {
        throw new Error('This ride is no longer open for joining.');
      }

      const isAlready = (ride.members || ride.passengers || []).some((m) => m.userId === store.user.id);
      if (isAlready) {
        throw new Error('You are already a passenger on this ride.');
      }

      const nextSeats = ride.availableSeats - 1;
      const nextStatus = nextSeats === 0 ? 'FULL' : 'OPEN';

      const member = {
        id: `rm_${Date.now()}`,
        rideId: ride.id,
        userId: store.user.id,
        user: {
          id: store.user.id,
          name: store.user.name,
          avatarUrl: store.user.avatarUrl,
        },
        joinedAt: new Date().toISOString(),
      };

      ride.availableSeats = nextSeats;
      ride.status = nextStatus;
      ride.passengers = [...(ride.passengers || []), member];
      ride.members = [...(ride.members || []), member];
      ride.updatedAt = new Date().toISOString();

      // Add to linked conversation
      const conv = store.conversations.find((c) => c.rideId === ride.id);
      if (conv && !conv.participantIds.includes(store.user.id)) {
        conv.participantIds.push(store.user.id);
        conv.participants = [
          ...(conv.participants || []),
          {
            id: store.user.id,
            name: store.user.name,
            avatarUrl: store.user.avatarUrl,
          },
        ];
      }

      saveMockStore(store);
      return { id: ride.id, availableSeats: nextSeats, status: nextStatus, joined: true };
    }

    return apiFetch<{ id: string; availableSeats: number; status: string; joined: boolean }>(`/rides/${id}/join`, {
      method: 'POST',
    });
  },

  async leave(id: string): Promise<{ id: string; availableSeats: number; status: string; left: boolean }> {
    if (USE_MOCKS) {
      await delay(200);
      const store = getMockStore();
      const index = store.rides.findIndex((r) => r.id === id);
      if (index === -1) throw new Error('Ride not found');

      const ride = store.rides[index];
      if (ride.creatorId === store.user.id) {
        throw new Error('Ride creator cannot leave the ride.');
      }

      ride.passengers = (ride.passengers || []).filter((p) => p.userId !== store.user.id);
      ride.members = (ride.members || []).filter((p) => p.userId !== store.user.id);
      ride.availableSeats = Math.min(ride.totalSeats, ride.availableSeats + 1);
      if (ride.status === 'FULL') {
        ride.status = 'OPEN';
      }
      ride.updatedAt = new Date().toISOString();

      saveMockStore(store);
      return { id: ride.id, availableSeats: ride.availableSeats, status: ride.status, left: true };
    }

    return apiFetch<{ id: string; availableSeats: number; status: string; left: boolean }>(`/rides/${id}/leave`, {
      method: 'POST',
    });
  },

  async updateStatus(id: string, status: RideStatus): Promise<{ id: string; status: RideStatus }> {
    if (USE_MOCKS) {
      await delay(150);
      const store = getMockStore();
      const index = store.rides.findIndex((r) => r.id === id);
      if (index === -1) throw new Error('Ride not found');
      store.rides[index].status = status;
      store.rides[index].updatedAt = new Date().toISOString();
      saveMockStore(store);
      return { id, status };
    }

    return apiFetch<{ id: string; status: RideStatus }>(`/rides/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async getFareSplit(id: string, totalFare?: number): Promise<FareSplitInfo> {
    if (USE_MOCKS) {
      await delay(100);
      const store = getMockStore();
      const ride = store.rides.find((r) => r.id === id);
      if (!ride) throw new Error('Ride not found');

      const members = ride.members || ride.passengers || [{ userId: store.user.id, user: store.user }];
      const fare = totalFare !== undefined ? totalFare : ride.estimatedFare;
      const count = Math.max(1, members.length);
      const perPerson = parseFloat((fare / count).toFixed(2));

      return {
        rideId: ride.id,
        totalFare: fare,
        passengerCount: count,
        farePerPerson: perPerson,
        participants: members.map((m: any) => ({
          userId: m.userId,
          name: m.user?.name || 'Passenger',
          amount: perPerson,
        })),
      };
    }

    const query = totalFare !== undefined ? `?totalFare=${totalFare}` : '';
    return apiFetch<FareSplitInfo>(`/rides/${id}/fare-split${query}`);
  },
};

// -------------------------------------------------------------------------
// In-App Chat API
// -------------------------------------------------------------------------
export const chatApi = {
  async listConversations(): Promise<Conversation[]> {
    if (USE_MOCKS) {
      await delay();
      const store = getMockStore();
      return store.conversations;
    }
    return apiFetch<Conversation[]>('/conversations');
  },

  async getOrCreate(recipientId: string): Promise<Conversation> {
    if (USE_MOCKS) {
      await delay(150);
      const store = getMockStore();
      // Check if direct 1-to-1 conversation exists
      const existing = store.conversations.find(
        (c) => !c.isGroup && c.participantIds.includes(recipientId) && c.participantIds.includes(store.user.id)
      );
      if (existing) return existing;

      // Create new conversation
      const convId = `conv_${Date.now()}`;
      const newConv: Conversation = {
        id: convId,
        isGroup: false,
        participantIds: [store.user.id, recipientId],
        participants: [
          {
            id: recipientId,
            name: recipientId.startsWith('usr_') ? recipientId.replace('usr_', 'Peer ') : 'Campus Peer',
            avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
          },
        ],
        lastMessage: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      store.conversations.unshift(newConv);
      store.messages[convId] = [];
      saveMockStore(store);
      return newConv;
    }

    return apiFetch<Conversation>('/conversations', {
      method: 'POST',
      body: JSON.stringify({ recipientId }),
    });
  },

  async getMessages(conversationId: string, limit = 50, before?: string): Promise<Message[]> {
    if (USE_MOCKS) {
      await delay(100);
      const store = getMockStore();
      return store.messages[conversationId] || [];
    }
    const params = new URLSearchParams({ limit: limit.toString() });
    if (before) params.set('before', before);
    return apiFetch<Message[]>(`/conversations/${conversationId}/messages?${params.toString()}`);
  },

  async sendMessage(conversationId: string, content: string): Promise<Message> {
    if (USE_MOCKS) {
      await delay(150);
      const store = getMockStore();
      const newMsg: Message = {
        id: `msg_${Date.now()}`,
        conversationId,
        senderId: store.user.id,
        sender: {
          id: store.user.id,
          name: store.user.name,
          avatarUrl: store.user.avatarUrl,
          department: store.user.department,
          year: store.user.year,
        },
        content: content.trim(),
        createdAt: new Date().toISOString(),
      };

      if (!store.messages[conversationId]) {
        store.messages[conversationId] = [];
      }
      store.messages[conversationId].push(newMsg);

      // Update conversation last message
      const conv = store.conversations.find((c) => c.id === conversationId);
      if (conv) {
        conv.lastMessage = newMsg;
        conv.updatedAt = newMsg.createdAt;
      }

      saveMockStore(store);
      return newMsg;
    }

    return apiFetch<Message>(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },
};

// -------------------------------------------------------------------------
// Notifications API
// -------------------------------------------------------------------------
export const notificationsApi = {
  async list(): Promise<Notification[]> {
    if (USE_MOCKS) {
      await delay(100);
      const store = getMockStore();
      return store.notifications;
    }
    return apiFetch<Notification[]>('/notifications');
  },

  async markAsRead(id: string): Promise<{ id: string; isRead: boolean }> {
    if (USE_MOCKS) {
      const store = getMockStore();
      const notif = store.notifications.find((n) => n.id === id);
      if (notif) notif.isRead = true;
      saveMockStore(store);
      return { id, isRead: true };
    }
    return apiFetch<{ id: string; isRead: boolean }>(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  },

  async markAllAsRead(): Promise<{ markedReadCount: number; success: boolean }> {
    if (USE_MOCKS) {
      const store = getMockStore();
      let count = 0;
      store.notifications.forEach((n) => {
        if (!n.isRead) {
          n.isRead = true;
          count++;
        }
      });
      saveMockStore(store);
      return { markedReadCount: count, success: true };
    }
    return apiFetch<{ markedReadCount: number; success: boolean }>('/notifications/read-all', {
      method: 'PATCH',
    });
  },
};

// Unified export
export const api = {
  auth: authApi,
  lost: lostApi,
  found: foundApi,
  marketplace: marketplaceApi,
  uploads: uploadsApi,
  feed: feedApi,
  trips: tripsApi,
  rides: ridesApi,
  chat: chatApi,
  notifications: notificationsApi,
};

export default api;

