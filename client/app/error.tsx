'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RefreshCw, Home, ArrowLeft } from 'lucide-react';

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
      <div className="max-w-md w-full p-8 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-center space-y-5 shadow-xl animate-in zoom-in-95">
        <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-sm">
          <AlertCircle className="w-7 h-7" />
        </div>

        <div className="space-y-1">
          <h2 className="text-xl font-black text-neutral-900 dark:text-white">
            Something went sideways
          </h2>
          <p className="text-xs text-neutral-500 leading-relaxed">
            An unexpected error occurred while loading this campus view.
          </p>
        </div>

        {error.message && (
          <div className="p-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800/60 text-left text-[11px] font-mono text-neutral-600 dark:text-neutral-400 max-h-24 overflow-y-auto break-words">
            {error.message}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={reset}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all active:scale-98"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>

          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 font-bold text-xs text-neutral-700 dark:text-neutral-300 transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Campus Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

