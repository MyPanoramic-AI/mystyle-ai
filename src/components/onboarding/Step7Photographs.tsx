/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { onboardingStepLabel } from './onboardingSteps';
import { TemporaryPhotos } from '../../types';
import { Button } from '../common/Button';
import {
  Camera,
  Upload,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  X,
  HelpCircle,
} from 'lucide-react';
import type { ProfilePhotoSlot } from '../../services/accountApi';
import {
  fileToBase64,
  mediaDisplayUrl,
  mediaKeyForSlot,
  slotForUrlKey,
  urlKeyForSlot,
} from '../../services/profilePhotosClient';

type UrlPhotoKey = 'profilePhotoUrl' | 'fullBodyFrontUrl' | 'fullBodyAdditionalUrl';

interface Step7PhotographsProps {
  photos: TemporaryPhotos;
  onUpdatePhotos: (photos: TemporaryPhotos) => void;
  onContinue: () => void;
  onBack: () => void;
  onSkip: () => void;
  usesAccount?: boolean;
  storageConsentGranted?: boolean;
  onGrantStorageConsent?: () => Promise<void>;
  onUploadSlot?: (slot: ProfilePhotoSlot, imageBase64: string) => Promise<{ mediaId: string }>;
  onDeleteSlot?: (slot: ProfilePhotoSlot) => Promise<void>;
}

