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
    if (filters?.status) params.set('status', filters.status);
    if (filters?.category) params.set('category', filters.category);
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
    return apiFetch<LostItem>('/lost', {
      method: 'POST',
      body: JSON.stringify(data),
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
    if (filters?.status) params.set('status', filters.status);
    if (filters?.category) params.set('category', filters.category);
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
    return apiFetch<ExtendedFoundItem>('/found', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async claim(
    id: string,
    data: { note: string; proofImageUrl?: string; answer?: string }
  ): Promise<ExtendedFoundItem> {
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
    return apiFetch<ExtendedFoundItem>(`/found/${id}/claim`, {
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
    if (filters?.category) params.set('category', filters.category);
    if (filters?.minPrice) params.set('minPrice', filters.minPrice.toString());
    if (filters?.maxPrice) params.set('maxPrice', filters.maxPrice.toString());
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

    const isCurrentlyWishlisted = false;
    if (isCurrentlyWishlisted) {
      return apiFetch<{ listingId: string; isWishlisted: boolean }>(`/listings/${id}/wishlist`, {
        method: 'DELETE',
      });
    } else {
      return apiFetch<{ listingId: string; isWishlisted: boolean }>(`/listings/${id}/wishlist`, {
        method: 'POST',
      });
    }
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

// Unified export
export const api = {
  auth: authApi,
  lost: lostApi,
  found: foundApi,
  marketplace: marketplaceApi,
  uploads: uploadsApi,
  feed: feedApi,
};

export default api;
