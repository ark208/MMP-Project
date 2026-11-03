'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Search,
  Filter,
  Heart,
  Tag,
  DollarSign,
  PlusCircle,
  Sparkles,
} from 'lucide-react';
import type { Listing, ListingCondition } from '@docs/types';
import { api } from '@/lib/api';
import { useToast } from '@/lib/toast-context';
import { ItemCardSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { SafetyBanner } from '@/components/safety/SafetyBanner';

const CATEGORIES = [
  'ALL',
  'Books',
  'Electronics',
  'Furniture',
  'Appliances',
  'Clothing',
  'Accessories',
  'Other',
];

const CONDITIONS = ['ALL', 'NEW', 'LIKE_NEW', 'GOOD', 'FAIR'];

export default function MarketplacePage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<Listing[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedCondition, setSelectedCondition] = useState('ALL');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [showFiltersModal, setShowFiltersModal] = useState(false);

  useEffect(() => {
    async function loadListings() {
      try {
        setLoading(true);
        const items = await api.marketplace.list({
          q: searchQuery,
          category: selectedCategory,
          condition: selectedCondition,
          minPrice: minPrice ? parseFloat(minPrice) : undefined,
          maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        });
        setListings(items);
      } catch (err) {
        console.error('Failed to load listings:', err);
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(() => {
      loadListings();
    }, 150);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, selectedCondition, minPrice, maxPrice]);

  const toggleWishlist = async (e: React.MouseEvent, listingId: string) => {
    e.preventDefault();
    e.stopPropagation();

    // Optimistic UI update
    setListings((prev) =>
      prev.map((item) =>
        item.id === listingId ? { ...item, isWishlisted: !item.isWishlisted } : item
      )
    );

    try {
      const res = await api.marketplace.toggleWishlist(listingId);
      if (res.isWishlisted) {
        toast.success('Saved to your wishlist');
      } else {
        toast.info('Removed from your wishlist');
      }
    } catch {
      toast.error('Failed to update wishlist');
      // Rollback
      setListings((prev) =>
        prev.map((item) =>
          item.id === listingId ? { ...item, isWishlisted: !item.isWishlisted } : item
        )
      );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Campus Marketplace
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Buy, sell, and trade textbooks, dorm furniture, and gear with verified campus peers.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/marketplace/wishlist"
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-200 text-xs sm:text-sm font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors shadow-xs"
          >
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
            <span>Wishlist</span>
          </Link>

          <Link
            href="/marketplace/create"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Sell Item</span>
          </Link>
        </div>
      </div>

      {/* Safety Tips Banner */}
      <SafetyBanner type="marketplace" defaultExpanded={false} />

      {/* Search & Filters */}
      <div className="space-y-3">
        {/* Search row */}
        <div className="flex gap-2.5">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search listings (e.g. Calculus, Desk Chair, iPad, Mouse)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder:text-neutral-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-xs"
            />
          </div>

          <button
            onClick={() => setShowFiltersModal(!showFiltersModal)}
            className={`px-3.5 py-2.5 rounded-xl border text-sm font-semibold flex items-center gap-1.5 transition-colors ${
              minPrice || maxPrice || selectedCondition !== 'ALL'
                ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                : 'border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-200'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Price & Condition</span>
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="font-bold text-neutral-500 shrink-0 mr-1 flex items-center gap-1">
            <Tag className="w-3.5 h-3.5" /> Category:
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

        {/* Collapsible Filters: Price Range & Condition */}
        {showFiltersModal && (
          <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4 animate-in fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Condition */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
                  Condition
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {CONDITIONS.map((cond) => (
                    <button
                      key={cond}
                      onClick={() => setSelectedCondition(cond)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                        selectedCondition === cond
                          ? 'bg-emerald-600 text-white font-bold'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200'
                      }`}
                    >
                      {cond.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
                  Price Range ($)
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-xs text-neutral-400">
                      $
                    </span>
                    <input
                      type="number"
                      min="0"
                      placeholder="Min"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="w-full pl-6 pr-3 py-1.5 text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/50 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <span className="text-neutral-400 text-xs">to</span>
                  <div className="relative flex-1">
                    <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-xs text-neutral-400">
                      $
                    </span>
                    <input
                      type="number"
                      min="0"
                      placeholder="Max"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="w-full pl-6 pr-3 py-1.5 text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/50 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  {(minPrice || maxPrice || selectedCondition !== 'ALL') && (
                    <button
                      onClick={() => {
                        setMinPrice('');
                        setMaxPrice('');
                        setSelectedCondition('ALL');
                      }}
                      className="text-xs text-rose-500 hover:underline shrink-0"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Listings Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <ItemCardSkeleton key={i} />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No marketplace listings match your search"
          description="Try broadening your filters or be the first to list an item in this category!"
          actionHref="/marketplace/create"
          actionLabel="Sell an Item"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {listings.map((item) => (
            <Link
              key={item.id}
              href={`/marketplace/${item.id}`}
              className="group flex flex-col rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-xs hover:shadow-lg transition-all hover:border-emerald-300 dark:hover:border-emerald-700"
            >
              {/* Image & Wishlist Button */}
              <div className="relative h-48 w-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                <img
                  src={item.imageUrls[0] || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80'}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* Price tag */}
                <div className="absolute top-3 left-3">
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-neutral-900/90 text-white backdrop-blur-xs shadow-md">
                    ${item.price.toFixed(2)}
                  </span>
                </div>

                {/* Wishlist Heart Toggle */}
                <button
                  type="button"
                  onClick={(e) => toggleWishlist(e, item.id)}
                  aria-label={item.isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                  className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all ${
                    item.isWishlisted
                      ? 'bg-rose-500 text-white shadow-md scale-105'
                      : 'bg-white/80 dark:bg-neutral-900/80 text-neutral-600 dark:text-neutral-300 hover:text-rose-500 hover:scale-110 shadow-xs'
                  }`}
                >
                  <Heart
                    className={`w-4 h-4 ${item.isWishlisted ? 'fill-current' : ''}`}
                  />
                </button>

                {/* Condition Pill */}
                <div className="absolute bottom-2.5 left-3">
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-white/95 dark:bg-neutral-900/95 text-neutral-800 dark:text-neutral-200 backdrop-blur-xs shadow-xs">
                    {item.condition.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                <div>
                  <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 mt-1 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-[11px] text-neutral-500">
                  <span className="font-semibold text-purple-600 dark:text-purple-400">
                    {item.category}
                  </span>
                  <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
