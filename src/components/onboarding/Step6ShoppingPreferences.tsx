/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShoppingPreferences, BudgetTier } from '../../types';
import { SOUTH_AFRICAN_RETAILERS } from '../../data/mockData';
import { Button } from '../common/Button';
import { ArrowLeft, ArrowRight, Check, Tag } from 'lucide-react';

interface Step6ShoppingPreferencesProps {
  initialData: ShoppingPreferences;
  onContinue: (data: ShoppingPreferences) => void;
  onBack: () => void;
  onSkip: () => void;
}

const BUDGET_OPTIONS: { id: BudgetTier; label: string }[] = [
  { id: 'under-300', label: 'Under R300' },
  { id: '300-600', label: 'R300 – R600' },
  { id: '600-1000', label: 'R600 – R1,000' },
  { id: '1000-2000', label: 'R1,000 – R2,000' },
  { id: '2000-plus', label: 'R2,000+' },
  { id: 'flexible', label: 'Flexible' },
];

const SHOPPING_PRIORITIES = [
  'Best value for money',
  'Quality and durability',
  'Latest trends',
  'Comfort',
  'Premium brands',
  'Finding specials and discounts',
];

export const Step6ShoppingPreferences: React.FC<Step6ShoppingPreferencesProps> = ({
  initialData,
  onContinue,
  onBack,
  onSkip,
}) => {
  const [itemBudget, setItemBudget] = useState<BudgetTier>(initialData.itemBudget || '600-1000');
  const [priorities, setPriorities] = useState<string[]>(initialData.priorities || ['Quality and durability']);
  const [favoriteRetailers, setFavoriteRetailers] = useState<string[]>(
    initialData.favoriteRetailers || ['Woolworths', 'Superbalist']
  );

  const togglePriority = (p: string) => {
    setPriorities((prev) => (prev.includes(p) ? prev.filter((item) => item !== p) : [...prev, p]));
  };

  const toggleRetailer = (r: string) => {
    setFavoriteRetailers((prev) =>
      prev.includes(r) ? prev.filter((item) => item !== r) : [...prev, r]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onContinue({
      itemBudget,
      priorities,
      favoriteRetailers,
    });
  };

  return (
    <div className="max-w-xl mx-auto py-2 sm:py-6 animate-fadeIn">
      <div className="rounded-3xl bg-white border border-[#242326]/10 shadow-sm p-6 sm:p-10">
        {/* Header */}
        <div className="mb-6">
          <span className="text-xs font-semibold tracking-wider uppercase text-[#B49361] block mb-1">
            Step 5 of 6 · Smart Shopping
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#242326]">
            Shopping Preferences
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-[#5C585E]">
            Help our shopping assistant highlight garments and South African retail collections aligned with your wallet.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Typical Item Budget */}
          <div>
            <label className="block text-xs font-semibold text-[#242326] uppercase tracking-wider mb-2">
              Typical Budget Per Item
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {BUDGET_OPTIONS.map((b) => (
                <button
                  type="button"
                  key={b.id}
                  onClick={() => setItemBudget(b.id)}
                  className={`py-2.5 px-3 text-xs font-medium rounded-xl border text-center cursor-pointer transition-all ${
                    itemBudget === b.id
                      ? 'bg-[#242326] text-white border-[#242326] shadow-xs'
                      : 'bg-[#F6F2EC]/50 text-[#5C585E] border-[#242326]/10 hover:border-[#242326]/25'
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          {/* Shopping Priorities */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-[#242326] uppercase tracking-wider">
                Shopping Priorities
              </label>
              <span className="text-[11px] text-[#5C585E]">Select all that apply</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SHOPPING_PRIORITIES.map((p) => {
                const isSelected = priorities.includes(p);
                return (
                  <button
                    type="button"
                    key={p}
                    onClick={() => togglePriority(p)}
                    className={`flex items-center justify-between p-2.5 px-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#9C6A61] bg-[#E5CDBE]/20 text-[#242326] shadow-2xs'
                        : 'border-[#242326]/10 bg-[#F6F2EC]/40 text-[#5C585E] hover:border-[#242326]/25'
                    }`}
                  >
                    <span className="text-xs font-medium">{p}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#9C6A61] shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* South African Retailers */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-[#242326] uppercase tracking-wider">
                Favourite South African Retailers
              </label>
              <span className="text-[11px] text-[#5C585E]">Optional</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {SOUTH_AFRICAN_RETAILERS.map((r) => {
                const isSelected = favoriteRetailers.includes(r);
                return (
                  <button
                    type="button"
                    key={r}
                    onClick={() => toggleRetailer(r)}
                    className={`py-1.5 px-3 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#9C6A61] text-white border-[#9C6A61]'
                        : 'bg-[#F6F2EC]/60 text-[#5C585E] border-[#242326]/10 hover:border-[#242326]/25'
                    }`}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-[#5C585E] mt-2 italic">
              These preferences guide retailer search filtering; live price synchronization will connect in Phase 2.
            </p>
          </div>

          {/* Action Controls */}
          <div className="pt-6 border-t border-[#242326]/8 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium text-[#5C585E] hover:text-[#242326] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onSkip}
                className="px-3.5 py-2 text-xs font-medium text-[#5C585E] hover:text-[#242326] transition-colors cursor-pointer"
              >
                Skip
              </button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Continue
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
