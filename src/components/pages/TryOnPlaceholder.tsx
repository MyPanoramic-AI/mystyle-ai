/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { NavigationTab, TemporaryPhotos } from '../../types';
import { FashionLook } from '../../types/discover';
import { PreloadedGarment } from '../../types/shop';
import { Button } from '../common/Button';
import { ImageWithFallback } from '../common/ImageWithFallback';
import {
  Camera,
  Upload,
  ArrowLeft,
  Layers,
  ShieldCheck,
  Sparkles,
  X,
  User,
} from 'lucide-react';
import { AccountApiError, accountApi, type TryOnCategory, type TryOnJobRecord } from '../../services/accountApi';
import { fileToBase64, mediaDisplayUrl } from '../../services/profilePhotosClient';

interface TryOnPlaceholderProps {
  onNavigate: (tab: NavigationTab) => void;
  preloadedOutfit?: FashionLook | null;
  preloadedGarment?: PreloadedGarment | null;
  familyMemberName?: string | null;
  photos?: TemporaryPhotos;
  usesAccount?: boolean;
  onClearGarment?: () => void;
  onClearOutfit?: () => void;
}

type PersonSlot = 'full_body_front' | 'full_body_additional' | 'portrait';

const CATEGORIES: { id: TryOnCategory; label: string }[] = [
  { id: 'tops', label: 'Tops' },
  { id: 'bottoms', label: 'Bottoms' },
  { id: 'one-pieces', label: 'One-pieces' },
  { id: 'outerwear', label: 'Outerwear' },
];

function personOptions(photos?: TemporaryPhotos): { slot: PersonSlot; mediaId: string; url: string; label: string }[] {
  const options: { slot: PersonSlot; mediaId: string; url: string; label: string }[] = [];
  if (photos?.fullBodyFrontMediaId && photos.fullBodyFrontUrl) {
    options.push({ slot: 'full_body_front', mediaId: photos.fullBodyFrontMediaId, url: photos.fullBodyFrontUrl, label: 'Full-body front' });
  }
  if (photos?.fullBodyAdditionalMediaId && photos.fullBodyAdditionalUrl) {
    options.push({ slot: 'full_body_additional', mediaId: photos.fullBodyAdditionalMediaId, url: photos.fullBodyAdditionalUrl, label: 'Additional angle' });
  }
  if (photos?.portraitMediaId && photos.profilePhotoUrl) {
    options.push({ slot: 'portrait', mediaId: photos.portraitMediaId, url: photos.profilePhotoUrl, label: 'Portrait' });
  }
  return options;
}

function categoryFromPreload(garment?: PreloadedGarment | null): TryOnCategory {
  const raw = (garment?.category || '').toLowerCase();
  if (raw.includes('bottom') || raw.includes('pant') || raw.includes('skirt')) return 'bottoms';
  if (raw.includes('dress') || raw.includes('jumpsuit') || raw.includes('one')) return 'one-pieces';
  if (raw.includes('outer') || raw.includes('coat') || raw.includes('jacket')) return 'outerwear';
  return 'tops';
}

async function urlToBase64(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) throw new Error('The garment preview could not be loaded.');
  const buffer = await response.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let index = 0; index < bytes.length; index += 1) binary += String.fromCharCode(bytes[index]!);
  return btoa(binary);
}

