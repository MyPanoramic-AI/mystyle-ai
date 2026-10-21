/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  MembershipSubpageTab,
  UserMembership,
  CreditBalance,
  AccountSettings,
  PrivacySettings,
  NotificationSettings,
  SubscriptionPlanId,
  BillingCycle,
} from '../../types/membership';
import {
  getMembership,
  updateSubscriptionPlan,
  cancelSubscription,
  resumeSubscription,
  getCreditBalance,
  purchaseTopUpPack,
  getCreditTransactions,
  getAccountSettings,
  updateAccountSettings,
  getPrivacySettings,
  updatePrivacySettings,
  getNotificationSettings,
  updateNotificationSettings,
} from '../../services/membershipService';
import { MyMembershipView } from './MyMembershipView';
import { ExplorePlansView } from './ExplorePlansView';
import { CreditsOverviewView } from './CreditsOverviewView';
import { CreditHistoryView } from './CreditHistoryView';
import { AccountSettingsView } from './AccountSettingsView';
import { PrivacyDataView } from './PrivacyDataView';
import { NotificationPreferencesView } from './NotificationPreferencesView';
import {
  ArrowLeft,
  Crown,
  Sparkles,
  History,
  User,
  Shield,
  Bell,
  Layers,
} from 'lucide-react';
import { accountApi, type MembershipCreditEntry, type MembershipPlanDefinition } from '../../services/accountApi';

interface MembershipHubScreenProps {
  initialTab?: MembershipSubpageTab;
  onBack: () => void;
}

