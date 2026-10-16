/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BEAUTY_INSPIRATIONS } from '../../data/mockData';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Sparkles, ArrowRight, Eye, Heart } from 'lucide-react';

interface BeautySectionProps {
  onAskBeautyAdvice: (category: string) => void;
  onOpenBeautyStudio?: () => void;
}

export const BeautySection: React.FC<BeautySectionProps> = ({
  onAskBeautyAdvice,
  onOpenBeautyStudio,
}) => {
  const [selectedBeauty, setSelectedBeauty] = useState<typeof BEAUTY_INSPIRATIONS[0] | null>(null);

  return (
    <section className="mb-10 sm:mb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-4">
        <div>
          <span className="text-xs font-semibold tracking-wider uppercase text-[#B49361] block mb-1">
            Complete The Look
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-[#242326]">
            Beyond the Outfit
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <p className="hidden md:block text-xs text-[#5C585E]">
            Hairstyle, makeup & beauty harmonies tailored to your look
          </p>
          {onOpenBeautyStudio && (
            <button
              onClick={onOpenBeautyStudio}
              className="px-3.5 py-1.5 text-xs font-semibold text-[#9C6A61] bg-[#FAF7F2] hover:bg-[#E5CDBE]/40 border border-[#9C6A61]/20 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#B49361]" />
              <span>Open AI Beauty Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 3 Beauty Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {BEAUTY_INSPIRATIONS.map((item) => (
          <div
            key={item.id}
            onClick={() => setSelectedBeauty(item)}
            className="group relative rounded-3xl overflow-hidden bg-white border border-[#242326]/10 shadow-xs hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col justify-between"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') setSelectedBeauty(item);
            }}
          >
            {/* Image Showcase (4:3 aspect ratio) */}
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#E5CDBE]/20">
              <ImageWithFallback
                src={item.imageUrl}
                alt={item.title}
                fallbackTitle={item.title}
                className="w-full h-full"
                imageClassName="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#242326]/80 via-[#242326]/20 to-transparent" />

              {/* Tagline pill */}
              <div className="absolute bottom-3 left-3 right-3 text-white">
                <span className="text-[10px] font-semibold tracking-wider uppercase text-[#E5CDBE] block mb-0.5">
                  Beauty Studio
                </span>
                <h3 className="font-serif text-base font-semibold leading-tight">
                  {item.title}
                </h3>
              </div>

              {/* Hover inspect pill */}
              <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/85 backdrop-blur-md flex items-center justify-center text-[#242326] opacity-0 group-hover:opacity-100 transition-opacity shadow-xs">
                <Eye className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Description */}
            <div className="p-4 sm:p-5 flex flex-col justify-between flex-1">
              <div>
                <p className="text-xs text-[#5C585E] leading-relaxed mb-2">
                  {item.subtitle}
                </p>
                <span className="text-[11px] font-medium text-[#B49361] block">
                  {item.tagline}
                </span>
              </div>

              <div className="mt-4 pt-3 border-t border-[#242326]/6 flex items-center justify-between text-xs font-semibold text-[#9C6A61]">
                <span>Explore Beauty Pairings</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Beauty Details Modal */}
      {selectedBeauty && (
        <Modal
          isOpen={!!selectedBeauty}
          onClose={() => setSelectedBeauty(null)}
          title={`Beauty Studio · ${selectedBeauty.title}`}
          subtitle={selectedBeauty.tagline}
        >
          <div className="space-y-4">
            <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-[#E5CDBE]/20 border border-[#242326]/10">
              <ImageWithFallback
                src={selectedBeauty.imageUrl}
                alt={selectedBeauty.title}
                fallbackTitle={selectedBeauty.title}
                className="w-full h-full"
                imageClassName="object-cover"
              />
            </div>

            <div className="p-4 rounded-xl bg-white border border-[#242326]/8 shadow-2xs">
              <div className="flex items-center gap-2 mb-1.5 text-xs font-semibold text-[#9C6A61]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Beauty Engine Guidance</span>
              </div>
              <p className="text-xs sm:text-sm text-[#242326] leading-relaxed italic font-serif">
                "{selectedBeauty.subtitle}. Our personal stylist coordinates hairstyle textures and lip pigments with your garment neckline and seasonal palette."
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F6F2EC] border border-[#242326]/8 text-xs text-[#5C585E]">
              Full interactive beauty palette mixing, nail swatch mapping, and salon referral tools are coming in Phase 3.
            </div>

            <div className="pt-2 border-t border-[#242326]/8 flex justify-end gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedBeauty(null)}
              >
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  const it = selectedBeauty;
                  setSelectedBeauty(null);
                  onAskBeautyAdvice(it.title);
                }}
                icon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                Ask Stylist About {selectedBeauty.title}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
};
