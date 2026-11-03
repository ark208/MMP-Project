'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ShieldAlert, ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();

  if (isLoading) {
    return (
      <div className="p-6 max-w-xl mx-auto space-y-4">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-3xl border border-[#E8DED5] dark:border-[#332D27] bg-white dark:bg-[#221F1B] shadow-xl text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[#FAF0EB] dark:bg-[#34241E] flex items-center justify-center text-[#B9573B] shadow-xs">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-[#242424] dark:text-[#F5F1EB]">
            Campus Authentication Required
          </h2>
          <p className="text-sm text-[#77716D] dark:text-[#A8A29D] leading-relaxed">
            This action requires a verified university account. Sign in with your campus email to continue.
          </p>
          <div className="pt-2">
            <Link
              href={`/auth/login?redirect=${encodeURIComponent(pathname || '/')}`}
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#B9573B] hover:bg-[#9E452D] text-white font-semibold text-sm shadow-xs transition-all hover:shadow"
            >
              <span>Sign in with University Email</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
