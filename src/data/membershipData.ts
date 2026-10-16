/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Demonstration dataset for MyStyle AI - Memberships, Subscriptions, AI Credits & Settings.
 * Grounded in South African Rand (ZAR) pricing, honest prototype data, and transparent cost rules.
 */

import {
  SubscriptionPlan,
  UserMembership,
  CreditBalance,
  CreditCostRule,
  CreditTopUpPack,
  CreditTransaction,
  AccountSettings,
  PrivacySettings,
  NotificationSettings,
} from '../types/membership';

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Discovery',
    tagline: 'Essential personal styling & wardrobe organisation for mindful dressing.',
    monthlyPriceZar: 0,
    yearlyPriceZar: 0,
    monthlyCredits: 10,
    accentColor: '#5C585E',
    features: [
      { text: '10 monthly AI styling image credits', included: true },
      { text: 'Digital Wardrobe up to 30 pieces', included: true },
      { text: 'Basic AI Personal Stylist chats (text)', included: true },
      { text: 'Standard resolution Virtual Try-On previews', included: true },
      { text: 'Family styling profiles (up to 2 members)', included: true },
      { text: 'South African retailer price search (Woolworths, Superbalist)', included: true },
      { text: 'Wardrobe gap & color palette intelligence', included: false },
      { text: 'High-definition photo realistic try-ons', included: false },
      { text: 'Full family occasion coordination (unlimited)', included: false },
      { text: 'Priority AI generation speed & dedicated stylist memory', included: false },
    ],
  },
  {
    id: 'signature',
    name: 'Signature',
    tagline: 'Our most loved tier for discerning fashion lovers wanting complete personal styling.',
    monthlyPriceZar: 149,
    yearlyPriceZar: 1490, // Save R298 (~2 months free)
    monthlyCredits: 50,
    isPopular: true,
    badge: 'Most Popular',
    accentColor: '#9C6A61',
    features: [
      { text: '50 monthly AI image generation & try-on credits', included: true, highlight: true },
      { text: 'Unlimited digital wardrobe piece uploads', included: true },
      { text: 'Uncapped conversational AI Stylist with full memory', included: true },
      { text: 'High-definition 4K Virtual Try-On studio renders', included: true, highlight: true },
      { text: 'Intelligent wardrobe gap detection & outfit combinations', included: true },
      { text: 'Family styling & coordination for up to 6 members', included: true },
      { text: 'Complete Beauty Studio (hair, makeup, nails matching)', included: true },
      { text: 'Exclusive SA designer previews & private sale alerts', included: true },
      { text: 'Automatic credit roll-over up to 100 unused credits', included: true },
      { text: '1-on-1 human couture stylist masterclasses', included: false },
    ],
  },
  {
    id: 'atelier',
    name: 'Private Atelier',
    tagline: 'The ultimate luxury experience: bespoke styling, VIP generation speed and multi-household family management.',
    monthlyPriceZar: 349,
    yearlyPriceZar: 3490, // Save R698
    monthlyCredits: 150,
    badge: 'Luxury Haute',
    accentColor: '#B49361',
    features: [
      { text: '150 monthly premium AI credits (fastest GPU generation)', included: true, highlight: true },
      { text: 'Unlimited multi-household family profiles & wardrobes', included: true },
      { text: 'Studio-grade photorealistic try-on previews & video simulation', included: true, highlight: true },
      { text: 'Automated seasonal capsule builder with luggage packing plans', included: true },
      { text: 'Direct WhatsApp private styling concierge line', included: true, highlight: true },
      { text: 'All Signature tier capabilities included', included: true },
      { text: 'Priority access to experimental AI beauty features', included: true },
      { text: 'Full rollover of all unused monthly credits', included: true },
      { text: 'VIP South African fashion boutique showroom invitations', included: true },
      { text: 'Zero wait times during peak South African fashion weeks', included: true },
    ],
  },
];

export const DEFAULT_USER_MEMBERSHIP: UserMembership = {
  planId: 'signature',
  billingCycle: 'monthly',
  status: 'active',
  renewsOn: '1 November 2026',
  startedOn: '1 October 2026',
  cancelAtPeriodEnd: false,
  cardLast4: '4289',
  paymentMethod: 'Visa •••• 4289',
};

export const DEFAULT_CREDIT_BALANCE: CreditBalance = {
  totalMonthlyAllocation: 50,
  remainingCredits: 28,
  bonusCredits: 6,
  renewsOn: '1 November 2026',
};

