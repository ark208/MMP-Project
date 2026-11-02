'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@docs/types';
import { api, USE_MOCKS } from './api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  requestOtp: (email: string) => Promise<{ message: string; email: string }>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<User>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function initAuth() {
      try {
        const storedToken = api.auth.getStoredToken();
        const storedUser = api.auth.getStoredUser();

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(storedUser);
        } else if (USE_MOCKS) {
          // Pre-populate with mock user in mock mode for immediate friction-free testing
          const me = await api.auth.getMe();
          setUser(me);
          setToken('mock_jwt_token_alex_chen_2026');
          if (typeof window !== 'undefined') {
            localStorage.setItem('token', 'mock_jwt_token_alex_chen_2026');
            localStorage.setItem('campusloop_user', JSON.stringify(me));
          }
        }
      } catch (err) {
        console.warn('Could not initialize session:', err);
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();
  }, []);

  const requestOtp = async (email: string) => {
    return api.auth.requestOtp(email);
  };

  const verifyOtp = async (email: string, otp: string) => {
    const res = await api.auth.verifyOtp(email, otp);
    setUser(res.user);
    setToken(res.token);
  };

  const logout = () => {
    api.auth.logout();
    setUser(null);
    setToken(null);
  };

  const updateProfile = async (data: Partial<User>) => {
    const updated = await api.auth.updateProfile(data);
    setUser(updated);
    return updated;
  };

  const refreshUser = async () => {
    try {
      const current = await api.auth.getMe();
      setUser(current);
    } catch {
      // ignore
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        requestOtp,
        verifyOtp,
        logout,
        updateProfile,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
