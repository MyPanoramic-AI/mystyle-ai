/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  HairstyleItem,
  HairColorItem,
  MakeupItem,
  NailItem,
} from '../../types/beauty';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { Sparkles, ShoppingBag, Eye, Bookmark } from 'lucide-react';

interface BeautyItemCardProps {
  item: HairstyleItem | HairColorItem | MakeupItem | NailItem;
  onInspect: (item: HairstyleItem | HairColorItem | MakeupItem | NailItem) => void;
  onAddToBag?: (item: HairstyleItem | HairColorItem | MakeupItem | NailItem) => void;
  onAskStylist?: (item: HairstyleItem | HairColorItem | MakeupItem | NailItem) => void;
  onSave?: (item: HairstyleItem | HairColorItem | MakeupItem | NailItem) => void;
  isSaved?: boolean;
}

export const BeautyItemCard: React.FC<BeautyItemCardProps> = ({
  item,
  onInspect,
  onAddToBag,
  onAskStylist,
  onSave,
  isSaved = false,
}) => {
  const getSubtext = () => {
    switch (item.category) {
      case 'hairstyles':
        return `${item.length.toUpperCase()} • ${item.texture.toUpperCase()}`;
      case 'hair-colours':
        return `${item.tone.toUpperCase()} • ${item.shadeFamily.replace('-', ' ').toUpperCase()}`;
      case 'makeup':
        return `${item.style.replace('-', ' ').toUpperCase()} • ${item.bestForTime.toUpperCase()}`;
      case 'nails':
        return `${item.shape.toUpperCase()} • ${item.style.replace('-', ' ').toUpperCase()}`;
    }
  };

  const getPrimaryHex = () => {
    if (item.category === 'hair-colours') return item.swatchHex;
    if (item.category === 'makeup') return item.lipHex;
    if (item.category === 'nails') return item.primaryHex;
    return null;
  };

  const colorSwatch = getPrimaryHex();

  return (
    <div className="group bg-white rounded-2xl overflow-hidden border border-[#242326]/6 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col">
      {/* Visual media */}
      <div
        onClick={() => onInspect(item)}
        className="relative aspect-4/5 overflow-hidden bg-[#F6F2EC] cursor-pointer"
      >
        <ImageWithFallback
          src={item.imageUrl}
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-500"
        />

        {/* Category tag */}
        <div className="absolute top-3 left-3 bg-[#242326]/80 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] tracking-wider uppercase font-semibold text-white">
          {item.category.replace('-', ' ')}
        </div>

        {/* Color swatch if applicable */}
        {colorSwatch && (
          <div
            className="absolute top-3 right-3 w-6 h-6 rounded-full border-2 border-white shadow-md"
            style={{ backgroundColor: colorSwatch }}
            title="Signature Shade"
          />
        )}

        {/* Quick hover inspect overlay */}
        <div className="absolute inset-0 bg-[#242326]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-[#242326] text-xs font-medium rounded-lg shadow-sm">
            <Eye className="w-3.5 h-3.5" />
            <span>View Details</span>
          </span>
        </div>
      </div>

      {/* Body details */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="text-[10px] font-mono tracking-wider text-[#9C6A61] uppercase mb-1">
            {getSubtext()}
          </div>
          <h4
            onClick={() => onInspect(item)}
            className="font-serif text-base font-semibold text-[#242326] leading-snug line-clamp-2 hover:text-[#9C6A61] cursor-pointer transition-colors"
          >
            {item.title}
          </h4>
          <p className="text-xs text-[#5C585E] mt-1.5 line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        </div>

        {/* Action bar */}
        <div className="mt-4 pt-3 border-t border-[#242326]/6 flex items-center justify-between gap-2">
          {onAskStylist && (
            <button
              onClick={() => onAskStylist(item)}
              className="inline-flex items-center gap-1 text-xs font-medium text-[#5C585E] hover:text-[#242326] transition-colors cursor-pointer py-1"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#B49361]" />
              <span>Ask Stylist</span>
            </button>
          )}

          {onSave && (
            <button
              onClick={() => onSave(item)}
              className="inline-flex items-center gap-1 text-xs font-medium text-[#9C6A61] hover:text-[#8A5B53] transition-colors cursor-pointer py-1"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>{isSaved ? 'Saved' : 'Save'}</span>
            </button>
          )}

          {item.productsUsed && item.productsUsed.length > 0 && onAddToBag && (
            <button
              onClick={() => onAddToBag(item)}
              className="inline-flex items-center gap-1 text-xs font-medium text-[#9C6A61] hover:text-[#8A5B53] transition-colors cursor-pointer py-1 ml-auto"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Shop Look</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
