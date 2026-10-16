/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PrivacySettings } from '../../types/membership';
import { exportUserDataAsJson, resetAllDemoData } from '../../services/membershipService';
import {
  Shield,
  Eye,
  Lock,
  Download,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  Sparkles,
} from 'lucide-react';

interface PrivacyDataViewProps {
  settings: PrivacySettings;
  onSaveSettings: (updated: PrivacySettings) => void;
}

export const PrivacyDataView: React.FC<PrivacyDataViewProps> = ({
  settings,
  onSaveSettings,
}) => {
  const [formData, setFormData] = useState<PrivacySettings>(settings);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  const handleToggle = (key: keyof PrivacySettings, val: any) => {
    const updated = { ...formData, [key]: val };
    setFormData(updated);
    onSaveSettings(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleDownload = () => {
    const jsonStr = exportUserDataAsJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mystyle-ai-profile-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 4000);
  };

  const handleConfirmReset = () => {
    resetAllDemoData();
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E5CDBE]/40 text-[#9C6A61] text-xs font-semibold uppercase tracking-wider mb-1.5">
          <Shield className="w-3.5 h-3.5" />
          <span>Trust & Sovereignty</span>
        </div>
        <h2 className="font-serif text-2xl font-semibold text-[#242326]">
          Privacy & Data Protection
        </h2>
        <p className="text-xs text-[#5C585E]">
          You own your fashion choices, body measurements, and styling photographs. Control how your data is handled.
        </p>
      </div>

      {saveSuccess && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-300 p-4 text-xs font-medium text-emerald-800 flex items-center gap-2.5 animate-fadeIn shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Privacy preferences updated immediately.</span>
        </div>
      )}

      {downloadSuccess && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-300 p-4 text-xs font-medium text-emerald-800 flex items-center gap-2.5 animate-fadeIn shadow-xs">
          <Download className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Style DNA and measurements export package downloaded successfully.</span>
        </div>
      )}

      {/* Card 1: Photographic Privacy Controls */}
      <div className="rounded-3xl bg-white border border-[#242326]/10 p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#E5CDBE]/40 text-[#9C6A61] flex items-center justify-center">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-serif text-base font-semibold text-[#242326]">
              Photographic Privacy & Ephemeral Mode
            </h3>
            <p className="text-xs text-[#5C585E]">
              Control whether photos are purged immediately after rendering or preserved in browser storage.
            </p>
          </div>
        </div>

        <div className="divide-y divide-[#242326]/6">
          <div className="py-3.5 flex items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-[#242326] block">
                Ephemeral Fitting Photos Mode
              </span>
              <span className="text-[11px] text-[#5C585E] block">
                Never save fitting or body photos to persistent local storage. Purge immediately when tab closes.
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={formData.ephemeralPhotosOnly}
                onChange={(e) => handleToggle('ephemeralPhotosOnly', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#9C6A61]"></div>
            </label>
          </div>

          <div className="py-3.5 flex items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-[#242326] block">
                Cache High-Resolution Try-On Renders Locally
              </span>
              <span className="text-[11px] text-[#5C585E] block">
                Keep generated try-on imagery cached on this device for instant offline review.
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={formData.storeHighResTryOnsLocally}
                onChange={(e) => handleToggle('storeHighResTryOnsLocally', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#9C6A61]"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Card 2: AI Personalization & Learning */}
      <div className="rounded-3xl bg-white border border-[#242326]/10 p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#FAF7F2] text-[#B49361] flex items-center justify-center border border-[#B49361]/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-serif text-base font-semibold text-[#242326]">
              Styling Intelligence & Learning
            </h3>
            <p className="text-xs text-[#5C585E]">
              Determine how the personal stylist adapts to your interactions.
            </p>
          </div>
        </div>

        <div className="divide-y divide-[#242326]/6">
          <div className="py-3.5 flex items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-[#242326] block">
                Continuous Aesthetic DNA Learning
              </span>
              <span className="text-[11px] text-[#5C585E] block">
                Allow the stylist chat to remember favorite silhouettes, colors, and disliked garments across visits.
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={formData.allowStyleRecommendationsLearning}
                onChange={(e) => handleToggle('allowStyleRecommendationsLearning', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#9C6A61]"></div>
            </label>
          </div>

          <div className="py-3.5 flex items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-[#242326] block">
                Personalized South African Retailer Matching
              </span>
              <span className="text-[11px] text-[#5C585E] block">
                Tailor price comparison searches to Woolworths, Poetry, Foschini, and Superbalist.
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={formData.allowRetailerPersonalization}
                onChange={(e) => handleToggle('allowRetailerPersonalization', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#9C6A61]"></div>
            </label>
          </div>

          <div className="py-3.5 flex items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-[#242326] block">
                Data Retention Window
              </span>
              <span className="text-[11px] text-[#5C585E] block">
                Automatically purge historical try-on sessions older than chosen timeframe.
              </span>
            </div>
            <select
              value={formData.dataRetentionMonths}
              onChange={(e) => handleToggle('dataRetentionMonths', Number(e.target.value))}
              className="px-3 py-1.5 text-xs rounded-xl bg-[#FAF7F2] border border-[#242326]/15 font-medium"
            >
              <option value={3}>3 Months</option>
              <option value={6}>6 Months</option>
              <option value={12}>12 Months (Recommended)</option>
              <option value={24}>24 Months</option>
            </select>
          </div>
        </div>
      </div>

      {/* Card 3: Data Sovereignty & Portability */}
      <div className="rounded-3xl bg-white border border-[#242326]/10 p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#F6F2EC] text-[#242326] flex items-center justify-center">
            <Download className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-serif text-base font-semibold text-[#242326]">
              Data Portability & Export
            </h3>
            <p className="text-xs text-[#5C585E]">
              Download a complete JSON archive of your measurements, saved outfits, and preferences.
            </p>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#FAF7F2] border border-[#242326]/6">
          <div className="text-xs text-[#5C585E]">
            <span className="font-semibold text-[#242326] block mb-0.5">
              Export Style DNA Package
            </span>
            <span>Includes personal sizing, colour palette, digital wardrobe items, and membership logs.</span>
          </div>

          <button
            onClick={handleDownload}
            className="px-4 py-2.5 rounded-xl bg-[#242326] hover:bg-[#38363a] text-white text-xs font-semibold transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#B49361]" />
            <span>Download Archive</span>
          </button>
        </div>
      </div>

      {/* Danger Zone: Reset Data */}
      <div className="rounded-3xl bg-red-50/50 border border-red-200/60 p-6 sm:p-7 shadow-xs space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-red-100 text-red-700 flex items-center justify-center">
            <Trash2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-serif text-base font-semibold text-red-950">
              Clear Cache & Reset Demonstration Data
            </h3>
            <p className="text-xs text-red-700/80">
              Reset all local prototype changes, subscriptions, and custom wardrobe garments to baseline defaults.
            </p>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={() => setShowResetModal(true)}
            className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-[#242326]/10 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="font-serif text-xl font-semibold text-[#242326]">
              Reset All Local Demo Data?
            </h3>

            <p className="text-xs text-[#5C585E] leading-relaxed">
              This will clear simulated subscriptions, uploaded wardrobe pieces, credit transactions, and return
              your profile to initial demonstration defaults.
            </p>

            <div className="pt-3 flex justify-end gap-3">
              <button
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 text-xs font-medium text-[#5C585E] hover:text-[#242326] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReset}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs"
              >
                Yes, Reset Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
