/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { STYLE_CATEGORIES } from '../../data/mockData';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { Button } from '../common/Button';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';

interface Step4PersonalStyleProps {
  initialStyles: string[];
  onContinue: (styles: string[]) => void;
  onBack: () => void;
  onSkip: () => void;
}

export const Step4PersonalStyle: React.FC<Step4PersonalStyleProps> = ({
  initialStyles,
  onContinue,
  onBack,
  onSkip,
}) => {
  const [selectedStyles, setSelectedStyles] = useState<string[]>(initialStyles || []);

  const toggleStyle = (title: string) => {
    setSelectedStyles((prev) =>
      prev.includes(title) ? prev.filter((s) => s !== title) : [...prev, title]
    );
  };

  const handleNext = () => {
    onContinue(selectedStyles);
  };

  return (
    <div className="max-w-2xl mx-auto py-2 sm:py-6 animate-fadeIn">
      <div className="rounded-3xl bg-white border border-[#242326]/10 shadow-sm p-6 sm:p-10">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider uppercase text-[#B49361] block mb-1">
              Step 3 of 6 · Personal Style
            </span>
            <span className="text-xs text-[#5C585E]">
              {selectedStyles.length} selected
            </span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#242326]">
            Discover Your Personal Style
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-[#5C585E]">
            Select the aesthetics that resonate with you most. You can pick multiple styles or skip.
          </p>
        </div>

        {/* 8 Style Image Cards Grid (2 cols mobile, 4 cols tablet/desktop) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
          {STYLE_CATEGORIES.map((cat) => {
            const isSelected = selectedStyles.includes(cat.title);

            return (
              <button
                type="button"
                key={cat.id}
                onClick={() => toggleStyle(cat.title)}
                className={`group relative rounded-2xl overflow-hidden border text-left cursor-pointer transition-all duration-200 focus-visible:outline-none ${
                  isSelected
                    ? 'border-[#9C6A61] ring-2 ring-[#9C6A61]/30 shadow-md scale-[1.01]'
                    : 'border-[#242326]/10 hover:border-[#242326]/30 shadow-xs'
                }`}
              >
                {/* Image Container (3:4 aspect ratio) */}
                <div className="relative aspect-[3/4] w-full bg-[#E5CDBE]/20 overflow-hidden">
                  <ImageWithFallback
                    src={cat.imageUrl}
                    alt={cat.title}
                    fallbackTitle={cat.title}
                    className="w-full h-full"
                    imageClassName="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#242326]/80 via-transparent to-transparent" />

                  {/* Tasteful selection indicator badge */}
                  {isSelected && (
                    <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-[#9C6A61] text-white flex items-center justify-center shadow-xs">
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    </div>
                  )}

                  {/* Title */}
                  <div className="absolute bottom-0 left-0 right-0 p-2.5 sm:p-3 text-white">
                    <h3 className="font-serif text-xs sm:text-sm font-semibold leading-tight">
                      {cat.title}
                    </h3>
                  </div>
                </div>
              </button>
            );
          })}
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
              onClick={handleNext}
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
