/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
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
} from 'lucide-react';

interface NotificationPreferencesViewProps {
  settings: NotificationSettings;
  onSaveSettings: (updated: NotificationSettings) => void;
}

export const NotificationPreferencesView: React.FC<NotificationPreferencesViewProps> = ({
  settings,
  onSaveSettings,
}) => {
  const [formData, setFormData] = useState<NotificationSettings>(settings);
  const [success, setSuccess] = useState(false);

  const handleToggle = (key: keyof NotificationSettings, val: boolean) => {
    const updated = { ...formData, [key]: val };
    setFormData(updated);
    onSaveSettings(updated);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
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
          Receive intentional fashion alerts, morning weather outfit ideas, and credit replenishment updates without digital noise.
        </p>
      </div>

      {success && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-300 p-4 text-xs font-medium text-emerald-800 flex items-center gap-2.5 animate-fadeIn shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Notification preferences updated.</span>
        </div>
      )}

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
              <span className="text-xs font-semibold text-[#242326]">Push Alerts</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.pushEnabled}
                onChange={(e) => handleToggle('pushEnabled', e.target.checked)}
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
                  Daily 07:00 alert with layering advice calibrated to Cape Town / local microclimates.
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
              <Coins className="w-4 h-4 text-[#B49361] shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-semibold text-[#242326] block">
                  Credit Replenishment & Low Balance Alerts
                </span>
                <span className="text-[11px] text-[#5C585E] block">
                  Notifies you when your monthly 50 credits replenish or when credits drop below 5.
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
                  South African Retailer Sales & Price Drops
                </span>
                <span className="text-[11px] text-[#5C585E] block">
                  Instant notice if items on your Saved Wishlist or Wardrobe Gaps go on promotion at Woolworths or Superbalist.
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
              <RotateCcw className="w-4 h-4 text-[#5C585E] shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-semibold text-[#242326] block">
                  Digital Wardrobe Rotation Prompts
                </span>
                <span className="text-[11px] text-[#5C585E] block">
                  Gentle suggestions to wear forgotten pieces in your digital wardrobe to increase cost-per-wear value.
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
                  Family Occasion Preparation
                </span>
                <span className="text-[11px] text-[#5C585E] block">
                  Coordination reminders 1 week before scheduled family weddings, school ceremonies, or holidays.
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
