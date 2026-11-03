"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Car,
  Train,
  Search,
  ShoppingBag,
  ArrowRight,
  Calendar,
  Users,
  TrendingUp,
  Briefcase,
  CheckCircle2,
  Tag,
  PlusCircle,
  X,
  ChevronRight,
  HelpCircle,
  Clock,
  Sparkles,
} from "lucide-react";
import type { LostItem, Listing, Ride } from "@docs/types";
import type { ExtendedFoundItem } from "@/lib/mock-data";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";

interface ActivityItem {
  id: string;
  type: "lost" | "found" | "ride" | "marketplace";
  badgeTitle: string;
  detail: string;
  category?: string;
  createdAt: string;
  link: string;
}

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [lostItems, setLostItems] = useState<LostItem[]>([]);
  const [foundItems, setFoundItems] = useState<ExtendedFoundItem[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [rides, setRides] = useState<Ride[]>([]);
  const [showPostModal, setShowPostModal] = useState(false);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        setError(null);
        const [feedData, ridesData] = await Promise.all([
          api.feed.getSummary(),
          api.rides.list().catch(() => []),
        ]);
        setLostItems(feedData?.lost || []);
        setFoundItems(feedData?.found || []);
        setListings(feedData?.marketplace || []);
        setRides(ridesData || []);
      } catch (err: any) {
        console.error("Failed to load dashboard data:", err);
        setError("Unable to load latest campus feed.");
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  // Time formatters
  const formatTimeAgo = (isoString?: string): string => {
    if (!isoString) return "Recently";
    const now = new Date().getTime();
    const date = new Date(isoString).getTime();
    const diffMinutes = Math.max(0, Math.floor((now - date) / (1000 * 60)));
    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  };

  const formatRideDate = (isoString: string): string => {
    try {
      const rideDate = new Date(isoString);
      const today = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);

      const timeStr = rideDate.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      });
      if (rideDate.toDateString() === today.toDateString()) {
        return `Today, ${timeStr}`;
      }
      if (rideDate.toDateString() === tomorrow.toDateString()) {
        return `Tomorrow, ${timeStr}`;
      }
      return `${rideDate.toLocaleDateString([], { month: "short", day: "numeric" })}, ${timeStr}`;
    } catch {
      return "Upcoming Departure";
    }
  };

  // Build unified Recent Activity list from real backend data
  const recentActivities: ActivityItem[] = [
    ...lostItems.map((item) => ({
      id: `lost-${item.id}`,
      type: "lost" as const,
      badgeTitle: "Lost item reported",
      detail: item.title,
      category: item.category,
      createdAt: item.createdAt,
      link: `/lost-found/${item.id}`,
    })),
    ...foundItems.map((item) => ({
      id: `found-${item.id}`,
      type: "found" as const,
      badgeTitle: "Found item registered",
      detail: item.title,
      category: item.category,
      createdAt: item.createdAt,
      link: `/lost-found/${item.id}`,
    })),
    ...rides.map((ride) => ({
      id: `ride-${ride.id}`,
      type: "ride" as const,
      badgeTitle: "New ride posted",
      detail: `${ride.origin} → ${ride.destination}`,
      category: `${ride.availableSeats} seats open`,
      createdAt: ride.createdAt || ride.departureTime,
      link: "/rides",
    })),
    ...listings.map((listing) => ({
      id: `listing-${listing.id}`,
      type: "marketplace" as const,
      badgeTitle: "New marketplace listing",
      detail: listing.title,
      category: `$${listing.price.toFixed(2)}`,
      createdAt: listing.createdAt,
      link: `/marketplace/${listing.id}`,
    })),
  ]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 5);

  // Identify real upcoming ride (User's joined/created ride first, or earliest open campus ride)
  const myUpcomingRide = user
    ? rides.find(
        (r) =>
          r.status === "OPEN" &&
          (r.creatorId === user.id ||
            r.members?.some((m) => m.userId === user.id)),
      )
    : null;
  const campusUpcomingRide = rides.find((r) => r.status === "OPEN") || null;
  const displayUpcomingRide = myUpcomingRide || campusUpcomingRide;

  // Real user activity counts (strictly computed from real data)
  const myRidesCount = user
    ? rides.filter(
        (r) =>
          r.creatorId === user.id ||
          r.members?.some((m) => m.userId === user.id),
      ).length
    : rides.length;

  const myLostFoundCount = user
    ? lostItems.filter((i) => i.userId === user.id).length +
      foundItems.filter((i) => i.userId === user.id).length
    : lostItems.length + foundItems.length;

  const myListingsCount = user
    ? listings.filter((l) => l.sellerId === user.id).length
    : listings.length;

  const handleExploreScroll = () => {
    const el = document.getElementById("campus-services");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="space-y-7 animate-in fade-in duration-300">
      {/* ============================================================== */}
      {/* 1. HERO SECTION (EDITORIAL STYLE WITH IIIT KOTA ACADEMIC BLOCK) */}
      {/* ============================================================== */}
      <section className="bg-white dark:bg-[#221F1B] rounded-3xl border border-[#E8DED5] dark:border-[#332D27] p-6 sm:p-8 lg:p-9 shadow-xs overflow-hidden">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          {/* Left Text Column */}
          <div className="flex-1 space-y-4 text-left">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#242424] dark:text-[#F5F1EB] tracking-tight leading-[1.15]">
              Your campus, <span className="text-[#B9573B]">connected.</span>
            </h1>
            <p className="text-sm sm:text-base text-[#77716D] dark:text-[#A8A29D] max-w-xl leading-relaxed">
              Find rides, train buddies, lost items and marketplace listings
              within the IIIT Kota community.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setShowPostModal(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#B9573B] hover:bg-[#9E452D] text-white text-sm font-bold shadow-xs transition-all hover:shadow"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Post or Register</span>
              </button>

              <button
                type="button"
                onClick={handleExploreScroll}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#E8DED5] dark:border-[#332D27] bg-white dark:bg-[#1E1B18] text-[#242424] dark:text-[#F5F1EB] hover:bg-[#F8F5F0] dark:hover:bg-[#2C2723] text-sm font-bold transition-colors"
              >
                <span>Explore Services</span>
              </button>
            </div>
          </div>

          {/* Right Visual Column (Actual IIIT Kota Academic Block Image) */}
          <div className="w-full lg:w-[55%] shrink-0">
            <div className="relative -mx-6 w-[calc(100%+3rem)] overflow-hidden rounded-2xl border border-[#E8DED5] dark:border-[#332D27] shadow-xs bg-[#FAF0EB] dark:bg-[#1E1B18] sm:mx-0 sm:w-full lg:[clip-path:polygon(11%_0,100%_0,100%_100%,0_100%)]">
              <img
                src="/images/iiit-kota-building.png"
                alt="IIIT Kota Academic Block"
                className="block w-full aspect-[16/9] lg:aspect-[2.15/1] object-cover object-center transform transition-transform duration-300 hover:scale-[1.02]"
              />
              <div className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-xs text-[10px] font-bold text-white tracking-wider uppercase">
                IIIT Kota Campus
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 2. FOUR HORIZONTAL SERVICE CARDS */}
      {/* ============================================================== */}
      <section
        id="campus-services"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* Campus Rides */}
        <Link
          href="/rides"
          className="group p-5 rounded-2xl border border-[#E8DED5] dark:border-[#332D27] bg-[#F7F4EE] dark:bg-[#221F1B] hover:bg-white dark:hover:bg-[#26221E] hover:border-[#B9573B]/50 transition-all shadow-xs flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#FAF0EB] dark:bg-[#34241E] flex items-center justify-center text-[#B9573B] shrink-0 group-hover:scale-105 transition-transform">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#242424] dark:text-[#F5F1EB] group-hover:text-[#B9573B] transition-colors">
                Campus Rides
              </h3>
              <p className="text-xs text-[#77716D] dark:text-[#A8A29D]">
                Share or find a ride
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-[#77716D] group-hover:text-[#B9573B] group-hover:translate-x-0.5 transition-all" />
        </Link>

        {/* Train Buddy */}
        <Link
          href="/train-buddy"
          className="group p-5 rounded-2xl border border-[#E8DED5] dark:border-[#332D27] bg-[#F7F4EE] dark:bg-[#221F1B] hover:bg-white dark:hover:bg-[#26221E] hover:border-[#B9573B]/50 transition-all shadow-xs flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#FAF0EB] dark:bg-[#34241E] flex items-center justify-center text-[#B9573B] shrink-0 group-hover:scale-105 transition-transform">
              <Train className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#242424] dark:text-[#F5F1EB] group-hover:text-[#B9573B] transition-colors">
                Train Buddy
              </h3>
              <p className="text-xs text-[#77716D] dark:text-[#A8A29D]">
                Find travel companions
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-[#77716D] group-hover:text-[#B9573B] group-hover:translate-x-0.5 transition-all" />
        </Link>

        {/* Lost & Found */}
        <Link
          href="/lost-found"
          className="group p-5 rounded-2xl border border-[#E8DED5] dark:border-[#332D27] bg-[#F7F4EE] dark:bg-[#221F1B] hover:bg-white dark:hover:bg-[#26221E] hover:border-[#B9573B]/50 transition-all shadow-xs flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#FAF0EB] dark:bg-[#34241E] flex items-center justify-center text-[#B9573B] shrink-0 group-hover:scale-105 transition-transform">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#242424] dark:text-[#F5F1EB] group-hover:text-[#B9573B] transition-colors">
                Lost &amp; Found
              </h3>
              <p className="text-xs text-[#77716D] dark:text-[#A8A29D]">
                Report or recover items
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-[#77716D] group-hover:text-[#B9573B] group-hover:translate-x-0.5 transition-all" />
        </Link>

        {/* Marketplace */}
        <Link
          href="/marketplace"
          className="group p-5 rounded-2xl border border-[#E8DED5] dark:border-[#332D27] bg-[#F7F4EE] dark:bg-[#221F1B] hover:bg-white dark:hover:bg-[#26221E] hover:border-[#B9573B]/50 transition-all shadow-xs flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#FAF0EB] dark:bg-[#34241E] flex items-center justify-center text-[#B9573B] shrink-0 group-hover:scale-105 transition-transform">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#242424] dark:text-[#F5F1EB] group-hover:text-[#B9573B] transition-colors">
                Marketplace
              </h3>
              <p className="text-xs text-[#77716D] dark:text-[#A8A29D]">
                Buy, sell or exchange
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-[#77716D] group-hover:text-[#B9573B] group-hover:translate-x-0.5 transition-all" />
        </Link>
      </section>

      {/* ============================================================== */}
      {/* 3. MAIN CONTENT: TWO-COLUMN LAYOUT */}
      {/* ============================================================== */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: RECENT ACTIVITY (60-65% width) */}
        <div className="lg:col-span-7 xl:col-span-8 bg-white dark:bg-[#221F1B] rounded-3xl border border-[#E8DED5] dark:border-[#332D27] p-6 sm:p-7 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-2 border-b border-[#E8DED5]/70 dark:border-[#332D27]">
            <h2 className="text-lg font-bold text-[#242424] dark:text-[#F5F1EB]">
              Recent Activity
            </h2>
            <Link
              href="/lost-found"
              className="text-xs font-bold text-[#B9573B] hover:text-[#9E452D] inline-flex items-center gap-1 transition-colors"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="p-4 rounded-2xl border border-[#E8DED5]/60 bg-[#FDFBF8] dark:bg-[#1E1B18] space-y-2 animate-pulse"
                >
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-xl" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-56" />
                    </div>
                    <Skeleton className="h-7 w-16 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-4 rounded-2xl bg-[#FAF0EB] text-[#B9573B] text-xs font-semibold">
              {error}
            </div>
          ) : recentActivities.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="No recent activity yet"
              description="Be the first to offer a ride, list a study book, or post on campus."
              actionLabel="+ Create First Post"
              onActionClick={() => setShowPostModal(true)}
            />
          ) : (
            <div className="space-y-3">
              {recentActivities.map((act) => {
                const getIcon = () => {
                  switch (act.type) {
                    case "lost":
                      return <Briefcase className="w-5 h-5 text-[#B9573B]" />;
                    case "found":
                      return (
                        <CheckCircle2 className="w-5 h-5 text-[#6698C2]" />
                      );
                    case "ride":
                      return <Car className="w-5 h-5 text-[#B9573B]" />;
                    case "marketplace":
                      return <ShoppingBag className="w-5 h-5 text-[#B9573B]" />;
                  }
                };

                return (
                  <div
                    key={act.id}
                    className="p-4 rounded-2xl border border-[#E8DED5]/70 dark:border-[#332D27] bg-[#FDFBF8] dark:bg-[#1E1B18] hover:bg-[#F8F5F0] dark:hover:bg-[#26221E] transition-colors flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#2A2521] border border-[#E8DED5] dark:border-[#332D27] flex items-center justify-center shrink-0 shadow-xs">
                        {getIcon()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-xs sm:text-sm text-[#242424] dark:text-[#F5F1EB] truncate">
                          {act.badgeTitle}
                        </div>
                        <div className="text-xs text-[#77716D] dark:text-[#A8A29D] truncate mt-0.5">
                          {act.detail} {act.category ? `• ${act.category}` : ""}{" "}
                          • {formatTimeAgo(act.createdAt)}
                        </div>
                      </div>
                    </div>

                    <Link
                      href={act.link}
                      className="px-3.5 py-1.5 rounded-xl border border-[#E8DED5] dark:border-[#332D27] bg-white dark:bg-[#221F1B] hover:border-[#B9573B] hover:text-[#B9573B] text-xs font-bold text-[#242424] dark:text-[#F5F1EB] transition-colors shrink-0 shadow-xs"
                    >
                      View
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: PERSONAL DASHBOARD (35-40% width) */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6">
          {/* Upcoming Ride Card */}
          <div className="bg-[#F7F4EE] dark:bg-[#221F1B] rounded-3xl border border-[#E8DED5] dark:border-[#332D27] p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#B9573B]">
              <Car className="w-4 h-4" />
              <span>Upcoming Ride</span>
            </div>

            {loading ? (
              <div className="space-y-2 py-2 animate-pulse">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-4 w-28" />
              </div>
            ) : displayUpcomingRide ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-base font-black text-[#242424] dark:text-[#F5F1EB]">
                    <span>{displayUpcomingRide.origin}</span>
                    <span className="text-[#B9573B] mx-2">→</span>
                    <span>{displayUpcomingRide.destination}</span>
                  </div>

                  <Link
                    href="/rides"
                    className="w-8 h-8 rounded-full bg-[#B9573B] hover:bg-[#9E452D] text-white flex items-center justify-center shrink-0 shadow-xs transition-colors"
                    title="View ride details"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                <div className="space-y-1.5 text-xs text-[#77716D] dark:text-[#A8A29D]">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-[#B9573B]" />
                    <span>
                      {formatRideDate(displayUpcomingRide.departureTime)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-[#B9573B]" />
                    <span>
                      {displayUpcomingRide.availableSeats} of{" "}
                      {displayUpcomingRide.totalSeats} seats open
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-2 space-y-2 text-xs text-[#77716D] dark:text-[#A8A29D]">
                <p>No active rides currently scheduled.</p>
                <Link
                  href="/rides"
                  className="inline-flex items-center gap-1.5 font-bold text-[#B9573B] hover:underline pt-1"
                >
                  <span>Book or offer a ride</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>

          {/* Your Activity Card */}
          <div className="bg-[#F7F4EE] dark:bg-[#221F1B] rounded-3xl border border-[#E8DED5] dark:border-[#332D27] p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#B9573B]">
              <TrendingUp className="w-4 h-4" />
              <span>
                {isAuthenticated ? "Your Activity" : "Campus Community"}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center pt-1 divide-x divide-[#E8DED5]/80 dark:divide-[#332D27]">
              {/* Rides */}
              <div className="space-y-1 px-1">
                <div className="text-2xl font-black text-[#242424] dark:text-[#F5F1EB]">
                  {loading ? "-" : myRidesCount}
                </div>
                <div className="text-[11px] font-semibold text-[#77716D] dark:text-[#A8A29D]">
                  Rides
                </div>
              </div>

              {/* Lost & Found */}
              <div className="space-y-1 px-1">
                <div className="text-2xl font-black text-[#242424] dark:text-[#F5F1EB]">
                  {loading ? "-" : myLostFoundCount}
                </div>
                <div className="text-[11px] font-semibold text-[#77716D] dark:text-[#A8A29D]">
                  Lost &amp; Found
                </div>
              </div>

              {/* Listings */}
              <div className="space-y-1 px-1">
                <div className="text-2xl font-black text-[#242424] dark:text-[#F5F1EB]">
                  {loading ? "-" : myListingsCount}
                </div>
                <div className="text-[11px] font-semibold text-[#77716D] dark:text-[#A8A29D]">
                  Listings
                </div>
              </div>
            </div>

            {!isAuthenticated && (
              <p className="text-[11px] text-[#77716D] text-center pt-2 border-t border-[#E8DED5]/60 dark:border-[#332D27]">
                <Link
                  href="/auth/login"
                  className="text-[#B9573B] font-bold hover:underline"
                >
                  Sign in
                </Link>{" "}
                to view your personal activity.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 4. POST OR REGISTER MODAL (TRIGGERED BY HERO BUTTON) */}
      {/* ============================================================== */}
      {showPostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#221F1B] rounded-3xl p-6 border border-[#E8DED5] dark:border-[#332D27] shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8DED5] dark:border-[#332D27]">
              <div>
                <h3 className="text-base font-black text-[#242424] dark:text-[#F5F1EB]">
                  Post or Register on Campus
                </h3>
                <p className="text-xs text-[#77716D] dark:text-[#A8A29D]">
                  Select the campus service you want to use
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPostModal(false)}
                className="p-1 rounded-full text-[#77716D] hover:text-[#242424] dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 pt-1">
              <Link
                href="/rides"
                onClick={() => setShowPostModal(false)}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F7F4EE] hover:bg-[#FAF0EB] dark:bg-[#1E1B18] dark:hover:bg-[#2C241E] border border-[#E8DED5] dark:border-[#332D27] transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-[#FAF0EB] text-[#B9573B] group-hover:scale-105 transition-transform">
                    <Car className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-[#242424] dark:text-[#F5F1EB]">
                      Offer a Campus Ride
                    </div>
                    <div className="text-xs text-[#77716D] dark:text-[#A8A29D]">
                      Cab pool to airport, stations & city
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#B9573B]" />
              </Link>

              <Link
                href="/train-buddy"
                onClick={() => setShowPostModal(false)}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F7F4EE] hover:bg-[#FAF0EB] dark:bg-[#1E1B18] dark:hover:bg-[#2C241E] border border-[#E8DED5] dark:border-[#332D27] transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-[#FAF0EB] text-[#B9573B] group-hover:scale-105 transition-transform">
                    <Train className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-[#242424] dark:text-[#F5F1EB]">
                      Post Train Journey
                    </div>
                    <div className="text-xs text-[#77716D] dark:text-[#A8A29D]">
                      Find classmates traveling on your train
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#B9573B]" />
              </Link>

              <Link
                href="/lost-found/report-lost"
                onClick={() => setShowPostModal(false)}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F7F4EE] hover:bg-[#FAF0EB] dark:bg-[#1E1B18] dark:hover:bg-[#2C241E] border border-[#E8DED5] dark:border-[#332D27] transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-[#FAF0EB] text-[#B9573B] group-hover:scale-105 transition-transform">
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-[#242424] dark:text-[#F5F1EB]">
                      Report Lost Item
                    </div>
                    <div className="text-xs text-[#77716D] dark:text-[#A8A29D]">
                      Lost your belongings on campus
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#B9573B]" />
              </Link>

              <Link
                href="/lost-found/register-found"
                onClick={() => setShowPostModal(false)}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F7F4EE] hover:bg-[#FAF0EB] dark:bg-[#1E1B18] dark:hover:bg-[#2C241E] border border-[#E8DED5] dark:border-[#332D27] transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-[#E0EFF9] text-[#6698C2] group-hover:scale-105 transition-transform">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-[#242424] dark:text-[#F5F1EB]">
                      Register Found Item
                    </div>
                    <div className="text-xs text-[#77716D] dark:text-[#A8A29D]">
                      Found someone&apos;s item with secret claim question
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#6698C2]" />
              </Link>

              <Link
                href="/marketplace/create"
                onClick={() => setShowPostModal(false)}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F7F4EE] hover:bg-[#FAF0EB] dark:bg-[#1E1B18] dark:hover:bg-[#2C241E] border border-[#E8DED5] dark:border-[#332D27] transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-[#FAF0EB] text-[#B9573B] group-hover:scale-105 transition-transform">
                    <Tag className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-[#242424] dark:text-[#F5F1EB]">
                      Sell on Marketplace
                    </div>
                    <div className="text-xs text-[#77716D] dark:text-[#A8A29D]">
                      List textbooks, tech gadgets, cycle, or dorm supplies
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#B9573B]" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
