/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { STYLE_INSPIRATIONS } from '../../data/mockData';
import { StyleInspiration } from '../../types';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Sparkles, ArrowRight, Eye } from 'lucide-react';

interface InspirationGalleryProps {
  onStyleSimilar: (inspiration: StyleInspiration) => void;
}

export const InspirationGallery: React.FC<InspirationGalleryProps> = ({ onStyleSimilar }) => {
  const [activeInspiration, setActiveInspiration] = useState<StyleInspiration | null>(null);

  const handleOpen = (item: StyleInspiration) => {
    setActiveInspiration(item);
  };

  const handleStyleSimilarClick = () => {
    if (activeInspiration) {
      const item = activeInspiration;
      setActiveInspiration(null);
      onStyleSimilar(item);
    }
  };

  return (
    <section className="mb-10 sm:mb-12">
      {/* Section Header */}
      <div className="flex items-end justify-between mb-4">
        <div>
          <span className="text-xs font-semibold tracking-wider uppercase text-[#91635a] block mb-1">
            Weekly Lookbook
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-[#242326]">
            Style Inspiration
          </h2>
        </div>
        <p className="hidden sm:block text-xs text-[#5C585E]">
          Tap any look to view color harmony & key pieces
        </p>
      </div>

      {/* Visual Inspiration Grid (2-column mobile, 4-column desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {STYLE_INSPIRATIONS.map((item) => (
          <div
            key={item.id}
            onClick={() => handleOpen(item)}
            className="group relative rounded-2xl overflow-hidden bg-white border border-[#242326]/10 cursor-pointer shadow-xs hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') handleOpen(item);
            }}
          >
            {/* Image Container (4:5 vertical proportion) */}
            <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#E5CDBE]/20">
              <ImageWithFallback
                src={item.imageUrl}
                alt={item.title}
                fallbackTitle={item.title}
                className="w-full h-full"
                imageClassName="object-cover transition-transform duration-500 group-hover:scale-105"
              />

              {/* Scrim */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#242326]/85 via-transparent to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

              {/* Quick inspect hover pill */}
              <div className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/85 backdrop-blur-md flex items-center justify-center text-[#242326] opacity-0 group-hover:opacity-100 transition-opacity shadow-xs">
                <Eye className="w-3.5 h-3.5" />
              </div>

              {/* Unboxed Metadata & Title */}
              <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 text-white">
                <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-[#E5CDBE] font-medium mb-1">
                  <span>{item.aesthetic}</span>
                  <span aria-hidden="true">·</span>
                  <span className="truncate">{item.occasion}</span>
                </div>
                <h3 className="font-serif text-sm sm:text-base font-semibold leading-tight line-clamp-1">
                  {item.title}
                </h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Outfit Inspection Modal */}
      {activeInspiration && (
        <Modal
          isOpen={!!activeInspiration}
          onClose={() => setActiveInspiration(null)}
          title={activeInspiration.title}
          subtitle={`${activeInspiration.aesthetic} · ${activeInspiration.occasion}`}
        >
          <div className="space-y-5">
            {/* Image Preview */}
            <div className="relative aspect-[16/10] sm:aspect-[16/9] rounded-2xl overflow-hidden bg-[#E5CDBE]/20 border border-[#242326]/10">
              <ImageWithFallback
                src={activeInspiration.imageUrl}
                alt={activeInspiration.title}
                fallbackTitle={activeInspiration.title}
                className="w-full h-full"
                imageClassName="object-cover"
              />
            </div>

            {/* Stylist Note */}
            <div className="p-4 rounded-xl bg-white border border-[#242326]/8 shadow-2xs">
              <div className="flex items-center gap-2 mb-1.5 text-xs font-semibold text-[#91635a]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Stylist's Note</span>
              </div>
              <p className="text-xs sm:text-sm text-[#242326] leading-relaxed italic font-serif">
                "{activeInspiration.stylistNote}"
              </p>
            </div>

            {/* Color Harmony Palette */}
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#5C585E] block mb-2">
                Color Palette
              </span>
              <div className="flex items-center gap-2">
                {activeInspiration.palette.map((color, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <span
                      className="w-7 h-7 rounded-full border border-[#242326]/15 shadow-xs"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Key Pieces Checklist */}
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#5C585E] block mb-2">
                Key Ensemble Pieces
              </span>
              <ul className="space-y-1.5">
                {activeInspiration.keyPieces.map((piece, idx) => (
                  <li
                    key={idx}
                    className="flex items-center gap-2 text-xs sm:text-sm text-[#242326]"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#B49361]" />
                    <span>{piece}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA to consult stylist with this look */}
            <div className="pt-2 border-t border-[#242326]/8">
              <Button
                variant="primary"
                fullWidth
                onClick={handleStyleSimilarClick}
                icon={<ArrowRight className="w-4 h-4 ml-1" />}
              >
                Style an Outfit Like This
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
};
