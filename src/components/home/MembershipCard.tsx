/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Crown, Sparkles, ArrowRight, Zap, Shield, ChevronRight } from 'lucide-react';
import { MembershipSubpageTab } from '../../types/membership';
import { getMembership, getCreditBalance } from '../../services/membershipService';

import { SUBSCRIPTION_PLANS } from '../../data/membershipData';

interface MembershipCardProps {
  onOpenMembership: (tab?: MembershipSubpageTab) => void;
}

export const MembershipCard: React.FC<MembershipCardProps> = ({ onOpenMembership }) => {
  const [membership, setMembership] = useState(getMembership());
  const [credits, setCredits] = useState(getCreditBalance());

  useEffect(() => {
    const handleUpdate = () => {
      setMembership(getMembership());
      setCredits(getCreditBalance());
    };
    window.addEventListener('mystyle_membership_updated', handleUpdate);
    window.addEventListener('mystyle_credits_updated', handleUpdate);
    return () => {
      window.removeEventListener('mystyle_membership_updated', handleUpdate);
      window.removeEventListener('mystyle_credits_updated', handleUpdate);
    };
  }, []);

  const currentPlan = SUBSCRIPTION_PLANS.find(p => p.id === membership.planId) || SUBSCRIPTION_PLANS[0];
  const totalAllocation = credits.totalMonthlyAllocation || 100;
  const percentUsed = Math.min(100, Math.round(((totalAllocation - credits.remainingCredits) / totalAllocation) * 100));

  return (
    <section className="mb-10 sm:mb-12">
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#1C1A1E] via-[#28252B] to-[#1F1D22] text-white p-6 sm:p-8 shadow-md border border-[#B49361]/25">
        {/* Decorative ambient radiance */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-60 h-60 bg-[#B49361]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 -mb-10 w-52 h-52 bg-[#9C6A61]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl space-y-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[10px] font-mono tracking-widest text-[#B49361] uppercase font-semibold">
                <Crown className="w-3 h-3" />
                {currentPlan.name}
              </span>
              <span className="text-[10px] bg-white/10 text-white/90 px-2 py-0.5 rounded font-medium">
                {membership.billingCycle === 'monthly' ? 'Monthly' : 'Annual (17% Saved)'}
              </span>
              <span className="text-[10px] bg-[#B49361]/20 text-[#D4AF37] px-2 py-0.5 rounded font-medium">
                {credits.remainingCredits} AI Credits
              </span>
            </div>

            <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight leading-tight">
              AI Styling Credits & Memberships
            </h2>

            <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
              Transparent, pay-as-you-go image generation and editorial memberships. Keep full control over your privacy, data downloads, and styling preferences.
            </p>

            {/* Quick Credit Meter */}
            <div className="pt-1.5 space-y-1.5 max-w-sm">
              <div className="flex items-center justify-between text-[11px] text-white/80">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#B49361]" />
                  <span>Available Credits</span>
                </span>
                <span className="font-semibold text-white">
                  {credits.remainingCredits} / {totalAllocation}
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#9C6A61] to-[#B49361] rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(5, 100 - percentUsed)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-white/50">
                <span>Renews on {membership.renewsOn}</span>
                <span>Bonus: +{credits.bonusCredits} rollover credits</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0">
            <button
              onClick={() => onOpenMembership('credits')}
              className="px-5 py-3 rounded-xl bg-[#B49361] hover:bg-[#A38353] text-[#242326] text-xs font-semibold uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Manage AI Credits</span>
            </button>

            <button
              onClick={() => onOpenMembership('plans')}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Explore All Membership Plans</span>
              <ChevronRight className="w-3.5 h-3.5 text-white/60" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
