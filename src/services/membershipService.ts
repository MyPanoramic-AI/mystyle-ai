/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Local persistence and business logic for MyStyle AI:
 * - Memberships & Subscriptions
 * - AI Image Credits & Top-ups
 * - Credit Usage Ledger
 * - Account Settings
 * - Privacy & Data Controls
 * - Notification Preferences
 */

import {
  UserMembership,
  SubscriptionPlanId,
  BillingCycle,
  CreditBalance,
  CreditTransaction,
  CreditActivityCategory,
  AccountSettings,
  PrivacySettings,
  NotificationSettings,
} from '../types/membership';
import {
  DEFAULT_USER_MEMBERSHIP,
  DEFAULT_CREDIT_BALANCE,
  DEMO_CREDIT_TRANSACTIONS,
  DEFAULT_ACCOUNT_SETTINGS,
  DEFAULT_PRIVACY_SETTINGS,
  DEFAULT_NOTIFICATION_SETTINGS,
  SUBSCRIPTION_PLANS,
  CREDIT_TOP_UP_PACKS,
} from '../data/membershipData';

const STORAGE_KEYS = {
  MEMBERSHIP: 'mystyle_membership',
  CREDITS: 'mystyle_credits',
  TRANSACTIONS: 'mystyle_credit_transactions',
  ACCOUNT: 'mystyle_account_settings',
  PRIVACY: 'mystyle_privacy_settings',
  NOTIFICATIONS: 'mystyle_notification_settings',
};

// --- MEMBERSHIP & SUBSCRIPTION ---
export const getMembership = (): UserMembership => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MEMBERSHIP);
    return raw ? JSON.parse(raw) : DEFAULT_USER_MEMBERSHIP;
  } catch {
    return DEFAULT_USER_MEMBERSHIP;
  }
};

export const updateSubscriptionPlan = (planId: SubscriptionPlanId, billingCycle: BillingCycle): UserMembership => {
  const current = getMembership();
  const targetPlan = SUBSCRIPTION_PLANS.find((p) => p.id === planId) || SUBSCRIPTION_PLANS[1];
  
  const updated: UserMembership = {
    ...current,
    planId,
    billingCycle,
    status: 'active',
    cancelAtPeriodEnd: false,
    renewsOn: '1 November 2026',
  };

  try {
    localStorage.setItem(STORAGE_KEYS.MEMBERSHIP, JSON.stringify(updated));
    
    // Also adjust monthly allocation in credit balance
    const credits = getCreditBalance();
    const updatedCredits: CreditBalance = {
      ...credits,
      totalMonthlyAllocation: targetPlan.monthlyCredits,
      remainingCredits: Math.max(credits.remainingCredits, targetPlan.monthlyCredits),
    };
    saveCreditBalance(updatedCredits);

    // Record transaction
    recordCreditTransaction({
      activityName: `Plan upgraded to ${targetPlan.name} (${billingCycle})`,
      category: 'subscription',
      creditsChange: targetPlan.monthlyCredits,
      details: `New plan tier activated: ${targetPlan.name}. Monthly allocation set to ${targetPlan.monthlyCredits} credits.`,
    });
  } catch (err) {
    console.error('Failed to update subscription in localStorage:', err);
  }

  return updated;
};

export const cancelSubscription = (): UserMembership => {
  const current = getMembership();
  const updated: UserMembership = {
    ...current,
    cancelAtPeriodEnd: true,
  };
  try {
    localStorage.setItem(STORAGE_KEYS.MEMBERSHIP, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to cancel subscription:', err);
  }
  return updated;
};

export const resumeSubscription = (): UserMembership => {
  const current = getMembership();
  const updated: UserMembership = {
    ...current,
    cancelAtPeriodEnd: false,
  };
  try {
    localStorage.setItem(STORAGE_KEYS.MEMBERSHIP, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to resume subscription:', err);
  }
  return updated;
};

// --- CREDITS & BALANCES ---
export const getCreditBalance = (): CreditBalance => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CREDITS);
    return raw ? JSON.parse(raw) : DEFAULT_CREDIT_BALANCE;
  } catch {
    return DEFAULT_CREDIT_BALANCE;
  }
};

export const saveCreditBalance = (balance: CreditBalance): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.CREDITS, JSON.stringify(balance));
  } catch (err) {
    console.error('Failed to save credit balance:', err);
  }
};

