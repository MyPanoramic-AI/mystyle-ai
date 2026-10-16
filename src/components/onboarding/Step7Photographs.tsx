/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import { TemporaryPhotos } from '../../types';
import { Button } from '../common/Button';
import {
  Camera,
  Upload,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  X,
  HelpCircle,
} from 'lucide-react';

interface Step7PhotographsProps {
  photos: TemporaryPhotos;
  onUpdatePhotos: (photos: TemporaryPhotos) => void;
  onContinue: () => void;
  onBack: () => void;
  onSkip: () => void;
}

export const Step7Photographs: React.FC<Step7PhotographsProps> = ({
  photos,
  onUpdatePhotos,
  onContinue,
  onBack,
  onSkip,
}) => {
  const profileInputRef = useRef<HTMLInputElement>(null);
  const frontInputRef = useRef<HTMLInputElement>(null);
  const additionalInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (key: keyof TemporaryPhotos, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Create local object URL for browser memory preview only
      const objectUrl = URL.createObjectURL(file);
      onUpdatePhotos({
        ...photos,
        [key]: objectUrl,
      });
    }
  };

  const handleRemovePhoto = (key: keyof TemporaryPhotos) => {
    if (photos[key]) {
      URL.revokeObjectURL(photos[key]!);
    }
    const updated = { ...photos };
    delete updated[key];
    onUpdatePhotos(updated);
  };

  return (
    <div className="max-w-xl mx-auto py-2 sm:py-6 animate-fadeIn">
      <div className="rounded-3xl bg-white border border-[#242326]/10 shadow-sm p-6 sm:p-10">
        {/* Header */}
        <div className="mb-6">
          <span className="text-xs font-semibold tracking-wider uppercase text-[#B49361] block mb-1">
            Step 6 of 6 · Styling Photographs
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#242326]">
            Upload Your Fitting Photos
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-[#5C585E]">
            Optional photos for personalized silhouette recommendations and virtual fitting previews.
          </p>
        </div>

        {/* Guidance Tips */}
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

        {/* Three Photo Upload Cards */}
        <div className="space-y-4 mb-6">
          {/* 1. Profile Photo */}
          <div className="flex items-center justify-between p-4 rounded-2xl border border-[#242326]/10 bg-white">
            <div className="flex items-center gap-3.5">
              <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-[#E5CDBE]/30 flex items-center justify-center shrink-0 border border-[#242326]/10">
                {photos.profilePhotoUrl ? (
                  <img
                    src={photos.profilePhotoUrl}
                    alt="Profile preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Camera className="w-6 h-6 text-[#9C6A61]" />
                )}
              </div>
              <div>
                <span className="text-xs font-semibold text-[#242326] block">
                  1. Profile Portrait
                </span>
                <span className="text-[11px] text-[#5C585E]">
                  {photos.profilePhotoUrl ? 'Photo selected (Local memory)' : 'Head and shoulders portrait'}
                </span>
              </div>
            </div>

            <div>
              <input
                ref={profileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileChange('profilePhotoUrl', e)}
              />
              {photos.profilePhotoUrl ? (
                <button
                  type="button"
                  onClick={() => handleRemovePhoto('profilePhotoUrl')}
                  className="p-2 text-[#5C585E] hover:text-red-600 transition-colors cursor-pointer"
                  title="Remove"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => profileInputRef.current?.click()}
                  icon={<Upload className="w-3.5 h-3.5" />}
                >
                  Choose
                </Button>
              )}
            </div>
          </div>

          {/* 2. Full-Body Front Photograph */}
          <div className="flex items-center justify-between p-4 rounded-2xl border border-[#242326]/10 bg-white">
            <div className="flex items-center gap-3.5">
              <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-[#E5CDBE]/30 flex items-center justify-center shrink-0 border border-[#242326]/10">
                {photos.fullBodyFrontUrl ? (
                  <img
                    src={photos.fullBodyFrontUrl}
                    alt="Full-body front preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Camera className="w-6 h-6 text-[#9C6A61]" />
                )}
              </div>
              <div>
                <span className="text-xs font-semibold text-[#242326] block">
                  2. Full-Body Front Pose
                </span>
                <span className="text-[11px] text-[#5C585E]">
                  {photos.fullBodyFrontUrl ? 'Photo selected (Local memory)' : 'Full length, arms slightly out'}
                </span>
              </div>
            </div>

            <div>
              <input
                ref={frontInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileChange('fullBodyFrontUrl', e)}
              />
              {photos.fullBodyFrontUrl ? (
                <button
                  type="button"
                  onClick={() => handleRemovePhoto('fullBodyFrontUrl')}
                  className="p-2 text-[#5C585E] hover:text-red-600 transition-colors cursor-pointer"
                  title="Remove"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => frontInputRef.current?.click()}
                  icon={<Upload className="w-3.5 h-3.5" />}
                >
                  Choose
                </Button>
              )}
            </div>
          </div>

          {/* 3. Optional Additional Full-Body Photograph */}
          <div className="flex items-center justify-between p-4 rounded-2xl border border-[#242326]/10 bg-white">
            <div className="flex items-center gap-3.5">
              <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-[#E5CDBE]/30 flex items-center justify-center shrink-0 border border-[#242326]/10">
                {photos.fullBodyAdditionalUrl ? (
                  <img
                    src={photos.fullBodyAdditionalUrl}
                    alt="Additional angle preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Camera className="w-6 h-6 text-[#9C6A61]" />
                )}
              </div>
              <div>
                <span className="text-xs font-semibold text-[#242326] block">
                  3. Side or 45° Angle (Optional)
                </span>
                <span className="text-[11px] text-[#5C585E]">
                  {photos.fullBodyAdditionalUrl ? 'Photo selected (Local memory)' : 'For drape & outerwear depth'}
                </span>
              </div>
            </div>

            <div>
              <input
                ref={additionalInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileChange('fullBodyAdditionalUrl', e)}
              />
              {photos.fullBodyAdditionalUrl ? (
                <button
                  type="button"
                  onClick={() => handleRemovePhoto('fullBodyAdditionalUrl')}
                  className="p-2 text-[#5C585E] hover:text-red-600 transition-colors cursor-pointer"
                  title="Remove"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => additionalInputRef.current?.click()}
                  icon={<Upload className="w-3.5 h-3.5" />}
                >
                  Choose
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Privacy Note */}
        <div className="p-3.5 rounded-2xl bg-[#E5CDBE]/20 border border-[#242326]/8 mb-6 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-[#9C6A61] shrink-0 mt-0.5" />
          <p className="text-[11px] text-[#242326] leading-relaxed">
            <strong>Privacy Guarantee:</strong> Photos selected here stay strictly in temporary browser memory. They are not uploaded to servers, cloud storage or localStorage. Neural virtual try-on will be integrated in Phase 2 with full biometric consent.
          </p>
        </div>

        {/* Action Controls */}
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
