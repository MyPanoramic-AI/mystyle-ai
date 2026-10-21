/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  ShoppingFilters,
  ProductCategory,
  SouthAfricanRetailer,
} from '../../types/shop';
import {
  SA_RETAILERS,
  DEMO_COLOURS,
  DEMO_SIZES,
  DEMO_OCCASIONS,
  DEMO_STYLE_CATEGORIES,
  SHOP_CATEGORIES,
} from '../../data/shopData';
import { Button } from '../common/Button';
import { X, SlidersHorizontal, RotateCcw, Check, Sparkles } from 'lucide-react';

interface ShopFiltersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: ShoppingFilters;
  onChangeFilters: (newFilters: ShoppingFilters) => void;
  onResetFilters: () => void;
  matchingCount: number;
}

export const ShopFiltersDrawer: React.FC<ShopFiltersDrawerProps> = ({
  isOpen,
  onClose,
  filters,
  onChangeFilters,
  onResetFilters,
  matchingCount,
}) => {
  if (!isOpen) return null;

  const handleToggleRetailer = (ret: SouthAfricanRetailer) => {
    const exists = filters.retailers.includes(ret);
    const updated = exists
      ? filters.retailers.filter((r) => r !== ret)
      : [...filters.retailers, ret];
    onChangeFilters({ ...filters, retailers: updated });
  };

  const handleToggleSize = (size: string) => {
    const exists = filters.sizes.includes(size);
    const updated = exists
      ? filters.sizes.filter((s) => s !== size)
      : [...filters.sizes, size];
    onChangeFilters({ ...filters, sizes: updated });
  };

  const handleToggleColour = (colour: string) => {
    const exists = filters.colours.includes(colour);
    const updated = exists
      ? filters.colours.filter((c) => c !== colour)
      : [...filters.colours, colour];
    onChangeFilters({ ...filters, colours: updated });
  };

  const colorHexMap: Record<string, string> = {
    Black: '#242326',
    White: '#FFFFFF',
    'Cream/Ivory': '#F6F2EC',
    Camel: '#C4A882',
    Navy: '#2C3E50',
    'Forest Green': '#1B382B',
    Blush: '#E5CDBE',
    Burgundy: '#6A1B29',
    Gold: '#B49361',
    Terracotta: '#C36B4D',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#242326]/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full sm:max-w-xl max-h-[90vh] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#242326]/8 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#FAF7F2] text-[#91635a] flex items-center justify-center">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-semibold text-[#242326]">
                Refine Shopping Catalogue
              </h2>
              <p className="text-[11px] text-[#5C585E]">
                Local South African price and style filters
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onResetFilters}
              className="inline-flex items-center gap-1 text-xs font-medium text-[#91635a] hover:text-[#7d5048] px-2 py-1 rounded-lg hover:bg-[#FAF7F2] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-[#5C585E] hover:text-[#242326] hover:bg-[#FAF7F2] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Filters Body */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1 text-left">
          {/* 1. Category */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#242326] mb-2">
              Garment Category
            </label>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => onChangeFilters({ ...filters, category: 'All' })}
                className={`text-xs px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                  filters.category === 'All'
                    ? 'bg-[#242326] text-white border-[#242326]'
                    : 'bg-white text-[#242326] border-[#242326]/15 hover:border-[#9C6A61]'
                }`}
              >
                All Categories
              </button>
              {SHOP_CATEGORIES.map((cat) => {
                const isSelected = filters.category === cat.name;
                return (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() =>
                      onChangeFilters({
                        ...filters,
                        category: isSelected ? 'All' : cat.name,
                      })
                    }
                    className={`text-xs px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#9C6A61] text-white border-[#9C6A61]'
                        : 'bg-white text-[#242326] border-[#242326]/15 hover:border-[#9C6A61]'
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. South African Retailers */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#242326]">
                Demonstration Retailers
              </label>
              <span className="text-[10px] text-[#5C585E] italic">Mock stores</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SA_RETAILERS.map((retailer) => {
                const isSelected = filters.retailers.includes(retailer);
                return (
                  <button
                    key={retailer}
                    type="button"
                    onClick={() => handleToggleRetailer(retailer)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#FAF7F2] text-[#91635a] border-[#9C6A61] font-semibold'
                        : 'bg-white text-[#242326] border-[#242326]/12 hover:border-[#242326]/30'
                    }`}
                  >
                    <span>{retailer}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#91635a]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Price Range Slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#242326]">
                Demo Price Range (ZAR)
              </label>
              <span className="text-xs font-semibold text-[#91635a]">
                R{filters.minPrice} — R{filters.maxPrice}
              </span>
            </div>
            <div className="space-y-3">
              <input
                type="range"
                min="200"
                max="3500"
                step="50"
                value={filters.maxPrice}
                onChange={(e) =>
                  onChangeFilters({
                    ...filters,
                    maxPrice: Number(e.target.value),
                  })
                }
                className="w-full accent-[#9C6A61] cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-[#5C585E]">
                <span>Min: R200</span>
                <span>Max: R3,500</span>
              </div>
            </div>
          </div>

          {/* 4. Sizes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#242326] mb-2">
              Available Sizes
            </label>
            <div className="flex flex-wrap gap-1.5">
              {DEMO_SIZES.map((size) => {
                const isSelected = filters.sizes.includes(size);
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => handleToggleSize(size)}
                    className={`w-10 h-9 rounded-xl text-xs font-medium border flex items-center justify-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#242326] text-white border-[#242326] font-semibold'
                        : 'bg-white text-[#242326] border-[#242326]/15 hover:border-[#242326]/40'
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Colours */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#242326] mb-2">
              Colours
            </label>
            <div className="flex flex-wrap gap-2">
              {DEMO_COLOURS.map((col) => {
                const isSelected = filters.colours.includes(col);
                const hex = colorHexMap[col] || '#E5CDBE';
                return (
                  <button
                    key={col}
                    type="button"
                    onClick={() => handleToggleColour(col)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#FAF7F2] text-[#91635a] border-[#9C6A61] font-semibold'
                        : 'bg-white text-[#242326] border-[#242326]/15 hover:border-[#242326]/30'
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full border border-[#242326]/20 shrink-0"
                      style={{ backgroundColor: hex }}
                    />
                    <span>{col}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 6. Style Category */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#242326] mb-2">
              Style Aesthetic
            </label>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => onChangeFilters({ ...filters, styleCategory: 'All' })}
                className={`text-xs px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                  filters.styleCategory === 'All'
                    ? 'bg-[#242326] text-white border-[#242326]'
                    : 'bg-white text-[#242326] border-[#242326]/15'
                }`}
              >
                All Aesthetics
              </button>
              {DEMO_STYLE_CATEGORIES.map((style) => {
                const isSelected = filters.styleCategory === style;
                return (
                  <button
                    key={style}
                    type="button"
                    onClick={() =>
                      onChangeFilters({
                        ...filters,
                        styleCategory: isSelected ? 'All' : style,
                      })
                    }
                    className={`text-xs px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#9C6A61] text-white border-[#9C6A61]'
                        : 'bg-white text-[#242326] border-[#242326]/15 hover:border-[#9C6A61]'
                    }`}
                  >
                    {style}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 7. Occasion */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#242326] mb-2">
              Occasion
            </label>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => onChangeFilters({ ...filters, occasion: 'All' })}
                className={`text-xs px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                  filters.occasion === 'All'
                    ? 'bg-[#242326] text-white border-[#242326]'
                    : 'bg-white text-[#242326] border-[#242326]/15'
                }`}
              >
                All Occasions
              </button>
              {DEMO_OCCASIONS.map((occ) => {
                const isSelected = filters.occasion === occ;
                return (
                  <button
                    key={occ}
                    type="button"
                    onClick={() =>
                      onChangeFilters({
                        ...filters,
                        occasion: isSelected ? 'All' : occ,
                      })
                    }
                    className={`text-xs px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#9C6A61] text-white border-[#9C6A61]'
                        : 'bg-white text-[#242326] border-[#242326]/15 hover:border-[#9C6A61]'
                    }`}
                  >
                    {occ}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 8. Demo Sale Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#242326]/8">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#866a40]" />
              <div>
                <span className="text-xs font-semibold text-[#242326]">
                  Demonstration Sale Items Only
                </span>
                <p className="text-[10px] text-[#5C585E]">
                  Show items with simulated seasonal price reductions
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={filters.onlyDemoSale}
              onChange={(e) =>
                onChangeFilters({ ...filters, onlyDemoSale: e.target.checked })
              }
              className="w-5 h-5 rounded text-[#91635a] focus:ring-[#9C6A61] accent-[#9C6A61] cursor-pointer"
            />
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 sm:p-5 border-t border-[#242326]/8 bg-[#FAF7F2]/50 flex items-center justify-between gap-3 shrink-0">
          <span className="text-xs text-[#5C585E]">
            <strong className="text-[#242326] font-semibold">{matchingCount}</strong>{' '}
            {matchingCount === 1 ? 'item matches' : 'items match'}
          </span>

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="md" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" size="md" onClick={onClose}>
              Show {matchingCount} Results
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
