/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Types for MyStyle AI - Memberships, AI Credits & Account Settings.
 */

export type SubscriptionPlanId = 'free' | 'signature' | 'atelier';

export type BillingCycle = 'monthly' | 'yearly';

export interface PlanFeature {
  text: string;
  included: boolean;
  highlight?: boolean;
}

export interface SubscriptionPlan {
  id: SubscriptionPlanId;
  name: string;
  tagline: string;
  monthlyPriceZar: number;
  yearlyPriceZar: number; // yearly price (equivalent to ~2 months free)
  monthlyCredits: number;
  badge?: string;
  isPopular?: boolean;
  accentColor: string;
  features: PlanFeature[];
}

export interface UserMembership {
  planId: SubscriptionPlanId;
  billingCycle: BillingCycle;
  status: 'active' | 'trial' | 'cancelled';
  renewsOn: string;
  startedOn: string;
  cancelAtPeriodEnd: boolean;
  cardLast4: string;
  paymentMethod: string;
}

export interface CreditBalance {
  totalMonthlyAllocation: number;
  remainingCredits: number;
  bonusCredits: number;
  renewsOn: string;
}

export type CreditTransactionType = 'usage' | 'monthly_allocation' | 'top_up' | 'bonus' | 'refund';

export type CreditActivityCategory = 
  | 'try_on'
  | 'beauty_studio'
  | 'family_coordination'
  | 'wardrobe_analysis'
  | 'subscription'
  | 'pack_purchase';

export interface CreditTransaction {
  id: string;
  date: string;
  time: string;
  activityName: string;
  category: CreditActivityCategory;
  creditsChange: number; // negative for usage, positive for top-up
  balanceAfter: number;
  details?: string;
}

export interface CreditCostRule {
  id: string;
  activityName: string;
  category: CreditActivityCategory;
  costCredits: number;
  description: string;
  freeInPlan?: SubscriptionPlanId[];
}

export interface CreditTopUpPack {
  id: string;
  name: string;
  credits: number;
  bonusCredits: number;
  priceZar: number;
  popular?: boolean;
  tagline: string;
}

export interface AccountSettings {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  city: string;
  province: string;
  country: string;
  currency: string;
  twoFactorEnabled: boolean;
  biometricLoginEnabled: boolean;
  linkedGoogle: boolean;
  linkedApple: boolean;
  linkedWhatsApp: boolean;
}

export interface PrivacySettings {
  ephemeralPhotosOnly: boolean;
  allowStyleRecommendationsLearning: boolean;
  allowRetailerPersonalization: boolean;
  storeHighResTryOnsLocally: boolean;
  analyticsOptOut: boolean;
  dataRetentionMonths: number;
}

export interface NotificationSettings {
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  weeklyStyleDrop: boolean;
  weatherOutfitAlerts: boolean;
  creditRenewalReminders: boolean;
  salesAndPriceDrops: boolean;
  wardrobeRotationPrompts: boolean;
  familyEventReminders: boolean;
}

export type MembershipSubpageTab = 
  | 'membership'
  | 'plans'
  | 'credits'
  | 'credit-history'
  | 'settings'
  | 'privacy'
  | 'notifications';