export const TryOnPlaceholder: React.FC<TryOnPlaceholderProps> = ({
  onNavigate,
  preloadedOutfit,
  preloadedGarment,
  familyMemberName,
  photos,
  usesAccount = false,
  onClearGarment,
  onClearOutfit,
}) => {
  const options = useMemo(() => personOptions(photos), [photos]);
  const [personMediaId, setPersonMediaId] = useState<string | undefined>(options[0]?.mediaId);
  const [category, setCategory] = useState<TryOnCategory>(categoryFromPreload(preloadedGarment));
  const [garmentFile, setGarmentFile] = useState<File | null>(null);
  const [garmentPreview, setGarmentPreview] = useState<string | undefined>(preloadedGarment?.imageUrl);
  const [externalConsent, setExternalConsent] = useState(false);
  const [liveEnabled, setLiveEnabled] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [job, setJob] = useState<TryOnJobRecord | null>(null);
  const garmentInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<number | null>(null);

  const activePhoto = options.find((item) => item.mediaId === personMediaId)?.url || options[0]?.url;

  useEffect(() => {
    if (!options.some((item) => item.mediaId === personMediaId)) {
      setPersonMediaId(options[0]?.mediaId);
    }
  }, [options, personMediaId]);

  useEffect(() => {
    setCategory(categoryFromPreload(preloadedGarment));
    setGarmentPreview(preloadedGarment?.imageUrl);
    setGarmentFile(null);
  }, [preloadedGarment]);

  useEffect(() => {
    if (!usesAccount) return;
    let cancelled = false;
    void accountApi.tryOnAvailability().then((availability) => {
      if (cancelled) return;
      setLiveEnabled(availability.liveEnabled);
      setExternalConsent(availability.externalPhotoAiConsent);
    }).catch(() => {
      // Availability is informational; the Simulate Fit path still surfaces errors.
    });
    return () => {
      cancelled = true;
    };
  }, [usesAccount]);

  useEffect(() => () => {
    if (pollRef.current) window.clearInterval(pollRef.current);
  }, []);

  const showStatus = (message: string) => setStatusMessage(message);

  const stopPolling = () => {
    if (pollRef.current) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const watchJob = (jobId: string) => {
    stopPolling();
    pollRef.current = window.setInterval(() => {
      void accountApi.getTryOnJob(jobId).then((next) => {
        setJob(next);
        if (next.status === 'succeeded') {
          stopPolling();
          setBusy(false);
          showStatus(next.demonstration
            ? 'Demonstration fit complete. The result is labelled as a demonstration and was not generated by FASHN.'
            : 'Try-on generation finished.');
        } else if (next.status === 'failed' || next.status === 'cancelled') {
          stopPolling();
          setBusy(false);
          showStatus(next.errorMessage || (next.status === 'cancelled' ? 'Try-on cancelled.' : 'Try-on failed.'));
        }
      }).catch((error) => {
        stopPolling();
        setBusy(false);
        showStatus(error instanceof AccountApiError ? error.message : 'The try-on job could not be refreshed.');
      });
    }, 400);
  };

  const handleGarmentFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setGarmentFile(file);
    setGarmentPreview(URL.createObjectURL(file));
  };

  const handleSimulateFit = async () => {
    if (!usesAccount) {
      showStatus('Sign in to run a private demonstration fit with your account photographs.');
      return;
    }
    if (!personMediaId) {
      showStatus('Add a private full-body photograph in My Profile → Manage Photos first.');
      return;
    }
    if (!garmentFile && !preloadedGarment?.imageUrl) {
      showStatus('Choose a garment image or load one from Shop before simulating a fit.');
      return;
    }

    setBusy(true);
    setJob(null);
    showStatus('Starting demonstration fit…');
    try {
      const garmentImageBase64 = garmentFile
        ? await fileToBase64(garmentFile)
        : await urlToBase64(preloadedGarment!.imageUrl);
      const created = await accountApi.createTryOnJob({
        personMediaId,
        garmentImageBase64,
        category,
        providerId: 'mock',
        idempotencyKey: `ui-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      });
      setJob(created);
      if (created.status === 'succeeded') {
        setBusy(false);
        showStatus(created.demonstration
          ? 'Demonstration fit complete. The result is labelled as a demonstration and was not generated by FASHN.'
          : 'Try-on generation finished.');
        return;
      }
      watchJob(created.id);
    } catch (error) {
      setBusy(false);
      showStatus(error instanceof AccountApiError ? error.message : 'The demonstration fit could not be started.');
    }
  };

  const handleCancel = async () => {
    if (!job) return;
    try {
      const cancelled = await accountApi.cancelTryOnJob(job.id);
      setJob(cancelled);
      if (cancelled.status === 'cancelled') {
        stopPolling();
        setBusy(false);
        showStatus('Try-on cancelled.');
      }
    } catch (error) {
      showStatus(error instanceof AccountApiError ? error.message : 'That job could not be cancelled.');
    }
  };

  const handleGrantExternalConsent = async () => {
    try {
      await accountApi.setPrivacyConsent({ purpose: 'external_photo_ai', granted: true, captureMethod: 'settings_toggle' });
      setExternalConsent(true);
      showStatus('External photograph AI consent is recorded. Live FASHN remains disabled until a server operator enables TRYON_ALLOW_LIVE.');
    } catch (error) {
      showStatus(error instanceof AccountApiError ? error.message : 'Consent could not be saved.');
    }
  };

  const resultUrl = job?.resultMediaId ? mediaDisplayUrl(job.resultMediaId) : undefined;

  return (
    <div className="max-w-3xl mx-auto space-y-6 text-left">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5C585E] hover:text-[#242326] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>

        <span className="text-xs font-semibold uppercase tracking-wider text-[#B49361]">
          Virtual Fitting Room · {liveEnabled ? 'Live providers available' : 'Demonstration ready'}
        </span>
      </div>

      <div className="rounded-3xl bg-white border border-[#242326]/10 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#E5CDBE] text-[#9C6A61] flex items-center justify-center shrink-0">
            <Camera className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#242326]">
              Virtual Fitting Room
            </h1>
            <p className="text-xs sm:text-sm text-[#5C585E] mt-1">
              Run a private demonstration fit with your account photograph and an authorised garment. Live FASHN calls stay disabled until explicitly approved.
            </p>
          </div>
        </div>

        {statusMessage && (
          <div
            role="status"
            className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 leading-relaxed"
          >
            {statusMessage}
          </div>
        )}

        {preloadedGarment && (
          <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF7F2] border border-[#B49361]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-16 h-20 rounded-xl overflow-hidden shrink-0 border border-[#242326]/10 bg-white">
                <ImageWithFallback
                  src={preloadedGarment.imageUrl}
                  alt={preloadedGarment.productName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#9C6A61] flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    {familyMemberName ? `Fitting for ${familyMemberName}` : 'Garment Loaded'}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-[#242326]/10 text-[#242326] font-medium">
                    {preloadedGarment.retailer}
                  </span>
                </div>
                <h4 className="font-serif text-base font-semibold text-[#242326] mt-0.5">
                  {preloadedGarment.productName}
                </h4>
                <p className="text-xs text-[#5C585E] mt-0.5">
                  Category: {preloadedGarment.category} · Demo price: R{preloadedGarment.priceZar}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {onClearGarment && (
                <button
                  type="button"
                  onClick={onClearGarment}
                  className="p-1.5 rounded-full text-[#5C585E] hover:text-[#242326] hover:bg-white transition-colors cursor-pointer"
                  title="Remove garment"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {preloadedOutfit && !preloadedGarment && (
          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#9C6A61]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-[#242326]/10">
                <ImageWithFallback
                  src={preloadedOutfit.imageUrl}
                  alt={preloadedOutfit.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#9C6A61]">
                  Outfit Loaded From Discover
                </span>
                <h4 className="font-serif text-base font-semibold text-[#242326]">
                  {preloadedOutfit.title}
                </h4>
                <p className="text-xs text-[#5C585E]">
                  {preloadedOutfit.category} · {preloadedOutfit.pieces.length} garments mapped
                </p>
              </div>
            </div>
            {onClearOutfit && (
              <button
                type="button"
                onClick={onClearOutfit}
                className="p-1.5 rounded-full text-[#5C585E] hover:text-[#242326] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {usesAccount && activePhoto && personMediaId ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-white border border-[#242326]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden border border-[#242326]/10 bg-[#FAF7F2]">
                  <img src={activePhoto} alt="Customer" className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#9C6A61]" />
                    <span className="text-xs font-semibold text-[#242326]">Fitting photograph ready</span>
                  </div>
                  <p className="text-[11px] text-[#5C585E]">Using a private photograph from your account</p>
                </div>
              </div>
              {options.length > 1 && (
                <label className="text-xs text-[#5C585E]">
                  Photograph
                  <select
                    className="mt-1 block w-full min-w-[180px] rounded-xl border border-[#242326]/12 bg-white px-3 py-2 text-[#242326]"
                    value={personMediaId}
                    onChange={(event) => setPersonMediaId(event.target.value)}
                  >
                    {options.map((option) => (
                      <option key={option.mediaId} value={option.mediaId}>{option.label}</option>
                    ))}
                  </select>
                </label>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="text-xs text-[#5C585E]">
                Garment category
                <select
                  className="mt-1 block w-full rounded-xl border border-[#242326]/12 bg-white px-3 py-2 text-[#242326]"
                  value={category}
                  onChange={(event) => setCategory(event.target.value as TryOnCategory)}
                >
                  {CATEGORIES.map((item) => (
                    <option key={item.id} value={item.id}>{item.label}</option>
                  ))}
                </select>
              </label>
              <div className="text-xs text-[#5C585E]">
                Garment image
                <div className="mt-1 flex items-center gap-2">
                  <Button type="button" variant="secondary" size="sm" icon={<Upload className="w-4 h-4" />} onClick={() => garmentInputRef.current?.click()}>
                    Choose garment
                  </Button>
                  <input ref={garmentInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleGarmentFile} />
                  {garmentPreview && (
                    <div className="w-10 h-12 rounded-lg overflow-hidden border border-[#242326]/10">
                      <img src={garmentPreview} alt="Garment" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#F6F2EC] border border-[#242326]/8 text-xs text-[#5C585E] space-y-2">
              <p>
                Demonstration fits stay on this account service and do not consume purchased credits.
                Live FASHN also requires external photograph AI consent{externalConsent ? ' (granted)' : ''}.
              </p>
              {!externalConsent && (
                <Button type="button" variant="secondary" size="sm" onClick={() => void handleGrantExternalConsent()}>
                  Record external-photo-AI consent
                </Button>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="primary" size="md" disabled={busy} onClick={() => void handleSimulateFit()}>
                {busy ? 'Generating…' : 'Simulate Fit'}
              </Button>
              {busy && job && (job.status === 'queued' || job.status === 'running') && (
                <Button type="button" variant="secondary" size="md" onClick={() => void handleCancel()}>
                  Cancel
                </Button>
              )}
              <Button type="button" variant="secondary" size="md" onClick={() => onNavigate('profile')}>
                Manage Photos
              </Button>
            </div>

            {resultUrl && job?.status === 'succeeded' && (
              <div className="p-4 rounded-2xl border border-[#B49361]/40 bg-[#FAF7F2] space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#9C6A61]">
                    {job.demonstration ? 'Demonstration result' : 'Try-on result'}
                  </span>
                  <span className="text-[11px] text-[#5C585E]">{job.label}</span>
                </div>
                <div className="max-w-xs rounded-2xl overflow-hidden border border-[#242326]/10 bg-white">
                  <img src={resultUrl} alt={job.label} className="w-full h-auto object-cover" />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="border-2 border-dashed border-[#242326]/15 rounded-3xl p-8 sm:p-12 text-center bg-[#F6F2EC]/40 flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-white shadow-xs border border-[#242326]/8 flex items-center justify-center text-[#9C6A61] mb-4">
              <Upload className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg font-semibold text-[#242326]">
              {usesAccount ? 'No fitting photograph loaded yet' : 'Upload a Full-Length Photo'}
            </h3>
            <p className="text-xs sm:text-sm text-[#5C585E] max-w-md mt-1.5 mb-6">
              {usesAccount
                ? 'Photographs you saved during sign-up or in Manage Photos are used here. Open My Profile to confirm they are still on this account, then return to Try On.'
                : 'Sign in and add private styling photographs from My Profile → Manage Photos to run a demonstration fit.'}
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button type="button" variant="primary" size="md" onClick={() => onNavigate('profile')}>
                Open My Profile
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-[#F6F2EC] border border-[#242326]/8">
            <div className="flex items-center gap-2 mb-1.5 text-xs font-semibold text-[#242326]">
              <Layers className="w-4 h-4 text-[#B49361]" />
              <span>Multi-Garment Layering</span>
            </div>
            <p className="text-xs text-[#5C585E] leading-relaxed">
              Mix and match tops, bottoms, outerwear, and accessories simultaneously to review full ensembles.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#F6F2EC] border border-[#242326]/8">
            <div className="flex items-center gap-2 mb-1.5 text-xs font-semibold text-[#242326]">
              <ShieldCheck className="w-4 h-4 text-[#9C6A61]" />
              <span>Private & On-Device Control</span>
            </div>
            <p className="text-xs text-[#5C585E] leading-relaxed">
              Your personal photographs are never shared publicly or used for unauthorized machine learning training.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
