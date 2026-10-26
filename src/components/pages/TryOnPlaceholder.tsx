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
  ShieldCheck,
  Sparkles,
  X,
  User,
  Columns2,
  Trash2,
  RefreshCw,
  Shirt,
} from 'lucide-react';
import {
  AccountApiError,
  accountApi,
  type TryOnAvailabilityResponse,
  type TryOnCategory,
  type TryOnGarmentOption,
  type TryOnJobRecord,
  type TryOnProviderId,
} from '../../services/accountApi';
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
type GarmentMode = 'existing' | 'shop' | 'upload';
type Step = 'garment' | 'photo' | 'confirm' | 'progress' | 'result' | 'fittings';

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

function categoryFromText(raw?: string | null): TryOnCategory {
  const value = (raw || '').toLowerCase();
  if (value.includes('bottom') || value.includes('pant') || value.includes('skirt') || value.includes('jean')) return 'bottoms';
  if (value.includes('dress') || value.includes('jumpsuit') || value.includes('one')) return 'one-pieces';
  if (value.includes('outer') || value.includes('coat') || value.includes('jacket') || value.includes('blazer')) return 'outerwear';
  return 'tops';
}

function tryOnFailureMessage(error: unknown, fallback: string): string {
  if (error instanceof AccountApiError) return error.message;
  if (error instanceof Error && error.name === 'AccountApiError' && error.message) return error.message;
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}