export const MembershipHubScreen: React.FC<MembershipHubScreenProps> = ({
  initialTab = 'membership',
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<MembershipSubpageTab>(initialTab);
  const [membership, setMembership] = useState<UserMembership>(() => getMembership());
  const [credits, setCredits] = useState<CreditBalance>(() => getCreditBalance());
  const [accountSettings, setAccountSettings] = useState<AccountSettings>(() => getAccountSettings());
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>(() => getPrivacySettings());
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() => getNotificationSettings());
  const [transactions, setTransactions] = useState(() => getCreditTransactions());
  const [accountPlan, setAccountPlan] = useState<string | null>(null);
  const [accountStatus, setAccountStatus] = useState<string | null>(null);
  const [accountFeatures, setAccountFeatures] = useState<string[]>([]);
  const [testCredits, setTestCredits] = useState<number | null>(null);
  const [testEntries, setTestEntries] = useState<MembershipCreditEntry[]>([]);
  const [publishedPlans, setPublishedPlans] = useState<MembershipPlanDefinition[]>([]);
  const [accountError, setAccountError] = useState<string | null>(null);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      accountApi.membershipEntitlement(),
      accountApi.membershipCredits(),
      accountApi.membershipPlans(),
    ]).then(([entitlement, credits, plans]) => {
      if (cancelled) return;
      const match = plans.plans.find((plan) => plan.planCode === entitlement.current?.planCode);
      setAccountPlan(match?.displayName ?? entitlement.current?.planCode ?? 'None');
      setAccountStatus(entitlement.current?.status ?? 'none');
      setAccountFeatures(entitlement.current?.featureKeys ?? []);
      setTestCredits(credits.balance);
      setTestEntries(credits.entries);
      setPublishedPlans(plans.plans);
      setAccountError(null);
    }).catch(() => {
      if (cancelled) return;
      setAccountError('Account membership could not be loaded. No membership has been assumed.');
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const refreshAllState = () => {
    setMembership(getMembership());
    setCredits(getCreditBalance());
    setTransactions(getCreditTransactions());
  };

  const handleSelectPlan = (planId: SubscriptionPlanId, billingCycle: BillingCycle) => {
    const updated = updateSubscriptionPlan(planId, billingCycle);
    setMembership(updated);
    refreshAllState();
  };

  const handleCancelSub = () => {
    const updated = cancelSubscription();
    setMembership(updated);
  };

  const handleResumeSub = () => {
    const updated = resumeSubscription();
    setMembership(updated);
  };

  const handlePurchaseTopUp = (packId: string) => {
    const res = purchaseTopUpPack(packId);
    if (res.success) {
      setCredits(res.newBalance);
      setTransactions(getCreditTransactions());
    }
  };

  const handleSaveAccount = (newSettings: AccountSettings) => {
    const updated = updateAccountSettings(newSettings);
    setAccountSettings(updated);
  };

  const handleSavePrivacy = (newSettings: PrivacySettings) => {
    const updated = updatePrivacySettings(newSettings);
    setPrivacySettings(updated);
  };

  const handleSaveNotifications = (newSettings: NotificationSettings) => {
    const updated = updateNotificationSettings(newSettings);
    setNotificationSettings(updated);
  };

  const navTabs: { id: MembershipSubpageTab; label: string; icon: React.ReactNode }[] = [
    { id: 'membership', label: 'My Membership', icon: <Crown className="w-3.5 h-3.5" /> },
    { id: 'plans', label: 'Explore Plans', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'credits', label: 'AI Credits', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: 'credit-history', label: 'Credit History', icon: <History className="w-3.5 h-3.5" /> },
    { id: 'settings', label: 'Account Settings', icon: <User className="w-3.5 h-3.5" /> },
    { id: 'privacy', label: 'Privacy & Data', icon: <Shield className="w-3.5 h-3.5" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Top Header with Back Button and Quick Credit Pill */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-2xl bg-white border border-[#242326]/10 hover:bg-[#F6F2EC] text-[#242326] flex items-center justify-center transition-colors cursor-pointer shadow-xs"
            title="Return to My Profile"
            aria-label="Return to My Profile"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9C6A61]">
                Account & Membership Hub
              </span>
              <span className="text-xs text-[#5C585E]">/</span>
              <span className="text-xs font-medium text-[#242326] capitalize">
                {navTabs.find((t) => t.id === activeTab)?.label}
              </span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#242326]">
              {activeTab === 'membership' && 'My Membership'}
              {activeTab === 'plans' && 'Explore Subscription Plans'}
              {activeTab === 'credits' && 'AI Image & Styling Credits'}
              {activeTab === 'credit-history' && 'Credit Usage Ledger'}
              {activeTab === 'settings' && 'Account & Security Settings'}
              {activeTab === 'privacy' && 'Privacy & Data Control'}
              {activeTab === 'notifications' && 'Notification Preferences'}
            </h1>
          </div>
        </div>

        {/* Floating Credit Status Pill */}
        <button
          onClick={() => setActiveTab('credits')}
          className="self-start sm:self-auto px-3.5 py-1.5 rounded-full bg-white border border-[#B49361]/30 hover:border-[#B49361] text-xs font-semibold text-[#242326] flex items-center gap-2 shadow-xs transition-all cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#B49361]" />
          <span>{testCredits === null ? 'Test credits unavailable' : `${testCredits} test credits`}</span>
        </button>
      </div>

      {/* Horizontal Scrollable Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-[#242326]/8">
        {navTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-2 rounded-2xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === tab.id
                ? 'bg-[#242326] text-white shadow-xs font-semibold'
                : 'bg-white/60 hover:bg-white text-[#5C585E] hover:text-[#242326] border border-transparent hover:border-[#242326]/8'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <section aria-label="Account entitlement" className="rounded-2xl border border-[#242326]/10 bg-white px-4 py-3 text-sm text-[#242326]">
        {accountError ? (
          <p>{accountError}</p>
        ) : accountPlan === null ? (
          <p>Loading the account entitlement.</p>
        ) : (
          <div className="space-y-1">
            <p>Account plan: {accountPlan}</p>
            <p>Entitlement status: {accountStatus}</p>
            <p>Test credits: {testCredits}</p>
            <p>Not a paid subscription.</p>
            <p>Available features: {accountFeatures.length > 0 ? accountFeatures.join(', ') : 'None'}</p>
            {publishedPlans.length > 0 && (
              <p>
                Provisional prices, not live offers: {publishedPlans.map((plan) => `${plan.displayName} R${plan.indicativeMonthlyZar ?? 0}`).join(' · ')}
              </p>
            )}
            {testEntries.length > 0 && (
              <ul className="pt-1 text-xs text-[#5C585E]">
                {testEntries.slice(-5).map((entry, index) => (
                  <li key={`${entry.createdAt}-${entry.entryType}-${index}`}>{entry.entryType} {entry.delta}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>

      {/* Active Subpage Content */}
      <div className="pt-2">
        {activeTab === 'membership' && (
          <MyMembershipView
            membership={membership}
            onExplorePlans={() => setActiveTab('plans')}
            onOpenCredits={() => setActiveTab('credits')}
            onCancelSubscription={handleCancelSub}
            onResumeSubscription={handleResumeSub}
          />
        )}

        {activeTab === 'plans' && (
          <ExplorePlansView
            currentMembership={membership}
            onSelectPlan={handleSelectPlan}
          />
        )}

        {activeTab === 'credits' && (
          <CreditsOverviewView
            balance={credits}
            onPurchaseTopUp={handlePurchaseTopUp}
            onViewHistory={() => setActiveTab('credit-history')}
          />
        )}

        {activeTab === 'credit-history' && (
          <CreditHistoryView
            transactions={transactions}
            onBackToCredits={() => setActiveTab('credits')}
          />
        )}

        {activeTab === 'settings' && (
          <AccountSettingsView
            settings={accountSettings}
            onSaveSettings={handleSaveAccount}
          />
        )}

        {activeTab === 'privacy' && (
          <PrivacyDataView
            settings={privacySettings}
            onSaveSettings={handleSavePrivacy}
          />
        )}

        {activeTab === 'notifications' && (
          <NotificationPreferencesView
            settings={notificationSettings}
            onSaveSettings={handleSaveNotifications}
          />
        )}
      </div>
    </div>
  );
};
