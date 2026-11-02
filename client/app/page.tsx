'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Search,
  CheckCircle,
  ShoppingBag,
  ArrowRight,
  MapPin,
  Calendar,
  Sparkles,
  HelpCircle,
  Tag,
  ShieldCheck,
  TrendingUp,
  Car,
  Train,
  Users,
} from 'lucide-react';
import type { LostItem, Listing, Ride } from '@docs/types';
import { ExtendedFoundItem } from '@/lib/mock-data';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { ItemCardSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';

export default function Home() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [lostItems, setLostItems] = useState<LostItem[]>([]);
  const [foundItems, setFoundItems] = useState<ExtendedFoundItem[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [rides, setRides] = useState<Ride[]>([]);

  useEffect(() => {
    async function loadFeed() {
      try {
        setLoading(true);
        const [feedData, ridesData] = await Promise.all([
          api.feed.getSummary(),
          api.rides.list().catch(() => []),
        ]);
        setLostItems(feedData.lost);
        setFoundItems(feedData.found);
        setListings(feedData.marketplace);
        setRides(ridesData.slice(0, 3));
      } catch (err) {
        console.error('Failed to load home feed:', err);
      } finally {
        setLoading(false);
      }
    }
    loadFeed();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
            <span>Campus Community Loop • Fall 2026</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}!
          </h1>
          <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed">
            Your verified hub for Lost & Found, student-to-student Marketplace, Campus Cab Splitting, and Train Buddy Radar.
          </p>

          <div className="pt-2 flex flex-wrap gap-2.5">
            <Link
              href="/rides"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-emerald-900 hover:bg-emerald-50 text-xs sm:text-sm font-bold shadow-md transition-all hover:scale-102"
            >
              <Car className="w-4 h-4 text-emerald-600" />
              <span>Campus Rides</span>
            </Link>
            <Link
              href="/train-buddy"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-800/80 hover:bg-emerald-800 text-white border border-white/20 text-xs sm:text-sm font-bold shadow-md transition-all hover:scale-102"
            >
              <Train className="w-4 h-4 text-amber-300" />
              <span>Train Buddy Radar</span>
            </Link>
            <Link
              href="/lost-found"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-800/80 hover:bg-emerald-800 text-white border border-white/20 text-xs sm:text-sm font-bold shadow-md transition-all hover:scale-102"
            >
              <Search className="w-4 h-4 text-emerald-300" />
              <span>Lost & Found</span>
            </Link>
            <Link
              href="/marketplace"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-800/80 hover:bg-emerald-800 text-white border border-white/20 text-xs sm:text-sm font-bold shadow-md transition-all hover:scale-102"
            >
              <Tag className="w-4 h-4 text-purple-300" />
              <span>Marketplace</span>
            </Link>
          </div>
        </div>

        {/* Decorative background shapes */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none hidden lg:block">
          <div className="w-80 h-80 rounded-full bg-white blur-3xl -mr-20 -mt-20"></div>
        </div>
      </section>

      {/* Campus Quick Stats */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Link
          href="/rides"
          className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-800 transition-all text-center sm:text-left group"
        >
          <div className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">Campus Rides</div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {loading ? '...' : rides.length}
          </div>
          <div className="text-[11px] text-neutral-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors hidden sm:block mt-0.5">
            Join or share &rarr;
          </div>
        </Link>

        <Link
          href="/train-buddy"
          className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-800 transition-all text-center sm:text-left group"
        >
          <div className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">Train Radar</div>
          <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
            Active
          </div>
          <div className="text-[11px] text-neutral-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors hidden sm:block mt-0.5">
            Match buddies &rarr;
          </div>
        </Link>

        <Link
          href="/lost-found"
          className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-800 transition-all text-center sm:text-left group"
        >
          <div className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">Lost & Found</div>
          <div className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
            {loading ? '...' : lostItems.length + foundItems.length}
          </div>
          <div className="text-[11px] text-neutral-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors hidden sm:block mt-0.5">
            View active items &rarr;
          </div>
        </Link>

        <Link
          href="/marketplace"
          className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-800 transition-all text-center sm:text-left group"
        >
          <div className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">Campus Listings</div>
          <div className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">
            {loading ? '...' : listings.length}
          </div>
          <div className="text-[11px] text-neutral-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors hidden sm:block mt-0.5">
            Explore deals &rarr;
          </div>
        </Link>
      </section>

      {/* ============================================================== */}
      {/* 1. LATEST LOST ITEMS FEED */}
      {/* ============================================================== */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              <Search className="w-4 h-4" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight">Recent Lost Items</h2>
          </div>
          <Link
            href="/lost-found?tab=lost"
            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <ItemCardSkeleton key={i} />
            ))}
          </div>
        ) : lostItems.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No lost items reported yet"
            description="All campus items are currently accounted for."
            actionHref="/lost-found/report-lost"
            actionLabel="Report Lost Item"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {lostItems.map((item) => (
              <Link
                key={item.id}
                href={`/lost-found/${item.id}`}
                className="group flex flex-col rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-xs hover:shadow-md transition-all hover:border-emerald-300 dark:hover:border-emerald-800"
              >
                <div className="relative h-44 w-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                  <img
                    src={item.imageUrl || 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=600&q=80'}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2.5 left-2.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-600 text-white shadow-xs">
                      LOST
                    </span>
                  </div>
                  <div className="absolute top-2.5 right-2.5">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white/90 dark:bg-neutral-900/90 text-neutral-800 dark:text-neutral-200 backdrop-blur-xs">
                      {item.category}
                    </span>
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 mt-1 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 space-y-1 text-[11px] text-neutral-500 dark:text-neutral-400">
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">{item.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      <span>{new Date(item.dateLost).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ============================================================== */}
      {/* 2. RECENTLY FOUND ITEMS FEED */}
      {/* ============================================================== */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="w-4 h-4" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight">Safely Recovered / Found</h2>
          </div>
          <Link
            href="/lost-found?tab=found"
            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <ItemCardSkeleton key={i} />
            ))}
          </div>
        ) : foundItems.length === 0 ? (
          <EmptyState
            icon={CheckCircle}
            title="No found items listed right now"
            description="Have you found something that belongs to a peer? Register it to return it safely."
            actionHref="/lost-found/register-found"
            actionLabel="Register Found Item"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {foundItems.map((item) => (
              <Link
                key={item.id}
                href={`/lost-found/${item.id}`}
                className="group flex flex-col rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-xs hover:shadow-md transition-all hover:border-emerald-300 dark:hover:border-emerald-800"
              >
                <div className="relative h-44 w-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                  <img
                    src={item.imageUrl || 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80'}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2.5 left-2.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-600 text-white shadow-xs">
                      FOUND
                    </span>
                  </div>
                  <div className="absolute top-2.5 right-2.5">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white/90 dark:bg-neutral-900/90 text-neutral-800 dark:text-neutral-200 backdrop-blur-xs">
                      {item.category}
                    </span>
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 mt-1 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 space-y-1 text-[11px] text-neutral-500 dark:text-neutral-400">
                    <div className="flex items-center gap-1.5 truncate">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span className="truncate">{item.keptAt || 'Campus Custody'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      <span>{new Date(item.dateFound).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ============================================================== */}
      {/* 3. CAMPUS MARKETPLACE FEED */}
      {/* ============================================================== */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight">Marketplace Highlights</h2>
          </div>
          <Link
            href="/marketplace"
            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
          >
            <span>Browse All Listings</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <ItemCardSkeleton key={i} />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title="No items for sale"
            description="Declutter your dorm room or sell your textbooks to peers."
            actionHref="/marketplace/create"
            actionLabel="Create Listing"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {listings.map((item) => (
              <Link
                key={item.id}
                href={`/marketplace/${item.id}`}
                className="group flex flex-col rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-xs hover:shadow-md transition-all hover:border-emerald-300 dark:hover:border-emerald-800"
              >
                <div className="relative h-44 w-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                  <img
                    src={item.imageUrls[0] || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80'}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2.5 left-2.5">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-neutral-900 text-white shadow-xs">
                      ${item.price.toFixed(2)}
                    </span>
                  </div>
                  <div className="absolute top-2.5 right-2.5">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white/90 dark:bg-neutral-900/90 text-neutral-800 dark:text-neutral-200 backdrop-blur-xs">
                      {item.condition.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 mt-1 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-[11px] text-neutral-500">
                    <span className="font-medium text-purple-600 dark:text-purple-400">{item.category}</span>
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
