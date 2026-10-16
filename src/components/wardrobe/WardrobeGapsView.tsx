/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { WardrobeGap } from '../../types/wardrobe';
import { ImageWithFallback } from '../common/ImageWithFallback';
import {
  Sparkles,
  ShoppingBag,
  ArrowRight,
  TrendingUp,
  Tag,
  CheckCircle,
} from 'lucide-react';

interface WardrobeGapsViewProps {
  gaps: WardrobeGap[];
  onShopGap: (gap: WardrobeGap) => void;
  onAskStylist: (gap: WardrobeGap) => void;
}

export const WardrobeGapsView: React.FC<WardrobeGapsViewProps> = ({
  gaps,
  onShopGap,
  onAskStylist,
}) => {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#242326] to-[#3D3A40] text-white rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="max-w-2xl space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono tracking-widest text-[#B49361] uppercase font-semibold">
              Wardrobe Intelligence
            </span>
            <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-white/90">
              Gap Analysis
            </span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold leading-tight">
            Missing Link Essentials
          </h2>
          <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
            By analyzing your existing silhouettes and favorite color stories, our styling engine identified key foundational pieces that unlock the highest number of new outfit combinations.
          </p>
        </div>
      </div>

      {/* Gap Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {gaps.map((gap) => (
          <div
            key={gap.id}
            className="group bg-white rounded-3xl overflow-hidden border border-[#242326]/8 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              {/* Visual Showcase with Impact Pill */}
              <div className="relative aspect-16/10 overflow-hidden bg-[#F6F2EC]">
                <ImageWithFallback
                  src={gap.imageUrl}
                  alt={gap.title}
                  className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 bg-[#9C6A61] text-white px-2.5 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider shadow-xs">
                  {gap.priority} Staple
                </div>

                <div className="absolute bottom-3 left-3 bg-[#242326]/85 backdrop-blur-md px-3 py-1.5 rounded-xl text-white flex items-center gap-1.5 shadow-sm">
                  <TrendingUp className="w-3.5 h-3.5 text-[#B49361]" />
                  <span className="text-xs font-semibold">
                    +{gap.outfitPotentialCount} New Outfits Unlocked
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="p-5 sm:p-6 space-y-3">
                <div className="flex items-center justify-between text-xs text-[#5C585E]">
                  <span className="font-mono uppercase text-[#9C6A61] text-[10px] font-semibold">
                    {gap.category}
                  </span>
                  <span>Est. R{gap.estimatedPriceZar.toLocaleString()}</span>
                </div>

                <h3 className="font-serif text-lg font-bold text-[#242326] leading-snug">
                  {gap.title}
                </h3>

                <p className="text-xs text-[#5C585E] leading-relaxed">
                  {gap.whyMissing}
                </p>

                {/* Recommended Retailers */}
                <div className="pt-2">
                  <span className="text-[10px] font-mono uppercase text-[#5C585E] block mb-1">
                    Available at South African Retailers:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {gap.recommendedRetailers.map((ret, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-0.5 bg-[#F6F2EC] rounded-md text-[11px] font-medium text-[#242326]"
                      >
                        {ret}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-5 sm:p-6 pt-0 flex items-center justify-between gap-3">
              <button
                onClick={() => onAskStylist(gap)}
                className="px-3 py-2 text-xs font-medium text-[#242326] bg-[#F6F2EC] hover:bg-[#E5CDBE]/40 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#B49361]" />
                <span className="hidden sm:inline">Ask Stylist</span>
              </button>

              <button
                onClick={() => onShopGap(gap)}
                className="px-4 py-2 text-xs font-medium text-white bg-[#9C6A61] hover:bg-[#8A5B53] rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5 ml-auto"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Find at Retailers</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
