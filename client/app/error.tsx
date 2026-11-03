'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('CampusLoop Application Error:', error);
  }, [error]);

  return (
    <div className="min-h-[65vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full p-8 rounded-3xl border border-[#E8DED5] dark:border-[#332D27] bg-white dark:bg-[#221F1B] text-center space-y-5 shadow-xl animate-in zoom-in-95">
        <div className="w-14 h-14 rounded-2xl bg-[#FAF0EB] dark:bg-[#34241E] text-[#B9573B] flex items-center justify-center mx-auto shadow-xs">
          <AlertCircle className="w-7 h-7" />
        </div>

        <div className="space-y-1">
          <h2 className="text-xl font-black text-[#242424] dark:text-[#F5F1EB]">
            Something went sideways
          </h2>
          <p className="text-xs text-[#77716D] dark:text-[#A8A29D] leading-relaxed">
            An unexpected error occurred while loading this campus view.
          </p>
        </div>

        {error.message && (
          <div className="p-3 rounded-2xl bg-[#F8F5F0] dark:bg-[#1E1B18] text-left text-[11px] font-mono text-[#77716D] dark:text-[#A8A29D] max-h-24 overflow-y-auto break-words border border-[#E8DED5] dark:border-[#332D27]">
            {error.message}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={reset}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#B9573B] hover:bg-[#9E452D] text-white font-bold text-xs shadow-xs transition-all active:scale-98"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>

          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-[#E8DED5] dark:border-[#332D27] hover:bg-[#F8F5F0] dark:hover:bg-[#2A2521] font-bold text-xs text-[#242424] dark:text-[#F5F1EB] transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Campus Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
