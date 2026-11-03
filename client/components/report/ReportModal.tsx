'use client';

import React, { useState } from 'react';
import {
  Flag,
  AlertTriangle,
  X,
  CheckCircle2,
  ShieldAlert,
  Loader2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/lib/toast-context';
import type { ReportTargetType } from '@docs/types';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetId: string;
  targetTitle?: string;
}

const REPORT_REASONS = [
  'Spam, fraudulent post, or commercial advertising',
  'Inappropriate, offensive, or harassing content',
  'Misleading, fake, or inaccurate information',
  'Prohibited, restricted, or stolen item',
  'Safety hazard, no-show, or peer misconduct',
  'Other campus community guidelines violation',
];

export function ReportModal({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetTitle,
}: ReportModalProps) {
  const toast = useToast();
  const [selectedReason, setSelectedReason] = useState<string>(REPORT_REASONS[0]);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReason) return;

    try {
      setSubmitting(true);
      await api.reports.create({
        targetType,
        targetId,
        reason: selectedReason,
        details: details.trim() || undefined,
      });

      toast.success('Report submitted. Our campus moderators will review this promptly.');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getTargetLabel = () => {
    switch (targetType) {
      case 'LISTING':
        return 'Marketplace Listing';
      case 'RIDE':
        return 'Ride Share Offer';
      case 'LOST':
        return 'Lost Item Report';
      case 'FOUND':
        return 'Found Item Post';
      case 'USER':
        return 'User Account';
      default:
        return 'Post';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-2xl space-y-4 animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-neutral-900 dark:text-white">
                Report {getTargetLabel()}
              </h3>
              {targetTitle && (
                <p className="text-xs text-neutral-500 truncate max-w-[220px]">
                  &quot;{targetTitle}&quot;
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-neutral-400 hover:text-neutral-600 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block">
              Reason for reporting:
            </label>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {REPORT_REASONS.map((reason) => (
                <label
                  key={reason}
                  className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    selectedReason === reason
                      ? 'border-rose-400 dark:border-rose-700 bg-rose-50/50 dark:bg-rose-950/20 font-semibold text-rose-900 dark:text-rose-200 shadow-2xs'
                      : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="reportReason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={() => setSelectedReason(reason)}
                    className="mt-0.5 text-rose-600 focus:ring-rose-500"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block">
              Additional Details (Optional)
            </label>
            <textarea
              rows={3}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Explain why this content violates community guidelines..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs focus:ring-2 focus:ring-rose-500 outline-none resize-none text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400"
            />
          </div>

          <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-700 text-[11px] text-neutral-500 leading-relaxed">
            CampusLoop administrators review flagged content. Offending posts will be removed and repeat violators banned.
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 disabled:opacity-50 transition-all"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Flag className="w-3.5 h-3.5" />
                  <span>Submit Report</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

