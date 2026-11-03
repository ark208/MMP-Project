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
          <div className="w-24 h-24 rounded-3xl bg-[#B9573B] text-white flex items-center justify-center mx-auto shadow-xl shadow-[#B9573B]/20">
            <Compass className="w-12 h-12 animate-pulse" />
          </div>
          <span className="absolute -bottom-2 -right-2 px-3 py-1 rounded-full text-xs font-black bg-[#242424] dark:bg-white text-white dark:text-[#242424] shadow-md">
            404
          </span>
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black text-[#242424] dark:text-[#F5F1EB] tracking-tight">
            Lost on Campus?
          </h1>
          <p className="text-xs sm:text-sm text-[#77716D] dark:text-[#A8A29D] max-w-sm mx-auto leading-relaxed">
            The hall, post, or route you are looking for has been moved, graduated, or doesn&apos;t exist on this campus.
          </p>
        </div>

        {/* Navigation shortcuts */}
        <div className="grid grid-cols-2 gap-3 text-left pt-2">
          <Link
            href="/lost-found"
            className="flex items-center gap-3 p-3.5 rounded-2xl border border-[#E8DED5] dark:border-[#332D27] bg-white dark:bg-[#221F1B] hover:border-[#B9573B] transition-all group shadow-xs"
          >
            <div className="p-2 rounded-xl bg-[#FAF0EB] dark:bg-[#34241E] text-[#B9573B] shrink-0">
              <Search className="w-4 h-4" />
            </div>
            <div className="truncate">
              <div className="text-xs font-bold text-[#242424] dark:text-[#F5F1EB] group-hover:text-[#B9573B] transition-colors">
                Lost &amp; Found
              </div>
              <div className="text-[10px] text-[#77716D] dark:text-[#A8A29D] truncate">Report or find items</div>
            </div>
          </Link>

          <Link
            href="/marketplace"
            className="flex items-center gap-3 p-3.5 rounded-2xl border border-[#E8DED5] dark:border-[#332D27] bg-white dark:bg-[#221F1B] hover:border-[#6698C2] transition-all group shadow-xs"
          >
            <div className="p-2 rounded-xl bg-[#E0EFF9] dark:bg-[#1E2E3D] text-[#6698C2] shrink-0">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div className="truncate">
              <div className="text-xs font-bold text-[#242424] dark:text-[#F5F1EB] group-hover:text-[#6698C2] transition-colors">
                Marketplace
              </div>
              <div className="text-[10px] text-[#77716D] dark:text-[#A8A29D] truncate">Buy &amp; sell student items</div>
            </div>
          </Link>

          <Link
            href="/rides"
            className="flex items-center gap-3 p-3.5 rounded-2xl border border-[#E8DED5] dark:border-[#332D27] bg-white dark:bg-[#221F1B] hover:border-[#B9573B] transition-all group shadow-xs"
          >
            <div className="p-2 rounded-xl bg-[#FAF0EB] dark:bg-[#34241E] text-[#B9573B] shrink-0">
              <Car className="w-4 h-4" />
            </div>
            <div className="truncate">
              <div className="text-xs font-bold text-[#242424] dark:text-[#F5F1EB] group-hover:text-[#B9573B] transition-colors">
                Campus Rides
              </div>
              <div className="text-[10px] text-[#77716D] dark:text-[#A8A29D] truncate">Cab pool &amp; fare split</div>
            </div>
          </Link>

          <Link
            href="/train-buddy"
            className="flex items-center gap-3 p-3.5 rounded-2xl border border-[#E8DED5] dark:border-[#332D27] bg-white dark:bg-[#221F1B] hover:border-[#B9573B] transition-all group shadow-xs"
          >
            <div className="p-2 rounded-xl bg-[#FAF0EB] dark:bg-[#34241E] text-[#B9573B] shrink-0">
              <Train className="w-4 h-4" />
            </div>
            <div className="truncate">
              <div className="text-xs font-bold text-[#242424] dark:text-[#F5F1EB] group-hover:text-[#B9573B] transition-colors">
                Train Buddy
              </div>
              <div className="text-[10px] text-[#77716D] dark:text-[#A8A29D] truncate">Travel radar</div>
            </div>
          </Link>
        </div>

        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#B9573B] hover:bg-[#9E452D] text-white font-bold text-xs shadow-xs transition-all hover:shadow"
          >
            <Home className="w-4 h-4" />
            <span>Return to Campus Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
