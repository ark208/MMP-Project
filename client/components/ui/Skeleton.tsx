import React from 'react';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`skeleton-shimmer rounded-lg bg-[#E8DED5]/50 dark:bg-[#2C2723]/60 ${className}`}
      aria-hidden="true"
    />
  );
}

export function ItemCardSkeleton() {
  return (
    <div className="p-4 rounded-2xl border border-[#E8DED5] dark:border-[#332D27] bg-white dark:bg-[#221F1B] shadow-xs space-y-3">
      <Skeleton className="w-full h-44 rounded-xl" />
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="pt-2 border-t border-[#E8DED5]/60 dark:border-[#332D27] flex justify-between items-center">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
    </div>
  );
}
