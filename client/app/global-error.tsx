'use client';

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-[#F8F5F0] dark:bg-[#171513] text-[#242424] dark:text-[#F5F1EB] min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-3xl border border-[#E8DED5] dark:border-[#332D27] bg-white dark:bg-[#221F1B] text-center space-y-5 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-[#FAF0EB] dark:bg-[#34241E] text-[#B9573B] flex items-center justify-center mx-auto shadow-xs">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-black">Critical Error</h1>
            <p className="text-xs text-[#77716D]">
              A system error occurred. Please refresh the page to restore your campus session.
            </p>
          </div>
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#B9573B] hover:bg-[#9E452D] text-white font-bold text-xs transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reload Application</span>
          </button>
        </div>
      </body>
    </html>
  );
}
