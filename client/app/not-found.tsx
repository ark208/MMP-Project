'use client';

import React from 'react';
import Link from 'next/link';
import {
  Compass,
  Home,
  Search,
  ShoppingBag,
  Car,
  Train,
  ArrowRight,
} from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-lg w-full text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
        {/* Campus Compass Graphic */}
        <div className="relative inline-block">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
            <Compass className="w-12 h-12 animate-pulse" />
          </div>
          <span className="absolute -bottom-2 -right-2 px-3 py-1 rounded-full text-xs font-black bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-md">
            404
          </span>
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight">
            Lost on Campus?
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto leading-relaxed">
            The hall, post, or route you are looking for has been moved, graduated, or doesn&apos;t exist on this campus.
          </p>
        </div>

        {/* Navigation shortcuts */}
        <div className="grid grid-cols-2 gap-3 text-left pt-2">
          <Link
            href="/lost-found"
            className="flex items-center gap-3 p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all group shadow-xs"
          >
            <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 shrink-0">
              <Search className="w-4 h-4" />
            </div>
            <div className="truncate">
              <div className="text-xs font-bold text-neutral-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                Lost &amp; Found
              </div>
              <div className="text-[10px] text-neutral-400 truncate">Report or find items</div>
            </div>
          </Link>

          <Link
            href="/marketplace"
            className="flex items-center gap-3 p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all group shadow-xs"
          >
            <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 shrink-0">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div className="truncate">
              <div className="text-xs font-bold text-neutral-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                Marketplace
              </div>
              <div className="text-[10px] text-neutral-400 truncate">Buy books &amp; dorm gear</div>
            </div>
          </Link>

          <Link
            href="/rides"
            className="flex items-center gap-3 p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all group shadow-xs"
          >
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0">
              <Car className="w-4 h-4" />
            </div>
            <div className="truncate">
              <div className="text-xs font-bold text-neutral-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                Campus Rides
              </div>
              <div className="text-[10px] text-neutral-400 truncate">Pool cabs &amp; split fares</div>
            </div>
          </Link>

          <Link
            href="/train-buddy"
            className="flex items-center gap-3 p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all group shadow-xs"
          >
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 shrink-0">
              <Train className="w-4 h-4" />
            </div>
            <div className="truncate">
              <div className="text-xs font-bold text-neutral-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                Train Buddy
              </div>
              <div className="text-[10px] text-neutral-400 truncate">Radar for travelers</div>
            </div>
          </Link>
        </div>

        {/* Back to Home CTA */}
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 font-bold text-xs shadow-md transition-all hover:scale-102"
          >
            <Home className="w-4 h-4" />
            <span>Take Me Back to Campus Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

