'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Bell,
  CheckCheck,
  Train,
  Car,
  MessageSquare,
  Sparkles,
  ExternalLink,
  Filter,
  Check,
  Settings,
} from 'lucide-react';
import { useNotifications } from '@/lib/notifications-context';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Notification, NotificationType } from '@docs/types';

export default function NotificationsPage() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useNotifications();
  const [filterType, setFilterType] = useState<string>('ALL');

  const filteredNotifications = notifications.filter((notif) => {
    if (filterType === 'UNREAD') return !notif.isRead;
    if (filterType === 'RIDE') return notif.type === 'RIDE';
    if (filterType === 'MATCH') return notif.type === 'MATCH';
    if (filterType === 'CHAT') return notif.type === 'CHAT';
    return true;
  });

  const getIcon = (notif: Notification) => {
    switch (notif.type) {
      case 'MATCH':
        if (notif.title.toLowerCase().includes('train') || notif.link?.includes('train')) {
          return <Train className="w-5 h-5 text-amber-500" />;
        }
        return <Sparkles className="w-5 h-5 text-amber-500" />;
      case 'RIDE':
        return <Car className="w-5 h-5 text-emerald-500" />;
      case 'CHAT':
        return <MessageSquare className="w-5 h-5 text-blue-500" />;
      default:
        return <Sparkles className="w-5 h-5 text-purple-500" />;
    }
  };

  const getTypeBadge = (notif: Notification) => {
    switch (notif.type) {
      case 'MATCH':
        if (notif.title.toLowerCase().includes('train') || notif.link?.includes('train')) {
          return (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
              TRAIN RADAR
            </span>
          );
        }
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            ITEM MATCH
          </span>
        );
      case 'RIDE':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
            RIDE SHARE
          </span>
        );
      case 'CHAT':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400">
            IN-APP CHAT
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400">
            COMMUNITY
          </span>
        );
    }
  };

  return (
    <ProtectedRoute>
      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-800">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <Bell className="w-5 h-5" />
              </div>
              <h1 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-white">
                Notifications
              </h1>
              {unreadCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500 text-white shadow-xs">
                  {unreadCount} unread
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              Real-time updates on your train buddies, ride splits, and peer messages.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors shadow-xs shrink-0"
              >
                <CheckCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Mark all as read</span>
              </button>
            )}

            <Link
              href="/notifications/settings"
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors shadow-xs shrink-0"
            >
              <Settings className="w-4 h-4 text-neutral-500" />
              <span>Settings</span>
            </Link>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'ALL', label: 'All Alerts' },
            { id: 'UNREAD', label: `Unread (${unreadCount})` },
            { id: 'RIDE', label: 'Rides' },
            { id: 'MATCH', label: 'Train Radar' },
            { id: 'CHAT', label: 'Messages' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                filterType === tab.id
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 shadow-xs'
                  : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        {filteredNotifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title={filterType === 'UNREAD' ? 'No unread notifications' : 'No notifications found'}
            description={
              filterType === 'UNREAD'
                ? "You've read all your notifications! Check back later for ride and train updates."
                : 'Join a ride share or post a train journey to receive automated buddy matches.'
            }
            actionHref="/rides"
            actionLabel="Browse Campus Rides"
          />
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl border transition-all ${
                  !notif.isRead
                    ? 'border-emerald-300 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20 shadow-xs'
                    : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900'
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="p-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800 shrink-0">
                    {getIcon(notif)}
                  </div>
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {getTypeBadge(notif)}
                      <h3 className={`text-sm tracking-tight ${!notif.isRead ? 'font-bold text-neutral-900 dark:text-white' : 'font-semibold text-neutral-800 dark:text-neutral-200'}`}>
                        {notif.title}
                      </h3>
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                      {notif.message}
                    </p>
                    <span className="block text-[11px] text-neutral-400 dark:text-neutral-500">
                      {new Date(notif.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {!notif.isRead && (
                    <button
                      onClick={() => markAsRead(notif.id)}
                      className="p-2 text-xs font-semibold text-neutral-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors"
                      title="Mark as read"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  {notif.link && (
                    <Link
                      href={notif.type === 'MATCH' && notif.link === '/lost-found' ? '/lost-found/match/match_001' : notif.link}
                      onClick={() => {
                        if (!notif.isRead) markAsRead(notif.id);
                      }}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        notif.type === 'MATCH'
                          ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs hover:scale-[1.02]'
                          : 'bg-neutral-100 dark:bg-neutral-800 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600'
                      }`}
                    >
                      {notif.type === 'MATCH' ? (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Review Match</span>
                        </>
                      ) : (
                        <>
                          <span>Open</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </>
                      )}
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