export const Step7Photographs: React.FC<Step7PhotographsProps> = ({
  photos,
  onUpdatePhotos,
  onContinue,
  onBack,
  onSkip,
  usesAccount = false,
  storageConsentGranted = false,
  onGrantStorageConsent,
  onUploadSlot,
  onDeleteSlot,
}) => {
  const profileInputRef = useRef<HTMLInputElement>(null);
  const frontInputRef = useRef<HTMLInputElement>(null);
  const additionalInputRef = useRef<HTMLInputElement>(null);
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
    <div className="max-w-xl mx-auto py-2 sm:py-6 animate-fadeIn">
      <div className="rounded-3xl bg-white border border-[#242326]/10 shadow-sm p-6 sm:p-10">
        <div className="mb-6">
          <span className="text-xs font-semibold tracking-wider uppercase text-[#B49361] block mb-1">
            {onboardingStepLabel(7)}
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#242326]">
            Upload Your Fitting Photos
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-[#5C585E]">
            Optional adult photographs for silhouette recommendations. Virtual try-on is not connected from this step.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#F6F2EC] border border-[#242326]/8 mb-6">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#242326] mb-2">
            <HelpCircle className="w-3.5 h-3.5 text-[#B49361]" />
            <span>Tips for Best Styling Accuracy</span>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-[#5C585E]">
            <li>• Use soft, natural front lighting</li>
            <li>• Stand upright in a natural posture</li>
            <li>• Ensure head-to-toe visibility</li>
            <li>• Avoid heavy beauty filters</li>
            <li>• Wear fitted base clothing</li>
            <li>• Plain uncluttered background</li>
          </ul>
        </div>

        {usesAccount && (
          <label className="mb-6 flex items-start gap-3 rounded-2xl border border-[#242326]/10 bg-[#FAF7F2] p-4 cursor-pointer">
            <input
              type="checkbox"
              className="mt-1"
              checked={consentChecked}
              onChange={(event) => {
                setConsentChecked(event.target.checked);
                setError(null);
              }}
              aria-label="Consent to private photograph storage"
            />
            <span className="text-[11px] text-[#242326] leading-relaxed">
              <strong>Private photograph storage consent.</strong> I am an adult and allow MyStyle AI to store these
              photographs privately for my account. This does <strong>not</strong> authorise sending photographs to
              FASHN, OpenAI, Gemini, or any external image AI. External photo AI is a separate optional consent.
            </span>
          </label>
        )}

        {error && (
          <p role="alert" className="mb-4 text-xs text-red-700">{error}</p>
        )}

        <div className="space-y-4 mb-6">
          <PhotoRow
            title="1. Profile Portrait"
            emptyHint="Head and shoulders portrait"
            status={statusLabel('profilePhotoUrl', 'Head and shoulders portrait')}
            previewUrl={photos.profilePhotoUrl}
            alt="Profile preview"
            inputRef={profileInputRef}
            busy={busySlot === 'portrait'}
            disabled={usesAccount && !canUpload}
            onChoose={() => profileInputRef.current?.click()}
            onFile={(event) => handleFileChange('profilePhotoUrl', event)}
            onRemove={() => handleRemovePhoto('profilePhotoUrl')}
          />
          <PhotoRow
            title="2. Full-Body Front Pose"
            emptyHint="Full length, arms slightly out"
            status={statusLabel('fullBodyFrontUrl', 'Full length, arms slightly out')}
            previewUrl={photos.fullBodyFrontUrl}
            alt="Full-body front preview"
            inputRef={frontInputRef}
            busy={busySlot === 'full_body_front'}
            disabled={usesAccount && !canUpload}
            onChoose={() => frontInputRef.current?.click()}
            onFile={(event) => handleFileChange('fullBodyFrontUrl', event)}
            onRemove={() => handleRemovePhoto('fullBodyFrontUrl')}
          />
          <PhotoRow
            title="3. Full-body back"
            emptyHint="Full length, facing away — unlocks try-on Back view"
            status={statusLabel('fullBodyAdditionalUrl', 'Full length, facing away — unlocks try-on Back view')}
            previewUrl={photos.fullBodyAdditionalUrl}
            alt="Full-body back preview"
            inputRef={additionalInputRef}
            busy={busySlot === 'full_body_additional'}
            disabled={usesAccount && !canUpload}
            onChoose={() => additionalInputRef.current?.click()}
            onFile={(event) => handleFileChange('fullBodyAdditionalUrl', event)}
            onRemove={() => handleRemovePhoto('fullBodyAdditionalUrl')}
          />
        </div>

        <div className="p-3.5 rounded-2xl bg-[#E5CDBE]/20 border border-[#242326]/8 mb-6 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-[#9C6A61] shrink-0 mt-0.5" />
          <p className="text-[11px] text-[#242326] leading-relaxed">
            {usesAccount ? (
              <>
                <strong>Private storage:</strong> Uploaded adult photographs are stored privately for this account only.
                They are not public URLs and are not sent to external AI providers from this step. Child photographs are refused.
              </>
            ) : (
              <>
                <strong>Demonstration mode:</strong> Photos stay in temporary browser memory only and are not uploaded.
              </>
            )}
          </p>
        </div>

        <div className="pt-6 border-t border-[#242326]/8 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium text-[#5C585E] hover:text-[#242326] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onSkip}
              className="px-3.5 py-2 text-xs font-medium text-[#5C585E] hover:text-[#242326] transition-colors cursor-pointer"
            >
              Skip
            </button>
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={onContinue}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Continue
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

function PhotoRow(props: {
  title: string;
  emptyHint: string;
  status: string;
  previewUrl?: string;
  alt: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  busy: boolean;
  disabled: boolean;
  onChoose: () => void;
  onFile: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center justify-between p-4 rounded-2xl border border-[#242326]/10 bg-white">
      <div className="flex items-center gap-3.5">
        <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-[#E5CDBE]/30 flex items-center justify-center shrink-0 border border-[#242326]/10">
          {props.previewUrl ? (
            <img src={props.previewUrl} alt={props.alt} className="w-full h-full object-cover" />
          ) : (
            <Camera className="w-6 h-6 text-[#9C6A61]" />
          )}
        </div>
        <div>
          <span className="text-xs font-semibold text-[#242326] block">{props.title}</span>
          <span className="text-[11px] text-[#5C585E]">{props.busy ? 'Saving…' : props.status}</span>
        </div>
      </div>
      <div>
        <input
          ref={props.inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={props.onFile}
        />
        {props.previewUrl ? (
          <button
            type="button"
            onClick={props.onRemove}
            disabled={props.busy}
            className="p-2 text-[#5C585E] hover:text-red-600 transition-colors cursor-pointer"
            title="Remove"
            aria-label={`Remove ${props.title}`}
          >
            <X className="w-4 h-4" />
          </button>
        ) : (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={props.onChoose}
            disabled={props.disabled || props.busy}
            icon={<Upload className="w-3.5 h-3.5" />}
          >
            Choose
          </Button>
        )}
      </div>
    </div>
  );
}