export const CREDIT_COST_RULES: CreditCostRule[] = [
  {
    id: 'rule-try-on',
    activityName: 'Virtual Try-On Photorealistic Render',
    category: 'try_on',
    costCredits: 2,
    description: 'Generates a high-fidelity fitting simulation of any garment tailored to your silhouette.',
  },
  {
    id: 'rule-beauty-look',
    activityName: 'Complete Beauty Studio Ensemble Consultation',
    category: 'beauty_studio',
    costCredits: 3,
    description: 'Harmonises hairstyle, hair colour, makeup tones, and manicured nail recommendations.',
  },
  {
    id: 'rule-beauty-single',
    activityName: 'Single Hair or Makeup Makeover Preview',
    category: 'beauty_studio',
    costCredits: 1,
    description: 'Instant visualization of a single hairstyle, balayage hair color, or makeup palette.',
  },
  {
    id: 'rule-family-concept',
    activityName: 'Coordinated Family Occasion Blueprint',
    category: 'family_coordination',
    costCredits: 4,
    description: 'Curates color-harmonized outfits across multiple family members with palette cohesion.',
  },
  {
    id: 'rule-wardrobe-studio',
    activityName: 'Wardrobe Studio Mix-and-Match Harmony Score',
    category: 'wardrobe_analysis',
    costCredits: 1,
    description: 'Calculates silhouette balance, color contrast, and occasion appropriateness for custom assemblies.',
    freeInPlan: ['signature', 'atelier'],
  },
  {
    id: 'rule-stylist-chat',
    activityName: 'Personal Stylist Conversational Consultations',
    category: 'subscription',
    costCredits: 0,
    description: 'Unlimited advice on dress codes, fashion history, fabric care, and tailoring recommendations.',
    freeInPlan: ['free', 'signature', 'atelier'],
  },
];

export const CREDIT_TOP_UP_PACKS: CreditTopUpPack[] = [
  {
    id: 'pack-starter',
    name: 'Occasion Spark',
    credits: 20,
    bonusCredits: 0,
    priceZar: 49,
    tagline: 'Perfect for styling an upcoming weekend wedding or celebratory dinner.',
  },
  {
    id: 'pack-popular',
    name: 'Stylist Wardrobe Pack',
    credits: 50,
    bonusCredits: 10,
    priceZar: 99,
    popular: true,
    tagline: 'Most popular: 60 total credits (including 10 free bonus credits). Never expires.',
  },
  {
    id: 'pack-atelier',
    name: 'Haute Collector Bundle',
    credits: 120,
    bonusCredits: 30,
    priceZar: 199,
    tagline: 'Best value: 150 total credits. Ideal for extensive try-on sessions & family planning.',
  },
];

export const DEMO_CREDIT_TRANSACTIONS: CreditTransaction[] = [
  {
    id: 'tx-001',
    date: '14 Oct 2026',
    time: '14:20',
    activityName: 'Virtual Try-On: Studio W Pure Linen Blazer',
    category: 'try_on',
    creditsChange: -2,
    balanceAfter: 28,
    details: 'Photorealistic render with front silhouette photo',
  },
  {
    id: 'tx-002',
    date: '14 Oct 2026',
    time: '11:05',
    activityName: 'Beauty Studio: Golden Hour Sun-Kissed Glam Look',
    category: 'beauty_studio',
    creditsChange: -3,
    balanceAfter: 30,
    details: 'Complete look consult (bronzed skin, berry lip, warm chestnut balayage)',
  },
  {
    id: 'tx-003',
    date: '13 Oct 2026',
    time: '18:42',
    activityName: 'Family Styling: Franschhoek Summer Wine Farm Wedding',
    category: 'family_coordination',
    creditsChange: -4,
    balanceAfter: 33,
    details: 'Coordinated outfits for Nandi, Sipho, and Kaelo with Sage & Terracotta palette',
  },
  {
    id: 'tx-004',
    date: '10 Oct 2026',
    time: '09:15',
    activityName: 'Top-Up Pack: Stylist Wardrobe Pack (+10 Bonus)',
    category: 'pack_purchase',
    creditsChange: +60,
    balanceAfter: 37,
    details: 'R99 top-up pack purchased via Visa •••• 4289',
  },
  {
    id: 'tx-005',
    date: '1 Oct 2026',
    time: '00:01',
    activityName: 'Monthly Signature Plan Allocation',
    category: 'subscription',
    creditsChange: +50,
    balanceAfter: 50,
    details: 'Monthly membership credit replenishment',
  },
];

export const DEFAULT_ACCOUNT_SETTINGS: AccountSettings = {
  firstName: 'Nandi',
  lastName: 'Mthembu',
  email: 'nandi.mthembu@capestyle.co.za',
  phoneNumber: '+27 82 459 8812',
  city: 'Cape Town',
  province: 'Western Cape',
  country: 'South Africa',
  currency: 'ZAR (R)',
  twoFactorEnabled: true,
  biometricLoginEnabled: true,
  linkedGoogle: true,
  linkedApple: false,
  linkedWhatsApp: true,
};

export const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  ephemeralPhotosOnly: false,
  allowStyleRecommendationsLearning: true,
  allowRetailerPersonalization: true,
  storeHighResTryOnsLocally: true,
  analyticsOptOut: false,
  dataRetentionMonths: 12,
};

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  pushEnabled: true,
  emailEnabled: true,
  smsEnabled: false,
  weeklyStyleDrop: true,
  weatherOutfitAlerts: true,
  creditRenewalReminders: true,
  salesAndPriceDrops: true,
  wardrobeRotationPrompts: false,
  familyEventReminders: true,
};
