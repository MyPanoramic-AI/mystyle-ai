/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { onboardingStepLabel } from './onboardingSteps';
import { ColourPreferences, FitPreference, ExperimentationLevel } from '../../types';
import { SWATCH_COLORS, AVOID_COLORS_LIST } from '../../data/mockData';
import { Button } from '../common/Button';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';

interface Step5ColoursPreferencesProps {
  initialData: ColourPreferences;
  onContinue: (data: ColourPreferences) => void;
  onBack: () => void;
  onSkip: () => void;
}

const FIT_OPTIONS: { id: FitPreference; label: string; desc: string }[] = [
  { id: 'relaxed', label: 'Relaxed', desc: 'Breezy silhouettes with easy room to move' },
  { id: 'regular', label: 'Regular', desc: 'Classic tailored proportions, neither tight nor baggy' },
  { id: 'fitted', label: 'Fitted', desc: 'Body-skimming cuts that emphasize shape' },
  { id: 'no-preference', label: 'No Preference', desc: 'Open to varied cuts depending on occasion' },
];

const EXPERIMENTATION_OPTIONS: { id: ExperimentationLevel; label: string; desc: string }[] = [
  { id: 'classic', label: 'Classic', desc: 'Timeless, dependable staples and neutrals' },
  { id: 'balanced', label: 'Balanced', desc: 'Solid staples paired with subtle contemporary accents' },
  { id: 'adventurous', label: 'Adventurous', desc: 'Bold runway trends, playful cuts and statement pieces' },
  { id: 'no-preference', label: 'No Preference', desc: 'Surprise me with smart ideas' },
];

export const Step5ColoursPreferences: React.FC<Step5ColoursPreferencesProps> = ({
  initialData,
  onContinue,
  onBack,
  onSkip,
}) => {
  const [favoriteColors, setFavoriteColors] = useState<string[]>(initialData.favoriteColors || []);
  const [avoidColors, setAvoidColors] = useState<string[]>(initialData.avoidColors || []);
  const [fitPreference, setFitPreference] = useState<FitPreference>(initialData.fitPreference || 'regular');
  const [experimentation, setExperimentation] = useState<ExperimentationLevel>(initialData.experimentation || 'balanced');

  const toggleFavoriteColor = (colorName: string) => {
    setFavoriteColors((prev) =>
      prev.includes(colorName) ? prev.filter((c) => c !== colorName) : [...prev, colorName]
    );
  };

  const toggleAvoidColor = (colorName: string) => {
    if (colorName === 'None') {
      setAvoidColors([]);
      return;
    }
    setAvoidColors((prev) =>
      prev.includes(colorName) ? prev.filter((c) => c !== colorName) : [...prev.filter((c) => c !== 'None'), colorName]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onContinue({
      favoriteColors,
      avoidColors,
      fitPreference,
      experimentation,
    });
  };

  return (
    <div className="max-w-xl mx-auto py-2 sm:py-6 animate-fadeIn">
      <div className="rounded-3xl bg-white border border-[#242326]/10 shadow-sm p-6 sm:p-10">
        {/* Header */}
        <div className="mb-6">
          <span className="text-xs font-semibold tracking-wider uppercase text-[#B49361] block mb-1">
            {onboardingStepLabel(5)}
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#242326]">
            Colours & Preferences
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-[#5C585E]">
            Tell us which shades make you feel confident, and how you prefer your garments to drape.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Favourite Colours Swatches */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-[#242326] uppercase tracking-wider">
                Favourite Clothing Colours
              </label>
              <span className="text-[11px] text-[#5C585E]">Select all that you love</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SWATCH_COLORS.map((swatch) => {
                const isSelected = favoriteColors.includes(swatch.name);
                return (
                  <button
                    type="button"
                    key={swatch.name}
                    onClick={() => toggleFavoriteColor(swatch.name)}
                    className={`flex items-center gap-2.5 p-2 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#9C6A61] bg-[#E5CDBE]/20 text-[#242326] shadow-2xs'
                        : 'border-[#242326]/10 bg-[#F6F2EC]/40 text-[#5C585E] hover:border-[#242326]/25'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full shrink-0 flex items-center justify-center ${
                        swatch.border ? 'border border-[#242326]/20' : ''
                      }`}
                      style={{ backgroundColor: swatch.hex }}
                    >
                      {isSelected && (
                        <Check className={`w-3 h-3 ${swatch.hex === '#FFFFFF' || swatch.hex === '#F6F2EC' ? 'text-[#242326]' : 'text-white'}`} />
                      )}
                    </span>
                    <span className="text-xs font-medium truncate">{swatch.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Colours to Avoid */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-[#242326] uppercase tracking-wider">
                Colours to Avoid
              </label>
              <span className="text-[11px] text-[#5C585E]">Optional</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {AVOID_COLORS_LIST.map((color) => {
                const isSelected = color === 'None' ? avoidColors.length === 0 : avoidColors.includes(color);
                return (
                  <button
                    type="button"
                    key={color}
                    onClick={() => toggleAvoidColor(color)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#242326] text-white border-[#242326]'
                        : 'bg-[#F6F2EC]/60 text-[#5C585E] border-[#242326]/10 hover:border-[#242326]/25'
                    }`}
                  >
                    {color}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preferred Fit */}
          <div>
            <label className="block text-xs font-semibold text-[#242326] uppercase tracking-wider mb-2">
              Preferred Clothing Fit
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {FIT_OPTIONS.map((opt) => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setFitPreference(opt.id)}
                  className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                    fitPreference === opt.id
                      ? 'border-[#9C6A61] bg-[#E5CDBE]/15 text-[#242326]'
                      : 'border-[#242326]/10 bg-white text-[#5C585E] hover:border-[#242326]/20'
                  }`}
                >
                  <span className="text-xs font-semibold text-[#242326] block">{opt.label}</span>
                  <span className="text-[11px] text-[#5C585E] leading-tight block mt-0.5">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Fashion Experimentation */}
          <div>
            <label className="block text-xs font-semibold text-[#242326] uppercase tracking-wider mb-2">
              Style Experimentation
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {EXPERIMENTATION_OPTIONS.map((opt) => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setExperimentation(opt.id)}
                  className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                    experimentation === opt.id
                      ? 'border-[#9C6A61] bg-[#E5CDBE]/15 text-[#242326]'
                      : 'border-[#242326]/10 bg-white text-[#5C585E] hover:border-[#242326]/20'
                  }`}
                >
                  <span className="text-xs font-semibold text-[#242326] block">{opt.label}</span>
                  <span className="text-[11px] text-[#5C585E] leading-tight block mt-0.5">{opt.desc}</span>
                </button>
              ))}
            </div>
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
