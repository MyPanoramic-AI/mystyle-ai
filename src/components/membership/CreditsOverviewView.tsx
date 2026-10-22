/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  CreditBalance,
  CreditTopUpPack,
  CreditCostRule,
} from '../../types/membership';
import {
  CREDIT_COST_RULES,
  CREDIT_TOP_UP_PACKS,
} from '../../data/membershipData';
import {
  Sparkles,
  Zap,
  ShoppingBag,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  Clock,
  History,
  Coins,
} from 'lucide-react';

interface CreditsOverviewViewProps {
  balance: CreditBalance;
  accountMode?: boolean;
  onPurchaseTopUp: (packId: string) => void;
  onViewHistory: () => void;
}

export const CreditsOverviewView: React.FC<CreditsOverviewViewProps> = ({
  balance,
  accountMode = false,
  onPurchaseTopUp,
  onViewHistory,
}) => {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const totalAvailable = balance.remainingCredits + balance.bonusCredits;
  const percentage = balance.totalMonthlyAllocation > 0
    ? Math.min(100, Math.round((balance.remainingCredits / balance.totalMonthlyAllocation) * 100))
    : 0;

  const handleBuy = (pack: CreditTopUpPack) => {
    onPurchaseTopUp(pack.id);
    setSuccessMessage(
      accountMode
        ? 'Top-ups are not available from the browser. Test credits stay on the server ledger.'
        : `Demonstration only: added ${pack.credits + pack.bonusCredits} browser credits. No payment was taken.`,
    );
    setTimeout(() => {
      setSuccessMessage(null);
    }, 4000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Credits Status */}
      <div className="rounded-3xl bg-gradient-to-br from-[#242326] via-[#2f2d32] to-[#1c1a1d] text-white p-6 sm:p-8 shadow-md border border-[#B49361]/25 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-52 h-52 bg-[#B49361]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-[#E5CDBE]">
              <Sparkles className="w-3.5 h-3.5 text-[#B49361]" />
              <span>AI Styling Credits</span>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="font-serif text-4xl sm:text-5xl font-bold text-white tracking-tight">
                {totalAvailable}
              </span>
              <span className="text-sm sm:text-base text-[#E5CDBE]">
                Credits Available
              </span>
            </div>

            <p className="text-xs text-[#E5CDBE]/75 max-w-md leading-relaxed">
              {accountMode
                ? `Server test credit balance: ${balance.remainingCredits}. Not a purchased allowance. ${balance.renewsOn}.`
                : <>Includes {balance.remainingCredits} monthly allocation credits and {balance.bonusCredits} rollover/top-up bonus credits. Your monthly allocation replenishes on <strong>{balance.renewsOn}</strong>.</>}
            </p>
          </div>

          {/* Mini Action Block */}
          <div className="flex flex-col sm:flex-row items-stretch md:items-center gap-3 shrink-0 w-full md:w-auto">
            <button
              onClick={onViewHistory}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold border border-white/15 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <History className="w-3.5 h-3.5 text-[#B49361]" />
              <span>Credit Usage History</span>
            </button>
          </div>
        </div>

        {/* Balance Progress Bar */}
        <div className="mt-6 pt-5 border-t border-white/10 space-y-1.5">
          <div className="flex justify-between text-xs text-[#E5CDBE]/80">
            <span>Monthly Allocation Remaining</span>
            <span className="font-mono text-white">
              {balance.remainingCredits} / {balance.totalMonthlyAllocation} ({percentage}%)
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#B49361] to-[#E5CDBE] rounded-full transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Success Alert */}
      {successMessage && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-300 p-4 text-xs font-medium text-emerald-800 flex items-center gap-2.5 animate-fadeIn shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Section 1: Transparent Cost Per Activity */}
      <div className="rounded-3xl bg-white border border-[#242326]/10 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-serif text-lg font-semibold text-[#242326]">
              How AI Credits Are Used
            </h3>
            <p className="text-xs text-[#5C585E]">
              Zero hidden fees. You only spend credits when generating photorealistic visuals or complex multi-look plans.
            </p>
          </div>
          <div className="text-xs font-medium text-[#9C6A61] bg-[#F6F2EC] px-3 py-1 rounded-full border border-[#242326]/6 self-start sm:self-auto">
            Conversational Stylist Chat is always FREE
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {CREDIT_COST_RULES.map((rule) => (
            <div
              key={rule.id}
              className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#242326]/6 flex items-start justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#242326]">
                    {rule.activityName}
                  </span>
                </div>
                <p className="text-[11px] text-[#5C585E] leading-relaxed">
                  {rule.description}
                </p>
                {rule.freeInPlan && (
                  <span className="inline-block text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md mt-1">
                    Free on Signature & Atelier
                  </span>
                )}
              </div>

              <div className="shrink-0 text-right">
                <span className="font-mono text-base font-bold text-[#9C6A61] block">
                  {rule.costCredits === 0 ? 'FREE' : `${rule.costCredits} pts`}
                </span>
                <span className="text-[10px] text-[#5C585E] block">per render</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Top-Up Credit Packs */}
      <div className="rounded-3xl bg-white border border-[#242326]/10 p-6 sm:p-8 shadow-xs space-y-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#B49361]/15 text-[#B49361] text-xs font-semibold mb-2">
            <Coins className="w-3.5 h-3.5" />
            <span>Never Run Out</span>
          </div>
          <h3 className="font-serif text-lg font-semibold text-[#242326]">
            Instant Credit Top-Up Bundles
          </h3>
          <p className="text-xs text-[#5C585E]">
            Planning a major event or wardrobe overhaul? Top-up credits never expire and stay in your bonus balance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {CREDIT_TOP_UP_PACKS.map((pack) => (
            <div
              key={pack.id}
              className={`relative rounded-2xl p-5 border flex flex-col justify-between transition-all ${
                pack.popular
                  ? 'bg-[#FAF7F2] border-2 border-[#9C6A61] shadow-sm'
                  : 'bg-white border-[#242326]/10 hover:border-[#242326]/25'
              }`}
            >
              {pack.popular && (
                <div className="absolute -top-3 right-4">
                  <span className="bg-[#9C6A61] text-white text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                    Most Popular
                  </span>
                </div>
              )}

              <div>
                <h4 className="font-serif text-base font-semibold text-[#242326] mb-1">
                  {pack.name}
                </h4>

                <div className="flex items-baseline gap-1 mb-2">
                  <span className="font-mono text-2xl font-bold text-[#242326]">
                    {pack.credits + pack.bonusCredits}
                  </span>
                  <span className="text-xs text-[#5C585E]">Credits</span>
                  {pack.bonusCredits > 0 && (
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-md ml-1">
                      +{pack.bonusCredits} Bonus
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-[#5C585E] leading-relaxed mb-4 min-h-[34px]">
                  {pack.tagline}
                </p>
              </div>

              <div>
                <div className="py-2 border-t border-[#242326]/8 mb-3 flex items-center justify-between">
                  <span className="text-xs text-[#5C585E]">Demonstration price</span>
                  <span className="font-serif text-base font-bold text-[#242326]">
                    Demo R{pack.priceZar}
                  </span>
                </div>

                <button
                  onClick={() => handleBuy(pack)}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                    pack.popular
                      ? 'bg-[#9C6A61] hover:bg-[#85564e] text-white'
                      : 'bg-[#242326] hover:bg-[#38363a] text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Preview top-up</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
