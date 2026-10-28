/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { Camera, ShieldCheck, Upload, X } from 'lucide-react';
import { TemporaryPhotos } from '../../types';
import { Button } from '../common/Button';
import type { ProfilePhotoSlot } from '../../services/accountApi';
import {
  fileToBase64,
  mediaDisplayUrl,
  mediaKeyForSlot,
  slotForUrlKey,
  urlKeyForSlot,
} from '../../services/profilePhotosClient';

type UrlPhotoKey = 'profilePhotoUrl' | 'fullBodyFrontUrl' | 'fullBodyAdditionalUrl';

export interface PrivatePhotoSlotsEditorProps {
  photos: TemporaryPhotos;
  onUpdatePhotos: (photos: TemporaryPhotos) => void;
  usesAccount?: boolean;
  storageConsentGranted?: boolean;
  onGrantStorageConsent?: () => Promise<void>;
  onUploadSlot?: (slot: ProfilePhotoSlot, imageBase64: string) => Promise<{ mediaId: string }>;
  onDeleteSlot?: (slot: ProfilePhotoSlot) => Promise<void>;
}

const SLOTS: {
  key: UrlPhotoKey;
  title: string;
  emptyHint: string;
  slot: ProfilePhotoSlot;
  emphasize?: boolean;
}[] = [
  { key: 'profilePhotoUrl', title: '1. Profile portrait', emptyHint: 'Head and shoulders', slot: 'portrait' },
  { key: 'fullBodyFrontUrl', title: '2. Full-body front', emptyHint: 'Full length, facing camera, arms slightly out', slot: 'full_body_front' },
  {
    key: 'fullBodyAdditionalUrl',
    title: '3. Full-body back',
    emptyHint: 'Full length, facing away — required to see the back of a try-on',
    slot: 'full_body_additional',
    emphasize: true,
  },
];

