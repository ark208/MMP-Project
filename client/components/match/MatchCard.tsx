'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  MapPin,
  Calendar,
  ShieldCheck,
  HelpCircle,
  ArrowRight,
  ExternalLink,
  Lock,
  Tag,
  Check,
  AlertCircle,
} from 'lucide-react';
import type { Match, MatchStatus } from '@docs/types';
import { api } from '@/lib/api';
import { useToast } from '@/lib/toast-context';
import { triggerConfetti } from '@/lib/confetti';

interface MatchCardProps {
  match: Match;
  onStatusChange?: (updated: Match) => void;
  className?: string;
  compact?: boolean;
}

export function MatchCard({
  match: initialMatch,
  onStatusChange,
  className = '',
  compact = false,
}: MatchCardProps) {
  const toast = useToast();
  const [match, setMatch] = useState<Match>(initialMatch);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // Claim modal state (when clicking "This is mine")
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [secretAnswer, setSecretAnswer] = useState('');
  const [claimNote, setClaimNote] = useState('');
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimSuccessData, setClaimSuccessData] = useState<{
    finderContact: { name: string; email?: string; phone?: string; holdingLocation?: string };
    message: string;
  } | null>(null);

  const percentage = Math.round(match.score * 100);

  const handleStatusUpdate = async (newStatus: MatchStatus) => {
    try {
      setLoadingAction(newStatus);
      const updated = await api.matches.updateStatus(match.id, newStatus);
      setMatch(updated);
      onStatusChange?.(updated);

      if (newStatus === 'ACCEPTED') {
        toast.success('Match confirmed! Let\'s verify ownership to claim the item.');
        // If the found item has a secret question, open the verification modal
        if (match.foundItem?.secretQuestion) {
          setShowClaimModal(true);
        } else {
          triggerConfetti();
        }
      } else if (newStatus === 'DISMISSED') {
        toast.info('Match dismissed.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update match status');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!match.foundItemId) return;

    try {
      setClaimLoading(true);
      const res = await api.found.claim(match.foundItemId, {
        answer: secretAnswer,
        note: claimNote,
      });
      setClaimSuccessData({
        finderContact: res.finderContact,
        message: res.message,
      });
      triggerConfetti();
      toast.success('Ownership verified! Finder contact unlocked.');
    } catch (err: any) {
      toast.error(err.message || 'Secret answer was incorrect. Please try again.');
    } finally {
      setClaimLoading(false);
    }
  };

  return (
    <div
      className={`rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden transition-all ${className}`}
    >
      {/* Header Banner */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Campus AI Match Engine
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    match.status === 'ACCEPTED'
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                      : match.status === 'DISMISSED'
                      ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                      : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                  }`}
                >
                  {match.status === 'ACCEPTED'
                    ? 'Confirmed Match'
                    : match.status === 'DISMISSED'
                    ? 'Dismissed'
                    : 'Possible Match Found'}
                </span>
              </div>
              <h2 className="text-lg font-black tracking-tight text-neutral-900 dark:text-white mt-0.5">
                Possible match found between your lost item and a found report
              </h2>
            </div>
          </div>

          {/* Match Score Meter */}
          <div className="flex items-center gap-2.5 self-start sm:self-center px-4 py-2 rounded-2xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-xs">
            <div className="text-right">
              <div className="text-[10px] uppercase font-bold text-neutral-400">Match Score</div>
              <div className="text-base font-black text-emerald-600 dark:text-emerald-400">
                {percentage}% Confidence
              </div>
            </div>
            <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center font-black text-xs text-emerald-700 dark:text-emerald-300">
              {percentage}%
            </div>
          </div>
        </div>

        {/* Match Reasons Badges */}
        {match.reasons && match.reasons.length > 0 && (
          <div className="mt-4 pt-4 border-t border-emerald-500/10">
            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 block mb-2">
              Why our engine flagged this match:
            </span>
            <div className="flex flex-wrap gap-2">
              {match.reasons.map((reason, idx) => (
                <div
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium bg-white/80 dark:bg-neutral-800/80 border border-emerald-500/20 text-neutral-800 dark:text-neutral-200 shadow-2xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>{reason}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Side-by-Side Comparison Body */}
      <div className="p-5 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
          {/* Middle Divider Icon on desktop */}
          <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 items-center justify-center text-neutral-400 z-10 shadow-xs">
            <ArrowRight className="w-4 h-4" />
          </div>

          {/* LEFT: Lost Item */}
          <div className="p-4 sm:p-5 rounded-2xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/30 dark:bg-rose-950/10 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-rose-200/60 dark:border-rose-900/40">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300">
                Lost Item Report
              </span>
              {match.lostItem && (
                <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
                  ID: #{match.lostItemId.slice(-6)}
                </span>
              )}
            </div>

            {match.lostItem ? (
              <div className="space-y-3">
                {match.lostItem.imageUrl && (
                  <div className="w-full h-40 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                    <img
                      src={match.lostItem.imageUrl}
                      alt={match.lostItem.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div>
                  <h3 className="text-base font-black text-neutral-900 dark:text-white">
                    {match.lostItem.title}
                  </h3>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 line-clamp-3 leading-relaxed">
                    {match.lostItem.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 text-xs text-neutral-600 dark:text-neutral-400 border-t border-rose-200/40 dark:border-rose-900/30">
                  <div className="flex items-center gap-1.5 truncate">
                    <Tag className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <span className="font-medium truncate">{match.lostItem.category}</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <span className="font-medium truncate">{match.lostItem.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5 col-span-2 text-[11px] text-neutral-500">
                    <Calendar className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <span>
                      Reported lost:{' '}
                      {new Date(match.lostItem.dateLost).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-neutral-400">
                Item details unavailable (ID: {match.lostItemId})
              </div>
            )}
          </div>

          {/* RIGHT: Found Item */}
          <div className="p-4 sm:p-5 rounded-2xl border border-teal-200 dark:border-teal-900/40 bg-teal-50/30 dark:bg-teal-950/10 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-teal-200/60 dark:border-teal-900/40">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300">
                Found Item Match
              </span>
              {match.foundItem && (
                <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
                  ID: #{match.foundItemId.slice(-6)}
                </span>
              )}
            </div>

            {match.foundItem ? (
              <div className="space-y-3">
                {match.foundItem.imageUrl && (
                  <div className="w-full h-40 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                    <img
                      src={match.foundItem.imageUrl}
                      alt={match.foundItem.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div>
                  <h3 className="text-base font-black text-neutral-900 dark:text-white">
                    {match.foundItem.title}
                  </h3>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 line-clamp-3 leading-relaxed">
                    {match.foundItem.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 text-xs text-neutral-600 dark:text-neutral-400 border-t border-teal-200/40 dark:border-teal-900/30">
                  <div className="flex items-center gap-1.5 truncate">
                    <Tag className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <span className="font-medium truncate">{match.foundItem.category}</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <span className="font-medium truncate">{match.foundItem.location}</span>
                  </div>
                  {match.foundItem.holdingLocation && (
                    <div className="flex items-center gap-1.5 col-span-2 text-xs font-semibold text-teal-700 dark:text-teal-300 bg-teal-100/50 dark:bg-teal-900/30 px-2 py-1 rounded-lg">
                      <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                      <span>Held securely at: {match.foundItem.holdingLocation}</span>
                    </div>
                  )}
                  {match.foundItem.secretQuestion && (
                    <div className="flex items-center gap-1.5 col-span-2 text-[11px] text-neutral-500 bg-neutral-100 dark:bg-neutral-800/60 px-2 py-1 rounded-lg">
                      <Lock className="w-3 h-3 text-neutral-400 shrink-0" />
                      <span className="truncate">
                        Verification question: &quot;{match.foundItem.secretQuestion}&quot;
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-neutral-400">
                Item details unavailable (ID: {match.foundItemId})
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons: "This is mine" & "Not a match" */}
        <div className="mt-6 pt-5 border-t border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-neutral-500 dark:text-neutral-400">
            {match.status === 'ACCEPTED' ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                <Check className="w-4 h-4" /> You confirmed this item is yours.
              </span>
            ) : match.status === 'DISMISSED' ? (
              <span className="text-neutral-400">
                You marked this as not a match.
              </span>
            ) : (
              <span>
                Carefully review the photo, category, and holding location before verifying ownership.
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
            {match.status === 'PENDING' ? (
              <>
                <button
                  type="button"
                  onClick={() => handleStatusUpdate('DISMISSED')}
                  disabled={loadingAction !== null}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold text-xs transition-colors disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4 text-neutral-400" />
                  <span>Not a match</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleStatusUpdate('ACCEPTED')}
                  disabled={loadingAction !== null}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>This is mine</span>
                </button>
              </>
            ) : match.status === 'ACCEPTED' ? (
              <div className="flex items-center gap-2">
                {match.foundItem?.secretQuestion && !claimSuccessData && (
                  <button
                    type="button"
                    onClick={() => setShowClaimModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Answer Secret Question to Claim</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleStatusUpdate('DISMISSED')}
                  disabled={loadingAction !== null}
                  className="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  Undo
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => handleStatusUpdate('ACCEPTED')}
                disabled={loadingAction !== null}
                className="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                Re-open Match
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Secret Question Claim Modal */}
      {showClaimModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-neutral-900 dark:text-white">
                    Ownership Verification
                  </h3>
                  <p className="text-xs text-neutral-500">
                    To prevent fraudulent claims, answer the finder&apos;s secret question.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowClaimModal(false)}
                className="p-1 rounded-full text-neutral-400 hover:text-neutral-600 dark:hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {claimSuccessData ? (
              <div className="space-y-4 py-2">
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <span>{claimSuccessData.message}</span>
                  </div>
                  <p className="text-emerald-700 dark:text-emerald-300">
                    Your claim has been verified and registered on CampusLoop.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 space-y-2 text-xs">
                  <div className="font-bold text-neutral-900 dark:text-white text-sm">
                    Finder Contact Details
                  </div>
                  <div>
                    <span className="text-neutral-400">Name:</span>{' '}
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                      {claimSuccessData.finderContact.name}
                    </span>
                  </div>
                  {claimSuccessData.finderContact.email && (
                    <div>
                      <span className="text-neutral-400">Email:</span>{' '}
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                        {claimSuccessData.finderContact.email}
                      </span>
                    </div>
                  )}
                  {claimSuccessData.finderContact.phone && (
                    <div>
                      <span className="text-neutral-400">Phone:</span>{' '}
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                        {claimSuccessData.finderContact.phone}
                      </span>
                    </div>
                  )}
                  {claimSuccessData.finderContact.holdingLocation && (
                    <div className="pt-2 border-t border-neutral-200 dark:border-neutral-700">
                      <span className="text-neutral-400">Handover Location:</span>{' '}
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {claimSuccessData.finderContact.holdingLocation}
                      </span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setShowClaimModal(false)}
                  className="w-full py-2.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold text-xs"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleClaimSubmit} className="space-y-4">
                {match.foundItem?.secretQuestion && (
                  <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-xs space-y-1">
                    <span className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      Secret Question:
                    </span>
                    <p className="text-amber-800 dark:text-amber-300 italic">
                      &quot;{match.foundItem.secretQuestion}&quot;
                    </p>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    Your Answer <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={secretAnswer}
                    onChange={(e) => setSecretAnswer(e.target.value)}
                    placeholder="Enter the secret answer (e.g. Totoro sticker, blue carabiner)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    Additional Claim Note (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={claimNote}
                    onChange={(e) => setClaimNote(e.target.value)}
                    placeholder="Provide any additional identifiers (e.g. student ID, serial number fragment)"
                    className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowClaimModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={claimLoading || !secretAnswer.trim()}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all"
                  >
                    {claimLoading ? 'Verifying Answer...' : 'Submit Claim'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

