'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Notification } from '@docs/types';
import { api, USE_MOCKS } from './api';
import { useAuth } from './auth-context';
import { useToast } from './toast-context';
import { getSocket } from './socket';

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refresh: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const toast = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    try {
      const data = await api.notifications.list();
      setNotifications(data || []);
    } catch (err) {
      console.warn('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Setup real-time socket listener + fallback polling
  useEffect(() => {
    if (!isAuthenticated) return;

    let socket: ReturnType<typeof getSocket> | null = null;

    try {
      socket = getSocket();
      if (!socket.connected) {
        socket.connect();
      }

      const handleNewNotification = (notif: Notification) => {
        setNotifications((prev) => {
          // Avoid duplicate notifications
          if (prev.some((n) => n.id === notif.id)) return prev;
          return [notif, ...prev];
        });

        // Trigger in-app toast
        toast.info(notif.message || notif.title);
      };

      socket.on('notification:new', handleNewNotification);

      return () => {
        socket?.off('notification:new', handleNewNotification);
      };
    } catch (err) {
      console.warn('[Notifications] Socket connection error:', err);
    }

    // Polling fallback (useful when running mocks or socket disconnected)
    const interval = setInterval(() => {
      fetchNotifications();
    }, 15000);

    return () => clearInterval(interval);
  }, [isAuthenticated, fetchNotifications, toast]);

  const markAsRead = async (id: string) => {
    try {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      await api.notifications.markAsRead(id);
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      // Revert if error
      fetchNotifications();
    }
  };

  const markAllAsRead = async () => {
    try {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      await api.notifications.markAllAsRead();
      toast.success('All notifications marked as read');
    } catch (err) {
      console.error('Failed to mark all as read:', err);
      fetchNotifications();
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        refresh: fetchNotifications,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
}
