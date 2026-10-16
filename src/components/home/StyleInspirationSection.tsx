/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { StyleInspiration } from '../../types';
import { getPersonalizedInspirations } from '../../utils/personalization';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Sparkles, ArrowRight, Eye } from 'lucide-react';

interface StyleInspirationSectionProps {
  userStyles?: string[];
  onExploreLook: (inspiration: StyleInspiration) => void;
  onDiscoverStyles?: () => void;
}

export const StyleInspirationSection: React.FC<StyleInspirationSectionProps> = ({
  userStyles,
  onExploreLook,
  onDiscoverStyles,
}) => {
  const [activeItem, setActiveItem] = useState<StyleInspiration | null>(null);

  const curatedLooks = getPersonalizedInspirations(userStyles);

  return (
    <section className="mb-10 sm:mb-12">
      {/* Header */}
      <div className="flex items-end justify-between mb-4">
        <div>
          <span className="text-xs font-semibold tracking-wider uppercase text-[#9C6A61] block mb-1">
            Curated For You
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-[#242326]">
            Picked for your style
          </h2>
        </div>
        {onDiscoverStyles ? (
          <button
            onClick={onDiscoverStyles}
            className="text-xs font-semibold text-[#9C6A61] hover:text-[#242326] transition-colors inline-flex items-center gap-1 cursor-pointer"
          >
            <span>Discover All Styles</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <p className="hidden sm:block text-xs text-[#5C585E]">
            Curated looks matched to your aesthetic DNA
          </p>
        )}
      </div>

      {/* 3 Editorial Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {curatedLooks.map((item) => (
          <div
            key={item.id}
            className="group rounded-3xl overflow-hidden bg-white border border-[#242326]/10 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
          >
            {/* Image Showcase */}
            <div
              className="relative aspect-[4/3] sm:aspect-[3/4] w-full overflow-hidden bg-[#E5CDBE]/20 cursor-pointer"
              onClick={() => setActiveItem(item)}
            >
              <ImageWithFallback
                src={item.imageUrl}
                alt={item.title}
                fallbackTitle={item.title}
                className="w-full h-full"
                imageClassName="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#242326]/75 via-transparent to-transparent" />

              {/* Category Pill Tag */}
              <div className="absolute bottom-3 left-3 text-white">
                <span className="text-[10px] font-semibold tracking-wider uppercase text-[#E5CDBE] block">
                  {item.aesthetic}
                </span>
                <span className="font-serif text-sm font-semibold leading-tight line-clamp-1">
                  {item.occasion}
                </span>
              </div>

              {/* Quick Inspect Icon */}
              <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/85 backdrop-blur-md flex items-center justify-center text-[#242326] opacity-0 group-hover:opacity-100 transition-opacity shadow-xs">
                <Eye className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Description & Action */}
            <div className="p-4 sm:p-5 flex flex-col justify-between flex-1">
              <div>
                <h3 className="font-serif text-base font-semibold text-[#242326] mb-1.5 leading-snug">
                  {item.title}
                </h3>
                <p className="text-xs text-[#5C585E] leading-relaxed line-clamp-2">
                  {item.stylistNote}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#242326]/6 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => onExploreLook(item)}
                  className="w-full py-2 px-3 text-xs font-semibold text-[#9C6A61] hover:text-white bg-[#F6F2EC] hover:bg-[#9C6A61] rounded-xl transition-all cursor-pointer flex items-center justify-between shadow-2xs group/btn"
                >
                  <span>Explore Look</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-1" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Outfit Inspection Modal */}
      {activeItem && (
        <Modal
          isOpen={!!activeItem}
          onClose={() => setActiveItem(null)}
          title={activeItem.title}
          subtitle={`${activeItem.aesthetic} · ${activeItem.occasion}`}
        >
          <div className="space-y-5">
            <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-[#E5CDBE]/20 border border-[#242326]/10">
              <ImageWithFallback
                src={activeItem.imageUrl}
                alt={activeItem.title}
                fallbackTitle={activeItem.title}
                className="w-full h-full"
                imageClassName="object-cover"
              />
            </div>

            <div className="p-4 rounded-xl bg-white border border-[#242326]/8 shadow-2xs">
              <div className="flex items-center gap-2 mb-1.5 text-xs font-semibold text-[#9C6A61]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Stylist Guidance</span>
              </div>
              <p className="text-xs sm:text-sm text-[#242326] leading-relaxed italic font-serif">
                "{activeItem.stylistNote}"
              </p>
            </div>

            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#5C585E] block mb-2">
                Color Palette
              </span>
              <div className="flex items-center gap-2">
                {activeItem.palette.map((color, idx) => (
                  <span
                    key={idx}
                    className="w-7 h-7 rounded-full border border-[#242326]/15 shadow-xs"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#5C585E] block mb-2">
                Key Ensemble Pieces
              </span>
              <ul className="space-y-1.5">
                {activeItem.keyPieces.map((piece, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-xs sm:text-sm text-[#242326]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#B49361]" />
                    <span>{piece}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-2 border-t border-[#242326]/8">
              <Button
                variant="primary"
                fullWidth
                onClick={() => {
                  const it = activeItem;
                  setActiveItem(null);
                  onExploreLook(it);
                }}
                icon={<ArrowRight className="w-4 h-4 ml-1" />}
              >
                Explore Look in Stylist
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
};
