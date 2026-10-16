/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { WardrobeItem } from '../../types/wardrobe';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { Heart, Sparkles, Plus, Clock, Star } from 'lucide-react';

interface WardrobeItemCardProps {
  item: WardrobeItem;
  onInspect: (item: WardrobeItem) => void;
  onToggleFavorite?: (itemId: string) => void;
  onAddToOutfit?: (item: WardrobeItem) => void;
  isSelectable?: boolean;
  isSelected?: boolean;
}

export const WardrobeItemCard: React.FC<WardrobeItemCardProps> = ({
  item,
  onInspect,
  onToggleFavorite,
  onAddToOutfit,
  isSelectable = false,
  isSelected = false,
}) => {
  return (
    <div
      className={`group relative bg-white rounded-2xl overflow-hidden border transition-all duration-300 flex flex-col ${
        isSelected
          ? 'border-[#9C6A61] ring-2 ring-[#9C6A61]/30 shadow-md'
          : 'border-[#242326]/8 hover:border-[#242326]/20 shadow-xs hover:shadow-md'
      }`}
    >
      {/* Image Container */}
      <div
        onClick={() => onInspect(item)}
        className="relative aspect-3/4 overflow-hidden bg-[#F6F2EC] cursor-pointer"
      >
        <ImageWithFallback
          src={item.imageUrl}
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-500"
        />

        {/* Brand Tag */}
        <div className="absolute top-2.5 left-2.5 bg-[#242326]/85 backdrop-blur-md px-2 py-0.5 rounded-md text-[9px] tracking-wider uppercase font-semibold text-white">
          {item.brand}
        </div>

        {/* Favorite Heart Button */}
        {onToggleFavorite && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(item.id);
            }}
            className={`absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer backdrop-blur-md ${
              item.isFavorite
                ? 'bg-[#9C6A61] text-white shadow-sm'
                : 'bg-white/80 text-[#5C585E] hover:text-[#9C6A61]'
            }`}
            aria-label={item.isFavorite ? 'Remove from favorites' : 'Favorite item'}
          >
            <Heart className={`w-3.5 h-3.5 ${item.isFavorite ? 'fill-current' : ''}`} />
          </button>
        )}

        {/* Capsule Staple Indicator */}
        {item.isCapsuleStaple && (
          <div className="absolute bottom-2.5 left-2.5 bg-[#B49361]/90 backdrop-blur-md px-2 py-0.5 rounded-md text-[9px] font-semibold text-white flex items-center gap-1">
            <Star className="w-2.5 h-2.5 fill-current" />
            <span>Capsule Staple</span>
          </div>
        )}

        {/* Color Dot */}
        <div
          className="absolute bottom-2.5 right-2.5 w-4 h-4 rounded-full border-2 border-white shadow-sm"
          style={{ backgroundColor: item.colorHex }}
          title={item.color}
        />
      </div>

      {/* Item Information */}
      <div className="p-3.5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-1 text-[10px] text-[#5C585E] font-mono uppercase mb-0.5">
            <span>{item.subcategory}</span>
            <span className="flex items-center gap-0.5 text-[#B49361]">
              <Clock className="w-2.5 h-2.5" />
              <span>{item.timesWorn}× worn</span>
            </span>
          </div>

          <h4
            onClick={() => onInspect(item)}
            className="font-serif text-sm font-semibold text-[#242326] leading-snug line-clamp-1 hover:text-[#9C6A61] cursor-pointer transition-colors"
          >
            {item.name}
          </h4>

          <p className="text-[11px] text-[#5C585E] mt-0.5 line-clamp-1">
            {item.color} • {item.seasons.join(', ')}
          </p>
        </div>

        {/* Actions */}
        <div className="mt-3 pt-2.5 border-t border-[#242326]/6 flex items-center justify-between gap-2">
          <button
            onClick={() => onInspect(item)}
            className="text-[11px] font-medium text-[#5C585E] hover:text-[#242326] transition-colors cursor-pointer"
          >
            Details
          </button>

          {isSelectable ? (
            <button
              onClick={() => onAddToOutfit && onAddToOutfit(item)}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-[#9C6A61] text-white'
                  : 'bg-[#F6F2EC] text-[#242326] hover:bg-[#E5CDBE]/40'
              }`}
            >
              {isSelected ? 'Selected' : 'Select'}
            </button>
          ) : onAddToOutfit ? (
            <button
              onClick={() => onAddToOutfit(item)}
              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-[#9C6A61] hover:text-[#8A5B53] bg-[#E5CDBE]/20 hover:bg-[#E5CDBE]/40 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Style</span>
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};
