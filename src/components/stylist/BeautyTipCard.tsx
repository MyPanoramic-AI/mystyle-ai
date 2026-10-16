/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { StylistBeautyTip } from '../../types';
import { Sparkles, Palette } from 'lucide-react';
import { ImageWithFallback } from '../common/ImageWithFallback';

interface BeautyTipCardProps {
  tip: StylistBeautyTip;
}

export const BeautyTipCard: React.FC<BeautyTipCardProps> = ({ tip }) => {
  return (
    <div className="rounded-2xl border border-[#9C6A61]/25 bg-gradient-to-br from-[#FAF7F2] to-[#F6F2EC] p-4.5 space-y-4 shadow-xs mt-3">
      {/* Title Header */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-[#9C6A61] text-white flex items-center justify-center shrink-0">
          <Sparkles className="w-3.5 h-3.5" />
        </div>
        <div>
          <h4 className="font-serif text-sm font-semibold text-[#242326]">
            Complementary Beauty & Glam Palette
          </h4>
          <span className="text-[11px] text-[#5C585E]">
            Curated to harmonize with your ensemble
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {/* Hairstyle */}
        <div className="p-3 rounded-xl bg-white/80 border border-[#242326]/5 space-y-1.5">
          <div className="flex items-center gap-2">
            {tip.hairstyle.imageUrl && (
              <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-[#242326]/10">
                <ImageWithFallback
                  src={tip.hairstyle.imageUrl}
                  alt={tip.hairstyle.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#B49361]">
                Hairstyle Direction
              </span>
              <h5 className="text-xs font-semibold text-[#242326] leading-snug">
                {tip.hairstyle.title}
              </h5>
            </div>
          </div>
          <p className="text-[11px] text-[#5C585E] leading-relaxed">
            {tip.hairstyle.description}
          </p>
        </div>

        {/* Makeup & Lip */}
        <div className="p-3 rounded-xl bg-white/80 border border-[#242326]/5 space-y-2">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#9C6A61]">
              Makeup & Lip Palette
            </span>
            <h5 className="text-xs font-semibold text-[#242326] leading-snug">
              {tip.makeup.title}
            </h5>
          </div>

          <p className="text-[11px] text-[#5C585E] leading-relaxed">
            {tip.makeup.description}
          </p>

          {/* Palette swatches */}
          <div className="flex items-center gap-1.5 pt-0.5">
            <span className="text-[10px] text-[#5C585E] mr-1">Shades:</span>
            {tip.makeup.palette.map((color, i) => (
              <div
                key={i}
                className="w-4.5 h-4.5 rounded-full border border-black/10 shadow-2xs"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Nails */}
      <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/60 border border-[#242326]/5 text-xs">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-[#9C6A61]" />
          <div>
            <span className="font-medium text-[#242326]">Recommended Nails: </span>
            <span className="text-[#5C585E]">{tip.nails.title} ({tip.nails.colorName})</span>
          </div>
        </div>
        <div
          className="w-5 h-5 rounded-md border border-black/10 shadow-2xs shrink-0"
          style={{ backgroundColor: tip.nails.hex }}
          title={tip.nails.colorName}
        />
      </div>
    </div>
  );
};
