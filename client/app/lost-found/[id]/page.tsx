'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  ShieldCheck,
  Lock,
  Building2,
  CheckCircle,
  HelpCircle,
  Sparkles,
  CheckCheck,
  User,
  PartyPopper,
  X,
  Upload,
} from 'lucide-react';
import type { LostItem } from '@docs/types';
import { ExtendedFoundItem } from '@/lib/mock-data';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';
import { fireReunitedConfetti } from '@/lib/confetti';
import { Skeleton } from '@/components/ui/Skeleton';

const claimSchema = z.object({
  answer: z.string().min(2, 'Please provide your answer to the secret verification question'),
  note: z.string().min(5, 'Please provide proof details (e.g. serial numbers, inner markings, when you lost it)'),
  proofImageUrl: z.string().optional(),
});

type ClaimFormValues = z.infer<typeof claimSchema>;

export default function LostFoundDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [itemType, setItemType] = useState<'lost' | 'found'>('lost');
  const [lostItem, setLostItem] = useState<LostItem | null>(null);
  const [foundItem, setFoundItem] = useState<ExtendedFoundItem | null>(null);

  const [showClaimModal, setShowClaimModal] = useState(false);
  const [showReunitedModal, setShowReunitedModal] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [claimProofImage, setClaimProofImage] = useState<string | null>(null);

  const {
    register: registerClaim,
    handleSubmit: handleClaimSubmit,
    setValue: setClaimValue,
    formState: { errors: claimErrors },
  } = useForm<ClaimFormValues>({
    resolver: zodResolver(claimSchema),
    defaultValues: {
      answer: '',
      note: '',
      proofImageUrl: '',
    },
  });

  useEffect(() => {
    async function loadItem() {
      try {
        setLoading(true);
        // Try finding as lost item first
        try {
          const l = await api.lost.get(id);
          setLostItem(l);
          setItemType('lost');
          setLoading(false);
          return;
        } catch {
          // try found item
        }

        const f = await api.found.get(id);
        setFoundItem(f);
        setItemType('found');
      } catch (err) {
        console.error('Failed to load item:', err);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadItem();
    }
  }, [id]);

  const onClaimSubmit = (data: ClaimFormValues) => {
    if (!isAuthenticated) {
      router.push(`/auth/login?redirect=/lost-found/${id}`);
      return;
    }

    startTransition(async () => {
      try {
        const updated = await api.found.claim(id, {
          answer: data.answer,
          note: data.note,
          proofImageUrl: data.proofImageUrl,
        });
        setFoundItem(updated);
        setShowClaimModal(false);
        toast.success('Claim submitted! The custody desk will review your secret verification answer.');
      } catch (err: any) {
        toast.error(err.message || 'Failed to submit claim');
      }
    });
  };

  const handleMarkReunited = () => {
    startTransition(async () => {
      try {
        if (itemType === 'lost' && lostItem) {
          const updated = await api.lost.updateStatus(id, 'RESOLVED');
          setLostItem(updated);
        } else if (itemType === 'found' && foundItem) {
          const updated = await api.found.updateStatus(id, 'RESOLVED');
          setFoundItem(updated);
        }

        // Fire celebration animation!
        fireReunitedConfetti();
        setShowReunitedModal(true);
        toast.success('Item marked as Reunited! Celebration unlocked 🎉');
      } catch (err: any) {
        toast.error(err.message || 'Failed to update status');
      }
    });
  };

  const handleProofImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const res = await api.uploads.uploadFile(file);
        setClaimProofImage(res.url);
        setClaimValue('proofImageUrl', res.url);
      } catch {
        toast.error('Failed to upload proof image');
      }
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-6 space-y-6">
        <Skeleton className="h-6 w-32 rounded-lg" />
        <Skeleton className="h-80 w-full rounded-3xl" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    );
  }

  const currentItem = itemType === 'lost' ? lostItem : foundItem;
  if (!currentItem) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-4">
        <h2 className="text-xl font-bold">Item Not Found</h2>
        <p className="text-sm text-neutral-500">
          The requested lost or found report does not exist or has been removed.
        </p>
        <Link
          href="/lost-found"
          className="inline-flex px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold"
        >
          Back to Lost & Found
        </Link>
      </div>
    );
  }

  const isLost = itemType === 'lost';
  const isResolved = currentItem.status === 'RESOLVED';
  const isClaimed = currentItem.status === 'CLAIMED';

  const defaultImg = isLost
    ? 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=800&q=80'
    : 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80';

  return (
    <div className="max-w-3xl mx-auto py-4 px-2 sm:px-0 space-y-6 animate-in fade-in">
      {/* Back Link */}
      <div>
        <Link
          href="/lost-found"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Lost & Found</span>
        </Link>
      </div>

      {/* Main Card */}
      <div className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-xl">
        {/* Banner Image */}
        <div className="relative h-64 sm:h-96 w-full bg-neutral-100 dark:bg-neutral-800">
          <img
            src={currentItem.imageUrl || defaultImg}
            alt={currentItem.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 left-4 flex gap-2">
            <span
              className={`px-3.5 py-1 rounded-full text-xs font-black shadow-lg ${
                isLost ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
              }`}
            >
              {isLost ? 'LOST ITEM' : 'FOUND ITEM'}
            </span>
            {isResolved && (
              <span className="px-3.5 py-1 rounded-full text-xs font-black bg-amber-500 text-white shadow-lg flex items-center gap-1.5">
                <PartyPopper className="w-4 h-4" /> Reunited & Returned!
              </span>
            )}
            {isClaimed && (
              <span className="px-3.5 py-1 rounded-full text-xs font-black bg-blue-600 text-white shadow-lg">
                Claim Under Verification
              </span>
            )}
          </div>

          <div className="absolute top-4 right-4">
            <span className="px-3 py-1 rounded-xl text-xs font-bold bg-white/95 dark:bg-neutral-900/95 text-neutral-900 dark:text-neutral-100 backdrop-blur-md shadow-md">
              {currentItem.category}
            </span>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight">
              {currentItem.title}
            </h1>

            <div className="flex flex-wrap gap-4 text-xs text-neutral-500 dark:text-neutral-400 pt-1">
              <div className="flex items-center gap-1.5 font-medium">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>{currentItem.location}</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <Calendar className="w-4 h-4 text-neutral-400" />
                <span>
                  {new Date(
                    isLost ? (currentItem as LostItem).dateLost : (currentItem as ExtendedFoundItem).dateFound
                  ).toLocaleDateString(undefined, {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Description & Details
            </h3>
            <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-line bg-neutral-50 dark:bg-neutral-800/40 p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800">
              {currentItem.description}
            </p>
          </div>

          {/* Found Item Custody & Secret Question Details */}
          {!isLost && foundItem && (
            <div className="space-y-4">
              {/* Where it's kept */}
              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 flex items-start gap-3">
                <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300">
                    Safe Custody & Handover Location
                  </div>
                  <div className="text-sm font-semibold text-blue-950 dark:text-blue-100 mt-0.5">
                    {foundItem.keptAt || 'Campus Security Central Office - Room 102'}
                  </div>
                  <div className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                    You can inspect or collect this item in person after ownership verification.
                  </div>
                </div>
              </div>

              {/* Secret Verification Prompt */}
              {foundItem.secretQuestion && (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 flex items-start gap-3">
                  <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300">
                      Owner Verification Question
                    </div>
                    <div className="text-sm font-bold text-amber-950 dark:text-amber-100 mt-0.5">
                      &ldquo;{foundItem.secretQuestion}&rdquo;
                    </div>
                    <div className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                      If this is your item, submit your answer to claim and receive collection instructions.
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Reporter / Finder Information */}
          <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={
                  currentItem.user?.avatarUrl ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'
                }
                alt={currentItem.user?.name || 'Campus Student'}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-500/30"
              />
              <div>
                <div className="text-xs font-semibold text-neutral-400">
                  {isLost ? 'Reported by' : 'Safely found by'}
                </div>
                <div className="text-sm font-bold text-neutral-900 dark:text-white">
                  {currentItem.user?.name || 'Verified Student'}
                </div>
              </div>
            </div>

            <div className="text-[11px] text-neutral-400">
              Posted {new Date(currentItem.createdAt).toLocaleDateString()}
            </div>
          </div>

          {/* Actions Bar */}
          <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 flex flex-wrap gap-3">
            {/* If Found & Not Resolved & Not Claimed: Claim button */}
            {!isLost && !isResolved && (
              <button
                onClick={() => setShowClaimModal(true)}
                className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Claim This Item</span>
              </button>
            )}

            {/* Mark as Reunited Button */}
            {!isResolved && (
              <button
                onClick={handleMarkReunited}
                disabled={isPending}
                className="inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-md transition-all"
              >
                <CheckCheck className="w-4 h-4" />
                <span>Mark as Reunited 🎉</span>
              </button>
            )}

            {isResolved && (
              <div className="w-full py-3 px-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-center font-bold text-emerald-800 dark:text-emerald-200 text-sm flex items-center justify-center gap-2">
                <PartyPopper className="w-4 h-4 text-emerald-600" />
                <span>This item has been successfully reunited with its owner!</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* CLAIM MODAL */}
      {/* ============================================================== */}
      {showClaimModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-neutral-200 dark:border-neutral-800 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-lg text-neutral-900 dark:text-white">
                  Claim Ownership
                </h3>
              </div>
              <button
                onClick={() => setShowClaimModal(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {foundItem?.secretQuestion && (
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                <span className="font-bold flex items-center gap-1 text-amber-700 dark:text-amber-300 uppercase tracking-wider text-[10px]">
                  <Lock className="w-3.5 h-3.5" /> Secret Question to Answer:
                </span>
                <p className="font-semibold text-sm">&ldquo;{foundItem.secretQuestion}&rdquo;</p>
              </div>
            )}

            <form onSubmit={handleClaimSubmit(onClaimSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Your Answer to the Secret Question *
                </label>
                <input
                  {...registerClaim('answer')}
                  type="text"
                  placeholder="e.g. Stickers on lid: Studio Ghibli Totoro & GitHub Octocat"
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/50 text-neutral-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {claimErrors.answer && (
                  <p className="mt-1 text-xs text-rose-500 font-medium">
                    {claimErrors.answer.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Proof of Ownership Details *
                </label>
                <textarea
                  {...registerClaim('note')}
                  rows={3}
                  placeholder="Provide additional details (e.g. serial numbers, contents, time of loss, password format)..."
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/50 text-neutral-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {claimErrors.note && (
                  <p className="mt-1 text-xs text-rose-500 font-medium">
                    {claimErrors.note.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Optional Proof Photo (e.g. receipt or past photo of item)
                </label>
                {claimProofImage ? (
                  <div className="relative h-28 rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-700">
                    <img src={claimProofImage} alt="Proof" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setClaimProofImage(null);
                        setClaimValue('proofImageUrl', '');
                      }}
                      className="absolute top-2 right-2 p-1 rounded-full bg-black/70 text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 p-3 border border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                    <Upload className="w-4 h-4" />
                    <span>Upload proof file (optional)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProofImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowClaimModal(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md disabled:opacity-50"
                >
                  {isPending ? 'Submitting...' : 'Submit Claim'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* CELEBRATION MODAL */}
      {/* ============================================================== */}
      {showReunitedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-8 max-w-sm w-full border border-neutral-200 dark:border-neutral-800 shadow-2xl text-center space-y-4 animate-in zoom-in-95">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center text-3xl shadow-inner">
              🎉
            </div>
            <h3 className="text-xl font-black text-neutral-900 dark:text-white">
              Successfully Reunited!
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Another belonging reunited with its campus owner. Thanks for keeping our university community honest and supportive!
            </p>
            <button
              onClick={() => setShowReunitedModal(false)}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md transition-all"
            >
              Celebrate & Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
