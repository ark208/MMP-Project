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
      <div className="w-full max-w-md bg-white dark:bg-[#221F1B] rounded-3xl p-6 border border-[#E8DED5] dark:border-[#332D27] shadow-2xl space-y-4 animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-[#E8DED5] dark:border-[#332D27]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#FAF0EB] dark:bg-[#34241E] text-[#B9573B]">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-[#242424] dark:text-[#F5F1EB]">
                Report {getTargetLabel()}
              </h3>
              {targetTitle && (
                <p className="text-xs text-[#77716D] dark:text-[#A8A29D] truncate max-w-[220px]">
                  {targetTitle}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-[#77716D] hover:text-[#242424] dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#242424] dark:text-[#F5F1EB]">
              Reason for Report <span className="text-[#B9573B]">*</span>
            </label>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {REPORT_REASONS.map((reason) => (
                <label
                  key={reason}
                  className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    selectedReason === reason
                      ? 'border-[#B9573B] bg-[#FAF0EB]/60 dark:bg-[#34241E]/50 font-bold text-[#242424] dark:text-[#F5F1EB]'
                      : 'border-[#E8DED5] dark:border-[#332D27] bg-white dark:bg-[#221F1B] text-[#77716D] hover:bg-[#F8F5F0] dark:hover:bg-[#2A2521]'
                  }`}
                >
                  <input
                    type="radio"
                    name="reportReason"
                    checked={selectedReason === reason}
                    onChange={() => setSelectedReason(reason)}
                    className="mt-0.5 text-[#B9573B] focus:ring-[#B9573B]"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#242424] dark:text-[#F5F1EB]">
              Additional Context (Optional)
            </label>
            <textarea
              rows={3}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Provide any details to help campus moderators investigate..."
              className="w-full p-3 rounded-xl border border-[#E8DED5] dark:border-[#332D27] bg-[#F8F5F0]/50 dark:bg-[#1E1B18]/50 text-xs text-[#242424] dark:text-[#F5F1EB] placeholder-[#77716D] focus:outline-none focus:ring-2 focus:ring-[#B9573B]/30 resize-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl border border-[#E8DED5] dark:border-[#332D27] text-xs font-bold text-[#77716D] hover:bg-[#F8F5F0] dark:hover:bg-[#2A2521] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#B9573B] hover:bg-[#9E452D] text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50"
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
