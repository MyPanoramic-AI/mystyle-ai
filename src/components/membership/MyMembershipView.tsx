/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserMembership, SubscriptionPlan } from '../../types/membership';
import { SUBSCRIPTION_PLANS } from '../../data/membershipData';
import {
  Crown,
  Sparkles,
  Calendar,
  CreditCard,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface MyMembershipViewProps {
  membership: UserMembership;
  onExplorePlans: () => void;
  onOpenCredits: () => void;
  onCancelSubscription: () => void;
  onResumeSubscription: () => void;
}

export const MyMembershipView: React.FC<MyMembershipViewProps> = ({
  membership,
  onExplorePlans,
  onOpenCredits,
  onCancelSubscription,
  onResumeSubscription,
}) => {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const currentPlan: SubscriptionPlan =
    SUBSCRIPTION_PLANS.find((p) => p.id === membership.planId) || SUBSCRIPTION_PLANS[1];

  const isFree = currentPlan.id === 'free';
  const priceDisplay =
    membership.billingCycle === 'monthly'
      ? `R${currentPlan.monthlyPriceZar}/month`
      : `R${currentPlan.yearlyPriceZar}/year (billed annually)`;

  return (
    <div className="space-y-6">
      {/* Active Tier Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#242326] via-[#2d2c30] to-[#1c1a1d] text-white p-6 sm:p-8 shadow-lg border border-[#B49361]/25">
        <div className="absolute top-0 right-0 -mr-12 -mt-12 w-64 h-64 bg-[#B49361]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-12 -mb-12 w-48 h-48 bg-[#9C6A61]/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-[#E5CDBE]">
              <Crown className="w-3.5 h-3.5 text-[#B49361]" />
              <span>Current Membership Tier</span>
            </div>

            {membership.cancelAtPeriodEnd ? (
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-500/20 text-amber-200 border border-amber-500/30">
                Cancels at end of billing cycle
              </span>
            ) : (
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Active Subscription
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 mb-4">
            <div>
              <h2 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight text-white mb-1">
                {currentPlan.name}
              </h2>
              <p className="text-sm text-[#E5CDBE]/80 max-w-xl">
                {currentPlan.tagline}
              </p>
            </div>

            <div className="text-left sm:text-right shrink-0">
              <span className="font-serif text-2xl sm:text-3xl font-bold text-white">
                {isFree ? 'Free' : `R${membership.billingCycle === 'monthly' ? currentPlan.monthlyPriceZar : Math.round(currentPlan.yearlyPriceZar / 12)}`}
              </span>
              {!isFree && (
                <span className="text-xs text-[#E5CDBE]/70 block">
                  per month · {membership.billingCycle === 'monthly' ? 'Billed monthly' : 'Billed annually'}
                </span>
              )}
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-5 mt-4 border-t border-white/10 text-xs">
            <div className="p-3 rounded-2xl bg-white/5 backdrop-blur-xs border border-white/10">
              <span className="text-[#E5CDBE]/70 block mb-0.5">Monthly Credit Allowance</span>
              <span className="font-semibold text-white text-sm flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#B49361]" />
                {currentPlan.monthlyCredits} AI Credits / mo
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-white/5 backdrop-blur-xs border border-white/10">
              <span className="text-[#E5CDBE]/70 block mb-0.5">Renewal Date</span>
              <span className="font-semibold text-white text-sm flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#9C6A61]" />
                {membership.renewsOn}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-white/5 backdrop-blur-xs border border-white/10">
              <span className="text-[#E5CDBE]/70 block mb-0.5">Payment Method</span>
              <span className="font-semibold text-white text-sm flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-[#B49361]" />
                {isFree ? 'No card required' : 'Demonstration · no card charged'}
              </span>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-6">
            <button
              onClick={onExplorePlans}
              className="px-5 py-2.5 rounded-xl bg-[#B49361] hover:bg-[#a08152] text-white text-xs font-semibold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <Crown className="w-3.5 h-3.5" />
              <span>{isFree ? 'Preview Signature' : 'Explore All Tier Options'}</span>
            </button>

            <button
              onClick={onOpenCredits}
              className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium border border-white/15 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#B49361]" />
              <span>Manage AI Credits</span>
            </button>

            {!isFree && (
              <div className="ml-auto">
                {membership.cancelAtPeriodEnd ? (
                  <button
                    onClick={onResumeSubscription}
                    className="px-4 py-2 text-xs font-medium text-emerald-300 hover:text-emerald-200 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Resume Subscription</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="px-3 py-2 text-xs font-medium text-[#E5CDBE]/60 hover:text-red-300 transition-colors cursor-pointer"
                  >
                    Cancel Plan
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Plan Features Included */}
      <div className="rounded-3xl bg-white border border-[#242326]/10 p-6 sm:p-8 shadow-xs">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#E5CDBE]/40 text-[#9C6A61] flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-semibold text-[#242326]">
                What's Included in {currentPlan.name}
              </h3>
              <p className="text-xs text-[#5C585E]">
                Full breakdown of your current styling allowances and studio capabilities.
              </p>
            </div>
          </div>

          <button
            onClick={onExplorePlans}
            className="text-xs font-semibold text-[#9C6A61] hover:text-[#794E46] flex items-center gap-1 cursor-pointer"
          >
            <span>Compare Tiers</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {currentPlan.features.map((feat, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-2xl border flex items-start gap-3 transition-colors ${
                feat.included
                  ? feat.highlight
                    ? 'bg-[#FAF7F2] border-[#B49361]/30 text-[#242326]'
                    : 'bg-[#F6F2EC]/60 border-[#242326]/6 text-[#242326]'
                  : 'bg-white border-[#242326]/6 text-[#5C585E]/60 opacity-60'
              }`}
            >
              {feat.included ? (
                <CheckCircle2 className="w-4 h-4 text-[#9C6A61] shrink-0 mt-0.5" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-dashed border-[#5C585E]/40 shrink-0 mt-0.5" />
              )}
              <div className="text-xs leading-relaxed">
                <span className={feat.included ? 'font-medium' : 'line-through'}>
                  {feat.text}
                </span>
                {feat.highlight && (
                  <span className="block text-[10px] text-[#B49361] font-semibold mt-0.5">
                    Signature Highlight
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Honest Prototype Notice */}
      <div className="rounded-2xl bg-[#FAF7F2] border border-[#B49361]/25 p-4 sm:p-5 flex items-start gap-3.5 text-xs text-[#5C585E]">
        <HelpCircle className="w-5 h-5 text-[#B49361] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-semibold text-[#242326] block">
            Transparent Prototype Guarantee
          </span>
          <p>
            This application is currently in frontend prototype mode. All tier switches, credit refills,
            and billing updates are simulated deterministically in your local browser memory. No live credit
            card charges or external billing webhooks are executed.
          </p>
        </div>
      </div>

      {/* Cancellation Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-[#242326]/10 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 flex items-center justify-center mb-2">
              <AlertCircle className="w-6 h-6" />
            </div>

            <h3 className="font-serif text-xl font-semibold text-[#242326]">
              Cancel {currentPlan.name} Subscription?
            </h3>

            <p className="text-xs text-[#5C585E] leading-relaxed">
              You will keep your {currentPlan.name} benefits and remaining AI credits until the end of your
              current billing period on <strong>{membership.renewsOn}</strong>. After this date, your account
              will gently transition to the free Discovery tier with no recurring charges.
            </p>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2.5 rounded-xl border border-[#242326]/15 text-xs font-semibold text-[#242326] hover:bg-[#F6F2EC] cursor-pointer"
              >
                Keep My Membership
              </button>
              <button
                onClick={() => {
                  onCancelSubscription();
                  setShowCancelModal(false);
                }}
                className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold cursor-pointer"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
