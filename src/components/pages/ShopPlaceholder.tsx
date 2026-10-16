/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { NavigationTab } from '../../types';
import { Button } from '../common/Button';
import { ShoppingBag, ArrowLeft, Tag, Search, ArrowUpDown, ExternalLink } from 'lucide-react';

export interface ShopPreloadedContext {
  outfitTitle: string;
  category: string;
  pieces: string[];
}

interface ShopPlaceholderProps {
  onNavigate: (tab: NavigationTab) => void;
  preloadedContext?: ShopPreloadedContext | null;
}

export const ShopPlaceholder: React.FC<ShopPlaceholderProps> = ({
  onNavigate,
  preloadedContext,
}) => {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Tailored Suits', 'Dresses & Gowns', 'Linen & Resort', 'Footwear'];

  const saRetailers = [
    { name: 'Woolworths Studio', focus: 'Premium Essentials & Clean Cut Tailoring', status: 'Catalog Ready' },
    { name: 'Superbalist Editorial', focus: 'High Street Fashion & Emerging Local Labels', status: 'Sync Ready' },
    { name: 'Country Road SA', focus: 'Contemporary Australian-SA Heritage Casuals', status: 'Catalog Ready' },
    { name: 'Poetry', focus: 'Romantic Linens, Florals & Artisan Footwear', status: 'Sync Ready' },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('home')}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5C585E] hover:text-[#242326] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>

        <span className="text-xs font-semibold uppercase tracking-wider text-[#B49361]">
          Smart Shopping · South Africa Focus
        </span>
      </div>

      <div className="rounded-3xl bg-white border border-[#242326]/10 p-6 sm:p-8 shadow-sm">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#B49361]/15 text-[#B49361] flex items-center justify-center shrink-0">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#242326]">
              Shop the Look & Price Compare
            </h1>
            <p className="text-xs sm:text-sm text-[#5C585E] mt-1">
              Find exact items and affordable alternatives across trusted South African fashion retailers.
            </p>
          </div>
        </div>

        {preloadedContext && (
          <div className="mb-6 p-4 rounded-2xl bg-[#FAF7F2] border border-[#B49361]/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#9C6A61]">
                Shopping Context From Discover
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 font-medium">
                {preloadedContext.category}
              </span>
            </div>
            <h4 className="font-serif text-base font-semibold text-[#242326]">
              Searching retail stock for "{preloadedContext.outfitTitle}"
            </h4>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {preloadedContext.pieces.map((piece, i) => (
                <span
                  key={i}
                  className="text-xs px-2.5 py-1 rounded-lg bg-white border border-[#242326]/10 text-[#242326] font-medium"
                >
                  {piece}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Search Mockup */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5C585E]" />
          <input
            type="text"
            readOnly
            placeholder="Search dresses, blazers, linen pants across SA retailers..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#F6F2EC] border border-[#242326]/10 text-xs sm:text-sm text-[#242326] focus:outline-none"
          />
        </div>

        {/* Interactive Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 mb-6">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-[#242326] text-white shadow-xs'
                  : 'bg-[#F6F2EC] text-[#5C585E] hover:text-[#242326]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Target Retailers Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#242326]">
              Supported South African Retail Ecosystem
            </span>
            <span className="text-[11px] text-[#9C6A61] font-medium">Phase 2 Sync</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {saRetailers.map((retailer, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-[#F6F2EC] border border-[#242326]/8 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#242326]">
                      {retailer.name}
                    </span>
                    <span className="text-[10px] text-[#5C585E] bg-white px-2 py-0.5 rounded-md border border-[#242326]/8">
                      {retailer.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#5C585E] mt-1 leading-snug">
                    {retailer.focus}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bargain & Price Alert Promise */}
        <div className="p-4 rounded-2xl bg-[#E5CDBE]/20 border border-[#242326]/10 flex items-start gap-3">
          <Tag className="w-5 h-5 text-[#9C6A61] shrink-0 mt-0.5" />
          <div className="text-xs text-[#242326] leading-relaxed">
            <span className="font-semibold block mb-0.5">
              Smart Price Tracking & Bargain Finder
            </span>
            Real-time price checking and duplicate alternative detection will be integrated in Phase 2, ensuring you never pay more than necessary for runway-inspired aesthetics.
          </div>
        </div>
      </div>
    </div>
  );
};
