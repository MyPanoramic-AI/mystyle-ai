/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { onboardingStepLabel } from './onboardingSteps';
import { ClothingSizes, ShoePreferences } from '../../types';
import { SIZE_OPTIONS } from '../../data/mockData';
import { DEFAULT_SHOE_PREFERENCES } from '../../data/shoePreferences';
import { ShoePreferencesFields } from '../common/ShoePreferencesFields';
import { Button } from '../common/Button';
import { ArrowLeft, ArrowRight, Info } from 'lucide-react';

interface Step3ClothingSizesProps {
  initialData: ClothingSizes;
  initialShoePreferences?: ShoePreferences;
  onContinue: (data: ClothingSizes, shoePreferences: ShoePreferences) => void;
  onBack: () => void;
  onSkip: () => void;
}

export const Step3ClothingSizes: React.FC<Step3ClothingSizesProps> = ({
  initialData,
  initialShoePreferences,
  onContinue,
  onBack,
  onSkip,
}) => {
  const [topsSize, setTopsSize] = useState(initialData.topsSize || 'M (SA 34)');
  const [bottomsSize, setBottomsSize] = useState(initialData.bottomsSize || '32 (SA 34)');
  const [dressSize, setDressSize] = useState(initialData.dressSize || 'SA 34 / UK 10');
  const [shoeSize, setShoeSize] = useState(initialData.shoeSize || 'SA / UK 5');
  const [bustCm, setBustCm] = useState(initialData.bustCm || '');
  const [waistCm, setWaistCm] = useState(initialData.waistCm || '');
  const [hipCm, setHipCm] = useState(initialData.hipCm || '');
  const [shoePreferences, setShoePreferences] = useState<ShoePreferences>(
    initialShoePreferences ?? { ...DEFAULT_SHOE_PREFERENCES },
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onContinue(
      {
        topsSize,
        bottomsSize,
        dressSize,
        shoeSize,
        bustCm,
        waistCm,
        hipCm,
      },
      shoePreferences,
    );
  };

  return (
    <div className="max-w-xl mx-auto py-2 sm:py-6 animate-fadeIn">
      <div className="rounded-3xl bg-white border border-[#242326]/10 shadow-sm p-6 sm:p-10">
        {/* Header */}
        <div className="mb-6">
          <span className="text-xs font-semibold tracking-wider uppercase text-[#B49361] block mb-1">
            {onboardingStepLabel(3)}
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#242326]">
            Your Clothing Sizes
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-[#5C585E]">
            South African sizing standards help us recommend garments that feel comfortable.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Tops Size */}
          <div>
            <label className="block text-xs font-semibold text-[#242326] uppercase tracking-wider mb-2">
              Usual Tops Size
            </label>
            <div className="flex flex-wrap gap-2">
              {SIZE_OPTIONS.tops.map((size) => (
                <button
                  type="button"
                  key={size}
                  onClick={() => setTopsSize(size)}
                  className={`py-2 px-3 text-xs font-medium rounded-xl border transition-all cursor-pointer ${
                    topsSize === size
                      ? 'bg-[#242326] text-white border-[#242326] shadow-xs'
                      : 'bg-[#F6F2EC]/50 text-[#5C585E] border-[#242326]/10 hover:border-[#242326]/30'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Bottoms Size */}
          <div>
            <label className="block text-xs font-semibold text-[#242326] uppercase tracking-wider mb-2">
              Usual Bottoms / Trousers Size
            </label>
            <div className="flex flex-wrap gap-2">
              {SIZE_OPTIONS.bottoms.map((size) => (
                <button
                  type="button"
                  key={size}
                  onClick={() => setBottomsSize(size)}
                  className={`py-2 px-3 text-xs font-medium rounded-xl border transition-all cursor-pointer ${
                    bottomsSize === size
                      ? 'bg-[#242326] text-white border-[#242326] shadow-xs'
                      : 'bg-[#F6F2EC]/50 text-[#5C585E] border-[#242326]/10 hover:border-[#242326]/30'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Dress & Shoe Size in Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#242326] uppercase tracking-wider mb-1.5">
                Usual Dress Size
              </label>
              <select
                value={dressSize}
                onChange={(e) => setDressSize(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F6F2EC]/60 border border-[#242326]/15 text-xs sm:text-sm text-[#242326] focus:outline-none focus:ring-2 focus:ring-[#9C6A61] focus:bg-white transition-all cursor-pointer"
              >
                {SIZE_OPTIONS.dresses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#242326] uppercase tracking-wider mb-1.5">
                Shoe Size (SA / UK)
              </label>
              <select
                value={shoeSize}
                onChange={(e) => setShoeSize(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F6F2EC]/60 border border-[#242326]/15 text-xs sm:text-sm text-[#242326] focus:outline-none focus:ring-2 focus:ring-[#9C6A61] focus:bg-white transition-all cursor-pointer"
              >
                {SIZE_OPTIONS.shoes.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Optional Body Measurements Accordion / Fields */}
          <div className="pt-2">
            <span className="block text-xs font-semibold text-[#242326] uppercase tracking-wider mb-1.5">
              Optional Measurements (Centimetres)
            </span>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <span className="text-[11px] text-[#5C585E] block mb-1">Bust</span>
                <input
                  type="number"
                  placeholder="e.g. 90"
                  value={bustCm}
                  onChange={(e) => setBustCm(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F6F2EC]/60 border border-[#242326]/15 text-xs text-[#242326] focus:outline-none focus:ring-2 focus:ring-[#9C6A61] focus:bg-white transition-all"
                />
              </div>
              <div>
                <span className="text-[11px] text-[#5C585E] block mb-1">Waist</span>
                <input
                  type="number"
                  placeholder="e.g. 72"
                  value={waistCm}
                  onChange={(e) => setWaistCm(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F6F2EC]/60 border border-[#242326]/15 text-xs text-[#242326] focus:outline-none focus:ring-2 focus:ring-[#9C6A61] focus:bg-white transition-all"
                />
              </div>
              <div>
                <span className="text-[11px] text-[#5C585E] block mb-1">Hips</span>
                <input
                  type="number"
                  placeholder="e.g. 98"
                  value={hipCm}
                  onChange={(e) => setHipCm(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F6F2EC]/60 border border-[#242326]/15 text-xs text-[#242326] focus:outline-none focus:ring-2 focus:ring-[#9C6A61] focus:bg-white transition-all"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-[#242326]/8">
            <span className="block text-xs font-semibold text-[#242326] uppercase tracking-wider mb-1">
              Shoe preferences
            </span>
            <p className="text-[11px] text-[#5C585E] mb-3 leading-relaxed">
              Tell us what you can comfortably wear so recommendations stay realistic — for example no high heels, or heels only for special occasions.
            </p>
            <ShoePreferencesFields value={shoePreferences} onChange={setShoePreferences} />
          </div>

          {/* Disclaimer note */}
          <div className="p-3.5 rounded-2xl bg-[#F6F2EC] border border-[#242326]/8 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-[#B49361] shrink-0 mt-0.5" />
            <p className="text-[11px] text-[#5C585E] leading-relaxed">
              Sizes vary between brands. We'll use these as a starting point.
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
                type="submit"
                variant="primary"
                size="md"
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Continue
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
