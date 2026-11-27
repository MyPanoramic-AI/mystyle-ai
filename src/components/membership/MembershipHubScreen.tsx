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
import { accountApi, AccountApiError, type MembershipCreditEntry, type MembershipPlanDefinition } from '../../services/accountApi';
import { cataloguePlanToServerCode, serverCodeToCataloguePlan } from '../../services/membershipPlanMap';
import { DEFAULT_NOTIFICATION_SETTINGS } from '../../data/membershipData';

interface MembershipHubScreenProps {
  initialTab?: MembershipSubpageTab;
  onBack: () => void;
  usesAccount?: boolean;
  onUnauthenticated?: () => void;
}

export const MembershipHubScreen: React.FC<MembershipHubScreenProps> = ({
  initialTab = 'membership',
  onBack,
  usesAccount = false,
  onUnauthenticated,
}) => {
  const [activeTab, setActiveTab] = useState<MembershipSubpageTab>(initialTab);
  const [membership, setMembership] = useState<UserMembership>(() => getMembership());
  const [credits, setCredits] = useState<CreditBalance>(() => getCreditBalance());
  const [accountSettings, setAccountSettings] = useState<AccountSettings>(() => getAccountSettings());
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>(() => getPrivacySettings());
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() => getNotificationSettings());
  const [transactions, setTransactions] = useState(() => getCreditTransactions());
  const [accountPlan, setAccountPlan] = useState<string | null>(null);
  const [accountPlanCode, setAccountPlanCode] = useState<string | null>(null);
  const [accountStatus, setAccountStatus] = useState<string | null>(null);
  const [accountFeatures, setAccountFeatures] = useState<string[]>([]);
  const [accountEmail, setAccountEmail] = useState<string | null>(null);
  const [accountDisplayName, setAccountDisplayName] = useState<string | null>(null);
  const [accountEmailVerified, setAccountEmailVerified] = useState<boolean | null>(null);
  const [entitlementSource, setEntitlementSource] = useState<string | null>(null);
  const [entitlementSince, setEntitlementSince] = useState<string | null>(null);
  const [creditUnitLabel, setCreditUnitLabel] = useState<string | null>(null);
  const [paymentsEnabled, setPaymentsEnabled] = useState(false);
  const [testCredits, setTestCredits] = useState<number | null>(null);
  const [testEntries, setTestEntries] = useState<MembershipCreditEntry[]>([]);
  const [publishedPlans, setPublishedPlans] = useState<MembershipPlanDefinition[]>([]);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [previewPlanCode, setPreviewPlanCode] = useState<string | null>(null);
  const [previewNotice, setPreviewNotice] = useState<string | null>(null);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const applyAccountEntitlement = (
    entitlement: Awaited<ReturnType<typeof accountApi.membershipEntitlement>>,
    creditState: Awaited<ReturnType<typeof accountApi.membershipCredits>>,
    plans: Awaited<ReturnType<typeof accountApi.membershipPlans>>,
    identity?: {
      email: string;
      emailVerified: boolean;
      displayName: string | null;
      country?: string | null;
      currency?: string | null;
    },
  ) => {
    const match = plans.plans.find((plan) => plan.planCode === entitlement.current?.planCode);
    const planCode = entitlement.current?.planCode ?? 'FREE';
    const since = entitlement.current?.effectiveFrom ?? null;
    setAccountPlan(match?.displayName ?? planCode);
    setAccountPlanCode(planCode);
    setAccountStatus(entitlement.current?.status ?? 'none');
    setAccountFeatures(entitlement.current?.featureKeys ?? []);
    setEntitlementSource(entitlement.current?.source ?? null);
    setEntitlementSince(since);
    setTestCredits(creditState.balance);
    setTestEntries(creditState.entries);
    setCreditUnitLabel(creditState.label ?? null);
    setPublishedPlans(plans.plans);
    const billingLive = plans.paymentsEnabled === true || entitlement.paymentsEnabled === true;
    setPaymentsEnabled(billingLive);
    if (identity) {
      setAccountEmail(identity.email);
      setAccountEmailVerified(identity.emailVerified);
      setAccountDisplayName(identity.displayName);
      const parts = (identity.displayName || '').trim().split(/\s+/).filter(Boolean);
      setAccountSettings((prev) => ({
        ...prev,
        firstName: parts[0] || prev.firstName,
        lastName: parts.slice(1).join(' ') || '',
        email: identity.email || prev.email,
        country: identity.country || prev.country,
        currency: identity.currency || prev.currency,
      }));
    }
    setMembership({
      planId: serverCodeToCataloguePlan(planCode),
      billingCycle: 'monthly',
      status: entitlement.current?.status === 'active' ? 'active' : 'cancelled',
      renewsOn: billingLive ? 'See billing provider' : 'No paid renewal — payments not connected',
      startedOn: since ? since.slice(0, 10) : '—',
      cancelAtPeriodEnd: false,
      cardLast4: '',
      paymentMethod: 'Payments not connected',
    });
    setAccountError(null);
  };

  const reloadAccountMembership = async () => {
    const [entitlement, creditState, plans, session, profile] = await Promise.all([
      accountApi.membershipEntitlement(),
      accountApi.membershipCredits(),
      accountApi.membershipPlans(),
      accountApi.session(),
      accountApi.getProfile().catch(() => ({} as Record<string, unknown>)),
    ]);
    const displayName = typeof profile.displayName === 'string' ? profile.displayName : null;
    applyAccountEntitlement(entitlement, creditState, plans, {
      email: session.email,
      emailVerified: session.emailVerified === true,
      displayName,
      country: typeof profile.country === 'string' ? profile.country : null,
      currency: typeof profile.currency === 'string' ? profile.currency : null,
    });
  };

  useEffect(() => {
    if (!usesAccount) return;
    let cancelled = false;
    reloadAccountMembership().catch((error: unknown) => {
      if (cancelled) return;
      if (error instanceof AccountApiError && error.status === 401) {
        onUnauthenticated?.();
        setAccountError('Sign in again to load your account membership.');
        return;
      }
      setAccountError('Account membership could not be loaded. No membership has been assumed.');
    });
    void accountApi.getPreferences().then((prefs) => {
      if (cancelled) return;
      const notifications = (prefs.notifications && typeof prefs.notifications === 'object' && !Array.isArray(prefs.notifications))
        ? prefs.notifications as Partial<NotificationSettings>
        : {};
      setNotificationSettings({ ...DEFAULT_NOTIFICATION_SETTINGS, ...notifications });
      const privacy = (prefs.privacy && typeof prefs.privacy === 'object' && !Array.isArray(prefs.privacy))
        ? prefs.privacy as Partial<PrivacySettings>
        : {};
      setPrivacySettings((prev) => ({ ...prev, ...privacy }));
    }).catch(() => {
      // Keep browser defaults if preferences cannot be loaded.
    });
    return () => {
      cancelled = true;
    };
  }, [usesAccount]);

  const refreshAllState = () => {
    setMembership(getMembership());
    setCredits(getCreditBalance());
    setTransactions(getCreditTransactions());
  };

  const handleSelectPlan = (planId: SubscriptionPlanId, billingCycle: BillingCycle) => {
    if (usesAccount) {
      const planCode = cataloguePlanToServerCode(planId);
      setPreviewPlanCode(planId);
      if (planCode !== 'FREE') {
        setPreviewNotice(
          `${planCode === 'PERSONAL' ? 'Personal' : 'Family'} is a preview label only. No payment was taken and your Free entitlement is unchanged.`,
        );
        return;
      }
      setPreviewNotice('Activating FREE…');
      void accountApi.setMembershipEntitlement(planCode).then(async () => {
        await reloadAccountMembership();
        setPreviewNotice('Your account is on the Free entitlement. No payment was taken.');
      }).catch((error: unknown) => {
        setPreviewNotice(
          error instanceof AccountApiError
            ? error.message
            : 'That membership could not be activated.',
        );
      });
      return;
    }
    const updated = updateSubscriptionPlan(planId, billingCycle);
    setMembership(updated);
    refreshAllState();
  };

  const handleCancelSub = () => {
    if (usesAccount) return;
    setMembership(cancelSubscription());
  };

  const handleResumeSub = () => {
    if (usesAccount) return;
    setMembership(resumeSubscription());
  };

  const handlePurchaseTopUp = (packId: string) => {
    if (usesAccount) {
      setPreviewNotice('Credit top-ups are not available. Test credits are operator-managed and not purchased from the browser.');
      return;
    }
    const res = purchaseTopUpPack(packId);
    if (res.success) {
      setCredits(res.newBalance);
      setTransactions(getCreditTransactions());
    }
  };

  const handleSaveAccount = (newSettings: AccountSettings) => {
    setAccountSettings(updateAccountSettings(newSettings));
  };

  const handleSavePrivacy = (newSettings: PrivacySettings) => {
    setPrivacySettings(updatePrivacySettings(newSettings));
  };

  const handleSaveNotifications = (newSettings: NotificationSettings) => {
    setNotificationSettings(newSettings);
    if (!usesAccount) {
      updateNotificationSettings(newSettings);
      return;
    }
    void accountApi.getPreferences().then((current) => (
      accountApi.savePreferences({
        ...current,
        notifications: {
          ...(current.notifications && typeof current.notifications === 'object' && !Array.isArray(current.notifications)
            ? current.notifications
            : {}),
          ...newSettings,
        },
      })
    )).then(() => {
      setPreviewNotice(null);
    }).catch((error: unknown) => {
      setPreviewNotice(
        error instanceof AccountApiError
          ? error.message
          : 'Notification preferences could not be saved to your account.',
      );
    });
  };

  const handleHearMoreFromMeChange = (value: boolean) => {
    handleSaveNotifications({ ...notificationSettings, hearMoreFromMe: value });
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

  const accountCreditBalance: CreditBalance = {
    totalMonthlyAllocation: 0,
    remainingCredits: testCredits ?? 0,
    bonusCredits: 0,
    renewsOn: 'No paid renewal — test ledger only',
  };

  const accountTransactions = testEntries.map((entry, index) => ({
    id: `${entry.createdAt}-${entry.entryType}-${index}`,
    date: entry.createdAt.slice(0, 10),
    time: entry.createdAt.slice(11, 16) || '00:00',
    activityName: entry.reason || entry.entryType,
    category: 'subscription' as const,
    creditsChange: entry.delta,
    balanceAfter: testCredits ?? 0,
    details: 'Server test credit ledger entry',
  }));

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-12">
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

        <button
          onClick={() => setActiveTab('credits')}
          className="self-start sm:self-auto px-3.5 py-1.5 rounded-full bg-white border border-[#B49361]/30 hover:border-[#B49361] text-xs font-semibold text-[#242326] flex items-center gap-2 shadow-xs transition-all cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#B49361]" />
          <span>
            {usesAccount
              ? (testCredits === null ? 'Test credits unavailable' : `${testCredits} test credits`)
              : `${credits.remainingCredits + credits.bonusCredits} demonstration credits`}
          </span>
        </button>
      </div>

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

      {usesAccount && (
        <section aria-label="Current membership" className="rounded-2xl border border-[#242326]/10 bg-white px-4 py-3 text-sm text-[#242326]">
          {accountError ? (
            <p>{accountError}</p>
          ) : accountPlan === null ? (
            <p>Loading the account entitlement.</p>
          ) : (
            <div className="space-y-1">
              {accountDisplayName && <p>Account name: {accountDisplayName}</p>}
              {accountEmail && (
                <p>
                  Account email: {accountEmail}
                  {accountEmailVerified === true ? ' (verified)' : accountEmailVerified === false ? ' (unverified)' : ''}
                </p>
              )}
              <p>Account plan: {accountPlan}{accountPlanCode ? ` (${accountPlanCode})` : ''}</p>
              <p>Entitlement status: {accountStatus}</p>
              {entitlementSince && (
                <p>Entitlement since: {new Date(entitlementSince).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</p>
              )}
              {entitlementSource && <p>Entitlement source: {entitlementSource}</p>}
              <p>Credit balance: {testCredits ?? 0} test credits (server ledger)</p>
              {creditUnitLabel && <p className="text-xs text-[#5C585E]">{creditUnitLabel}</p>}
              <p>
                {paymentsEnabled
                  ? 'Live card billing is connected for this environment.'
                  : accountPlanCode && accountPlanCode !== 'FREE'
                    ? 'Provisional paid-tier entitlement is active. Live card billing is not connected, so no payment was taken.'
                    : 'Free entitlement is active. Personal and Family can be previewed under Explore Plans; paid activation waits until billing is connected.'}
              </p>
              <p>Available features: {accountFeatures.length > 0 ? accountFeatures.join(', ') : 'None'}</p>
              {publishedPlans.length > 0 && (
                <p>
                  Available plans (provisional prices): {publishedPlans.map((plan) => `${plan.displayName} R${plan.indicativeMonthlyZar ?? 0}`).join(' · ')}
                </p>
              )}
              {previewPlanCode && (
                <p role="status">Previewing package: {previewPlanCode}. {previewNotice}</p>
              )}
              {testEntries.length > 0 ? (
                <ul className="pt-1 text-xs text-[#5C585E]">
                  {testEntries.slice(-5).map((entry, index) => (
                    <li key={`${entry.createdAt}-${entry.entryType}-${index}`}>
                      {entry.createdAt.slice(0, 10)} · {entry.entryType} {entry.delta > 0 ? `+${entry.delta}` : entry.delta}
                      {entry.reason ? ` — ${entry.reason}` : ''}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-[#5C585E]">No credit ledger entries yet for this account.</p>
              )}
            </div>
          )}
        </section>
      )}

      {previewNotice && usesAccount && activeTab !== 'membership' && (
        <p role="status" className="text-xs text-[#5C585E]">{previewNotice}</p>
      )}

      <div className="pt-2">
        {activeTab === 'membership' && (
          <MyMembershipView
            membership={membership}
            accountMode={usesAccount}
            accountPlanName={accountPlan ?? undefined}
            accountStatus={accountStatus ?? undefined}
            accountTestCredits={testCredits}
            publishedPlans={publishedPlans}
            previewPlanCode={previewPlanCode}
            onExplorePlans={() => setActiveTab('plans')}
            onOpenCredits={() => setActiveTab('credits')}
            onCancelSubscription={handleCancelSub}
            onResumeSubscription={handleResumeSub}
          />
        )}

        {activeTab === 'plans' && (
          <ExplorePlansView
            currentMembership={membership}
            accountMode={usesAccount}
            accountPlanName={accountPlan}
            publishedPlans={publishedPlans}
            onSelectPlan={handleSelectPlan}
          />
        )}

        {activeTab === 'credits' && (
          <CreditsOverviewView
            balance={usesAccount ? accountCreditBalance : credits}
            accountMode={usesAccount}
            onPurchaseTopUp={handlePurchaseTopUp}
            onViewHistory={() => setActiveTab('credit-history')}
          />
        )}

        {activeTab === 'credit-history' && (
          <CreditHistoryView
            transactions={usesAccount ? accountTransactions : transactions}
            onBackToCredits={() => setActiveTab('credits')}
          />
        )}

        {activeTab === 'settings' && (
          <AccountSettingsView
            settings={accountSettings}
            onSaveSettings={handleSaveAccount}
            accountMode={usesAccount}
            onUnauthenticated={onUnauthenticated}
            hearMoreFromMe={notificationSettings.hearMoreFromMe}
            onHearMoreFromMeChange={handleHearMoreFromMeChange}
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
            accountMode={usesAccount}
          />
        )}
      </div>
    </div>
  );
};
