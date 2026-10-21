/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ProductCategory } from '../../types/shop';
import { SHOP_CATEGORIES } from '../../data/shopData';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { Sparkles } from 'lucide-react';

interface CategoryCardsCarouselProps {
  selectedCategory: ProductCategory | 'All';
  onSelectCategory: (category: ProductCategory | 'All') => void;
}

export const CategoryCardsCarousel: React.FC<CategoryCardsCarouselProps> = ({
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-[#B49361]" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#242326]">
            Curated Categories
          </h2>
        </div>
        {selectedCategory !== 'All' && (
          <button
            onClick={() => onSelectCategory('All')}
            className="text-xs font-medium text-[#9C6A61] hover:underline cursor-pointer"
          >
            Show All
          </button>
        )}
      </div>

      {/* Horizontal scrolling carousel on mobile, responsive grid on desktop */}
      <div className="flex min-w-0 max-w-full overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-8 gap-2.5 scrollbar-none">
        {/* 'All' category button */}
        <button
          onClick={() => onSelectCategory('All')}
          className={`flex-shrink-0 w-28 sm:w-auto p-3 rounded-2xl text-left transition-all border cursor-pointer flex flex-col justify-between ${
            selectedCategory === 'All'
              ? 'bg-[#242326] text-white border-[#242326] shadow-sm'
              : 'bg-white text-[#242326] border-[#242326]/10 hover:border-[#9C6A61]/40'
          }`}
        >
          <div className="text-[10px] uppercase font-bold tracking-wider opacity-70">
            Everything
          </div>
          <div className="font-serif text-sm font-semibold mt-2">
            All Styles
          </div>
          <div className="text-[10px] opacity-75 mt-0.5">
            32 pieces
          </div>
        </button>

        {SHOP_CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.name;
          return (
            <button
              key={cat.name}
              onClick={() => onSelectCategory(isSelected ? 'All' : cat.name)}
              className={`group flex-shrink-0 w-32 sm:w-auto relative rounded-2xl overflow-hidden border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'ring-2 ring-[#9C6A61] ring-offset-2 border-transparent shadow-sm'
                  : 'border-[#242326]/10 hover:border-[#9C6A61]/50'
              }`}
            >
              <div className="relative h-24 sm:h-20 w-full overflow-hidden bg-[#FAF7F2]">
                <ImageWithFallback
                  src={cat.imageUrl}
                  alt={cat.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#242326]/80 via-[#242326]/30 to-transparent" />
                <div className="absolute bottom-2 left-2 right-2 text-white">
                  <div className="font-serif text-xs font-semibold leading-tight line-clamp-1">
                    {cat.name}
                  </div>
                  <div className="text-[9px] text-[#F6F2EC]/85 line-clamp-1 mt-0.5">
                    {cat.subtitle}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
