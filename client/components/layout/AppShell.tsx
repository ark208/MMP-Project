'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Search,
  ShoppingBag,
  Heart,
  User,
  PlusCircle,
  Sun,
  Moon,
  Sparkles,
  HelpCircle,
  CheckCircle,
  Tag,
  LogOut,
  ChevronRight,
  X,
  Train,
  Car,
  MessageSquare,
  Bell,
  ShieldAlert,
} from 'lucide-react';
import { useTheme } from '@/lib/theme-context';
import { useAuth } from '@/lib/auth-context';
import { NotificationBell } from './NotificationBell';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();

  const [showCreateMenu, setShowCreateMenu] = useState(false);

  // Navigation Items (Phase 1 + Phase 2 + Phase 3 Admin)
  const navItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Lost & Found', href: '/lost-found', icon: Search },
    { label: 'Marketplace', href: '/marketplace', icon: ShoppingBag },
    { label: 'Campus Rides', href: '/rides', icon: Car },
    { label: 'Train Buddy', href: '/train-buddy', icon: Train },
    { label: 'In-App Chat', href: '/chat', icon: MessageSquare },
    { label: 'Notifications', href: '/notifications', icon: Bell },
    { label: 'Wishlist', href: '/marketplace/wishlist', icon: Heart },
    { label: 'Profile', href: '/profile', icon: User },
    ...(user?.role === 'ADMIN' ? [{ label: 'Admin Console', href: '/admin', icon: ShieldAlert }] : []),
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-neutral-950 flex flex-col md:flex-row text-neutral-900 dark:text-neutral-100 transition-colors duration-200">
      {/* ============================================================== */}
      {/* DESKTOP SIDEBAR */}
      {/* ============================================================== */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 border-r border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md sticky top-0 h-screen p-5 shrink-0 z-30 justify-between">
        <div className="space-y-5 overflow-y-auto pr-1">
          {/* Logo, Brand & Controls */}
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-xl tracking-tight">
                  Campus<span className="text-emerald-600 dark:text-emerald-400">Loop</span>
                </span>
                <span className="block text-[9px] uppercase font-bold tracking-widest text-emerald-600 dark:text-emerald-400">
                  Campus Network
                </span>
              </div>
            </Link>

            <div className="flex items-center gap-1">
              <NotificationBell />
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                aria-label="Toggle color theme"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-neutral-600" />}
              </button>
            </div>
          </div>

          {/* Quick Action Button: + Post or Register */}
          <div className="relative">
            <button
              onClick={() => setShowCreateMenu(!showCreateMenu)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-sm transition-all hover:shadow-md"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Post or Register</span>
            </button>

            {/* Dropdown Menu */}
            {showCreateMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowCreateMenu(false)}
                />
                <div className="absolute left-0 right-0 mt-2 p-2 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl z-50 animate-in fade-in zoom-in-95 space-y-1">
                  <Link
                    href="/rides"
                    onClick={() => setShowCreateMenu(false)}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-sm font-medium transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                      <Car className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-neutral-900 dark:text-neutral-100">Offer a Ride</div>
                      <div className="text-xs text-neutral-500">Cab pool to airport/station</div>
                    </div>
                  </Link>

                  <Link
                    href="/train-buddy"
                    onClick={() => setShowCreateMenu(false)}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-sm font-medium transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                      <Train className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-neutral-900 dark:text-neutral-100">Train Journey</div>
                      <div className="text-xs text-neutral-500">Find classmates on your train</div>
                    </div>
                  </Link>

                  <Link
                    href="/lost-found/report-lost"
                    onClick={() => setShowCreateMenu(false)}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-sm font-medium transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                      <HelpCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-neutral-900 dark:text-neutral-100">Report Lost Item</div>
                      <div className="text-xs text-neutral-500">I lost something on campus</div>
                    </div>
                  </Link>

                  <Link
                    href="/lost-found/register-found"
                    onClick={() => setShowCreateMenu(false)}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-sm font-medium transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-neutral-900 dark:text-neutral-100">Register Found Item</div>
                      <div className="text-xs text-neutral-500">I found someone&apos;s item</div>
                    </div>
                  </Link>

                  <Link
                    href="/marketplace/create"
                    onClick={() => setShowCreateMenu(false)}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-sm font-medium transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                      <Tag className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-neutral-900 dark:text-neutral-100">Sell on Marketplace</div>
                      <div className="text-xs text-neutral-500">List books, gear & dorm items</div>
                    </div>
                  </Link>

                  <Link
                    href="/trips"
                    onClick={() => setShowCreateMenu(false)}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-sm font-medium transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
                      <Train className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-neutral-900 dark:text-neutral-100">Post Train Journey</div>
                      <div className="text-xs text-neutral-500">Activate Train Buddy radar</div>
                    </div>
                  </Link>

                  <Link
                    href="/rides"
                    onClick={() => setShowCreateMenu(false)}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-sm font-medium transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                      <Car className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-neutral-900 dark:text-neutral-100">Offer Ride Share</div>
                      <div className="text-xs text-neutral-500">Split cab fares to airport/station</div>
                    </div>
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1" aria-label="Desktop Sidebar Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 font-semibold'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/60 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Card at bottom of sidebar */}
        <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
          {isAuthenticated && user ? (
            <div className="flex items-center justify-between p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
              <Link href="/profile" className="flex items-center gap-2.5 overflow-hidden">
                <img
                  src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-emerald-500/30 shrink-0"
                />
                <div className="truncate">
                  <div className="text-xs font-bold truncate text-neutral-900 dark:text-white">
                    {user.name}
                  </div>
                  <div className="text-[11px] text-neutral-500 truncate">{user.email}</div>
                </div>
              </Link>
              <button
                onClick={logout}
                title="Log out"
                className="p-1.5 text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <User className="w-4 h-4" />
              <span>Campus Sign In</span>
            </Link>
          )}
        </div>
      </aside>

      {/* ============================================================== */}
      {/* MOBILE TOP HEADER */}
      {/* ============================================================== */}
      <header className="md:hidden sticky top-0 z-40 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-extrabold text-lg tracking-tight">
            Campus<span className="text-emerald-600 dark:text-emerald-400">Loop</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Notification Bell in Mobile Header */}
          <NotificationBell />

          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {isAuthenticated && user ? (
            <Link href="/profile">
              <img
                src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                alt={user.name}
                className="w-7 h-7 rounded-full object-cover ring-2 ring-emerald-500/30"
              />
            </Link>
          ) : (
            <Link
              href="/auth/login"
              className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-600 text-white"
            >
              Sign In
            </Link>
          )}
        </div>
      </header>

      {/* ============================================================== */}
      {/* MAIN CONTENT AREA */}
      {/* ============================================================== */}
      <main className="flex-1 flex flex-col min-w-0 pb-24 md:pb-8">
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1">
          {children}
        </div>
      </main>

      {/* ============================================================== */}
      {/* MOBILE BOTTOM TAB BAR */}
      {/* ============================================================== */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-lg border-t border-neutral-200 dark:border-neutral-800 px-2 py-2 flex items-center justify-around"
        aria-label="Mobile Navigation Bar"
      >
        <Link
          href="/"
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-colors ${
            isActive('/') ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-500'
          }`}
        >
          <Home className="w-4 h-4" />
          <span className="text-[9px] font-semibold">Home</span>
        </Link>

        <Link
          href="/trips"
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-colors ${
            isActive('/trips') ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-500'
          }`}
        >
          <Train className="w-4 h-4" />
          <span className="text-[9px] font-semibold">Trains</span>
        </Link>

        <Link
          href="/rides"
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-colors ${
            isActive('/rides') ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-500 dark:text-neutral-400'
          }`}
        >
          <Car className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Rides</span>
        </Link>

        {/* Center Post Button */}
        <button
          onClick={() => setShowCreateMenu(true)}
          className="flex flex-col items-center justify-center -mt-4"
          aria-label="Create new post"
        >
          <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30">
            <PlusCircle className="w-5 h-5" />
          </div>
          <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">Post</span>
        </button>

        <Link
          href="/chat"
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-colors ${
            isActive('/chat') ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-500'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span className="text-[9px] font-semibold">Chat</span>
        </Link>

        <Link
          href="/train-buddy"
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-colors ${
            isActive('/train-buddy') ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-500 dark:text-neutral-400'
          }`}
        >
          <Train className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Train</span>
        </Link>

      </nav>

      {/* Mobile Create Post Modal */}
      {showCreateMenu && (
        <div className="md:hidden fixed inset-0 z-50 flex items-end bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full bg-white dark:bg-neutral-900 rounded-t-3xl p-6 border-t border-neutral-200 dark:border-neutral-800 space-y-4 animate-in slide-in-from-bottom-5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">Create Campus Post</h3>
              <button
                onClick={() => setShowCreateMenu(false)}
                className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <Link
                href="/rides"
                onClick={() => setShowCreateMenu(false)}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-600 text-white">
                    <Car className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-emerald-950 dark:text-emerald-100 text-sm">Offer a Campus Ride</div>
                    <div className="text-xs text-emerald-700/80 dark:text-emerald-300">Pool cabs to airport, stations & city</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-emerald-400" />
              </Link>

              <Link
                href="/train-buddy"
                onClick={() => setShowCreateMenu(false)}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/50"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-600 text-white">
                    <Train className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-amber-950 dark:text-amber-100 text-sm">Post Train Journey</div>
                    <div className="text-xs text-amber-700/80 dark:text-amber-300">Find classmates on your train</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-amber-400" />
              </Link>

              <Link
                href="/lost-found/report-lost"
                onClick={() => setShowCreateMenu(false)}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/50"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-rose-600 text-white">
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-rose-950 dark:text-rose-100 text-sm">Report Lost Item</div>
                    <div className="text-xs text-rose-700/80 dark:text-rose-300">Notify the campus community</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-rose-400" />
              </Link>

              <Link
                href="/lost-found/register-found"
                onClick={() => setShowCreateMenu(false)}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-900/50"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-teal-600 text-white">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-teal-950 dark:text-teal-100 text-sm">Register Found Item</div>
                    <div className="text-xs text-teal-700/80 dark:text-teal-300">Set secret question & safe custody</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-teal-400" />
              </Link>

              <Link
                href="/marketplace/create"
                onClick={() => setShowCreateMenu(false)}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/50"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-600 text-white">
                    <Tag className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-purple-950 dark:text-purple-100 text-sm">Sell on Marketplace</div>
                    <div className="text-xs text-purple-700/80 dark:text-purple-300">List books, tech & dorm furniture</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-purple-400" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
