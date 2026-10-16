/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CompleteBeautyLook } from '../../types/beauty';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { Sparkles, ShoppingBag, Bookmark, ArrowRight } from 'lucide-react';

interface BeautyLookCardProps {
  look: CompleteBeautyLook;
  isSaved?: boolean;
  onSelect: (look: CompleteBeautyLook) => void;
  onSave?: (look: CompleteBeautyLook) => void;
  onSendToShop?: (look: CompleteBeautyLook) => void;
  onAskStylist?: (look: CompleteBeautyLook) => void;
}

export const BeautyLookCard: React.FC<BeautyLookCardProps> = ({
  look,
  isSaved = false,
  onSelect,
  onSave,
  onSendToShop,
  onAskStylist,
}) => {
  const totalPriceZar = look.curatedProducts.reduce((sum, p) => sum + p.priceZar, 0);

  return (
    <div className="group bg-white rounded-2xl overflow-hidden border border-[#242326]/8 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col md:flex-row">
      {/* Visual showcase */}
      <div
        onClick={() => onSelect(look)}
        className="relative md:w-2/5 aspect-4/3 md:aspect-auto overflow-hidden bg-[#F6F2EC] cursor-pointer shrink-0"
      >
        <ImageWithFallback
          src={look.imageUrl}
          alt={look.title}
          className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
        />
        <div className="absolute top-3 left-3 bg-[#242326]/85 backdrop-blur-md px-3 py-1 rounded-md text-[10px] tracking-wider uppercase font-semibold text-white">
          Complete Beauty Look
        </div>

        {/* Color Palette Chips */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center gap-1.5 p-2 bg-[#242326]/75 backdrop-blur-md rounded-xl">
          <span className="text-[10px] text-white/80 font-medium mr-1">Palette:</span>
          {look.colorPalette.map((col, idx) => (
            <div
              key={idx}
              className="w-4 h-4 rounded-full border border-white/40 shadow-xs"
              style={{ backgroundColor: col.hex }}
              title={col.name}
            />
          ))}
        </div>
      </div>

      {/* Look details */}
      <div className="p-5 md:p-6 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-3 mb-1">
            <span className="text-[11px] font-mono tracking-wider text-[#9C6A61] uppercase font-medium">
              {look.aesthetic}
            </span>
            <span className="text-xs text-[#5C585E]">
              {look.curatedProducts.length} Curated Products
            </span>
          </div>

          <h3
            onClick={() => onSelect(look)}
            className="font-serif text-xl md:text-2xl font-bold text-[#242326] leading-tight hover:text-[#9C6A61] cursor-pointer transition-colors"
          >
            {look.title}
          </h3>

          <p className="text-xs text-[#B49361] font-medium mt-1">
            Occasion: {look.occasion}
          </p>

          <p className="text-xs text-[#5C585E] mt-2 leading-relaxed">
            {look.description}
          </p>

          {/* Breakdown pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-3 border-t border-[#242326]/6">
            <div className="p-2 bg-[#F6F2EC]/60 rounded-lg">
              <span className="text-[9px] font-mono uppercase text-[#5C585E] block">Hair</span>
              <span className="text-xs font-medium text-[#242326] line-clamp-1">{look.hairstyle.title}</span>
            </div>
            <div className="p-2 bg-[#F6F2EC]/60 rounded-lg">
              <span className="text-[9px] font-mono uppercase text-[#5C585E] block">Colour</span>
              <span className="text-xs font-medium text-[#242326] line-clamp-1">{look.hairColor.title}</span>
            </div>
            <div className="p-2 bg-[#F6F2EC]/60 rounded-lg">
              <span className="text-[9px] font-mono uppercase text-[#5C585E] block">Makeup</span>
              <span className="text-xs font-medium text-[#242326] line-clamp-1">{look.makeup.style.replace('-', ' ')}</span>
            </div>
            <div className="p-2 bg-[#F6F2EC]/60 rounded-lg">
              <span className="text-[9px] font-mono uppercase text-[#5C585E] block">Nails</span>
              <span className="text-xs font-medium text-[#242326] line-clamp-1">{look.nails.title}</span>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="mt-5 pt-4 border-t border-[#242326]/6 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-[#5C585E]">
            Products total:{' '}
            <span className="font-semibold text-[#242326]">
              R{totalPriceZar.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onSave && (
              <button
                onClick={() => onSave(look)}
                className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                  isSaved
                    ? 'bg-[#9C6A61] text-white border-[#9C6A61]'
                    : 'bg-white text-[#5C585E] border-[#242326]/12 hover:border-[#242326]/30'
                }`}
                title={isSaved ? 'Saved to Your Looks' : 'Save Look'}
              >
                <Bookmark className="w-4 h-4 fill-current" />
              </button>
            )}

            {onAskStylist && (
              <button
                onClick={() => onAskStylist(look)}
                className="px-3 py-1.5 text-xs font-medium text-[#242326] bg-[#F6F2EC] hover:bg-[#E5CDBE]/40 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#B49361]" />
                <span className="hidden sm:inline">Ask Stylist</span>
              </button>
            )}

            {onSendToShop && (
              <button
                onClick={() => onSendToShop(look)}
                className="px-3.5 py-1.5 text-xs font-medium text-white bg-[#9C6A61] hover:bg-[#8A5B53] rounded-lg transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Shop Beauty</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
