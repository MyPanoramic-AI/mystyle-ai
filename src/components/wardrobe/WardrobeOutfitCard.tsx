/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { WardrobeOutfit, WardrobeItem } from '../../types/wardrobe';
import { Sparkles, Camera, Heart, CheckCircle2, ChevronRight } from 'lucide-react';

interface WardrobeOutfitCardProps {
  outfit: WardrobeOutfit;
  wardrobeItems: WardrobeItem[];
  onInspect?: (outfit: WardrobeOutfit) => void;
  onSendToTryOn?: (outfit: WardrobeOutfit, pieces: WardrobeItem[]) => void;
  onAskStylist?: (outfit: WardrobeOutfit) => void;
  onToggleFavorite?: (outfitId: string) => void;
  onLogWear?: (outfitId: string) => void;
}

export const WardrobeOutfitCard: React.FC<WardrobeOutfitCardProps> = ({
  outfit,
  wardrobeItems,
  onInspect,
  onSendToTryOn,
  onAskStylist,
  onToggleFavorite,
  onLogWear,
}) => {
  // Resolve items in slots
  const slotItemIds = [
    outfit.slots.topId,
    outfit.slots.bottomId,
    outfit.slots.dressId,
    outfit.slots.outerwearId,
    outfit.slots.shoesId,
    outfit.slots.bagId,
    ...(outfit.slots.accessoryIds || []),
  ].filter(Boolean) as string[];

  const resolvedPieces = slotItemIds
    .map((id) => wardrobeItems.find((i) => i.id === id))
    .filter(Boolean) as WardrobeItem[];

  return (
    <div className="group bg-white rounded-2xl overflow-hidden border border-[#242326]/8 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col">
      {/* Top Header */}
      <div className="p-4 sm:p-5 border-b border-[#242326]/6 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono tracking-wider text-[#9C6A61] uppercase font-semibold">
              {outfit.occasion} • {outfit.season}
            </span>
            {outfit.wearCount > 0 && (
              <span className="text-[10px] bg-[#F6F2EC] text-[#5C585E] px-2 py-0.5 rounded-md font-medium">
                Worn {outfit.wearCount}×
              </span>
            )}
          </div>
          <h3
            onClick={() => onInspect && onInspect(outfit)}
            className="font-serif text-lg font-bold text-[#242326] leading-snug hover:text-[#9C6A61] cursor-pointer transition-colors"
          >
            {outfit.title}
          </h3>
        </div>

        {/* Harmony Score Pill */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="px-2.5 py-1 bg-[#F6F2EC] border border-[#B49361]/30 rounded-xl flex items-center gap-1.5 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-[#B49361]" />
            <span className="text-xs font-bold text-[#242326]">{outfit.harmonyScore}%</span>
            <span className="text-[9px] text-[#5C585E] uppercase font-mono hidden sm:inline">Harmony</span>
          </div>

          {onToggleFavorite && (
            <button
              onClick={() => onToggleFavorite(outfit.id)}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                outfit.isFavorite
                  ? 'bg-[#9C6A61] text-white border-[#9C6A61]'
                  : 'bg-white text-[#5C585E] border-[#242326]/12 hover:border-[#242326]/30'
              }`}
              aria-label="Favorite outfit"
            >
              <Heart className={`w-3.5 h-3.5 ${outfit.isFavorite ? 'fill-current' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Visual Garment Collage */}
      <div className="p-4 bg-[#FBF8F5]/80">
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
          {resolvedPieces.map((piece) => (
            <div
              key={piece.id}
              className="relative aspect-3/4 rounded-xl overflow-hidden bg-white border border-[#242326]/8 shadow-2xs group/piece"
              title={`${piece.name} (${piece.brand})`}
            >
              <img
                src={piece.imageUrl}
                alt={piece.name}
                className="w-full h-full object-cover group-hover/piece:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-1.5 text-center">
                <span className="text-[9px] text-white font-medium line-clamp-1">
                  {piece.subcategory}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Stylist Harmony Critique */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          <p className="text-xs text-[#5C585E] leading-relaxed line-clamp-2 italic">
            "{outfit.harmonyCritique}"
          </p>

          {/* Color Palette Chips */}
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#242326]/6">
            <span className="text-[10px] font-mono uppercase text-[#5C585E]">Palette:</span>
            <div className="flex items-center gap-1.5">
              {outfit.colorPalette.map((col, idx) => (
                <div
                  key={idx}
                  className="w-4 h-4 rounded-full border border-[#242326]/15 shadow-2xs"
                  style={{ backgroundColor: col.hex }}
                  title={col.name}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 pt-3 border-t border-[#242326]/6 flex flex-wrap items-center justify-between gap-2">
          {onLogWear && (
            <button
              onClick={() => onLogWear(outfit.id)}
              className="inline-flex items-center gap-1 text-xs font-medium text-[#5C585E] hover:text-[#242326] transition-colors cursor-pointer py-1"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-[#B49361]" />
              <span>Log Worn Today</span>
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            {onAskStylist && (
              <button
                onClick={() => onAskStylist(outfit)}
                className="px-2.5 py-1.5 text-xs font-medium text-[#242326] bg-[#F6F2EC] hover:bg-[#E5CDBE]/40 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3 text-[#B49361]" />
                <span className="hidden sm:inline">Ask Stylist</span>
              </button>
            )}

            {onSendToTryOn && (
              <button
                onClick={() => onSendToTryOn(outfit, resolvedPieces)}
                className="px-3 py-1.5 text-xs font-medium text-white bg-[#9C6A61] hover:bg-[#8A5B53] rounded-lg transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Try On</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
