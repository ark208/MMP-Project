'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Sparkles,
  Loader2,
  AlertCircle,
  HelpCircle,
  Bell,
} from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { MatchCard } from '@/components/match/MatchCard';
import { api } from '@/lib/api';
import type { Match } from '@docs/types';

export default function MatchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params?.id as string;

  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMatch() {
      if (!matchId) return;
      try {
        setLoading(true);
        setError(null);
        const data = await api.matches.get(matchId);
        setMatch(data);
      } catch (err: any) {
        setError(err.message || 'Could not load match comparison');
      } finally {
        setLoading(false);
      }
    }

    loadMatch();
  }, [matchId]);

  return (
    <ProtectedRoute>
      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800">
          <Link
            href="/notifications"
            className="inline-flex items-center gap-2 text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Notifications</span>
          </Link>

          <Link
            href="/lost-found"
            className="text-xs font-semibold text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
          >
            Lost & Found Home
          </Link>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-24 flex flex-col items-center justify-center text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            <p className="text-xs text-neutral-500">
              Comparing lost and found item records...
            </p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="p-8 rounded-3xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
            <h3 className="text-base font-bold text-rose-900 dark:text-rose-200">
              Match Details Unavailable
            </h3>
            <p className="text-xs text-rose-700 dark:text-rose-300 max-w-md mx-auto">
              {error}
            </p>
            <div className="pt-2">
              <Link
                href="/notifications"
                className="inline-block px-4 py-2 rounded-xl text-xs font-bold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
              >
                Return to Notifications
              </Link>
            </div>
          </div>
        )}

        {/* Success Match Card */}
        {!loading && match && (
          <MatchCard match={match} onStatusChange={(updated) => setMatch(updated)} />
        )}
      </div>
    </ProtectedRoute>
  );
}

