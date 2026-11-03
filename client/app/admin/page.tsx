'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Trash2,
  UserX,
  CheckCircle,
  XCircle,
  BarChart3,
  TrendingUp,
  Package,
  Car,
  ShoppingBag,
  Flag,
  Users,
  Sparkles,
  ArrowRight,
  Filter,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { api, USE_MOCKS } from '@/lib/api';
import { useToast } from '@/lib/toast-context';
import type { Report, AdminAnalytics, ReportStatus } from '@docs/types';

export default function AdminDashboardPage() {
  const { user, updateProfile } = useAuth();
  const toast = useToast();

  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const isAdmin = user?.role === 'ADMIN';

  const loadData = async () => {
    try {
      setLoading(true);
      const [analyticsData, reportsData] = await Promise.all([
        api.admin.getAnalytics(),
        api.admin.getReports(),
      ]);
      setAnalytics(analyticsData);
      setReports(reportsData);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load administrative data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  // Demo helper: allows tester in mock mode to toggle admin role
  const handleMakeAdminDemo = async () => {
    try {
      await updateProfile({ role: 'ADMIN' });
      toast.success('Granted ADMIN role for current session');
      loadData();
    } catch {
      toast.error('Could not switch to admin');
    }
  };

  // Moderate: Delete offending post
  const handleDeletePost = async (report: Report) => {
    if (!confirm(`Are you sure you want to delete this ${report.targetType.toLowerCase()} post? This action will remove it from the platform.`)) {
      return;
    }

    try {
      setProcessingId(report.id);
      await api.admin.deletePost(report.targetType, report.targetId);
      toast.success('Post removed and report marked as resolved');
      // Update local state
      setReports((prev) =>
        prev.map((r) => (r.id === report.id ? { ...r, status: 'RESOLVED' } : r))
      );
      if (analytics) {
        setAnalytics({
          ...analytics,
          reportsPending: Math.max(0, analytics.reportsPending - 1),
        });
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete post');
    } finally {
      setProcessingId(null);
    }
  };

  // Moderate: Ban offending user
  const handleBanUser = async (userId: string, reportId: string) => {
    if (!confirm('Are you sure you want to BAN this user? They will immediately lose access to CampusLoop.')) {
      return;
    }

    try {
      setProcessingId(reportId);
      await api.admin.banUser(userId, 'Violated community standards');
      toast.success('User account banned and restricted from accessing the campus network');
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status: 'RESOLVED' } : r))
      );
    } catch (err: any) {
      toast.error(err.message || 'Failed to ban user');
    } finally {
      setProcessingId(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-center space-y-4 shadow-xl animate-in fade-in">
        <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-black text-neutral-900 dark:text-white">
          Admin Console Restricted
        </h2>
        <p className="text-xs text-neutral-500 leading-relaxed">
          Access to this dashboard requires verified university administrator privileges (<code className="font-mono text-rose-500">role === &apos;ADMIN&apos;</code>).
        </p>

        {USE_MOCKS && (
          <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800">
            <button
              onClick={handleMakeAdminDemo}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all"
            >
              Switch to Admin Mode (Demo Review)
            </button>
            <p className="text-[10px] text-neutral-400 mt-2">
              Available in mock mode to verify Phase 3 requirements.
            </p>
          </div>
        )}

        <div>
          <Link
            href="/"
            className="inline-block text-xs font-semibold text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
          >
            â† Return to Campus Home
          </Link>
        </div>
      </div>
    );
  }

  const filteredReports = reports.filter((r) => {
    if (filterStatus === 'PENDING') return r.status === 'PENDING';
    if (filterStatus === 'RESOLVED') return r.status === 'RESOLVED';
    if (filterStatus === 'DISMISSED') return r.status === 'DISMISSED';
    return true;
  });

  const pendingCount = reports.filter((r) => r.status === 'PENDING').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-white">
                  Campus Admin Dashboard
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                  Moderator Console
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                Overview of platform safety, community reports, reunited items, and ride analytics.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors self-start sm:self-center"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Items Reunited */}
        <div className="p-5 rounded-3xl border border-emerald-200 dark:border-emerald-900/60 bg-white dark:bg-neutral-900 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Items Reunited
            </span>
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-neutral-900 dark:text-white">
            {analytics?.itemsReunited ?? 0}
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>High return rate on campus</span>
          </div>
        </div>

        {/* Card 2: Rides Completed */}
        <div className="p-5 rounded-3xl border border-blue-200 dark:border-blue-900/60 bg-white dark:bg-neutral-900 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Rides Completed
            </span>
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Car className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-neutral-900 dark:text-white">
            {analytics?.ridesCompleted ?? 0}
          </div>
          <div className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Shared cab splits executed</span>
          </div>
        </div>

        {/* Card 3: Active Listings */}
        <div className="p-5 rounded-3xl border border-purple-200 dark:border-purple-900/60 bg-white dark:bg-neutral-900 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Active Listings
            </span>
            <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-neutral-900 dark:text-white">
            {analytics?.activeListings ?? 0}
          </div>
          <div className="text-[11px] text-neutral-500">
            Across textbooks, electronics &amp; dorm
          </div>
        </div>

        {/* Card 4: Reports Pending */}
        <div className="p-5 rounded-3xl border border-rose-200 dark:border-rose-900/60 bg-white dark:bg-neutral-900 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Reports Pending
            </span>
            <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              <Flag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-rose-600 dark:text-rose-400">
            {pendingCount}
          </div>
          <div className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold">
            {pendingCount > 0 ? 'Requires administrative review' : 'No pending reports'}
          </div>
        </div>
      </div>

      {/* SIMPLE CHARTS: REUNITED ITEMS & COMPLETED RIDES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Reunited Items Distribution */}
        <div className="p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-neutral-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                <span>Lost &amp; Found Resolution Metrics</span>
              </h3>
              <p className="text-xs text-neutral-400">
                Breakdown of items successfully returned to verified students
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded-xl">
              {analytics?.itemsReunited ?? 14} Resolved
            </span>
          </div>

          {/* Visual Progress Bar Chart */}
          <div className="space-y-4 pt-2">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-neutral-700 dark:text-neutral-300">Lost Items Reunited</span>
                <span className="text-emerald-600 font-bold">
                  {analytics?.breakdown?.lostItemsReunited ?? 8} items (57%)
                </span>
              </div>
              <div className="w-full h-3 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '57%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-neutral-700 dark:text-neutral-300">Found Items Reunited</span>
                <span className="text-teal-600 font-bold">
                  {analytics?.breakdown?.foundItemsReunited ?? 6} items (43%)
                </span>
              </div>
              <div className="w-full h-3 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div className="h-full bg-teal-500 rounded-full" style={{ width: '43%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-neutral-700 dark:text-neutral-300">Automated Smart Matches</span>
                <span className="text-amber-600 font-bold">
                  {analytics?.breakdown?.totalMatches ?? 12} generated
                </span>
              </div>
              <div className="w-full h-3 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: '75%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Chart 2: Campus Rides Activity */}
        <div className="p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-neutral-900 dark:text-white flex items-center gap-2">
                <Car className="w-4 h-4 text-blue-600" />
                <span>Campus Ride Sharing Activity</span>
              </h3>
              <p className="text-xs text-neutral-400">
                Carpool completion status and active transit splits
              </p>
            </div>
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2.5 py-1 rounded-xl">
              {analytics?.ridesCompleted ?? 28} Completed
            </span>
          </div>

          {/* Visual Bar Comparison */}
          <div className="grid grid-cols-4 gap-2 pt-4 text-center items-end h-32">
            <div className="flex flex-col items-center gap-1.5 h-full justify-end">
              <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                {analytics?.ridesCompleted ?? 28}
              </span>
              <div className="w-full bg-emerald-500 rounded-t-xl h-24" />
              <span className="text-[10px] font-semibold text-neutral-500 truncate w-full">
                Completed
              </span>
            </div>

            <div className="flex flex-col items-center gap-1.5 h-full justify-end">
              <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                {analytics?.breakdown?.activeRides ?? 5}
              </span>
              <div className="w-full bg-blue-500 rounded-t-xl h-12" />
              <span className="text-[10px] font-semibold text-neutral-500 truncate w-full">
                Active Open
              </span>
            </div>

            <div className="flex flex-col items-center gap-1.5 h-full justify-end">
              <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">8</span>
              <div className="w-full bg-amber-500 rounded-t-xl h-16" />
              <span className="text-[10px] font-semibold text-neutral-500 truncate w-full">
                Full Pools
              </span>
            </div>

            <div className="flex flex-col items-center gap-1.5 h-full justify-end">
              <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">2</span>
              <div className="w-full bg-rose-400 rounded-t-xl h-6" />
              <span className="text-[10px] font-semibold text-neutral-500 truncate w-full">
                Cancelled
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* REPORTS MODERATION TABLE */}
      <div className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xs overflow-hidden space-y-4">
        <div className="p-5 sm:p-6 pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-neutral-900 dark:text-white flex items-center gap-2">
              <Flag className="w-5 h-5 text-rose-600" />
              <span>Community Reports &amp; Moderation Queue</span>
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Review reported posts and accounts. Enforce campus rules by removing offending content or banning repeat violators.
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-2xl">
            {[
              { id: 'ALL', label: 'All' },
              { id: 'PENDING', label: `Pending (${pendingCount})` },
              { id: 'RESOLVED', label: 'Resolved' },
              { id: 'DISMISSED', label: 'Dismissed' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  filterStatus === tab.id
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {filteredReports.length === 0 ? (
            <div className="py-16 text-center text-xs text-neutral-400">
              No reports match the selected filter.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 dark:bg-neutral-800/60 border-y border-neutral-200 dark:border-neutral-800 text-neutral-400 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-5">Target Entity</th>
                  <th className="py-3 px-4">Reason &amp; Details</th>
                  <th className="py-3 px-4">Reporter</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-5 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {filteredReports.map((report) => (
                  <tr
                    key={report.id}
                    className="hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40 transition-colors"
                  >
                    {/* Target Entity */}
                    <td className="py-4 px-5">
                      <div className="space-y-1">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                          {report.targetType}
                        </span>
                        <div className="font-mono text-[11px] text-neutral-400">
                          ID: #{report.targetId.slice(-6)}
                        </div>
                      </div>
                    </td>

                    {/* Reason & Details */}
                    <td className="py-4 px-4 max-w-xs">
                      <div className="font-bold text-neutral-900 dark:text-white">
                        {report.reason}
                      </div>
                      {report.details && (
                        <p className="text-neutral-500 text-[11px] mt-0.5 line-clamp-2">
                          {report.details}
                        </p>
                      )}
                    </td>

                    {/* Reporter */}
                    <td className="py-4 px-4">
                      <div className="font-semibold text-neutral-800 dark:text-neutral-200">
                        {report.reporter?.name || 'Anonymous Student'}
                      </div>
                      <div className="text-[11px] text-neutral-400">
                        {report.reporter?.email || 'student@iiitkota.ac.in'}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          report.status === 'PENDING'
                            ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400'
                            : report.status === 'RESOLVED'
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'
                        }`}
                      >
                        {report.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {report.status === 'PENDING' ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleDeletePost(report)}
                              disabled={processingId === report.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950/80 text-rose-700 dark:text-rose-300 font-bold text-xs transition-colors"
                              title="Delete offending post from platform"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Remove Post</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleBanUser(report.targetId, report.id)}
                              disabled={processingId === report.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white font-bold text-xs transition-colors"
                              title="Ban user account"
                            >
                              <UserX className="w-3.5 h-3.5" />
                              <span>Ban User</span>
                            </button>
                          </>
                        ) : (
                          <span className="text-neutral-400 text-xs italic">
                            Action complete
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

