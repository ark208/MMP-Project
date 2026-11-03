"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
} from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import { useAuth } from "@/lib/auth-context";
import { NotificationBell } from "./NotificationBell";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();

  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Navigation Items (Preserved completely)
  const navItems = [
    { label: "Home", href: "/", icon: Home },
    { label: "Lost & Found", href: "/lost-found", icon: Search },
    { label: "Marketplace", href: "/marketplace", icon: ShoppingBag },
    { label: "Trips", href: "/trips", icon: Train },
    { label: "Campus Rides", href: "/rides", icon: Car },
    { label: "Train Buddy", href: "/train-buddy", icon: Train },
    { label: "In-App Chat", href: "/chat", icon: MessageSquare },
    { label: "Notifications", href: "/notifications", icon: Bell },
    { label: "Wishlist", href: "/marketplace/wishlist", icon: Heart },
    { label: "Profile", href: "/profile", icon: User },
    ...(user?.role === "ADMIN"
      ? [{ label: "Admin Console", href: "/admin", icon: ShieldAlert }]
      : []),
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/lost-found?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const userInitial = user?.name ? user.name[0].toUpperCase() : "N";
  const userIdentifier = user?.name || "2025kucp1031";
  const userEmail = user?.email || "2025kucp1031@iiitkota.ac.in";

  return (
    <div className="min-h-screen bg-[#F8F5F0] dark:bg-[#171513] flex flex-col md:flex-row text-[#242424] dark:text-[#F5F1EB] transition-colors duration-200">
      {/* ============================================================== */}
      {/* DESKTOP SIDEBAR (#F1ECE5 background, #E8DED5 border) */}
      {/* ============================================================== */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 border-r border-[#E8DED5] dark:border-[#332D27] bg-[#F1ECE5] dark:bg-[#1E1B18] sticky top-0 h-screen p-5 shrink-0 z-30 justify-between">
        <div className="space-y-6 overflow-y-auto pr-1">
          {/* Logo & Brand Presentation */}
          <div className="flex items-center justify-between pt-1">
            <Link href="/" className="flex flex-col group">
              <div className="text-2xl font-black tracking-tight text-[#242424] dark:text-[#F5F1EB]">
                Campus<span className="text-[#B9573B]">Loop</span>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#77716D] dark:text-[#A8A29D]">
                CAMPUS NETWORK
              </span>
            </Link>
          </div>

          {/* Navigation Links (Preserved completely) */}
          <nav className="space-y-1.5" aria-label="Desktop Sidebar Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all ${
                    active
                      ? "bg-[#FDF8F6] dark:bg-[#2E241E] text-[#B9573B] font-bold shadow-xs border border-[#F4E0D7] dark:border-[#423228]"
                      : "text-[#242424] dark:text-[#E2DCD5] hover:bg-[#EAE3D9] dark:hover:bg-[#2A2521] font-medium"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      active
                        ? "text-[#B9573B]"
                        : "text-[#77716D] dark:text-[#A8A29D]"
                    }`}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Card at bottom of sidebar (IIIT Kota format) */}
        <div className="pt-4 border-t border-[#E8DED5] dark:border-[#332D27]">
          {isAuthenticated && user ? (
            <div className="flex items-center justify-between p-2 rounded-xl bg-transparent">
              <Link
                href="/profile"
                className="flex items-center gap-2.5 overflow-hidden group"
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-[#B9573B]/30 shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#B9573B] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                    {userInitial}
                  </div>
                )}
                <div className="truncate">
                  <div className="text-xs font-bold truncate text-[#242424] dark:text-[#F5F1EB] group-hover:text-[#B9573B] transition-colors">
                    {userIdentifier}
                  </div>
                  <div className="text-[11px] text-[#77716D] dark:text-[#A8A29D] truncate">
                    {userEmail}
                  </div>
                </div>
              </Link>
              <button
                onClick={logout}
                title="Log out"
                className="p-1.5 text-[#77716D] hover:text-[#B9573B] dark:hover:text-[#D5866C] rounded-lg hover:bg-[#EAE3D9] dark:hover:bg-[#2A2521] transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-[#E8DED5] dark:border-[#332D27] text-sm font-semibold hover:bg-[#EAE3D9] dark:hover:bg-[#2A2521] transition-colors"
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
      <header className="md:hidden sticky top-0 z-40 bg-[#F1ECE5]/95 dark:bg-[#1E1B18]/95 backdrop-blur-md border-b border-[#E8DED5] dark:border-[#332D27] px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex flex-col">
          <span className="font-extrabold text-lg tracking-tight text-[#242424] dark:text-[#F5F1EB]">
            Campus<span className="text-[#B9573B]">Loop</span>
          </span>
          <span className="text-[8px] uppercase font-bold tracking-widest text-[#77716D]">
            CAMPUS NETWORK
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <NotificationBell />

          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-[#77716D] dark:text-[#A8A29D] hover:bg-[#EAE3D9] dark:hover:bg-[#2A2521] transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>

          {isAuthenticated && user ? (
            <Link href="/profile">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-7 h-7 rounded-full object-cover ring-2 ring-[#B9573B]/30"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-[#B9573B] text-white flex items-center justify-center font-bold text-xs">
                  {userInitial}
                </div>
              )}
            </Link>
          ) : (
            <Link
              href="/auth/login"
              className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#B9573B] text-white"
            >
              Sign In
            </Link>
          )}
        </div>
      </header>

      {/* ============================================================== */}
      {/* MAIN CONTENT AREA WITH TOP SEARCH BAR (AS SHOWN IN REFERENCE) */}
      {/* ============================================================== */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar for Desktop */}
        <header className="hidden md:flex items-center justify-between gap-4 px-6 lg:px-8 py-4 bg-transparent border-b border-[#E8DED5] dark:border-[#332D27]">
          {/* Global Search Bar (From Reference Screenshot) */}
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-xl">
            <div className="relative">
              <Search className="w-4 h-4 text-[#77716D] absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search for rides, items, listings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-full border border-[#E8DED5] dark:border-[#332D27] bg-white dark:bg-[#221F1B] text-sm text-[#242424] dark:text-[#F5F1EB] placeholder-[#77716D] focus:outline-none focus:ring-2 focus:ring-[#B9573B]/30 transition-all shadow-xs"
              />
            </div>
          </form>

          {/* Right Header Controls */}
          <div className="flex items-center gap-3">
            <NotificationBell />

            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-[#77716D] dark:text-[#A8A29D] hover:bg-[#EAE3D9] dark:hover:bg-[#2A2521] transition-colors"
              aria-label="Toggle color theme"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-[#77716D]" />
              )}
            </button>

            {isAuthenticated && user ? (
              <Link href="/profile" title={user.name}>
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-[#B9573B]/30"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#B9573B] text-white flex items-center justify-center font-bold text-xs shadow-xs hover:opacity-90 transition-opacity">
                    {userInitial}
                  </div>
                )}
              </Link>
            ) : (
              <Link
                href="/auth/login"
                className="text-xs font-bold px-3 py-1.5 rounded-full bg-[#B9573B] text-white hover:bg-[#9E452D] transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 pb-24 md:pb-8">
          <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </div>
        </main>
      </div>

      {/* ============================================================== */}
      {/* MOBILE BOTTOM TAB BAR */}
      {/* ============================================================== */}
      <nav
        className="md:hidden fixed inset-x-0 bottom-0 z-40 grid grid-cols-7 items-end gap-0 border-t border-[#E8DED5] bg-white/95 px-0.5 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] backdrop-blur-lg dark:border-[#332D27] dark:bg-[#1E1B18]/95"
        aria-label="Mobile Navigation Bar"
      >
        <Link
          href="/"
          className={`flex min-w-0 w-full flex-col items-center justify-end gap-1 rounded-lg py-1.5 text-center transition-colors ${
            isActive("/") ? "text-[#B9573B]" : "text-[#77716D]"
          }`}
        >
          <Home className="h-4.5 w-4.5 shrink-0" />
          <span className="w-full truncate text-[8px] font-semibold leading-3">
            Home
          </span>
        </Link>

        <Link
          href="/trips"
          className={`flex min-w-0 w-full flex-col items-center justify-end gap-1 rounded-lg py-1.5 text-center transition-colors ${
            isActive("/trips") ? "text-[#B9573B]" : "text-[#77716D]"
          }`}
        >
          <Train className="h-4.5 w-4.5 shrink-0" />
          <span className="w-full truncate text-[8px] font-semibold leading-3">
            Trains
          </span>
        </Link>

        <Link
          href="/rides"
          className={`flex min-w-0 w-full flex-col items-center justify-end gap-1 rounded-lg py-1.5 text-center transition-colors ${
            isActive("/rides") ? "text-[#B9573B]" : "text-[#77716D]"
          }`}
        >
          <Car className="h-4.5 w-4.5 shrink-0" />
          <span className="w-full truncate text-[8px] font-semibold leading-3">
            Rides
          </span>
        </Link>

        {/* Center Post action: same slot height and label baseline as the other tabs */}
        <button
          type="button"
          onClick={() => setShowCreateMenu(true)}
          className="flex min-w-0 w-full flex-col items-center justify-end gap-1 rounded-lg py-1.5 text-center text-[#B9573B] transition-colors"
          aria-label="Create new post"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#B9573B] text-white shadow-sm">
            <PlusCircle className="h-4 w-4" />
          </span>
          <span className="w-full truncate text-[8px] font-semibold leading-3">
            Post
          </span>
        </button>

        <Link
          href="/chat"
          className={`flex min-w-0 w-full flex-col items-center justify-end gap-1 rounded-lg py-1.5 text-center transition-colors ${
            isActive("/chat") ? "text-[#B9573B]" : "text-[#77716D]"
          }`}
        >
          <MessageSquare className="h-4.5 w-4.5 shrink-0" />
          <span className="w-full truncate text-[8px] font-semibold leading-3">
            Chat
          </span>
        </Link>

        <Link
          href="/train-buddy"
          className={`flex min-w-0 w-full flex-col items-center justify-end gap-1 rounded-lg py-1.5 text-center transition-colors ${
            isActive("/train-buddy") ? "text-[#B9573B]" : "text-[#77716D]"
          }`}
        >
          <Train className="h-4.5 w-4.5 shrink-0" />
          <span className="w-full truncate text-[8px] font-semibold leading-3">
            Trips
          </span>
        </Link>

        <Link
          href="/marketplace"
          className={`flex min-w-0 w-full flex-col items-center justify-end gap-1 rounded-lg py-1.5 text-center transition-colors ${
            isActive("/marketplace") ? "text-[#B9573B]" : "text-[#77716D]"
          }`}
        >
          <ShoppingBag className="h-4.5 w-4.5 shrink-0" />
          <span className="w-full truncate text-[8px] font-semibold leading-3">
            Market
          </span>
        </Link>
      </nav>

      {/* Mobile Create Post Modal */}
      {showCreateMenu && (
        <div className="md:hidden fixed inset-0 z-50 flex items-end bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full bg-white dark:bg-[#221F1B] rounded-t-3xl p-6 border-t border-[#E8DED5] dark:border-[#332D27] space-y-4 animate-in slide-in-from-bottom-5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-[#E8DED5] dark:border-[#332D27]">
              <h3 className="text-base font-bold text-[#242424] dark:text-[#F5F1EB]">
                Create Campus Post
              </h3>
              <button
                onClick={() => setShowCreateMenu(false)}
                className="p-1.5 rounded-full text-[#77716D] hover:text-[#242424] dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <Link
                href="/rides"
                onClick={() => setShowCreateMenu(false)}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FAF0EB] dark:bg-[#34241E] border border-[#F4E0D7] dark:border-[#423228]"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-[#B9573B] text-white">
                    <Car className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-[#242424] dark:text-[#F5F1EB] text-sm">
                      Offer a Campus Ride
                    </div>
                    <div className="text-xs text-[#77716D] dark:text-[#A8A29D]">
                      Pool cabs to airport, stations & city
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#B9573B]" />
              </Link>

              <Link
                href="/train-buddy"
                onClick={() => setShowCreateMenu(false)}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FAF0EB] dark:bg-[#34241E] border border-[#F4E0D7] dark:border-[#423228]"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-[#B9573B] text-white">
                    <Train className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-[#242424] dark:text-[#F5F1EB] text-sm">
                      Post Train Journey
                    </div>
                    <div className="text-xs text-[#77716D] dark:text-[#A8A29D]">
                      Find classmates on your train
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#B9573B]" />
              </Link>

              <Link
                href="/lost-found/report-lost"
                onClick={() => setShowCreateMenu(false)}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FAF0EB] dark:bg-[#34241E] border border-[#F4E0D7] dark:border-[#423228]"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-[#B9573B] text-white">
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-[#242424] dark:text-[#F5F1EB] text-sm">
                      Report Lost Item
                    </div>
                    <div className="text-xs text-[#77716D] dark:text-[#A8A29D]">
                      I lost something on campus
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#B9573B]" />
              </Link>

              <Link
                href="/lost-found/register-found"
                onClick={() => setShowCreateMenu(false)}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-[#E0EFF9] dark:bg-[#1E2E3D] border border-[#C2DFF3] dark:border-[#2C4054]"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-[#6698C2] text-white">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-[#242424] dark:text-[#F5F1EB] text-sm">
                      Register Found Item
                    </div>
                    <div className="text-xs text-[#77716D] dark:text-[#A8A29D]">
                      I found someone&apos;s item
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#6698C2]" />
              </Link>

              <Link
                href="/marketplace/create"
                onClick={() => setShowCreateMenu(false)}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-[#E0EFF9] dark:bg-[#1E2E3D] border border-[#C2DFF3] dark:border-[#2C4054]"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-[#6698C2] text-white">
                    <Tag className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-[#242424] dark:text-[#F5F1EB] text-sm">
                      Sell on Marketplace
                    </div>
                    <div className="text-xs text-[#77716D] dark:text-[#A8A29D]">
                      List books, gear & dorm items
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#6698C2]" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
