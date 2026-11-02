'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, ArrowLeft, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import type { Listing } from '@docs/types';
import { api } from '@/lib/api';
import { useToast } from '@/lib/toast-context';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ItemCardSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';

export default function WishlistPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [wishlistItems, setWishlistItems] = useState<Listing[]>([]);

  useEffect(() => {
    async function loadWishlist() {
      try {
        setLoading(true);
        const items = await api.marketplace.getWishlist();
        setWishlistItems(items);
      } catch (err) {
        console.error('Failed to load wishlist:', err);
      } finally {
        setLoading(false);
      }
    }
    loadWishlist();
  }, []);

  const handleRemove = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();

    setWishlistItems((prev) => prev.filter((i) => i.id !== id));
    try {
      await api.marketplace.toggleWishlist(id);
      toast.info('Item removed from wishlist');
    } catch {
      toast.error('Failed to remove item');
    }
  };

  return (
    <ProtectedRoute>
      <div className="space-y-6 animate-in fade-in">
        {/* Top Back Link */}
        <div>
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Marketplace</span>
          </Link>
        </div>

        {/* Title */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400">
              <Heart className="w-6 h-6 fill-rose-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                My Saved Wishlist
              </h1>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Keep track of marketplace listings you want to purchase.
              </p>
            </div>
          </div>

          <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
            {wishlistItems.length} Saved
          </span>
        </div>

        {/* Content Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((i) => (
              <ItemCardSkeleton key={i} />
            ))}
          </div>
        ) : wishlistItems.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="Your wishlist is empty"
            description="Browse campus marketplace gear and click the heart icon to save items for later."
            actionHref="/marketplace"
            actionLabel="Explore Marketplace"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {wishlistItems.map((item) => (
              <Link
                key={item.id}
                href={`/marketplace/${item.id}`}
                className="group flex flex-col rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-xs hover:shadow-lg transition-all hover:border-purple-300 dark:hover:border-purple-700"
              >
                <div className="relative h-48 w-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                  <img
                    src={item.imageUrls[0] || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80'}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-neutral-900/90 text-white backdrop-blur-xs shadow-md">
                      ${item.price.toFixed(2)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleRemove(e, item.id)}
                    aria-label="Remove from wishlist"
                    className="absolute top-3 right-3 p-2 rounded-full bg-white/90 dark:bg-neutral-900/90 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-md"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-1">
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
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
                      View Item <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
