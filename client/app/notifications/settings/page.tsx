'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Mail,
  Phone,
  Sparkles,
  Car,
  MessageSquare,
  ShieldCheck,
  Check,
  Loader2,
  AlertCircle,
  Bell,
  Smartphone,
} from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { api } from '@/lib/api';
import { useToast } from '@/lib/toast-context';
import type { NotificationPreference } from '@docs/types';

export default function NotificationSettingsPage() {
  const toast = useToast();
  const [preferences, setPreferences] = useState<NotificationPreference | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [isSavingAll, setIsSavingAll] = useState(false);

  useEffect(() => {
    async function loadPreferences() {
      try {
        setLoading(true);
        const data = await api.notifications.getPreferences();
        setPreferences(data);
        setWhatsappNumber(data.whatsappNumber || '');
      } catch (err: any) {
        toast.error(err.message || 'Failed to load preferences');
      } finally {
        setLoading(false);
      }
    }

    loadPreferences();
  }, [toast]);

  const handleToggle = async (key: keyof NotificationPreference, currentValue: boolean) => {
    if (!preferences) return;
    const newValue = !currentValue;
    const updated = { ...preferences, [key]: newValue };
    setPreferences(updated);

    try {
      setSavingKey(key);
      await api.notifications.updatePreferences({ [key]: newValue });
      toast.success('Preference updated');
    } catch (err: any) {
      toast.error('Could not save preference');
      // Revert on failure
      setPreferences(preferences);
    } finally {
      setSavingKey(null);
    }
  };

  const handleSavePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!preferences) return;

    try {
      setIsSavingAll(true);
      const updated = await api.notifications.updatePreferences({
        whatsappNumber,
      });
      setPreferences(updated);
      toast.success('WhatsApp number saved');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update phone number');
    } finally {
      setIsSavingAll(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
        {/* Header Breadcrumb */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800">
          <Link
            href="/notifications"
            className="inline-flex items-center gap-2 text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Notifications</span>
          </Link>
          <span className="text-xs text-neutral-400">Settings</span>
        </div>

        {/* Page Title */}
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Mail className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-white">
              Notification Settings
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Choose what alerts are sent to your verified campus email address and WhatsApp messenger.
          </p>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-7 h-7 animate-spin text-emerald-600" />
            <p className="text-xs text-neutral-400">Loading your notification preferences...</p>
          </div>
        ) : preferences ? (
          <div className="space-y-6">
            {/* EMAIL NOTIFICATIONS SECTION */}
            <div className="p-5 sm:p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-neutral-900 dark:text-white">
                      Email Notifications
                    </h2>
                    <p className="text-xs text-neutral-500">
                      Delivered via CampusLoop Nodemailer mailer to your verified campus inbox.
                    </p>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-neutral-100 dark:divide-neutral-800 space-y-2">
                {/* Email Item Matches */}
                <div className="pt-2 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                        Lost &amp; Found Item Matches
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 leading-relaxed">
                      Send me an email whenever an item is registered that matches one of my lost item reports.
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={preferences.emailMatches}
                    onClick={() => handleToggle('emailMatches', preferences.emailMatches)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                      preferences.emailMatches ? 'bg-emerald-600' : 'bg-neutral-200 dark:bg-neutral-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        preferences.emailMatches ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Email Ride Joins */}
                <div className="pt-4 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Car className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                        Campus Ride Splits &amp; Joins
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 leading-relaxed">
                      Email me when a passenger joins my ride pool or when departure schedules are updated.
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={preferences.emailRideJoins}
                    onClick={() => handleToggle('emailRideJoins', preferences.emailRideJoins)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                      preferences.emailRideJoins ? 'bg-emerald-600' : 'bg-neutral-200 dark:bg-neutral-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        preferences.emailRideJoins ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Email Messages */}
                <div className="pt-4 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-blue-500" />
                      <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                        Offline Direct Messages
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 leading-relaxed">
                      Notify me via email if I have unread messages in CampusLoop chat while offline.
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={preferences.emailMessages}
                    onClick={() => handleToggle('emailMessages', preferences.emailMessages)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                      preferences.emailMessages ? 'bg-emerald-600' : 'bg-neutral-200 dark:bg-neutral-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        preferences.emailMessages ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* WHATSAPP NOTIFICATIONS SECTION */}
            <div className="p-5 sm:p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-neutral-900 dark:text-white">
                        WhatsApp Notifications
                      </h2>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
                        BETA
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500">
                      High-priority instant text alerts sent directly to your phone.
                    </p>
                  </div>
                </div>
              </div>

              {/* Phone number config */}
              <form onSubmit={handleSavePhone} className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <label className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                    WhatsApp Mobile Number
                  </label>
                  <input
                    type="tel"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    placeholder="+1 (555) 234-5678"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div className="sm:self-end">
                  <button
                    type="submit"
                    disabled={isSavingAll}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-bold text-xs hover:bg-neutral-800 transition-colors disabled:opacity-50"
                  >
                    {isSavingAll ? 'Saving...' : 'Update Phone'}
                  </button>
                </div>
              </form>

              <div className="divide-y divide-neutral-100 dark:divide-neutral-800 space-y-2 pt-2">
                {/* WhatsApp Matches */}
                <div className="pt-2 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                      WhatsApp Match Alerts
                    </span>
                    <p className="text-[11px] text-neutral-500">
                      Receive an instant text ping when a lost/found match is flagged.
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={preferences.whatsappMatches}
                    onClick={() => handleToggle('whatsappMatches', preferences.whatsappMatches)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                      preferences.whatsappMatches ? 'bg-emerald-600' : 'bg-neutral-200 dark:bg-neutral-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        preferences.whatsappMatches ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* WhatsApp Ride Joins */}
                <div className="pt-4 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                      WhatsApp Ride Joins
                    </span>
                    <p className="text-[11px] text-neutral-500">
                      Receive departure confirmations and passenger check-ins on WhatsApp.
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={preferences.whatsappRideJoins}
                    onClick={() => handleToggle('whatsappRideJoins', preferences.whatsappRideJoins)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                      preferences.whatsappRideJoins ? 'bg-emerald-600' : 'bg-neutral-200 dark:bg-neutral-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        preferences.whatsappRideJoins ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </ProtectedRoute>
  );
}

