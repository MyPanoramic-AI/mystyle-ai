/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AccountSettings } from '../../types/membership';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Lock,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  Key,
  Globe,
  MessageSquare,
} from 'lucide-react';

interface AccountSettingsViewProps {
  settings: AccountSettings;
  onSaveSettings: (updated: AccountSettings) => void;
}

const SA_CITIES = [
  'Cape Town',
  'Johannesburg',
  'Durban',
  'Pretoria',
  'Stellenbosch',
  'Gqeberha (Port Elizabeth)',
  'Bloemfontein',
  'Franschhoek',
  'Umhlanga',
];

export const AccountSettingsView: React.FC<AccountSettingsViewProps> = ({
  settings,
  onSaveSettings,
}) => {
  const [formData, setFormData] = useState<AccountSettings>(settings);
  const [success, setSuccess] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E5CDBE]/40 text-[#9C6A61] text-xs font-semibold uppercase tracking-wider mb-1.5">
          <User className="w-3.5 h-3.5" />
          <span>Profile & Security</span>
        </div>
        <h2 className="font-serif text-2xl font-semibold text-[#242326]">
          Account Settings
        </h2>
        <p className="text-xs text-[#5C585E]">
          Manage your personal contact details, South African regional location, authentication, and connected services.
        </p>
      </div>

      {success && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-300 p-4 text-xs font-medium text-emerald-800 flex items-center gap-2.5 animate-fadeIn shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Account preferences successfully updated and saved locally.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card 1: Personal Contact Info */}
        <div className="rounded-3xl bg-white border border-[#242326]/10 p-6 sm:p-7 shadow-xs space-y-4">
          <h3 className="font-serif text-base font-semibold text-[#242326] flex items-center gap-2">
            <Mail className="w-4 h-4 text-[#9C6A61]" />
            Personal Contact Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#242326] mb-1">First Name</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#FAF7F2] border border-[#242326]/15 focus:outline-hidden focus:border-[#9C6A61]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#242326] mb-1">Last Name</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#FAF7F2] border border-[#242326]/15 focus:outline-hidden focus:border-[#9C6A61]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#242326] mb-1">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#FAF7F2] border border-[#242326]/15 focus:outline-hidden focus:border-[#9C6A61]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#242326] mb-1">Phone Number (South Africa)</label>
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                placeholder="+27 82 000 0000"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#FAF7F2] border border-[#242326]/15 focus:outline-hidden focus:border-[#9C6A61]"
              />
            </div>
          </div>
        </div>

        {/* Card 2: Region & Location */}
        <div className="rounded-3xl bg-white border border-[#242326]/10 p-6 sm:p-7 shadow-xs space-y-4">
          <h3 className="font-serif text-base font-semibold text-[#242326] flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#B49361]" />
            Regional & Climate Location
          </h3>
          <p className="text-xs text-[#5C585E]">
            Used for automatic weather-responsive styling suggestions and local boutique delivery estimates.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#242326] mb-1">City</label>
              <select
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#FAF7F2] border border-[#242326]/15 focus:outline-hidden focus:border-[#9C6A61]"
              >
                {SA_CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#242326] mb-1">Default Currency</label>
              <input
                type="text"
                disabled
                value="South African Rand (ZAR - R)"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#F6F2EC] text-[#5C585E] border border-[#242326]/10 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Card 3: Security & Verification */}
        <div className="rounded-3xl bg-white border border-[#242326]/10 p-6 sm:p-7 shadow-xs space-y-4">
          <h3 className="font-serif text-base font-semibold text-[#242326] flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#9C6A61]" />
            Security & Authentication
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#242326]/6">
              <div>
                <span className="text-xs font-semibold text-[#242326] block">Account Password</span>
                <span className="text-[11px] text-[#5C585E] block">Last updated 3 months ago · Protected</span>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswordModal(true)}
                className="px-3 py-1.5 rounded-xl border border-[#242326]/15 text-xs font-semibold text-[#242326] hover:bg-white cursor-pointer"
              >
                Change Password
              </button>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#242326]/6">
              <div>
                <span className="text-xs font-semibold text-[#242326] block">Two-Factor Authentication (2FA)</span>
                <span className="text-[11px] text-[#5C585E] block">Receive SMS or authenticator challenge on sign in</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.twoFactorEnabled}
                  onChange={(e) => setFormData({ ...formData, twoFactorEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#9C6A61]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#242326]/6">
              <div>
                <span className="text-xs font-semibold text-[#242326] block">Biometric Fast Login</span>
                <span className="text-[11px] text-[#5C585E] block">Use Face ID / Touch ID when opening on mobile</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.biometricLoginEnabled}
                  onChange={(e) => setFormData({ ...formData, biometricLoginEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#9C6A61]"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Card 4: Connected Accounts */}
        <div className="rounded-3xl bg-white border border-[#242326]/10 p-6 sm:p-7 shadow-xs space-y-4">
          <h3 className="font-serif text-base font-semibold text-[#242326] flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#B49361]" />
            Connected Accounts & Channels
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#242326]/6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white border border-[#242326]/10 flex items-center justify-center font-bold text-xs text-[#242326]">
                  G
                </div>
                <div>
                  <span className="text-xs font-semibold text-[#242326] block">Google Account</span>
                  <span className="text-[11px] text-[#5C585E] block">
                    {formData.linkedGoogle ? 'Connected (nandi.mthembu@capestyle.co.za)' : 'Not connected'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, linkedGoogle: !formData.linkedGoogle })}
                className="text-xs font-semibold text-[#9C6A61] hover:text-[#794E46] cursor-pointer"
              >
                {formData.linkedGoogle ? 'Disconnect' : 'Connect'}
              </button>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#242326]/6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-[#242326] block">WhatsApp Concierge Link</span>
                  <span className="text-[11px] text-[#5C585E] block">
                    {formData.linkedWhatsApp ? 'Linked for morning outfit inspiration drops' : 'Not linked'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, linkedWhatsApp: !formData.linkedWhatsApp })}
                className="text-xs font-semibold text-[#9C6A61] hover:text-[#794E46] cursor-pointer"
              >
                {formData.linkedWhatsApp ? 'Disconnect' : 'Connect'}
              </button>
            </div>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-[#242326] hover:bg-[#38363a] text-white text-xs font-semibold transition-all shadow-xs cursor-pointer flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-[#B49361]" />
            <span>Save Account Settings</span>
          </button>
        </div>
      </form>

      {/* Password Change Simulator Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-[#242326]/10 space-y-4">
            <h3 className="font-serif text-lg font-semibold text-[#242326]">
              Change Password
            </h3>

            {passwordSuccess ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-800">
                Password successfully updated in your simulated security profile.
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#242326] mb-1">Current Password</label>
                  <input
                    type="password"
                    defaultValue="••••••••••••"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#FAF7F2] border border-[#242326]/15"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#242326] mb-1">New Secure Password</label>
                  <input
                    type="password"
                    placeholder="Minimum 8 characters"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#FAF7F2] border border-[#242326]/15"
                  />
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordSuccess(false);
                }}
                className="px-4 py-2 text-xs font-medium text-[#5C585E] hover:text-[#242326] cursor-pointer"
              >
                Close
              </button>
              {!passwordSuccess && (
                <button
                  type="button"
                  onClick={() => setPasswordSuccess(true)}
                  className="px-4 py-2 text-xs font-semibold bg-[#242326] text-white rounded-xl hover:bg-[#38363a] cursor-pointer"
                >
                  Update Password
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
