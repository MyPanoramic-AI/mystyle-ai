/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  SubscriptionPlanId,
  BillingCycle,
  UserMembership,
  SubscriptionPlan,
} from '../../types/membership';
import { SUBSCRIPTION_PLANS } from '../../data/membershipData';
import {
  Check,
  Crown,
  Sparkles,
  Zap,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Info,
} from 'lucide-react';

interface ExplorePlansViewProps {
  currentMembership: UserMembership;
  onSelectPlan: (planId: SubscriptionPlanId, billingCycle: BillingCycle) => void;
}

export const ExplorePlansView: React.FC<ExplorePlansViewProps> = ({
  currentMembership,
  onSelectPlan,
}) => {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(currentMembership.billingCycle);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleChoose = (planId: SubscriptionPlanId) => {
    onSelectPlan(planId, billingCycle);
    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
    setSuccessMessage(`Successfully switched to ${plan?.name} tier (${billingCycle}).`);
    setTimeout(() => {
      setSuccessMessage(null);
    }, 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header & Value Proposition */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E5CDBE]/40 text-[#9C6A61] text-xs font-semibold uppercase tracking-wider">
          <Crown className="w-3.5 h-3.5" />
          <span>Transparent Membership Tiers</span>
        </div>
        <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#242326]">
          Invest in Effortless Personal Elegance
        </h2>
        <p className="text-xs sm:text-sm text-[#5C585E] leading-relaxed">
          From casual daily wardrobe organization to high-definition 4K Virtual Try-Ons and coordinated
          household styling, choose the tier that harmonizes with your lifestyle.
        </p>

        {/* Billing Switcher (Monthly / Yearly) */}
        <div className="pt-3 flex items-center justify-center">
          <div className="inline-flex items-center p-1 rounded-2xl bg-[#F6F2EC] border border-[#242326]/8 shadow-inner">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                billingCycle === 'monthly'
                  ? 'bg-white text-[#242326] shadow-xs font-semibold'
                  : 'text-[#5C585E] hover:text-[#242326]'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-4 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                billingCycle === 'yearly'
                  ? 'bg-[#242326] text-white shadow-xs font-semibold'
                  : 'text-[#5C585E] hover:text-[#242326]'
              }`}
            >
              <span>Annual Billing</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#B49361] text-white">
                Save 17%
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Success Notification Alert */}
      {successMessage && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-300 p-4 text-xs font-medium text-emerald-800 flex items-center gap-2.5 animate-fadeIn max-w-xl mx-auto shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* 3 Tier Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {SUBSCRIPTION_PLANS.map((plan) => {
          const isCurrent =
            currentMembership.planId === plan.id && currentMembership.billingCycle === billingCycle;
          const isCurrentTierDifferentCycle = currentMembership.planId === plan.id;
          const isFree = plan.id === 'free';
          const monthlyPrice =
            billingCycle === 'monthly'
              ? plan.monthlyPriceZar
              : Math.round(plan.yearlyPriceZar / 12);
          const annualTotal = plan.yearlyPriceZar;

          return (
            <div
              key={plan.id}
              className={`relative rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all ${
                plan.isPopular
                  ? 'bg-white border-2 border-[#9C6A61] shadow-md ring-4 ring-[#9C6A61]/10'
                  : 'bg-white border border-[#242326]/10 shadow-xs hover:border-[#242326]/25'
              }`}
            >
              {/* Top Badges */}
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span
                    className="px-3.5 py-1 rounded-full text-[11px] font-bold text-white shadow-xs uppercase tracking-wider"
                    style={{ backgroundColor: plan.accentColor }}
                  >
                    {plan.badge}
                  </span>
                </div>
              )}

              <div>
                {/* Plan Header */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-serif text-xl font-semibold text-[#242326]">
                      {plan.name}
                    </h3>
                    <span className="text-xs font-medium text-[#9C6A61] flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      {plan.monthlyCredits} credits/mo
                    </span>
                  </div>
                  <p className="text-xs text-[#5C585E] leading-relaxed min-h-[36px]">
                    {plan.tagline}
                  </p>
                </div>

                {/* Price Display */}
                <div className="py-4 border-y border-[#242326]/8 mb-5">
                  <div className="flex items-baseline gap-1">
                    <span className="font-serif text-3xl font-bold text-[#242326]">
                      {isFree ? 'Free' : `R${monthlyPrice}`}
                    </span>
                    {!isFree && (
                      <span className="text-xs text-[#5C585E]">/ month</span>
                    )}
                  </div>
                  {!isFree && (
                    <span className="text-[11px] text-[#5C585E] mt-0.5 block">
                      {billingCycle === 'yearly'
                        ? `R${annualTotal} billed once a year (~2 months free)`
                        : 'Billed monthly, cancel anytime'}
                    </span>
                  )}
                  {isFree && (
                    <span className="text-[11px] text-[#5C585E] mt-0.5 block">
                      Forever free, no credit card required
                    </span>
                  )}
                </div>

                {/* Features List */}
                <div className="space-y-2.5 mb-6">
                  <span className="text-[11px] font-semibold text-[#242326] uppercase tracking-wider block mb-2">
                    Key Capabilities:
                  </span>
                  {plan.features.map((feat, idx) => (
                    <div
                      key={idx}
                      className={`flex items-start gap-2.5 text-xs leading-snug ${
                        feat.included
                          ? 'text-[#242326]'
                          : 'text-[#5C585E]/50 line-through'
                      }`}
                    >
                      {feat.included ? (
                        <div
                          className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                          style={{ backgroundColor: `${plan.accentColor}20`, color: plan.accentColor }}
                        >
                          <Check className="w-3 h-3 stroke-[2.5]" />
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-dashed border-[#5C585E]/30 shrink-0 mt-0.5" />
                      )}
                      <span className={feat.highlight ? 'font-semibold text-[#242326]' : ''}>
                        {feat.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                {isCurrent ? (
                  <div className="w-full py-2.5 px-4 rounded-xl bg-[#F6F2EC] text-[#242326] text-xs font-semibold text-center border border-[#242326]/10 flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Your Current Tier</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleChoose(plan.id)}
                    className={`w-full py-3 px-4 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
                      plan.isPopular
                        ? 'bg-[#9C6A61] hover:bg-[#85564e] text-white'
                        : plan.id === 'atelier'
                        ? 'bg-[#242326] hover:bg-[#38363a] text-white'
                        : 'bg-[#F6F2EC] hover:bg-[#E5CDBE]/40 text-[#242326] border border-[#242326]/15'
                    }`}
                  >
                    <span>
                      {isCurrentTierDifferentCycle
                        ? `Switch to ${billingCycle === 'monthly' ? 'Monthly' : 'Annual'}`
                        : plan.id === 'free'
                        ? 'Downgrade to Free'
                        : `Select ${plan.name}`}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Feature Guarantee & FAQ strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 text-xs text-[#5C585E]">
        <div className="p-4 rounded-2xl bg-[#F6F2EC] border border-[#242326]/6 space-y-1">
          <span className="font-semibold text-[#242326] flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#B49361]" />
            Cancel Anytime
          </span>
          <p>You remain in complete control. Subscriptions can be paused or cancelled at any time with one click.</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#F6F2EC] border border-[#242326]/6 space-y-1">
          <span className="font-semibold text-[#242326] flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-[#9C6A61]" />
            Credit Rollover
          </span>
          <p>Unused credits roll over to the next month on Signature and Atelier plans so you never lose what you paid for.</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#F6F2EC] border border-[#242326]/6 space-y-1">
          <span className="font-semibold text-[#242326] flex items-center gap-1.5">
            <Info className="w-4 h-4 text-[#242326]" />
            Local Currency
          </span>
          <p>All prices are quoted in South African Rand (ZAR) inclusive of VAT with local payment processing simulation.</p>
        </div>
      </div>
    </div>
  );
};
