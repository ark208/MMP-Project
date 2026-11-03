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
        className={`rounded-2xl border border-[#E8DED5] dark:border-[#332D27] bg-white dark:bg-[#221F1B] p-4 transition-all shadow-xs ${className}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-[#E0EFF9] dark:bg-[#1E2E3D] text-[#6698C2] shrink-0 mt-0.5">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-[#242424] dark:text-[#F5F1EB]">
                  Campus Marketplace Safety Guide
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E0EFF9] dark:bg-[#1E2E3D] text-[#6698C2]">
                  Recommended
                </span>
              </div>
              <p className="text-xs text-[#77716D] dark:text-[#A8A29D] mt-0.5 leading-relaxed">
                Meet in populated, well-lit campus spaces (Student Union, Library Lobby, or Campus Café).
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-lg text-[#77716D] hover:text-[#242424] dark:hover:text-white transition-colors shrink-0"
            aria-label="Toggle safety tips"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-[#E8DED5]/60 dark:border-[#332D27] grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-[#77716D] dark:text-[#A8A29D] animate-in fade-in">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-[#B9573B] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#242424] dark:text-[#F5F1EB] block">On-Campus Handover</span>
                <span>Complete exchanges inside university gates only.</span>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Lock className="w-4 h-4 text-[#6698C2] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#242424] dark:text-[#F5F1EB] block">Inspect Before Paying</span>
                <span>Test electronics, books, and gear before handing over UPI/cash.</span>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <PhoneCall className="w-4 h-4 text-[#B9573B] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#242424] dark:text-[#F5F1EB] block">Keep Chat In-App</span>
                <span>Protect personal contact details using CampusLoop chat.</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (type === 'rides') {
    return (
      <div
        className={`rounded-2xl border border-[#E8DED5] dark:border-[#332D27] bg-white dark:bg-[#221F1B] p-4 transition-all shadow-xs ${className}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-[#FAF0EB] dark:bg-[#34241E] text-[#B9573B] shrink-0 mt-0.5">
              <Car className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-[#242424] dark:text-[#F5F1EB]">
                  Campus Ride Share Guidelines
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF0EB] dark:bg-[#34241E] text-[#B9573B]">
                  Verified Peers Only
                </span>
              </div>
              <p className="text-xs text-[#77716D] dark:text-[#A8A29D] mt-0.5 leading-relaxed">
                Share cabs safely to airports and railway stations with equal automated fare splitting.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-lg text-[#77716D] hover:text-[#242424] dark:hover:text-white transition-colors shrink-0"
            aria-label="Toggle ride safety tips"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-[#E8DED5]/60 dark:border-[#332D27] grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-[#77716D] dark:text-[#A8A29D] animate-in fade-in">
            <div className="flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-[#B9573B] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#242424] dark:text-[#F5F1EB] block">Verified Accounts</span>
                <span>Every ride creator and passenger is confirmed via university email.</span>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-[#6698C2] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#242424] dark:text-[#F5F1EB] block">Designated Gates</span>
                <span>Meet at Main Gate, Hostel Gate, or Campus Station pickup point.</span>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-[#B9573B] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#242424] dark:text-[#F5F1EB] block">Equal Fare Division</span>
                <span>Use the Live Fare Splitter to divide actual Uber/Ola bills evenly.</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}
