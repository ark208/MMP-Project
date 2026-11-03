'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  CheckCheck,
  Train,
  Car,
  MessageSquare,
  Sparkles,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { useNotifications } from '@/lib/notifications-context';
import type { Notification, NotificationType } from '@docs/types';

export function NotificationBell() {
  const router = useRouter();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'MATCH':
        return <Train className="w-4 h-4 text-[#B9573B]" />;
      case 'RIDE':
        return <Car className="w-4 h-4 text-[#B9573B]" />;
      case 'CHAT':
        return <MessageSquare className="w-4 h-4 text-[#6698C2]" />;
      default:
        return <Sparkles className="w-4 h-4 text-[#6698C2]" />;
    }
  };

  const handleNotificationClick = async (notif: Notification) => {
    if (!notif.isRead) {
      await markAsRead(notif.id);
    }
    setIsOpen(false);
    if (notif.link) {
      router.push(notif.link);
    }
  };

  const recentNotifications = notifications.slice(0, 5);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full text-[#77716D] dark:text-[#A8A29D] hover:text-[#242424] dark:hover:text-white hover:bg-[#EAE3D9] dark:hover:bg-[#2A2521] transition-colors"
        aria-label={`Notifications (${unreadCount} unread)`}
        aria-expanded={isOpen}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#B9573B] px-1 text-[10px] font-extrabold text-white ring-2 ring-white dark:ring-[#1E1B18] animate-in zoom-in-50">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Popup */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-[#E8DED5] dark:border-[#332D27] bg-white dark:bg-[#221F1B] shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95">
          {/* Dropdown Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#E8DED5] dark:border-[#332D27] bg-[#F8F5F0]/60 dark:bg-[#1E1B18]/60">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-[#242424] dark:text-[#F5F1EB]">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#FAF0EB] dark:bg-[#34241E] text-[#B9573B] dark:text-[#D5866C]">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs font-semibold text-[#B9573B] hover:text-[#9E452D] flex items-center gap-1 transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all as read</span>
              </button>
            )}
          </div>

          {/* List of Recent Notifications */}
          <div className="divide-y divide-[#E8DED5]/60 dark:divide-[#332D27] max-h-80 overflow-y-auto">
            {recentNotifications.length === 0 ? (
              <div className="py-8 px-4 text-center space-y-1">
                <Bell className="w-8 h-8 text-[#77716D]/40 mx-auto" />
                <p className="text-xs font-semibold text-[#242424] dark:text-[#F5F1EB]">All caught up!</p>
                <p className="text-[11px] text-[#77716D]">No new notifications right now.</p>
              </div>
            ) : (
              recentNotifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`p-3.5 flex items-start gap-3 hover:bg-[#F8F5F0] dark:hover:bg-[#2A2521] cursor-pointer transition-colors ${
                    !n.isRead ? 'bg-[#FAF0EB]/40 dark:bg-[#2C231D]/40' : ''
                  }`}
                >
                  <div className="p-2 rounded-xl bg-[#F8F5F0] dark:bg-[#2C2723] shrink-0 mt-0.5">
                    {getNotificationIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-bold text-[#242424] dark:text-[#F5F1EB] truncate">{n.title}</p>
                      {!n.isRead && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#B9573B] shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-[#77716D] dark:text-[#A8A29D] line-clamp-2 leading-relaxed">
                      {n.message}
                    </p>
                    <span className="text-[10px] text-[#77716D]/70 block pt-0.5">
                      {new Date(n.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer View All */}
          <div className="p-2.5 border-t border-[#E8DED5] dark:border-[#332D27] bg-[#F8F5F0]/60 dark:bg-[#1E1B18]/60 text-center">
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="text-xs font-bold text-[#B9573B] hover:text-[#9E452D] inline-flex items-center gap-1 transition-colors"
            >
              <span>View all notifications</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
