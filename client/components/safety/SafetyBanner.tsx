'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  MapPin,
  Lock,
  PhoneCall,
  Info,
  Car,
  ShoppingBag,
  ExternalLink,
} from 'lucide-react';

interface SafetyBannerProps {
  type: 'marketplace' | 'rides' | 'train';
  className?: string;
  defaultExpanded?: boolean;
}

export function SafetyBanner({
  type,
  className = '',
  defaultExpanded = true,
}: SafetyBannerProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (type === 'marketplace') {
    return (
      <div
        className={`rounded-2xl border border-purple-200 dark:border-purple-900/50 bg-gradient-to-r from-purple-50/70 via-indigo-50/50 to-white dark:from-purple-950/20 dark:via-indigo-950/10 dark:to-neutral-900 p-4 transition-all shadow-xs ${className}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-purple-950 dark:text-purple-300">
                  Campus Marketplace Safety Guide
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300">
                  Recommended
                </span>
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5 leading-relaxed">
                Meet in populated, well-lit campus spaces (Student Union, Library Lobby, or Campus Café).
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors shrink-0"
            aria-label="Toggle safety tips"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-purple-200/60 dark:border-purple-900/40 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px] animate-in fade-in">
            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-white/70 dark:bg-neutral-800/60 border border-purple-100 dark:border-purple-900/30">
              <MapPin className="w-3.5 h-3.5 text-purple-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-neutral-900 dark:text-neutral-100 block">
                  Public Campus Spots
                </span>
                <span className="text-neutral-500">
                  Never invite buyers or sellers to private dorm rooms or secluded parking lots.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-white/70 dark:bg-neutral-800/60 border border-purple-100 dark:border-purple-900/30">
              <Lock className="w-3.5 h-3.5 text-purple-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-neutral-900 dark:text-neutral-100 block">
                  Inspect Before Paying
                </span>
                <span className="text-neutral-500">
                  Verify condition and functionality in person before completing the transfer.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-white/70 dark:bg-neutral-800/60 border border-purple-100 dark:border-purple-900/30">
              <PhoneCall className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-neutral-900 dark:text-neutral-100 block">
                  Campus Security Escort
                </span>
                <span className="text-neutral-500">
                  Dial <strong>(555) 019-9111</strong> for university security or escort assistance.
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Rides & Carpool variant
  return (
    <div
      className={`rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-gradient-to-r from-emerald-50/70 via-teal-50/50 to-white dark:from-emerald-950/20 dark:via-teal-950/10 dark:to-neutral-900 p-4 transition-all shadow-xs ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
            <Car className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-emerald-950 dark:text-emerald-300">
                Ride Share &amp; Carpool Safety Tips
              </h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                Verified Riders
              </span>
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5 leading-relaxed">
              Verify driver identity and license plate before boarding. Meet at official campus gates.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors shrink-0"
          aria-label="Toggle safety tips"
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-emerald-200/60 dark:border-emerald-900/40 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px] animate-in fade-in">
          <div className="flex items-start gap-2 p-2.5 rounded-xl bg-white/70 dark:bg-neutral-800/60 border border-emerald-100 dark:border-emerald-900/30">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-neutral-900 dark:text-neutral-100 block">
                Confirm ID &amp; Vehicle
              </span>
              <span className="text-neutral-500">
                Check that vehicle model and driver match their CampusLoop profile.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2 p-2.5 rounded-xl bg-white/70 dark:bg-neutral-800/60 border border-emerald-100 dark:border-emerald-900/30">
            <Info className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-neutral-900 dark:text-neutral-100 block">
                Share Trip Status
              </span>
              <span className="text-neutral-500">
                Notify a roommate or friend of departure, destination, and expected arrival time.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2 p-2.5 rounded-xl bg-white/70 dark:bg-neutral-800/60 border border-emerald-100 dark:border-emerald-900/30">
            <PhoneCall className="w-3.5 h-3.5 text-teal-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-neutral-900 dark:text-neutral-100 block">
                Campus Helpline
              </span>
              <span className="text-neutral-500">
                24/7 Campus Dispatch hotline: <strong>(555) 019-9111</strong>.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

