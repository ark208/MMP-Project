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
          className={`p-2 rounded-xl text-[#77716D] hover:text-[#B9573B] hover:bg-[#FAF0EB] dark:hover:bg-[#34241E] transition-colors ${className}`}
        >
          <Flag className="w-4 h-4" />
        </button>
      ) : variant === 'text' ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`inline-flex items-center gap-1.5 text-xs text-[#77716D] hover:text-[#B9573B] font-medium transition-colors ${className}`}
        >
          <Flag className="w-3.5 h-3.5" />
          <span>{label}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E8DED5] dark:border-[#332D27] text-xs font-semibold text-[#77716D] hover:text-[#B9573B] hover:border-[#B9573B]/40 hover:bg-[#FAF0EB]/60 dark:hover:bg-[#34241E]/40 transition-all ${className}`}
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
