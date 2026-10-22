/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { PrivacySettings } from '../../types/membership';
import { exportUserDataAsJson, resetAllDemoData } from '../../services/membershipService';
import { accountApi, AccountApiError, type ConsentStateResponse } from '../../services/accountApi';
import {
  Shield,
  Lock,
  Download,
  Trash2,
  CheckCircle2,
  AlertTriangle,
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
  const [consent, setConsent] = useState<ConsentStateResponse | null>(null);
  const [media, setMedia] = useState<{ id: string; purpose: string; byteSize: number; createdAt: string }[]>([]);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [accountBusy, setAccountBusy] = useState(false);
  const [password, setPassword] = useState('');
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [deletionMessage, setDeletionMessage] = useState<string | null>(null);
  const [deletionOpen, setDeletionOpen] = useState(false);
  const [photoAiNote, setPhotoAiNote] = useState('External AI photograph processing is not active.');

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      accountApi.privacyConsent(),
      accountApi.privacyMedia(),
      accountApi.privacyDeletionStatus(),
    ]).then(([consentState, mediaState, deletion]) => {
      if (cancelled) return;
      setConsent(consentState);
      setMedia(mediaState.items);
      setPhotoAiNote(mediaState.note);
      if ((deletion.request as { status?: string } | null)?.status === 'pending') {
        setDeletionMessage('A deletion request is pending confirmation.');
        setDeletionOpen(true);
      }
      setAccountError(null);
    }).catch((error) => {
      if (cancelled) return;
      setAccountError(error instanceof AccountApiError ? error.message : 'Account privacy controls could not be loaded.');
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleToggle = (key: keyof PrivacySettings, val: boolean | number) => {
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
    a.download = `mystyle-ai-browser-demo-export-${new Date().toISOString().slice(0, 10)}.json`;
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

  const granted = (purpose: string) => consent?.current.find((row) => row.purpose === purpose)?.granted === true;

  const setPurpose = async (purpose: string, next: boolean) => {
    setAccountBusy(true);
    setAccountError(null);
    try {
      const nextConsent = await accountApi.setPrivacyConsent({ purpose, granted: next, captureMethod: 'settings_toggle' });
      setConsent(nextConsent);
    } catch (error) {
      setAccountError(error instanceof AccountApiError ? error.message : 'Consent could not be updated.');
    } finally {
      setAccountBusy(false);
    }
  };

  const requestExport = async () => {
    setAccountBusy(true);
    setExportMessage(null);
    setAccountError(null);
    try {
      const created = await accountApi.requestPrivacyExport(password);
      const blob = await accountApi.downloadPrivacyExport(created.exportId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mystyle-account-export-${created.exportId}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportMessage(`Account export ready. It expires at ${new Date(created.expiresAt).toLocaleString()}.`);
      setPassword('');
    } catch (error) {
      setAccountError(error instanceof AccountApiError ? error.message : 'The account export was not completed.');
    } finally {
      setAccountBusy(false);
    }
  };

  const deletePhoto = async (id: string) => {
    setAccountBusy(true);
    setAccountError(null);
    try {
      await accountApi.deleteMedia(id);
      const mediaState = await accountApi.privacyMedia();
      setMedia(mediaState.items);
    } catch (error) {
      setAccountError(error instanceof AccountApiError ? error.message : 'The photograph could not be deleted.');
    } finally {
      setAccountBusy(false);
    }
  };

  const beginDeletion = async () => {
    setAccountBusy(true);
    setAccountError(null);
    try {
      const started = await accountApi.startPrivacyDeletion();
      setDeletionOpen(true);
      setDeletionMessage((started.explanation as { consequences?: string[] })?.consequences?.join(' ') ?? 'Confirm deletion with your password, or cancel.');
    } catch (error) {
      setAccountError(error instanceof AccountApiError ? error.message : 'Deletion could not be started.');
    } finally {
      setAccountBusy(false);
    }
  };

  const cancelDeletion = async () => {
    setAccountBusy(true);
    setAccountError(null);
    try {
      await accountApi.cancelPrivacyDeletion();
      setDeletionOpen(false);
      setDeletionMessage('Deletion was cancelled. No account records were removed.');
      setPassword('');
    } catch (error) {
      setAccountError(error instanceof AccountApiError ? error.message : 'Deletion could not be cancelled.');
    } finally {
      setAccountBusy(false);
    }
  };

  const confirmDeletion = async () => {
    setAccountBusy(true);
    setAccountError(null);
    try {
      await accountApi.confirmPrivacyDeletion(password);
      setDeletionMessage('Account deletion completed. Sign-in for this account is no longer available.');
      setPassword('');
      window.location.assign('/');
    } catch (error) {
      setAccountError(error instanceof AccountApiError ? error.message : 'Deletion was not confirmed.');
    } finally {
      setAccountBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E5CDBE]/40 text-[#91635a] text-xs font-semibold uppercase tracking-wider mb-1.5">
          <Shield className="w-3.5 h-3.5" />
          <span>Trust & Sovereignty</span>
        </div>
        <h2 className="font-serif text-2xl font-semibold text-[#242326]">
          Privacy & Data Protection
        </h2>
        <p className="text-xs text-[#5C585E]">
          Account privacy controls use the signed-in server. Browser demonstration toggles below stay local and are not a legal privacy notice.
        </p>
      </div>

      {accountError && (
        <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-xs font-medium text-red-900">
          {accountError}
        </div>
      )}

      <section aria-label="Account privacy controls" className="rounded-3xl bg-white border border-[#242326]/10 p-6 sm:p-7 shadow-xs space-y-4">
        <div>
          <h3 className="font-serif text-base font-semibold text-[#242326]">Signed-in account controls</h3>
          <p className="text-xs text-[#5C585E]">{photoAiNote}</p>
        </div>

        <div className="divide-y divide-[#242326]/6">
          {[
            { purpose: 'ai_personalisation', label: 'Optional AI personalisation', detail: 'Allows the stylist to use saved style lists when personalisation is on. It does not start live model calls by itself.' },
            { purpose: 'marketing', label: 'Optional marketing communications', detail: 'Separate from styling. Defaults off.' },
            { purpose: 'private_photo_storage', label: 'Private photograph storage', detail: 'Stores adult styling photographs privately for this account. Does not authorise FASHN, OpenAI, Gemini, or any external image AI.' },
            { purpose: 'external_photo_ai', label: 'Optional external AI photograph processing', detail: 'Separate from private storage. External image providers are not connected in this revision.' },
            { purpose: 'browser_profile_import', label: 'Optional import of previous browser profile data', detail: 'Does not import demonstration family or child profiles.' },
          ].map((item) => (
            <div key={item.purpose} className="py-3.5 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold text-[#242326] block">{item.label}</span>
                <span className="text-[11px] text-[#5C585E] block">{item.detail}</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={granted(item.purpose)}
                  disabled={accountBusy || !consent}
                  onChange={(event) => void setPurpose(item.purpose, event.target.checked)}
                  aria-label={item.label}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#9C6A61]"></div>
              </label>
            </div>
          ))}
        </div>

        {consent && (
          <p className="text-[11px] text-[#5C585E]">
            Privacy notice version {consent.noticeVersion}. History entries: {consent.history.length}.
          </p>
        )}

        <div className="pt-2 space-y-3 border-t border-[#242326]/8">
          <h4 className="text-xs font-semibold text-[#242326]">Private photographs</h4>
          {media.length === 0 ? (
            <p className="text-[11px] text-[#5C585E]">No private photographs are stored for this account.</p>
          ) : (
            <ul className="space-y-2">
              {media.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 text-xs">
                  <span>{item.purpose} · {item.byteSize} bytes · {new Date(item.createdAt).toLocaleDateString()}</span>
                  <button
                    type="button"
                    disabled={accountBusy}
                    onClick={() => void deletePhoto(item.id)}
                    className="px-3 py-1.5 rounded-xl border border-red-200 text-red-700 text-[11px] font-semibold cursor-pointer"
                  >
                    Delete photograph
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="pt-2 space-y-3 border-t border-[#242326]/8">
          <h4 className="text-xs font-semibold text-[#242326]">Authenticated account export</h4>
          <p className="text-[11px] text-[#5C585E]">
            Downloads a private ZIP of this account's server records after password confirmation. Browser demonstration data is not included.
          </p>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Confirm password"
            aria-label="Confirm password for privacy actions"
            className="w-full px-3 py-2 rounded-xl border border-[#242326]/15 text-xs"
          />
          <button
            type="button"
            disabled={accountBusy || password.length < 12}
            onClick={() => void requestExport()}
            className="px-4 py-2.5 rounded-xl bg-[#242326] text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
          >
            Request account export
          </button>
          {exportMessage && <p className="text-[11px] text-emerald-800">{exportMessage}</p>}
        </div>

        <div className="pt-2 space-y-3 border-t border-red-200">
          <h4 className="text-xs font-semibold text-red-950">Delete account</h4>
          <p className="text-[11px] text-red-800/80">
            Removes profile, wardrobe, family, beauty, conversations, and private photographs for this account after password confirmation. Accounting rows may remain in a minimised form until retention is approved.
          </p>
          {!deletionOpen ? (
            <button
              type="button"
              disabled={accountBusy}
              onClick={() => void beginDeletion()}
              className="px-4 py-2.5 rounded-xl bg-red-600 text-white text-xs font-semibold cursor-pointer"
            >
              Begin account deletion
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-[11px] text-[#5C585E]">{deletionMessage}</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" disabled={accountBusy} onClick={() => void cancelDeletion()} className="px-4 py-2 rounded-xl border border-[#242326]/15 text-xs font-semibold cursor-pointer">
                  Cancel deletion
                </button>
                <button type="button" disabled={accountBusy || password.length < 12} onClick={() => void confirmDeletion()} className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold cursor-pointer disabled:opacity-50">
                  Confirm deletion
                </button>
              </div>
            </div>
          )}
          {deletionMessage && !deletionOpen && <p className="text-[11px] text-[#5C585E]">{deletionMessage}</p>}
        </div>
      </section>

      {saveSuccess && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-300 p-4 text-xs font-medium text-emerald-800 flex items-center gap-2.5 animate-fadeIn shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Browser demonstration privacy preferences updated locally.</span>
        </div>
      )}

      {downloadSuccess && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-300 p-4 text-xs font-medium text-emerald-800 flex items-center gap-2.5 animate-fadeIn shadow-xs">
          <Download className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Browser demonstration export downloaded. This is not the signed-in account archive.</span>
        </div>
      )}

      <div className="rounded-3xl bg-white border border-[#242326]/10 p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#E5CDBE]/40 text-[#91635a] flex items-center justify-center">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-serif text-base font-semibold text-[#242326]">
              Browser demonstration photo preferences
            </h3>
            <p className="text-xs text-[#5C585E]">
              These toggles only update localStorage. They do not control the account media store.
            </p>
          </div>
        </div>

        <div className="divide-y divide-[#242326]/6">
          <div className="py-3.5 flex items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-[#242326] block">Ephemeral Fitting Photos Mode</span>
              <span className="text-[11px] text-[#5C585E] block">Browser demonstration preference only.</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input type="checkbox" checked={formData.ephemeralPhotosOnly} onChange={(e) => handleToggle('ephemeralPhotosOnly', e.target.checked)} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#9C6A61]"></div>
            </label>
          </div>
          <div className="py-3.5 flex items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-[#242326] block">Cache High-Resolution Try-On Renders Locally</span>
              <span className="text-[11px] text-[#5C585E] block">Browser demonstration preference only. Generation is not active.</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input type="checkbox" checked={formData.storeHighResTryOnsLocally} onChange={(e) => handleToggle('storeHighResTryOnsLocally', e.target.checked)} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#9C6A61]"></div>
            </label>
          </div>
        </div>
      </div>

      <div className="rounded-3xl bg-white border border-[#242326]/10 p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#FAF7F2] text-[#866a40] flex items-center justify-center border border-[#B49361]/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-serif text-base font-semibold text-[#242326]">Browser demonstration learning preferences</h3>
            <p className="text-xs text-[#5C585E]">Local only. Signed-in AI personalisation uses the account controls above.</p>
          </div>
        </div>
        <div className="divide-y divide-[#242326]/6">
          <div className="py-3.5 flex items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-[#242326] block">Continuous Aesthetic DNA Learning</span>
              <span className="text-[11px] text-[#5C585E] block">Browser demonstration preference only.</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input type="checkbox" checked={formData.allowStyleRecommendationsLearning} onChange={(e) => handleToggle('allowStyleRecommendationsLearning', e.target.checked)} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#9C6A61]"></div>
            </label>
          </div>
          <div className="py-3.5 flex items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-[#242326] block">Personalized South African Retailer Matching</span>
              <span className="text-[11px] text-[#5C585E] block">Browser demonstration preference only. Live retailer feeds are not connected.</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input type="checkbox" checked={formData.allowRetailerPersonalization} onChange={(e) => handleToggle('allowRetailerPersonalization', e.target.checked)} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#9C6A61]"></div>
            </label>
          </div>
          <div className="py-3.5 flex items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-[#242326] block">Demonstration retention window</span>
              <span className="text-[11px] text-[#5C585E] block">Not applied to the account database. Server retention remains undecided or operator-controlled.</span>
            </div>
            <select value={formData.dataRetentionMonths} onChange={(e) => handleToggle('dataRetentionMonths', Number(e.target.value))} className="px-3 py-1.5 text-xs rounded-xl bg-[#FAF7F2] border border-[#242326]/15 font-medium">
              <option value={3}>3 Months</option>
              <option value={6}>6 Months</option>
              <option value={12}>12 Months (Recommended)</option>
              <option value={24}>24 Months</option>
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-3xl bg-white border border-[#242326]/10 p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#F6F2EC] text-[#242326] flex items-center justify-center">
            <Download className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-serif text-base font-semibold text-[#242326]">Browser demonstration export</h3>
            <p className="text-xs text-[#5C585E]">Downloads localStorage demonstration data only.</p>
          </div>
        </div>
        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#FAF7F2] border border-[#242326]/6">
          <div className="text-xs text-[#5C585E]">
            <span className="font-semibold text-[#242326] block mb-0.5">Export browser demonstration package</span>
            <span>Not an authenticated account archive.</span>
          </div>
          <button onClick={handleDownload} className="px-4 py-2.5 rounded-xl bg-[#242326] hover:bg-[#38363a] text-white text-xs font-semibold transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer">
            <Download className="w-3.5 h-3.5 text-[#B49361]" />
            <span>Download local demo data</span>
          </button>
        </div>
      </div>

      <div className="rounded-3xl bg-red-50/50 border border-red-200/60 p-6 sm:p-7 shadow-xs space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-red-100 text-red-700 flex items-center justify-center">
            <Trash2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-serif text-base font-semibold text-red-950">Clear local demonstration data</h3>
            <p className="text-xs text-red-700/80">
              Clears browser demonstration keys on this device only. It does not delete the signed-in server account.
            </p>
          </div>
        </div>
        <div className="pt-2 flex justify-end">
          <button onClick={() => setShowResetModal(true)} className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer shadow-xs">
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear local demo data</span>
          </button>
        </div>
      </div>

      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-[#242326]/10 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-xl font-semibold text-[#242326]">Clear local demonstration data?</h3>
            <p className="text-xs text-[#5C585E] leading-relaxed">
              This clears browser localStorage demonstration keys on this device. Your signed-in account on the server is unchanged.
            </p>
            <div className="pt-3 flex justify-end gap-3">
              <button onClick={() => setShowResetModal(false)} className="px-4 py-2 text-xs font-medium text-[#5C585E] hover:text-[#242326] cursor-pointer">Cancel</button>
              <button onClick={handleConfirmReset} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs">Yes, clear local demo data</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