export const PrivatePhotoSlotsEditor: React.FC<PrivatePhotoSlotsEditorProps> = ({
  photos,
  onUpdatePhotos,
  usesAccount = false,
  storageConsentGranted = false,
  onGrantStorageConsent,
  onUploadSlot,
  onDeleteSlot,
}) => {
  const profileInputRef = useRef<HTMLInputElement>(null);
  const frontInputRef = useRef<HTMLInputElement>(null);
  const additionalInputRef = useRef<HTMLInputElement>(null);
  const refs: Record<UrlPhotoKey, React.RefObject<HTMLInputElement | null>> = {
    profilePhotoUrl: profileInputRef,
    fullBodyFrontUrl: frontInputRef,
    fullBodyAdditionalUrl: additionalInputRef,
  };
  const [consentChecked, setConsentChecked] = useState(storageConsentGranted);
  const [busySlot, setBusySlot] = useState<ProfilePhotoSlot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setConsentChecked(storageConsentGranted);
  }, [storageConsentGranted]);

  const canUpload = !usesAccount || consentChecked;

  const handleLocalFile = (key: UrlPhotoKey, file: File) => {
    const objectUrl = URL.createObjectURL(file);
    onUpdatePhotos({ ...photos, [key]: objectUrl });
  };

  const handleAccountFile = async (key: UrlPhotoKey, file: File) => {
    if (!onUploadSlot || !onGrantStorageConsent) return;
    const slot = slotForUrlKey(key);
    setBusySlot(slot);
    setError(null);
    try {
      if (!storageConsentGranted) {
        await onGrantStorageConsent();
      }
      const uploaded = await onUploadSlot(slot, await fileToBase64(file));
      onUpdatePhotos({
        ...photos,
        [urlKeyForSlot(slot)]: mediaDisplayUrl(uploaded.mediaId),
        [mediaKeyForSlot(slot)]: uploaded.mediaId,
      });
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'That photograph could not be saved privately.');
    } finally {
      setBusySlot(null);
    }
  };

  const handleFileChange = (key: UrlPhotoKey, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (usesAccount) {
      if (!canUpload) {
        setError('Confirm private photograph storage consent before uploading.');
        return;
      }
      void handleAccountFile(key, file);
      return;
    }
    handleLocalFile(key, file);
  };

  const handleRemovePhoto = (key: UrlPhotoKey) => {
    const slot = slotForUrlKey(key);
    if (usesAccount && onDeleteSlot && photos[mediaKeyForSlot(slot)]) {
      setBusySlot(slot);
      setError(null);
      void onDeleteSlot(slot)
        .then(() => {
          const updated = { ...photos };
          delete updated[key];
          delete updated[mediaKeyForSlot(slot)];
          onUpdatePhotos(updated);
        })
        .catch((deleteError: unknown) => {
          setError(deleteError instanceof Error ? deleteError.message : 'That photograph could not be removed.');
        })
        .finally(() => setBusySlot(null));
      return;
    }
    if (photos[key]?.startsWith('blob:')) URL.revokeObjectURL(photos[key]!);
    const updated = { ...photos };
    delete updated[key];
    onUpdatePhotos(updated);
  };

  const statusLabel = (key: UrlPhotoKey, empty: string) => {
    if (!photos[key]) return empty;
    if (usesAccount && photos[mediaKeyForSlot(slotForUrlKey(key))]) return 'Saved privately to your account';
    return 'Photo selected (browser memory only)';
  };

  return (
    <div className="space-y-4">
      {usesAccount && (
        <label className="flex items-start gap-2.5 rounded-xl border border-[#242326]/10 bg-[#FAF7F2] px-3 py-2.5 cursor-pointer">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={consentChecked}
            onChange={(event) => {
              setConsentChecked(event.target.checked);
              setError(null);
            }}
            aria-label="Consent to private photograph storage"
          />
          <span className="text-[11px] text-[#242326] leading-snug">
            <strong>Private storage consent.</strong> Store these photos on my account only — not for FASHN, OpenAI, Gemini, or other external image AI.
          </span>
        </label>
      )}

      <div className="rounded-xl border border-[#866a40]/25 bg-[#FAF7F2] px-3 py-2.5">
        <p className="text-[11px] font-semibold text-[#242326]">Three private photo slots</p>
        <p className="text-[11px] text-[#5C585E] mt-0.5 leading-relaxed">
          Portrait · Full-body <strong className="text-[#242326]">front</strong> · Full-body <strong className="text-[#242326]">back</strong>.
          The back photo is what unlocks the Back view in Virtual Try-On.
        </p>
      </div>

      <div className="p-3 rounded-xl bg-[#E5CDBE]/20 border border-[#242326]/10 flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-[#9C6A61] shrink-0 mt-0.5" />
        <p className="text-[11px] text-[#242326] leading-relaxed">
          {usesAccount ? (
            <>
              Uploads save immediately to private slots on this account (owner-only). External image AI is not connected from this screen.
            </>
          ) : (
            <>
              Demonstration mode: photographs stay in temporary browser memory only and are not uploaded to an account.
            </>
          )}
        </p>
      </div>

      {error ? <p role="alert" className="text-xs text-red-700">{error}</p> : null}

      <div className="space-y-3">
        {SLOTS.map((entry) => (
          <div
            key={entry.key}
            id={entry.key === 'fullBodyAdditionalUrl' ? 'full-body-back-slot' : undefined}
            className={`flex items-center justify-between p-4 rounded-2xl border bg-white ${
              entry.emphasize
                ? 'border-[#866a40]/45 ring-1 ring-[#866a40]/15'
                : 'border-[#242326]/10'
            }`}
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-[#E5CDBE]/30 flex items-center justify-center shrink-0 border border-[#242326]/10">
                {photos[entry.key] ? (
                  <img src={photos[entry.key]} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-6 h-6 text-[#9C6A61]" />
                )}
              </div>
              <div className="min-w-0">
                <span className="text-xs font-semibold text-[#242326] block">{entry.title}</span>
                {entry.emphasize && !photos[entry.key] ? (
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#866a40] block mt-0.5">
                    Needed for try-on Back view
                  </span>
                ) : null}
                <span className="text-[11px] text-[#5C585E]">
                  {busySlot === entry.slot ? 'Saving…' : statusLabel(entry.key, entry.emptyHint)}
                </span>
              </div>
            </div>
            <div className="shrink-0">
              <input
                ref={refs[entry.key]}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                aria-label={`Choose ${entry.title}`}
                onChange={(event) => handleFileChange(entry.key, event)}
              />
              {photos[entry.key] ? (
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => refs[entry.key].current?.click()}
                    disabled={!canUpload || busySlot === entry.slot}
                    icon={<Upload className="w-3.5 h-3.5" />}
                  >
                    Replace
                  </Button>
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(entry.key)}
                    disabled={busySlot === entry.slot}
                    className="p-2 text-[#5C585E] hover:text-red-600 transition-colors cursor-pointer"
                    title="Remove"
                    aria-label={`Remove ${entry.title}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant={entry.emphasize ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => refs[entry.key].current?.click()}
                  disabled={!canUpload || busySlot === entry.slot}
                  icon={<Upload className="w-3.5 h-3.5" />}
                >
                  {entry.emphasize ? 'Upload back' : 'Choose'}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
