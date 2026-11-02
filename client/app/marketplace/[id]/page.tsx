'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Heart,
  Tag,
  ShieldCheck,
  Calendar,
  MessageCircle,
  Share2,
  CheckCheck,
  Sparkles,
} from 'lucide-react';
import type { Listing } from '@docs/types';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';
import { Skeleton } from '@/components/ui/Skeleton';

export default function MarketplaceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [listing, setListing] = useState<Listing | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    async function loadItem() {
      try {
        setLoading(true);
        const item = await api.marketplace.get(id);
        setListing(item);
      } catch (err) {
        console.error('Failed to load listing:', err);
      } finally {
        setLoading(false);
      }
    }

    if (id) loadItem();
  }, [id]);

  const toggleWishlist = async () => {
    if (!listing) return;

    // Optimistic toggle
    const nextState = !listing.isWishlisted;
    setListing({ ...listing, isWishlisted: nextState });

    try {
      const res = await api.marketplace.toggleWishlist(listing.id);
      if (res.isWishlisted) {
        toast.success('Added to your wishlist');
      } else {
        toast.info('Removed from your wishlist');
      }
    } catch {
      toast.error('Failed to update wishlist');
      setListing({ ...listing, isWishlisted: !nextState });
    }
  };

  const handleContactSeller = () => {
    if (!isAuthenticated) {
      router.push(`/auth/login?redirect=/marketplace/${id}`);
      return;
    }
    toast.success(`Connected! You can email ${listing?.seller?.email || 'the seller'} directly.`);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-6 space-y-6">
        <Skeleton className="h-6 w-32 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Skeleton className="h-96 w-full rounded-3xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-4">
        <h2 className="text-xl font-bold">Listing Not Found</h2>
        <p className="text-sm text-neutral-500">
          This listing may have been sold or removed by the seller.
        </p>
        <Link
          href="/marketplace"
          className="inline-flex px-4 py-2 rounded-xl bg-purple-600 text-white text-sm font-semibold"
        >
          Back to Marketplace
        </Link>
      </div>
    );
  }

  const isSold = listing.status === 'SOLD';
  const isReserved = listing.status === 'RESERVED';

  return (
    <div className="max-w-4xl mx-auto py-4 px-2 sm:px-0 space-y-6 animate-in fade-in">
      {/* Back Link */}
      <div>
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Marketplace</span>
        </Link>
      </div>

      {/* Main Grid: Gallery on left, Details on right */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Left: Image Gallery */}
        <div className="space-y-3">
          {/* Main Display Image */}
          <div className="relative h-80 sm:h-96 w-full rounded-3xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800 shadow-md">
            <img
              src={
                listing.imageUrls[activeImageIndex] ||
                'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80'
              }
              alt={listing.title}
              className="w-full h-full object-cover"
            />

            {/* Condition badge */}
            <div className="absolute top-4 left-4">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-purple-600 text-white shadow-md">
                {listing.condition.replace('_', ' ')}
              </span>
            </div>

            {/* Status if Reserved or Sold */}
            {isReserved && (
              <div className="absolute top-4 right-4">
                <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-500 text-white shadow-md">
                  RESERVED
                </span>
              </div>
            )}
            {isSold && (
              <div className="absolute top-4 right-4">
                <span className="px-3 py-1 rounded-full text-xs font-black bg-neutral-800 text-white shadow-md">
                  SOLD
                </span>
              </div>
            )}
          </div>

          {/* Thumbnails row (multi-image) */}
          {listing.imageUrls.length > 1 && (
            <div className="flex gap-2.5 overflow-x-auto pb-1">
              {listing.imageUrls.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative w-20 h-20 rounded-2xl overflow-hidden border-2 shrink-0 transition-all ${
                    activeImageIndex === idx
                      ? 'border-purple-600 ring-2 ring-purple-600/30 scale-102'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={url} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Details & Seller Box */}
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                {listing.category}
              </span>
              <button
                onClick={toggleWishlist}
                className={`p-2.5 rounded-full border transition-all ${
                  listing.isWishlisted
                    ? 'border-rose-200 bg-rose-50 dark:bg-rose-950/60 text-rose-500 shadow-sm'
                    : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                }`}
                title={listing.isWishlisted ? 'Saved in Wishlist' : 'Add to Wishlist'}
              >
                <Heart className={`w-5 h-5 ${listing.isWishlisted ? 'fill-current' : ''}`} />
              </button>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight">
              {listing.title}
            </h1>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-neutral-900 dark:text-white">
                ${listing.price.toFixed(2)}
              </span>
              <span className="text-xs text-neutral-400 font-medium">USD • Direct student sale</span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Item Details & Condition
            </h3>
            <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-line bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs">
              {listing.description}
            </p>
          </div>

          {/* Seller Card */}
          <div className="p-4 rounded-2xl bg-neutral-100/70 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Campus Seller
            </div>
            <div className="flex items-center gap-3">
              <img
                src={
                  listing.seller?.avatarUrl ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'
                }
                alt={listing.seller?.name || 'Seller'}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-purple-500/30"
              />
              <div className="flex-1 truncate">
                <div className="font-bold text-sm text-neutral-900 dark:text-white flex items-center gap-1.5">
                  <span>{listing.seller?.name || 'Alex Chen'}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                    Verified Student
                  </span>
                </div>
                <div className="text-xs text-neutral-500 truncate mt-0.5">
                  {listing.seller?.email || 'student@campus.edu'}
                </div>
              </div>
            </div>

            <div className="text-[11px] text-neutral-500 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>CampusLoop Verified • Safe exchange on campus grounds</span>
            </div>
          </div>

          {/* Contact Seller Button */}
          <div className="space-y-2">
            <button
              onClick={handleContactSeller}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md transition-all active:scale-98"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Contact Seller to Purchase</span>
            </button>
            <p className="text-[11px] text-center text-neutral-400">
              Tip: Meet in populated campus locations like the Student Union or Library Cafe.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