export const deductCredits = (
  amount: number,
  activityName: string,
  category: CreditActivityCategory,
  details?: string
): boolean => {
  const balance = getCreditBalance();
  const totalAvailable = balance.remainingCredits + balance.bonusCredits;
  
  if (totalAvailable < amount) {
    return false; // insufficient credits
  }

  let remaining = balance.remainingCredits;
  let bonus = balance.bonusCredits;

  if (remaining >= amount) {
    remaining -= amount;
  } else {
    const leftover = amount - remaining;
    remaining = 0;
    bonus = Math.max(0, bonus - leftover);
  }

  const updatedBalance: CreditBalance = {
    ...balance,
    remainingCredits: remaining,
    bonusCredits: bonus,
  };

  saveCreditBalance(updatedBalance);

  recordCreditTransaction({
    activityName,
    category,
    creditsChange: -amount,
    details: details || `Used ${amount} credits for ${activityName}`,
  });

  return true;
};

export const purchaseTopUpPack = (packId: string): { success: boolean; newBalance: CreditBalance } => {
  const pack = CREDIT_TOP_UP_PACKS.find((p) => p.id === packId);
  if (!pack) {
    return { success: false, newBalance: getCreditBalance() };
  }

  const current = getCreditBalance();
  const totalAdded = pack.credits + pack.bonusCredits;
  const updated: CreditBalance = {
    ...current,
    remainingCredits: current.remainingCredits + pack.credits,
    bonusCredits: current.bonusCredits + pack.bonusCredits,
  };

  saveCreditBalance(updated);

  recordCreditTransaction({
    activityName: `Top-Up Pack: ${pack.name}`,
    category: 'pack_purchase',
    creditsChange: totalAdded,
    details: `Purchased ${pack.credits} credits + ${pack.bonusCredits} bonus credits for R${pack.priceZar}`,
  });

  return { success: true, newBalance: updated };
};

// --- TRANSACTIONS LEDGER ---
export const getCreditTransactions = (): CreditTransaction[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    return raw ? JSON.parse(raw) : DEMO_CREDIT_TRANSACTIONS;
  } catch {
    return DEMO_CREDIT_TRANSACTIONS;
  }
};

export const recordCreditTransaction = (params: {
  activityName: string;
  category: CreditActivityCategory;
  creditsChange: number;
  details?: string;
}): void => {
  const history = getCreditTransactions();
  const balance = getCreditBalance();
  const now = new Date();
  
  const dateFormatted = now.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const timeFormatted = now.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const newTx: CreditTransaction = {
    id: `tx-${Date.now()}`,
    date: dateFormatted,
    time: timeFormatted,
    activityName: params.activityName,
    category: params.category,
    creditsChange: params.creditsChange,
    balanceAfter: balance.remainingCredits + balance.bonusCredits,
    details: params.details,
  };

  try {
    const updated = [newTx, ...history];
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to store transaction:', err);
  }
};

// --- ACCOUNT SETTINGS ---
export const getAccountSettings = (): AccountSettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACCOUNT);
    return raw ? JSON.parse(raw) : DEFAULT_ACCOUNT_SETTINGS;
  } catch {
    return DEFAULT_ACCOUNT_SETTINGS;
  }
};

export const updateAccountSettings = (settings: AccountSettings): AccountSettings => {
  try {
    localStorage.setItem(STORAGE_KEYS.ACCOUNT, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save account settings:', err);
  }
  return settings;
};

// --- PRIVACY SETTINGS ---
export const getPrivacySettings = (): PrivacySettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PRIVACY);
    return raw ? JSON.parse(raw) : DEFAULT_PRIVACY_SETTINGS;
  } catch {
    return DEFAULT_PRIVACY_SETTINGS;
  }
};

export const updatePrivacySettings = (settings: PrivacySettings): PrivacySettings => {
  try {
    localStorage.setItem(STORAGE_KEYS.PRIVACY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save privacy settings:', err);
  }
  return settings;
};

// --- NOTIFICATION SETTINGS ---
export const getNotificationSettings = (): NotificationSettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    return raw ? JSON.parse(raw) : DEFAULT_NOTIFICATION_SETTINGS;
  } catch {
    return DEFAULT_NOTIFICATION_SETTINGS;
  }
};

export const updateNotificationSettings = (settings: NotificationSettings): NotificationSettings => {
  try {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save notification settings:', err);
  }
  return settings;
};

// --- EXPORT & RESET UTILITIES ---
export const exportUserDataAsJson = (): string => {
  const data = {
    exportedAt: new Date().toISOString(),
    account: getAccountSettings(),
    membership: getMembership(),
    credits: getCreditBalance(),
    transactions: getCreditTransactions(),
    privacy: getPrivacySettings(),
    notifications: getNotificationSettings(),
  };
  return JSON.stringify(data, null, 2);
};

export const resetAllDemoData = (): void => {
  Object.values(STORAGE_KEYS).forEach((k) => {
    localStorage.removeItem(k);
  });
};
