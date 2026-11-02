'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Search,
  Filter,
  CheckCircle,
  HelpCircle,
  MapPin,
  Calendar,
  Sparkles,
  ShieldCheck,
  CheckCheck,
} from 'lucide-react';
import type { LostItem } from '@docs/types';
import { ExtendedFoundItem } from '@/lib/mock-data';
import { api } from '@/lib/api';
import { ItemCardSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';

const CATEGORIES = [
  'ALL',
  'Electronics',
  'Stationery',
  'Personal',
  'Accessories',
  'Bags',
  'Books',
  'Clothing',
  'Other',
];

const STATUSES = ['ALL', 'OPEN', 'CLAIMED', 'RESOLVED'];

function LostFoundContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'found' ? 'found' : searchParams.get('tab') === 'lost' ? 'lost' : 'all';

  const [activeTab, setActiveTab] = useState<'all' | 'lost' | 'found'>(initialTab);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [loading, setLoading] = useState(true);
  const [lostItems, setLostItems] = useState<LostItem[]>([]);
  const [foundItems, setFoundItems] = useState<ExtendedFoundItem[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [lost, found] = await Promise.all([
          api.lost.list({
            category: selectedCategory,
            status: selectedStatus,
            q: searchQuery,
          }),
          api.found.list({
            category: selectedCategory,
            status: selectedStatus,
            q: searchQuery,
          }),
        ]);
        setLostItems(lost);
        setFoundItems(found);
      } catch (err) {
        console.error('Error fetching items:', err);
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(() => {
      fetchData();
    }, 150);

    return () => clearTimeout(timer);
  }, [activeTab, selectedCategory, selectedStatus, searchQuery]);

  // Combine or filter items based on tab
  type UnifiedItem = {
    type: 'lost' | 'found';
    item: LostItem | ExtendedFoundItem;
  };

  const unifiedList: UnifiedItem[] = [];

  if (activeTab === 'all' || activeTab === 'lost') {
    lostItems.forEach((item) => unifiedList.push({ type: 'lost', item }));
  }
  if (activeTab === 'all' || activeTab === 'found') {
    foundItems.forEach((item) => unifiedList.push({ type: 'found', item }));
  }

  // Sort by created date descending
  unifiedList.sort(
    (a, b) =>
      new Date(b.item.createdAt).getTime() - new Date(a.item.createdAt).getTime()
  );

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Lost & Found Desk
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Search reports, file a missing item, or safely return what you found.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/lost-found/report-lost"
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition-all"
          >
            <HelpCircle className="w-4 h-4" />
            <span>Report Lost</span>
          </Link>
          <Link
            href="/lost-found/register-found"
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition-all"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Register Found</span>
          </Link>
        </div>
      </div>

      {/* Tabs: All / Lost / Found */}
      <div className="flex border-b border-neutral-200 dark:border-neutral-800">
        <button
          onClick={() => setActiveTab('all')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'all'
              ? 'border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400'
              : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
          }`}
        >
          All Items ({lostItems.length + foundItems.length})
        </button>
        <button
          onClick={() => setActiveTab('lost')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'lost'
              ? 'border-rose-600 text-rose-600 dark:border-rose-400 dark:text-rose-400'
              : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
          }`}
        >
          Lost Belongings ({lostItems.length})
        </button>
        <button
          onClick={() => setActiveTab('found')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'found'
              ? 'border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400'
              : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
          }`}
        >
          Found in Custody ({foundItems.length})
        </button>
      </div>

      {/* Search & Filters */}
      <div className="space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by keywords, title, location (e.g. AirPods, Library, Gym)..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder:text-neutral-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-xs"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-col gap-2.5">
          {/* Categories */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            <span className="font-bold text-neutral-500 shrink-0 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Category:
            </span>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-all ${
                  selectedCategory === cat
                    ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 font-bold shadow-xs'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Statuses */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            <span className="font-bold text-neutral-500 shrink-0 mr-1">Status:</span>
            {STATUSES.map((stat) => (
              <button
                key={stat}
                onClick={() => setSelectedStatus(stat)}
                className={`px-3 py-1 rounded-lg whitespace-nowrap font-medium transition-all ${
                  selectedStatus === stat
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                }`}
              >
                {stat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid of Items */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <ItemCardSkeleton key={i} />
          ))}
        </div>
      ) : unifiedList.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No items found"
          description="Try clearing your search query or switching categories."
          onActionClick={() => {
            setSelectedCategory('ALL');
            setSelectedStatus('ALL');
            setSearchQuery('');
          }}
          actionLabel="Reset Filters"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {unifiedList.map(({ type, item }) => {
            const isLost = type === 'lost';
            const isResolved = item.status === 'RESOLVED';
            const isClaimed = item.status === 'CLAIMED';

            const defaultImg = isLost
              ? 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=600&q=80'
              : 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80';

            return (
              <Link
                key={item.id}
                href={`/lost-found/${item.id}`}
                className="group flex flex-col rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-xs hover:shadow-lg transition-all hover:border-emerald-300 dark:hover:border-emerald-700"
              >
                {/* Image & Tags */}
                <div className="relative h-48 w-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                  <img
                    src={item.imageUrl || defaultImg}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Type badge */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-black shadow-md ${
                        isLost ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
                      }`}
                    >
                      {isLost ? 'LOST' : 'FOUND'}
                    </span>
                    {isResolved && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500 text-white shadow-md flex items-center gap-1">
                        <CheckCheck className="w-3.5 h-3.5" /> Reunited
                      </span>
                    )}
                    {isClaimed && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-600 text-white shadow-md">
                        Claim Pending
                      </span>
                    )}
                  </div>

                  <div className="absolute top-3 right-3">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/95 dark:bg-neutral-900/95 text-neutral-800 dark:text-neutral-200 backdrop-blur-xs shadow-xs">
                      {item.category}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
                      {item.title}
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 mt-1.5 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 space-y-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                    <div className="flex items-center gap-2 truncate">
                      <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="truncate font-medium">{item.location}</span>
                    </div>

                    {!isLost && (item as ExtendedFoundItem).keptAt && (
                      <div className="flex items-center gap-2 truncate text-blue-600 dark:text-blue-400">
                        <ShieldCheck className="w-4 h-4 shrink-0" />
                        <span className="truncate text-[11px] font-semibold">
                          Held at: {(item as ExtendedFoundItem).keptAt}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span>
                          {new Date(
                            isLost ? (item as LostItem).dateLost : (item as ExtendedFoundItem).dateFound
                          ).toLocaleDateString()}
                        </span>
                      </div>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold group-hover:underline">
                        View details &rarr;
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function LostFoundPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-neutral-400">Loading Lost & Found...</div>}>
      <LostFoundContent />
    </Suspense>
  );
}
