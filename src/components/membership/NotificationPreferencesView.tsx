/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { NotificationSettings } from '../../types/membership';
import {
  Bell,
  Mail,
  Smartphone,
  CloudSun,
  Coins,
  Tag,
  RotateCcw,
  Users,
  CheckCircle2,
  Sparkles,
  HeartHandshake,
  Send,
} from 'lucide-react';
import { AccountApiError, accountApi } from '../../services/accountApi';
import {
  subscribeBrowserPush,
  subscriptionToJson,
  unsubscribeBrowserPush,
  webPushSupported,
} from '../../services/webPush';

interface NotificationPreferencesViewProps {
  settings: NotificationSettings;
  onSaveSettings: (updated: NotificationSettings) => void;
  accountMode?: boolean;
}

export const NotificationPreferencesView: React.FC<NotificationPreferencesViewProps> = ({
  settings,
  onSaveSettings,
  accountMode = false,
}) => {
  const [formData, setFormData] = useState<NotificationSettings>(settings);
  const [success, setSuccess] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushNotice, setPushNotice] = useState<string | null>(null);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [pushServerEnabled, setPushServerEnabled] = useState(false);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  useEffect(() => {
    if (!accountMode) return;
    let cancelled = false;
    void accountApi.pushStatus().then((status) => {
      if (cancelled) return;
      setPushServerEnabled(status.enabled);
      setPushSubscribed(status.subscribed);
    }).catch(() => {
      if (cancelled) return;
      setPushServerEnabled(false);
      setPushSubscribed(false);
    });
    return () => {
      cancelled = true;
    };
  }, [accountMode]);

  const persist = (updated: NotificationSettings) => {
    setFormData(updated);
    onSaveSettings(updated);
    setSuccess(true);
    window.setTimeout(() => setSuccess(false), 3000);
  };

  const enableBrowserPush = async (): Promise<boolean> => {
    if (!accountMode) {
      setPushNotice('Sign in to receive browser push alerts on this device.');
      return false;
    }
    if (!webPushSupported()) {
      setPushNotice('This browser does not support push notifications.');
      return false;
    }
    setPushBusy(true);
    setPushNotice(null);
    try {
      const { publicKey } = await accountApi.pushVapidPublicKey();
      const subscription = await subscribeBrowserPush(publicKey);
      await accountApi.pushSubscribe(subscriptionToJson(subscription));
      setPushSubscribed(true);
      setPushServerEnabled(true);
      setPushNotice('Push alerts are on for this browser. You can send a test below.');
      return true;
    } catch (error) {
      setPushNotice(
        error instanceof AccountApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Could not enable browser push.',
      );
      return false;
    } finally {
      setPushBusy(false);
    }
  };

  const disableBrowserPush = async () => {
    setPushBusy(true);
    setPushNotice(null);
    try {
      const registration = await navigator.serviceWorker.getRegistration('/');
      const current = await registration?.pushManager.getSubscription();
      if (current) {
        await accountApi.pushUnsubscribe(current.endpoint).catch(() => undefined);
        await unsubscribeBrowserPush();
      }
      setPushSubscribed(false);
      setPushNotice('Push alerts turned off for this browser.');
    } catch (error) {
      setPushNotice(error instanceof Error ? error.message : 'Could not turn off push.');
    } finally {
      setPushBusy(false);
    }
  };

  const handleToggle = (key: keyof NotificationSettings, val: boolean) => {
    if (key === 'pushEnabled') {
      void (async () => {
        if (val) {
          const ok = await enableBrowserPush();
          if (!ok) {
            setFormData((prev) => ({ ...prev, pushEnabled: false }));
            return;
          }
          persist({ ...formData, pushEnabled: true });
          return;
        }
        await disableBrowserPush();
        persist({ ...formData, pushEnabled: false });
      })();
      return;
    }
    persist({ ...formData, [key]: val });
  };

  const sendTestPush = async () => {
    if (!accountMode) {
      setPushNotice('Sign in to send a test push notification.');
      return;
    }
    setPushBusy(true);
    setPushNotice(null);
    try {
      if (!pushSubscribed) {
        const ok = await enableBrowserPush();
        if (!ok) return;
      }
      const result = await accountApi.pushTest();
      setPushNotice(
        result.ok
          ? `Test notification sent (${result.delivered} of ${result.attempted} delivered). Check your system tray or notification centre.`
          : 'The test was attempted but nothing was delivered. Allow notifications for this site and try again.',
      );
    } catch (error) {
      setPushNotice(
        error instanceof AccountApiError
          ? error.message
          : 'Could not send a test push notification.',
      );
    } finally {
      setPushBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E5CDBE]/40 text-[#9C6A61] text-xs font-semibold uppercase tracking-wider mb-1.5">
          <Bell className="w-3.5 h-3.5" />
          <span>Timely & Mindful</span>
        </div>
        <h2 className="font-serif text-2xl font-semibold text-[#242326]">
          Notification Preferences
        </h2>
        <p className="text-xs text-[#5C585E]">
          {accountMode
            ? 'Saved to your account. Turn on Push Alerts and allow this browser — then send a test to confirm delivery.'
            : 'Receive intentional fashion alerts without digital noise. Sign in to enable real browser push.'}
        </p>
      </div>

      {success && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-300 p-4 text-xs font-medium text-emerald-800 flex items-center gap-2.5 animate-fadeIn shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            {accountMode
              ? 'Notification preferences saved to your account.'
              : 'Notification preferences updated in this browser.'}
          </span>
        </div>
      )}

      {pushNotice && (
        <div className="rounded-2xl border border-[#242326]/10 bg-white p-4 text-xs text-[#5C585E] leading-relaxed">
          {pushNotice}
        </div>
      )}

      {/* Cadence: hear more from stylist */}
      <div className="rounded-3xl bg-white border border-[#242326]/10 p-6 sm:p-7 shadow-xs">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#9C6A61]/10 text-[#9C6A61] flex items-center justify-center shrink-0">
              <HeartHandshake className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-serif text-base font-semibold text-[#242326]">
                Do you want to hear more from me?
              </h3>
              <p className="text-[11px] text-[#5C585E] mt-1 leading-relaxed">
                {formData.hearMoreFromMe
                  ? 'On — you will receive more frequent styling tips and outfit nudges through the day.'
                  : 'Off — you still get one thoughtful stylist notification each day. Turn this on when you want more.'}
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={formData.hearMoreFromMe}
              onChange={(e) => handleToggle('hearMoreFromMe', e.target.checked)}
              className="sr-only peer"
              aria-label="Do you want to hear more from me"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#9C6A61]"></div>
          </label>
        </div>
      </div>

      {/* Card 1: Delivery Channels */}
      <div className="rounded-3xl bg-white border border-[#242326]/10 p-6 sm:p-7 shadow-xs space-y-4">
        <h3 className="font-serif text-base font-semibold text-[#242326]">
          Delivery Channels
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#242326]/6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#E5CDBE]/50 text-[#9C6A61] flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-semibold text-[#242326] block">Push Alerts</span>
                <span className="text-[10px] text-[#5C585E]">
                  {pushBusy
                    ? 'Working…'
                    : pushSubscribed
                      ? 'This browser is subscribed'
                      : accountMode
                        ? (pushServerEnabled ? 'Not subscribed yet' : 'Server push ready after save')
                        : 'Sign in required'}
                </span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.pushEnabled}
                onChange={(e) => handleToggle('pushEnabled', e.target.checked)}
                disabled={pushBusy}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#9C6A61]"></div>
            </label>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#242326]/6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#B49361]/15 text-[#B49361] flex items-center justify-center">
                <Mail className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-[#242326]">Email Digest</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.emailEnabled}
                onChange={(e) => handleToggle('emailEnabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#9C6A61]"></div>
            </label>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#242326]/6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#242326]/10 text-[#242326] flex items-center justify-center">
                <Smartphone className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-[#242326]">SMS / WhatsApp</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.smsEnabled}
                onChange={(e) => handleToggle('smsEnabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#9C6A61]"></div>
            </label>
          </div>
        </div>

        {accountMode && (
          <button
            type="button"
            onClick={() => void sendTestPush()}
            disabled={pushBusy}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#242326] hover:bg-black disabled:opacity-50 text-white text-xs font-semibold cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            {pushBusy ? 'Sending…' : 'Send test push notification'}
          </button>
        )}
      </div>

      {/* Card 2: Fashion & Routine Content */}
      <div className="rounded-3xl bg-white border border-[#242326]/10 p-6 sm:p-7 shadow-xs space-y-4">
        <h3 className="font-serif text-base font-semibold text-[#242326]">
          Fashion & Lifestyle Updates
        </h3>

        <div className="divide-y divide-[#242326]/6">
          <div className="py-3.5 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-[#9C6A61] shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-semibold text-[#242326] block">
                  Weekly Curated Style Drop
                </span>
                <span className="text-[11px] text-[#5C585E] block">
                  Every Friday morning: 3 new looks aligned with your Aesthetic DNA and weekend plans.
                </span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={formData.weeklyStyleDrop}
                onChange={(e) => handleToggle('weeklyStyleDrop', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#9C6A61]"></div>
            </label>
          </div>

          <div className="py-3.5 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <CloudSun className="w-4 h-4 text-[#B49361] shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-semibold text-[#242326] block">
                  Morning Weather Outfit Recommendations
                </span>
                <span className="text-[11px] text-[#5C585E] block">
                  Around 07:00 — a weather-aware outfit idea based on your city and wardrobe.
                </span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={formData.weatherOutfitAlerts}
                onChange={(e) => handleToggle('weatherOutfitAlerts', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#9C6A61]"></div>
            </label>
          </div>

          <div className="py-3.5 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Coins className="w-4 h-4 text-[#9C6A61] shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-semibold text-[#242326] block">
                  Credit Renewal Reminders
                </span>
                <span className="text-[11px] text-[#5C585E] block">
                  Low-balance and renewal reminders for AI credits.
                </span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={formData.creditRenewalReminders}
                onChange={(e) => handleToggle('creditRenewalReminders', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#9C6A61]"></div>
            </label>
          </div>

          <div className="py-3.5 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Tag className="w-4 h-4 text-[#9C6A61] shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-semibold text-[#242326] block">
                  Sales & Price Drops
                </span>
                <span className="text-[11px] text-[#5C585E] block">
                  Alerts when saved looks or preferred retailers drop in price.
                </span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={formData.salesAndPriceDrops}
                onChange={(e) => handleToggle('salesAndPriceDrops', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#9C6A61]"></div>
            </label>
          </div>

          <div className="py-3.5 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <RotateCcw className="w-4 h-4 text-[#9C6A61] shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-semibold text-[#242326] block">
                  Wardrobe Rotation Prompts
                </span>
                <span className="text-[11px] text-[#5C585E] block">
                  Gentle nudges to restyle pieces you have not worn recently.
                </span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={formData.wardrobeRotationPrompts}
                onChange={(e) => handleToggle('wardrobeRotationPrompts', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#9C6A61]"></div>
            </label>
          </div>

          <div className="py-3.5 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Users className="w-4 h-4 text-[#9C6A61] shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-semibold text-[#242326] block">
                  Family Event Reminders
                </span>
                <span className="text-[11px] text-[#5C585E] block">
                  Outfit prep reminders ahead of family calendar events.
                </span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={formData.familyEventReminders}
                onChange={(e) => handleToggle('familyEventReminders', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#9C6A61]"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
