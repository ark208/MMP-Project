import React from 'react';
import Link from 'next/link';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  onActionClick?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionHref,
  actionLabel,
  onActionClick,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-3xl border border-dashed border-[#E8DED5] dark:border-[#332D27] bg-white/60 dark:bg-[#221F1B]/40 my-6">
      <div className="w-16 h-16 rounded-2xl bg-[#FAF0EB] dark:bg-[#34241E] flex items-center justify-center text-[#B9573B] mb-4 shadow-xs">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-bold text-[#242424] dark:text-[#F5F1EB] mb-1">{title}</h3>
      <p className="text-sm text-[#77716D] dark:text-[#A8A29D] max-w-md mb-6 leading-relaxed">
        {description}
      </p>

      {actionHref && actionLabel && (
        <Link
          href={actionHref}
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-[#B9573B] hover:bg-[#9E452D] text-white text-sm font-semibold shadow-xs transition-all hover:shadow-sm"
        >
          {actionLabel}
        </Link>
      )}

      {!actionHref && onActionClick && actionLabel && (
        <button
          onClick={onActionClick}
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-[#B9573B] hover:bg-[#9E452D] text-white text-sm font-semibold shadow-xs transition-all hover:shadow-sm"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
