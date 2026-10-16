/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShoppingPreferences, NavigationTab } from '../../types';
import { getShoppingHeadline } from '../../utils/personalization';
import { SHOPPING_CATEGORIES } from '../../data/mockData';
import { Button } from '../common/Button';
import { ShoppingBag, ArrowRight, Tag, Wallet } from 'lucide-react';

interface ShoppingPreviewProps {
  shopping?: ShoppingPreferences;
  onNavigate: (tab: NavigationTab) => void;
}

export const ShoppingPreview: React.FC<ShoppingPreviewProps> = ({
  shopping,
  onNavigate,
}) => {
  const { headline, badge, budgetText } = getShoppingHeadline(shopping);

  return (
    <section className="mb-10 sm:mb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold tracking-wider uppercase text-[#B49361]">
              Shop your way
            </span>
            <span className="text-[10px] font-semibold text-[#9C6A61] bg-[#E5CDBE]/30 px-2 py-0.5 rounded-md">
              {badge}
            </span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-[#242326]">
            {headline}
          </h2>
        </div>

        {/* Budget Pill */}
        <div className="flex items-center gap-1.5 text-xs text-[#5C585E] bg-white px-3 py-1.5 rounded-xl border border-[#242326]/8 shadow-2xs self-start sm:self-auto">
          <Wallet className="w-3.5 h-3.5 text-[#B49361]" />
          <span>Target: <strong className="text-[#242326] font-medium">{budgetText}</strong></span>
        </div>
      </div>

      {/* Category Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
        {SHOPPING_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => onNavigate('shop')}
            className="group p-4 rounded-2xl bg-white border border-[#242326]/10 text-left hover:border-[#9C6A61]/40 shadow-2xs hover:shadow transition-all cursor-pointer focus-visible:outline-none"
          >
            <span className="text-xs font-semibold text-[#242326] group-hover:text-[#9C6A61] transition-colors block mb-1">
              {cat.name}
            </span>
            <span className="text-[11px] text-[#5C585E] line-clamp-2 leading-snug">
              {cat.subtitle}
            </span>
          </button>
        ))}
      </div>

      {/* Action Strip */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-white via-[#F6F2EC] to-white border border-[#242326]/10 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div className="w-10 h-10 rounded-xl bg-[#B49361]/15 text-[#B49361] flex items-center justify-center shrink-0">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-[#242326] block">
              Curated Across South African Retailers
            </span>
            <p className="text-[11px] text-[#5C585E]">
              Woolworths, Superbalist, Country Road, Poetry & Zara collections tailored to your budget.
            </p>
          </div>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => onNavigate('shop')}
          icon={<ArrowRight className="w-3.5 h-3.5" />}
          className="shrink-0 whitespace-nowrap"
        >
          Explore Shopping
        </Button>
      </div>
    </section>
  );
};
