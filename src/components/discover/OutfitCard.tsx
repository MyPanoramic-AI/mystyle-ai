/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { FashionLook } from '../../types/discover';
import { savedLooksService } from '../../services/savedLooksService';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { Heart, Sparkles } from 'lucide-react';

interface OutfitCardProps {
  look: FashionLook;
  onSelectLook: (look: FashionLook) => void;
  onToast?: (message: string) => void;
}

export const OutfitCard: React.FC<OutfitCardProps> = ({
  look,
  onSelectLook,
  onToast,
}) => {
  const [isSaved, setIsSaved] = useState(() => savedLooksService.isLookSaved(look.id));

  useEffect(() => {
    const unsubscribe = savedLooksService.subscribe(() => {
      setIsSaved(savedLooksService.isLookSaved(look.id));
    });
    return unsubscribe;
  }, [look.id]);

  const handleToggleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nowSaved = savedLooksService.toggleSaveLook(look.id);
    setIsSaved(nowSaved);
    if (onToast) {
      onToast(nowSaved ? `Saved "${look.title}" to your looks` : `Removed "${look.title}"`);
    }
  };

  return (
    <div
      onClick={() => onSelectLook(look)}
      className="group relative flex flex-col rounded-2xl bg-white border border-[#242326]/10 overflow-hidden shadow-2xs hover:shadow-md transition-all duration-300 cursor-pointer text-left"
    >
      {/* Image Container with 3:4 aspect ratio */}
      <div className="relative aspect-3/4 w-full overflow-hidden bg-[#FAF7F2]">
        <ImageWithFallback
          src={look.imageUrl}
          alt={look.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-104"
          fallbackTitle={look.title}
        />

        {/* Top Floating Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1.5 pointer-events-none">
          <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-md text-[#242326] shadow-xs">
            {look.category}
          </span>

          {/* Heart Button */}
          <button
            type="button"
            onClick={handleToggleSave}
            className={`pointer-events-auto w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm cursor-pointer ${
              isSaved
                ? 'bg-[#9C6A61] text-white scale-105'
                : 'bg-white/90 backdrop-blur-md text-[#5C585E] hover:text-[#242326] hover:bg-white'
            }`}
            aria-label={isSaved ? 'Remove from saved' : 'Save outfit'}
          >
            <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Bottom subtle gradient on image */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent pointer-events-none flex items-end p-2.5">
          <span className="text-[11px] text-white/90 font-medium truncate drop-shadow-xs">
            {look.occasions[0]}
          </span>
        </div>
      </div>

      {/* Card Info */}
      <div className="p-3 sm:p-3.5 space-y-1.5 flex-1 flex flex-col justify-between bg-white">
        <div>
          <h3 className="font-serif text-sm sm:text-base font-semibold text-[#242326] group-hover:text-[#9C6A61] transition-colors line-clamp-1">
            {look.title}
          </h3>
          <p className="text-[11px] text-[#5C585E] line-clamp-2 leading-relaxed mt-0.5">
            {look.shortDescription}
          </p>
        </div>

        {/* Palette Bar */}
        <div className="flex items-center justify-between pt-1 border-t border-[#242326]/5 text-[11px] text-[#5C585E]">
          <span>{look.pieces.length} pieces</span>
          <div className="flex items-center gap-1">
            {look.colorPalette.slice(0, 3).map((col, idx) => (
              <span
                key={idx}
                className="w-3 h-3 rounded-full border border-black/10 shadow-2xs"
                style={{ backgroundColor: col }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
