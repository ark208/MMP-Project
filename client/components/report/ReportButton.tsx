'use client';

import React, { useState } from 'react';
import { Flag } from 'lucide-react';
import { ReportModal } from './ReportModal';
import type { ReportTargetType } from '@docs/types';

interface ReportButtonProps {
  targetType: ReportTargetType;
  targetId: string;
  targetTitle?: string;
  className?: string;
  variant?: 'icon' | 'text' | 'button';
  label?: string;
}

export function ReportButton({
  targetType,
  targetId,
  targetTitle,
  className = '',
  variant = 'button',
  label = 'Report',
}: ReportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {variant === 'icon' ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          title={`Report this ${targetType.toLowerCase()}`}
          className={`p-2 rounded-xl text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors ${className}`}
        >
          <Flag className="w-4 h-4" />
        </button>
      ) : variant === 'text' ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 font-medium transition-colors ${className}`}
        >
          <Flag className="w-3.5 h-3.5" />
          <span>{label}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-300 dark:hover:border-rose-900/60 hover:bg-rose-50/50 dark:hover:bg-rose-950/30 transition-all ${className}`}
        >
          <Flag className="w-3.5 h-3.5" />
          <span>{label}</span>
        </button>
      )}

      <ReportModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        targetType={targetType}
        targetId={targetId}
        targetTitle={targetTitle}
      />
    </>
  );
}