function mediaIdFromUrl(url: string): string | null {
  try {
    const pathname = new URL(url, typeof window !== 'undefined' ? window.location.origin : 'https://local.invalid').pathname;
    const match = /^\/api\/media\/([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i.exec(pathname);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

/** Prefer server-side garment loading — browser fetch hits CORS on Unsplash and some CDNs. */
function garmentUrlForServer(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed || trimmed.startsWith('blob:') || trimmed.startsWith('data:')) return null;
  try {
    const parsed = new URL(trimmed, typeof window !== 'undefined' ? window.location.origin : 'https://local.invalid');
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    // Same-origin catalogue assets: send path only so the API can read dist/assets.
    if (typeof window !== 'undefined' && parsed.origin === window.location.origin) {
      if (parsed.pathname.startsWith('/assets/') || parsed.pathname.startsWith('/images/')) {
        return `${parsed.pathname}${parsed.search}`;
      }
    }
    // Absolute remote (e.g. Unsplash wardrobe demos) — server allowlist fetches these.
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    if (trimmed.startsWith('/')) return trimmed;
    return null;
  } catch {
    return null;
  }
}

async function blobOrDataUrlToBase64(url: string): Promise<string> {
  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    throw new Error('The garment preview could not be loaded.');
  }
  if (!response.ok) throw new Error('The garment preview could not be loaded.');
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      const comma = result.indexOf(',');
      if (comma < 0) {
        reject(new Error('The garment preview could not be encoded.'));
        return;
      }
      resolve(result.slice(comma + 1));
    };
    reader.onerror = () => reject(new Error('The garment preview could not be encoded.'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Customer-facing blockers only — never dump ops/server checks when live is simply off.
 * Priority: sign-in → storage consent → live disabled → customer live prerequisites.
 * API key / budget are never shown to customers (ops-only).
 */
function generationBlockers(availability: TryOnAvailabilityResponse | null, usesAccount: boolean): string[] {
  if (!usesAccount) return ['Sign in with an adult account to use Virtual Try-On.'];
  if (!availability) return ['Checking try-on availability…'];
  if (availability.generationMode !== 'unavailable') return [];

  const checks = availability.readiness?.checks || {};
  if (!availability.privatePhotoStorageConsent && !checks.privatePhotoStorageConsent) {
    return ['Grant private photograph storage consent before using saved photos.'];
  }

  // Live is off (Render/production default): one honest message — not a checklist of plan/key/budget.
  if (!availability.liveEnabled) {
    return ['Live virtual try-on is currently unavailable.'];
  }

  // Live flag is on but this account/server is not ready — only actionable customer items.
  const blockers: string[] = [];
  if (!availability.externalPhotoAiConsent) {
    blockers.push('Grant external AI consent to continue.');
  }
  if (availability.aiImageEntitlement === false) {
    blockers.push('This plan does not include virtual try-on.');
  }
  if (
    typeof availability.creditBalance === 'number'
    && typeof availability.estimatedCustomerCredits === 'number'
    && availability.creditBalance < availability.estimatedCustomerCredits
  ) {
    blockers.push('You need available try-on credits.');
  }
  // Ops gaps (key/budget) collapse to the same customer-safe line.
  if (blockers.length === 0) {
    blockers.push('Live virtual try-on is currently unavailable.');
  }
  return blockers;
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
  const preferredPerson = options.find((item) => item.slot === 'full_body_front') || options[0];
  const [personMediaId, setPersonMediaId] = useState<string | undefined>(preferredPerson?.mediaId);
  const [category, setCategory] = useState<TryOnCategory>(categoryFromText(preloadedGarment?.category));
  const [garmentMode, setGarmentMode] = useState<GarmentMode>(preloadedGarment ? 'shop' : 'existing');
  const [accountGarments, setAccountGarments] = useState<TryOnGarmentOption[]>([]);
  const [selectedGarmentId, setSelectedGarmentId] = useState<string>('');
  const [shopNote, setShopNote] = useState('MyStyle AI Shop demonstration listings are not verified retailer products.');
  const [garmentFile, setGarmentFile] = useState<File | null>(null);
  const [garmentPreview, setGarmentPreview] = useState<string | undefined>(preloadedGarment?.imageUrl);
  const [availability, setAvailability] = useState<TryOnAvailabilityResponse | null>(null);
  const [step, setStep] = useState<Step>('garment');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [job, setJob] = useState<TryOnJobRecord | null>(null);
  const [fittings, setFittings] = useState<TryOnJobRecord[]>([]);
  const [compare, setCompare] = useState<'before' | 'after' | 'both'>('both');
  const garmentInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<number | null>(null);

  const activePhoto = options.find((item) => item.mediaId === personMediaId)?.url || preferredPerson?.url;
  const selectedGarment = accountGarments.find((item) => item.id === selectedGarmentId);
  const generationMode = availability?.generationMode || 'unavailable';
  const hasFullBody = Boolean(photos?.fullBodyFrontMediaId);

  useEffect(() => {
    if (!options.some((item) => item.mediaId === personMediaId)) {
      setPersonMediaId(preferredPerson?.mediaId);
    }
  }, [options, personMediaId, preferredPerson?.mediaId]);

  useEffect(() => {
    setCategory(categoryFromText(preloadedGarment?.category));
    if (preloadedGarment?.imageUrl) {
      setGarmentMode('shop');
      setGarmentPreview(preloadedGarment.imageUrl);
      setGarmentFile(null);
      // Skip ahead: photo ready → confirm; otherwise land on photograph step.
      setStep(hasFullBody || preferredPerson?.mediaId ? 'confirm' : 'photo');
    }
  }, [preloadedGarment, hasFullBody, preferredPerson?.mediaId]);

  const refreshFittings = async () => {
    if (!usesAccount) return;
    const listed = await accountApi.listTryOnFittings();
    setFittings(listed.fittings);
  };

  useEffect(() => {
    if (!usesAccount) return;
    let cancelled = false;
    void Promise.all([
      accountApi.tryOnAvailability(),
      accountApi.listTryOnGarments(),
      accountApi.listTryOnFittings().catch(() => ({ fittings: [] as TryOnJobRecord[] })),
    ]).then(([nextAvailability, garments, listed]) => {
      if (cancelled) return;
      setAvailability(nextAvailability);
      setAccountGarments(garments.garments);
      setShopNote(garments.shop.note);
      setFittings(listed.fittings);
      if (!preloadedGarment && garments.garments.length > 0) {
        setGarmentMode('existing');
        setSelectedGarmentId(garments.garments[0]!.id);
        setGarmentPreview(mediaDisplayUrl(garments.garments[0]!.mediaId));
        setCategory(categoryFromText(garments.garments[0]!.category));
      } else if (!preloadedGarment) {
        setGarmentMode(garments.preferredSource === 'upload' ? 'upload' : 'existing');
      }
    }).catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [usesAccount, preloadedGarment]);

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
    setStep('progress');
    pollRef.current = window.setInterval(() => {
      void accountApi.getTryOnJob(jobId).then((next) => {
        setJob(next);
        if (next.status === 'succeeded') {
          stopPolling();
          setBusy(false);
          setStep('result');
          void refreshFittings();
          showStatus(next.demonstration
            ? 'Local development demonstration complete — not a real FASHN fitting.'
            : 'Virtual try-on complete. This is an AI visualisation, not a precise physical fit guarantee.');
        } else if (next.status === 'failed' || next.status === 'cancelled') {
          stopPolling();
          setBusy(false);
          setStep(next.status === 'failed' ? 'result' : 'confirm');
          showStatus(next.errorMessage || (next.status === 'cancelled' ? 'Try-on cancelled.' : 'Try-on failed.'));
        }
      }).catch((error) => {
        stopPolling();
        setBusy(false);
        setStep('confirm');
        showStatus(error instanceof AccountApiError ? error.message : 'The try-on job could not be refreshed.');
      });
    }, 400);
  };

  const handleGarmentFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setGarmentMode('upload');
    setGarmentFile(file);
    setGarmentPreview(URL.createObjectURL(file));
  };

  const handleSelectExisting = (garmentId: string) => {
    const garment = accountGarments.find((item) => item.id === garmentId);
    setSelectedGarmentId(garmentId);
    setGarmentMode('existing');
    setGarmentFile(null);
    if (garment) {
      setGarmentPreview(mediaDisplayUrl(garment.mediaId));
      setCategory(categoryFromText(garment.category));
    }
  };

  const garmentReady = Boolean(
    (garmentMode === 'existing' && selectedGarment)
    || (garmentMode === 'shop' && preloadedGarment?.imageUrl)
    || (garmentMode === 'upload' && garmentFile),
  );

  const buildGarmentPayload = async (): Promise<Partial<{
    wardrobeItemId: string;
    garmentMediaId: string;
    garmentImageUrl: string;
    garmentImageBase64: string;
  }>> => {
    if (garmentMode === 'existing' && selectedGarment) {
      if (selectedGarment.wardrobeItemId) return { wardrobeItemId: selectedGarment.wardrobeItemId };
      return { garmentMediaId: selectedGarment.mediaId };
    }
    if (garmentMode === 'shop' && preloadedGarment?.imageUrl) {
      const imageUrl = preloadedGarment.imageUrl;
      const mediaId = mediaIdFromUrl(imageUrl);
      if (mediaId) return { garmentMediaId: mediaId };
      const forServer = garmentUrlForServer(imageUrl);
      if (forServer) return { garmentImageUrl: forServer };
      if (imageUrl.startsWith('blob:') || imageUrl.startsWith('data:')) {
        return { garmentImageBase64: await blobOrDataUrlToBase64(imageUrl) };
      }
      throw new Error('That garment image cannot be used for try-on. Choose a Shop listing, wardrobe photo, or upload.');
    }
    if (garmentMode === 'upload' && garmentFile) {
      return { garmentImageBase64: await fileToBase64(garmentFile) };
    }
    throw new Error('Select a wardrobe garment, Shop listing, or upload.');
  };

  const handleGenerate = async () => {
    if (!usesAccount) {
      showStatus('Sign in to use Virtual Try-On with your private photographs.');
      return;
    }
    if (!personMediaId) {
      showStatus('Add a private full-body photograph in My Profile → Manage Photos first.');
      return;
    }
    if (!garmentReady) {
      showStatus('Select a garment before generating a fitting.');
      return;
    }
    if (generationMode === 'unavailable') {
      showStatus(availability?.note || 'Virtual Try-On is currently unavailable. Your photographs have not been sent for AI processing.');
      return;
    }

    const providerId: TryOnProviderId = generationMode === 'live'
      ? (availability?.defaultLiveProviderId || 'fashn-tryon-v1.6')
      : 'mock';

    setBusy(true);
    setJob(null);
    setStep('progress');
    showStatus(generationMode === 'live' ? 'Starting virtual try-on…' : 'Starting local development demonstration…');
    try {
      const garmentPayload = await buildGarmentPayload();
      const prepared = await accountApi.prepareTryOnJob({
        personMediaId,
        category,
        providerId,
        ...garmentPayload,
      });
      if (!prepared.ok) {
        setBusy(false);
        setStep('confirm');
        showStatus(`Cannot generate yet: ${prepared.blockers.join(', ') || prepared.note}`);
        return;
      }

      const created = await accountApi.createTryOnJob({
        personMediaId,
        category,
        providerId,
        idempotencyKey: `ui-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
        ...garmentPayload,
      });
      setJob(created);
      if (created.status === 'succeeded') {
        setBusy(false);
        setStep('result');
        void refreshFittings();
        showStatus(created.demonstration
          ? 'Local development demonstration complete — not a real FASHN fitting.'
          : 'Virtual try-on complete. This is an AI visualisation, not a precise physical fit guarantee.');
        return;
      }
      watchJob(created.id);
    } catch (error) {
      setBusy(false);
      setStep('confirm');
      showStatus(tryOnFailureMessage(error, 'The try-on could not be started.'));
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
        setStep('confirm');
        showStatus('Try-on cancelled.');
      }
    } catch (error) {
      showStatus(error instanceof AccountApiError ? error.message : 'That job could not be cancelled.');
    }
  };

  const handleGrantExternalConsent = async () => {
    try {
      await accountApi.setPrivacyConsent({ purpose: 'external_photo_ai', granted: true, captureMethod: 'settings_toggle' });
      const next = await accountApi.tryOnAvailability();
      setAvailability(next);
      showStatus('External photograph AI consent is recorded.');
    } catch (error) {
      showStatus(error instanceof AccountApiError ? error.message : 'Consent could not be saved.');
    }
  };

  const handleDeleteFitting = async (id: string) => {
    try {
      await accountApi.deleteTryOnJob(id);
      if (job?.id === id) {
        setJob(null);
        setStep('fittings');
      }
      await refreshFittings();
      showStatus('Fitting removed from this account.');
    } catch (error) {
      showStatus(error instanceof AccountApiError ? error.message : 'That fitting could not be removed.');
    }
  };

  // Final “After” image MUST come from the job’s private result media — never garmentPreview / shop image.
  const hasCompletedResult = Boolean(job?.status === 'succeeded' && job.resultMediaId);
  const resultUrl = hasCompletedResult && job?.resultMediaId ? mediaDisplayUrl(job.resultMediaId) : undefined;
  const blockers = generationBlockers(availability, usesAccount);
  const generateLabel = generationMode === 'live'
    ? 'Generate Virtual Try-On'
    : generationMode === 'local_mock'
      ? 'Run Local Development Demo'
      : 'Virtual Try-On Unavailable';

  const goToStep = (next: Step) => {
    if (next === 'result' && !hasCompletedResult && job?.status !== 'failed') {
      showStatus('No generated try-on result yet. Confirm your selections and generate first.');
      setStep('confirm');
      return;
    }
    setStep(next);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 text-left" data-testid="tryon-page">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5C585E] hover:text-[#242326] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>
        <span className="text-xs font-semibold uppercase tracking-wider text-[#B49361]">
          Virtual Fitting Room · {generationMode === 'live' ? 'Live ready' : generationMode === 'local_mock' ? 'Local demo only' : 'Unavailable'}
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
              Select clothing, confirm your photograph, and generate a private virtual try-on when authorised.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-[11px]">
          {([
            ['garment', '1 · Clothing'],
            ['photo', '2 · Photograph'],
            ['confirm', '3 · Confirm'],
            ['result', '4 · Result'],
            ['fittings', 'My Fittings'],
          ] as const).map(([id, label]) => {
            const resultLocked = id === 'result' && !hasCompletedResult;
            return (
              <button
                key={id}
                type="button"
                onClick={() => goToStep(id)}
                disabled={resultLocked}
                title={resultLocked ? 'Available after a successful generation' : undefined}
                className={`px-3 py-1.5 rounded-full border transition-colors ${
                  resultLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                } ${
                  step === id || (step === 'progress' && id === 'confirm')
                    ? 'bg-[#9C6A61] text-white border-[#9C6A61]'
                    : 'bg-[#FAF7F2] text-[#5C585E] border-[#242326]/10 hover:text-[#242326]'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {statusMessage && (
          <div role="status" className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 leading-relaxed">
            {statusMessage}
          </div>
        )}

        {generationMode === 'unavailable' && (
          <div className="p-4 rounded-2xl bg-[#F6F2EC] border border-[#242326]/10 text-xs text-[#5C585E] space-y-2" data-testid="tryon-unavailable">
            <p className="font-semibold text-[#242326]">Live virtual try-on is currently unavailable</p>
            {blockers.length > 0 ? (
              <ul className="list-disc pl-4 space-y-1">
                {blockers.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            ) : (
              <p>{availability?.note || 'Your photographs have not been sent for AI processing.'}</p>
            )}
            {!availability?.externalPhotoAiConsent && usesAccount && (
              <Button type="button" variant="secondary" size="sm" onClick={() => void handleGrantExternalConsent()}>
                Grant external AI consent to continue
              </Button>
            )}
          </div>
        )}

        {generationMode === 'local_mock' && (
          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#B49361]/40 text-xs text-[#5C585E]">
            <span className="font-semibold text-[#9C6A61]">Local development demonstration mode.</span>{' '}
            This environment can run a labelled local demo that does not call FASHN and is not a real fitting.
          </div>
        )}

        {preloadedGarment && garmentMode === 'shop' && (
          <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF7F2] border border-[#B49361]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-16 h-20 rounded-xl overflow-hidden shrink-0 border border-[#242326]/10 bg-white">
                <ImageWithFallback src={preloadedGarment.imageUrl} alt={preloadedGarment.productName} className="w-full h-full object-cover" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#9C6A61] flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  {familyMemberName ? `Fitting for ${familyMemberName}` : 'Shop garment preselected'}
                </span>
                <h4 className="font-serif text-base font-semibold text-[#242326] mt-0.5">{preloadedGarment.productName}</h4>
                <p className="text-xs text-[#5C585E] mt-0.5">
                  Demonstration catalogue · {preloadedGarment.retailer}. Not a verified retailer offer.
                </p>
              </div>
            </div>
            {onClearGarment && (
              <button type="button" onClick={onClearGarment} className="p-1.5 rounded-full text-[#5C585E] hover:bg-white cursor-pointer" title="Remove garment">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {preloadedOutfit && !preloadedGarment && (
          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#9C6A61]/30 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-xl overflow-hidden border border-[#242326]/10">
                <ImageWithFallback src={preloadedOutfit.imageUrl} alt={preloadedOutfit.title} className="w-full h-full object-cover" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#9C6A61]">Outfit from Discover</span>
                <h4 className="font-serif text-base font-semibold text-[#242326]">{preloadedOutfit.title}</h4>
              </div>
            </div>
            {onClearOutfit && (
              <button type="button" onClick={onClearOutfit} className="p-1.5 rounded-full text-[#5C585E] cursor-pointer"><X className="w-4 h-4" /></button>
            )}
          </div>
        )}

        {(step === 'garment') && (
          <div className="space-y-4">
            <h2 className="font-serif text-lg font-semibold text-[#242326]">Select clothing</h2>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant={garmentMode === 'existing' ? 'primary' : 'secondary'} size="sm" onClick={() => setGarmentMode('existing')}>
                Wardrobe / saved
              </Button>
              <Button
                type="button"
                variant={garmentMode === 'shop' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => {
                  if (preloadedGarment) {
                    setGarmentMode('shop');
                    setGarmentPreview(preloadedGarment.imageUrl);
                    return;
                  }
                  onNavigate('shop');
                }}
              >
                Shop
              </Button>
              <Button type="button" variant={garmentMode === 'upload' ? 'primary' : 'secondary'} size="sm" icon={<Upload className="w-4 h-4" />} onClick={() => garmentInputRef.current?.click()}>
                Upload
              </Button>
              <input ref={garmentInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleGarmentFile} />
            </div>
            <p className="text-[11px] text-[#5C585E]">{shopNote}</p>
            {garmentMode === 'existing' && (
              accountGarments.length > 0 ? (
                <label className="text-xs text-[#5C585E] block">
                  Existing garment
                  <select
                    className="mt-1 block w-full rounded-xl border border-[#242326]/12 bg-white px-3 py-2 text-[#242326]"
                    value={selectedGarmentId}
                    onChange={(event) => handleSelectExisting(event.target.value)}
                  >
                    {accountGarments.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.source === 'wardrobe' ? 'Wardrobe' : 'Uploaded'} · {item.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <p className="text-xs text-[#5C585E]">No authorised wardrobe photographs yet. Open Shop or upload a garment image.</p>
              )
            )}
            <label className="text-xs text-[#5C585E] block max-w-xs">
              Garment category
              <select
                className="mt-1 block w-full rounded-xl border border-[#242326]/12 bg-white px-3 py-2 text-[#242326]"
                value={category}
                onChange={(event) => setCategory(event.target.value as TryOnCategory)}
              >
                {CATEGORIES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
            </label>
            {garmentPreview && (
              <div className="w-20 h-24 rounded-xl overflow-hidden border border-[#242326]/10">
                <img src={garmentPreview} alt="Selected garment" className="w-full h-full object-cover" />
              </div>
            )}
            <Button type="button" variant="primary" size="md" disabled={!garmentReady} onClick={() => setStep('photo')}>
              Continue to photograph
            </Button>
          </div>
        )}

        {step === 'photo' && (
          <div className="space-y-4">
            <h2 className="font-serif text-lg font-semibold text-[#242326]">My photograph</h2>
            {usesAccount && activePhoto && personMediaId ? (
              <>
                <div className="p-4 rounded-2xl border border-[#242326]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-20 rounded-xl overflow-hidden border border-[#242326]/10 bg-[#FAF7F2]">
                      <img src={activePhoto} alt="Customer" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-[#9C6A61]" />
                        <span className="text-xs font-semibold text-[#242326]">
                          {hasFullBody ? 'Full-body photograph ready' : 'Using saved account photograph'}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#5C585E]">
                        {hasFullBody
                          ? 'Defaulting to your privately stored full-body front image.'
                          : 'A full-body front photograph gives the best fittings. Portrait-only images are limited.'}
                      </p>
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
                <div className="flex flex-wrap gap-3">
                  <Button type="button" variant="secondary" size="md" onClick={() => setStep('garment')}>Back</Button>
                  <Button type="button" variant="primary" size="md" onClick={() => setStep('confirm')}>Continue to confirm</Button>
                  <Button type="button" variant="secondary" size="md" onClick={() => onNavigate('profile')}>Manage Photos</Button>
                </div>
              </>
            ) : (
              <div className="border-2 border-dashed border-[#242326]/15 rounded-3xl p-8 text-center bg-[#F6F2EC]/40">
                <h3 className="font-serif text-lg font-semibold text-[#242326]">Full-body photograph required</h3>
                <p className="text-xs sm:text-sm text-[#5C585E] max-w-md mx-auto mt-1.5 mb-6">
                  {usesAccount
                    ? 'Add a private full-body front photograph in My Profile → Manage Photos. It stays on this account until you grant separate external AI consent for live generation.'
                    : 'Sign in and save a private full-body photograph before using Virtual Try-On.'}
                </p>
                <Button type="button" variant="primary" size="md" onClick={() => onNavigate('profile')}>Open My Profile</Button>
              </div>
            )}
          </div>
        )}

        {step === 'confirm' && usesAccount && personMediaId && (
          <div className="space-y-4" data-testid="tryon-confirm">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#B49361]">Before generation</p>
              <h2 className="font-serif text-lg font-semibold text-[#242326] mt-1">Ready to generate virtual try-on</h2>
              <p className="text-xs text-[#5C585E] mt-1">
                These are your inputs only — not a finished try-on result.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3" data-testid="tryon-confirm-inputs">
              <div className="rounded-xl border border-dashed border-[#242326]/20 overflow-hidden bg-[#FAF7F2]">
                <div className="aspect-square max-h-40 bg-white">
                  {activePhoto && (
                    <img src={activePhoto} alt="Your selected photo" className="w-full h-full object-cover" data-testid="tryon-confirm-photo" />
                  )}
                </div>
                <p className="text-[11px] p-2 text-[#5C585E]">Your selected photo</p>
              </div>
              <div className="rounded-xl border border-dashed border-[#242326]/20 overflow-hidden bg-[#FAF7F2]">
                <div className="aspect-square max-h-40 bg-white">
                  {garmentPreview && (
                    <img src={garmentPreview} alt="Selected garment" className="w-full h-full object-cover" data-testid="tryon-confirm-garment" />
                  )}
                </div>
                <p className="text-[11px] p-2 text-[#5C585E]">Selected garment · {category}</p>
              </div>
            </div>

            {blockers.length > 0 && (
              <div
                className="p-4 rounded-2xl bg-[#FDF6F4] border border-[#9C6A61]/30 text-xs text-[#5C585E] space-y-2"
                data-testid="tryon-blockers"
                role="alert"
              >
                <p className="font-semibold text-[#242326]">Generation cannot run yet</p>
                <ul className="list-disc pl-4 space-y-1">
                  {blockers.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
                {!availability?.externalPhotoAiConsent && usesAccount && (
                  <Button type="button" variant="secondary" size="sm" onClick={() => void handleGrantExternalConsent()}>
                    Grant external AI consent to continue
                  </Button>
                )}
              </div>
            )}

            {blockers.length === 0 && (
              <div className="p-4 rounded-2xl bg-[#F6F2EC] border border-[#242326]/8 text-xs text-[#5C585E] space-y-2">
                <p>
                  Estimated customer credits:{' '}
                  <span className="font-semibold text-[#242326]">
                    {generationMode === 'live' ? (availability?.estimatedCustomerCredits ?? 1) : 0}
                  </span>
                  {typeof availability?.creditBalance === 'number' ? ` · Balance: ${availability.creditBalance}` : ''}
                </p>
                <p className="flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#9C6A61] shrink-0 mt-0.5" />
                  <span>Results are AI visualisations, not a guarantee of physical fit, colour accuracy, or stock availability.</span>
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="secondary" size="md" onClick={() => setStep('photo')} disabled={busy}>Back</Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                disabled={busy || !garmentReady || blockers.length > 0 || generationMode === 'unavailable'}
                onClick={() => void handleGenerate()}
                data-testid="tryon-generate"
              >
                {generateLabel}
              </Button>
            </div>
          </div>
        )}

        {step === 'progress' && (
          <div className="space-y-4" data-testid="tryon-progress" role="status">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#B49361]">Generating</p>
              <h2 className="font-serif text-lg font-semibold text-[#242326] mt-1">Virtual try-on in progress</h2>
              <p className="text-xs text-[#5C585E] mt-1">
                {job?.status === 'queued' || job?.status === 'running'
                  ? `Provider status: ${job.status}. Please wait — this is not a finished result yet.`
                  : 'Submitting your request…'}
              </p>
            </div>
            <div className="p-6 rounded-2xl border border-[#242326]/10 bg-[#FAF7F2] flex flex-col items-center gap-3 text-center">
              <RefreshCw className="w-8 h-8 text-[#9C6A61] animate-spin" aria-hidden />
              <p className="text-sm text-[#5C585E]">
                Do not treat the garment catalogue image as your result. The finished output will appear on the Result step.
              </p>
              {busy && job && (job.status === 'queued' || job.status === 'running') && (
                <Button type="button" variant="secondary" size="md" onClick={() => void handleCancel()}>Cancel</Button>
              )}
            </div>
          </div>
        )}

        {step === 'result' && job?.status === 'failed' && (
          <div className="space-y-4" data-testid="tryon-failed" role="alert">
            <h2 className="font-serif text-lg font-semibold text-[#242326]">Generation failed</h2>
            <p className="text-xs text-[#5C585E]">
              {job.errorMessage || 'The try-on could not be completed. No result image was saved.'}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="secondary" size="md" onClick={() => { setJob(null); setStep('confirm'); }}>
                Back to confirm
              </Button>
            </div>
          </div>
        )}

        {step === 'result' && hasCompletedResult && resultUrl && job && (
          <div className="space-y-4" data-testid="tryon-result">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#B49361]">
                  {job.demonstration ? 'Demonstration output — not a real virtual try-on' : 'Provider try-on result'}
                </p>
                <h2 className="font-serif text-lg font-semibold text-[#242326] mt-1">
                  {job.demonstration ? 'Development demonstration result' : 'Virtual try-on result'}
                </h2>
              </div>
              <span className="text-[11px] text-[#5C585E]">{job.label}</span>
            </div>
            {job.demonstration && (
              <p className="text-xs p-3 rounded-xl bg-[#F6F2EC] border border-[#242326]/8 text-[#5C585E]" data-testid="tryon-mock-banner">
                Demonstration output — not a real virtual try-on. The image below is a local mock, not a FASHN provider result.
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant={compare === 'both' ? 'primary' : 'secondary'} size="sm" icon={<Columns2 className="w-4 h-4" />} onClick={() => setCompare('both')}>
                Before / After
              </Button>
              <Button type="button" variant={compare === 'before' ? 'primary' : 'secondary'} size="sm" onClick={() => setCompare('before')}>Before</Button>
              <Button type="button" variant={compare === 'after' ? 'primary' : 'secondary'} size="sm" onClick={() => setCompare('after')}>After</Button>
            </div>
            <div className={`grid gap-3 ${compare === 'both' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
              {(compare === 'before' || compare === 'both') && activePhoto && (
                <div className="rounded-2xl border border-[#242326]/10 overflow-hidden bg-white" data-testid="tryon-before">
                  <img src={activePhoto} alt="Before — your original photo" className="w-full h-auto object-cover" />
                  <p className="text-[11px] p-2 text-[#5C585E]">Before · your original photo</p>
                </div>
              )}
              {(compare === 'after' || compare === 'both') && (
                <div className="rounded-2xl border border-[#B49361]/40 overflow-hidden bg-white" data-testid="tryon-after">
                  <img
                    src={resultUrl}
                    alt={job.demonstration ? 'Demonstration try-on output' : 'Provider try-on result'}
                    className="w-full h-auto object-cover"
                    data-testid="tryon-result-image"
                    data-result-media-id={job.resultMediaId}
                  />
                  <p className="text-[11px] p-2 text-[#5C585E]">
                    After · {job.demonstration ? 'Demonstration output — not a real virtual try-on' : 'Provider try-on result'}
                  </p>
                </div>
              )}
            </div>
            <p className="text-xs text-[#5C585E]">
              The After image is the stored try-on result media for this job — not the shop garment preview.
              It is saved privately on your account and is an AI visualisation, not a precise physical fit guarantee.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="secondary" size="md" onClick={() => setStep('fittings')}>View previous results</Button>
              <Button type="button" variant="secondary" size="md" icon={<Shirt className="w-4 h-4" />} onClick={() => { setJob(null); setStep('garment'); }}>
                Try another garment
              </Button>
              <Button type="button" variant="secondary" size="md" icon={<Trash2 className="w-4 h-4" />} onClick={() => void handleDeleteFitting(job.id)}>
                Delete result
              </Button>
            </div>
          </div>
        )}

        {step === 'result' && !hasCompletedResult && job?.status !== 'failed' && (
          <div className="space-y-3" data-testid="tryon-result-empty">
            <h2 className="font-serif text-lg font-semibold text-[#242326]">No result yet</h2>
            <p className="text-xs text-[#5C585E]">
              Generate a virtual try-on from the Confirm step. The garment preview is never shown as a finished result.
            </p>
            <Button type="button" variant="primary" size="md" onClick={() => setStep('confirm')}>Go to confirm</Button>
          </div>
        )}

        {step === 'fittings' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-serif text-lg font-semibold text-[#242326]">My Virtual Fittings</h2>
              <Button type="button" variant="secondary" size="sm" icon={<RefreshCw className="w-4 h-4" />} onClick={() => void refreshFittings()}>
                Refresh
              </Button>
            </div>
            {fittings.length === 0 ? (
              <p className="text-xs text-[#5C585E]">No saved fittings yet. Generate a try-on to see results here.</p>
            ) : (
              <ul className="space-y-3">
                {fittings.map((item) => {
                  const thumb = item.resultMediaId ? mediaDisplayUrl(item.resultMediaId) : undefined;
                  return (
                    <li key={item.id} className="p-3 rounded-2xl border border-[#242326]/10 flex gap-3 items-center">
                      {thumb && (
                        <button
                          type="button"
                          className="w-14 h-[4.5rem] rounded-xl overflow-hidden border border-[#242326]/10 shrink-0 cursor-pointer"
                          onClick={() => { setJob(item); setStep('result'); setCompare('both'); }}
                        >
                          <img src={thumb} alt="" className="w-full h-full object-cover" />
                        </button>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-[#242326] truncate">
                          {item.demonstration ? 'Local demo' : 'Provider result'} · {item.category}
                        </p>
                        <p className="text-[11px] text-[#5C585E]">
                          {new Date(item.finishedAt || item.createdAt).toLocaleString()} · {item.label}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="p-2 rounded-full text-[#5C585E] hover:bg-[#F6F2EC] cursor-pointer"
                        title="Delete fitting"
                        onClick={() => void handleDeleteFitting(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
