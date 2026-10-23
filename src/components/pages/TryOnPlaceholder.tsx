/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
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
  const accountPhoto = photos?.fullBodyFrontUrl || photos?.profilePhotoUrl || photos?.fullBodyAdditionalUrl;
  const [activePhoto, setActivePhoto] = useState<string | undefined>(accountPhoto);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    setActivePhoto(accountPhoto);
  }, [accountPhoto]);

  const showStatus = (message: string) => {
    setStatusMessage(message);
  };

  const hasAccountMediaIds = Boolean(
    photos?.portraitMediaId || photos?.fullBodyFrontMediaId || photos?.fullBodyAdditionalMediaId,
  );

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
          Virtual Fitting Room · Studio Prototype
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
              This is a preview of the fitting room. Real try-on generation is not active, and this page does not create a photograph of you.
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
              <span className="text-xs px-3 py-1 rounded-full bg-[#FAF7F2] text-[#242326] font-semibold border border-[#242326]/10">
                Generation is not active
              </span>
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

        {activePhoto ? (
          <div className="p-4 rounded-2xl bg-white border border-[#242326]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden border border-[#242326]/10 bg-[#FAF7F2]">
                <img
                  src={activePhoto}
                  alt="Customer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#9C6A61]" />
                  <span className="text-xs font-semibold text-[#242326]">
                    Fitting photograph ready
                  </span>
                </div>
                <p className="text-[11px] text-[#5C585E]">
                  {hasAccountMediaIds
                    ? 'Using a private photograph from your account'
                    : 'Preview photograph for this session only'}
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() =>
                showStatus(
                  'Simulate Fit acknowledged. Real virtual try-on generation is not active yet, so no new image was created and nothing was sent to FASHN or any external AI. Your account photograph was not changed.',
                )
              }
            >
              Simulate Fit
            </Button>
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
                : 'Real virtual try-on generation is not active. Add private styling photographs from My Profile → Manage Photos, or use the controls below for a local preview only.'}
            </p>

            <div className="flex flex-wrap gap-3 justify-center">
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={() => onNavigate('profile')}
              >
                Open My Profile
              </Button>
              {!usesAccount && (
                <>
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    icon={<Camera className="w-4 h-4" />}
                    onClick={() =>
                      showStatus(
                        'Camera capture is not active in this preview. Use My Profile → Manage Photos to save a private photograph to your account, or wait until live try-on is approved.',
                      )
                    }
                  >
                    Take Photo
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    icon={<Upload className="w-4 h-4" />}
                    onClick={() =>
                      showStatus(
                        'Gallery selection is not active in this preview. Use My Profile → Manage Photos to upload a private photograph to your account.',
                      )
                    }
                  >
                    Choose from Gallery
                  </Button>
                </>
              )}
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
