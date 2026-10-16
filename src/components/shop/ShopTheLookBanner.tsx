/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShopPreloadedContext } from '../pages/ShopPlaceholder';
import { Sparkles, X, ShoppingBag } from 'lucide-react';

interface ShopTheLookBannerProps {
  context: ShopPreloadedContext;
  onClear: () => void;
}

export const ShopTheLookBanner: React.FC<ShopTheLookBannerProps> = ({ context, onClear }) => {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#FAF7F2] to-[#F2EAE1] border border-[#B49361]/35 p-4 sm:p-5 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#B49361]/15 text-[#B49361] flex items-center justify-center shrink-0 mt-0.5">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#9C6A61] flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Shop The Look Mode
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/80 border border-[#242326]/10 text-[#242326] font-medium">
                {context.category}
              </span>
            </div>
            <h3 className="font-serif text-base sm:text-lg font-semibold text-[#242326] mt-0.5">
              Shopping for: {context.outfitTitle}
            </h3>
            <p className="text-xs text-[#5C585E] mt-0.5">
              Let's find pieces inspired by this look across trusted South African retailers.
            </p>
          </div>
        </div>

        <button
          onClick={onClear}
          className="p-1.5 rounded-full text-[#5C585E] hover:text-[#242326] hover:bg-white/60 transition-colors cursor-pointer"
          title="Clear look filter and show all products"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {context.pieces && context.pieces.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-[#242326]/8">
          <span className="text-[11px] text-[#5C585E] font-medium mr-1">Look Pieces:</span>
          {context.pieces.map((piece, i) => (
            <span
              key={i}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-white border border-[#242326]/10 text-[#242326] font-medium shadow-2xs"
            >
              {piece}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
