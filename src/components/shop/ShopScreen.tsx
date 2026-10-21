/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Product,
  ProductCategory,
  ShoppingFilters,
  ShoppingSortOption,
  PreloadedGarment,
} from '../../types/shop';
import { UserProfile, NavigationTab } from '../../types';
import { ShopPreloadedContext } from '../pages/ShopPlaceholder';
import {
  SHOP_PRODUCTS,
  POPULAR_SEARCH_PRESETS,
  filterAndSortProducts,
} from '../../data/shopData';
import { savedProductsService } from '../../services/savedProductsService';
import { CategoryCardsCarousel } from './CategoryCardsCarousel';
import { ShopTheLookBanner } from './ShopTheLookBanner';
import { ShopFiltersDrawer } from './ShopFiltersDrawer';
import { ProductCard } from './ProductCard';
import { ProductDetailModal } from './ProductDetailModal';
import { SavedProductsView } from './SavedProductsView';
import { Button } from '../common/Button';
import {
  Search,
  X,
  SlidersHorizontal,
  ArrowUpDown,
  Sparkles,
  Heart,
  ShoppingBag,
  ArrowLeft,
  Check,
  Info,
} from 'lucide-react';

interface ShopScreenProps {
  profile?: UserProfile;
  preloadedContext?: ShopPreloadedContext | null;
  onNavigate: (tab: NavigationTab) => void;
  onSendToTryOn: (garment: PreloadedGarment) => void;
  onClearPreloadedContext?: () => void;
}

const DEFAULT_FILTERS: ShoppingFilters = {
  category: 'All',
  retailers: [],
  sizes: [],
  colours: [],
  minPrice: 0,
  maxPrice: 3500,
  styleCategory: 'All',
  occasion: 'All',
  onlyDemoSale: false,
};

export const ShopScreen: React.FC<ShopScreenProps> = ({
  profile,
  preloadedContext,
  onNavigate,
  onSendToTryOn,
  onClearPreloadedContext,
}) => {
  // Primary view tabs: Browse vs Saved
  const [activeTab, setActiveTab] = useState<'browse' | 'saved'>('browse');

  // Search & Filters State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filters, setFilters] = useState<ShoppingFilters>(DEFAULT_FILTERS);
  const [sortOption, setSortOption] = useState<ShoppingSortOption>('recommended');
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState<boolean>(false);

  // Selected product for detail modal
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Saved items count
  const [savedCount, setSavedCount] = useState<number>(() =>
    savedProductsService.getSavedProductIds().length
  );

  useEffect(() => {
    const unsubscribe = savedProductsService.subscribe(() => {
      setSavedCount(savedProductsService.getSavedProductIds().length);
    });
    return unsubscribe;
  }, []);

  // Synchronize preloaded context from Discover or Stylist
  useEffect(() => {
    if (preloadedContext) {
      setActiveTab('browse');
      // If the context mentions an outfit category or piece, seed search or category
      if (preloadedContext.category) {
        const catMatch = [
          'Dresses',
          'Tops & Blouses',
          'Jeans & Trousers',
          'Jackets & Blazers',
          'Shoes',
          'Bags',
          'Jewellery & Accessories',
          'Activewear',
        ].find((c) =>
          preloadedContext.category.toLowerCase().includes(c.toLowerCase())
        );
        if (catMatch) {
          setFilters((prev) => ({ ...prev, category: catMatch as ProductCategory }));
        }
      }
    }
  }, [preloadedContext]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage((cur) => (cur === message ? null : cur));
    }, 3200);
  };

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.category !== 'All') count++;
    if (filters.retailers.length > 0) count += filters.retailers.length;
    if (filters.sizes.length > 0) count += filters.sizes.length;
    if (filters.colours.length > 0) count += filters.colours.length;
    if (filters.maxPrice < 3500 || filters.minPrice > 0) count++;
    if (filters.styleCategory !== 'All') count++;
    if (filters.occasion !== 'All') count++;
    if (filters.onlyDemoSale) count++;
    return count;
  }, [filters]);

  // Filtered and sorted products
  const displayedProducts = useMemo(() => {
    return filterAndSortProducts(
      SHOP_PRODUCTS,
      filters,
      sortOption,
      profile,
      searchQuery
    );
  }, [filters, sortOption, profile, searchQuery]);

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setSearchQuery('');
  };

  const handleCategorySelect = (category: ProductCategory | 'All') => {
    setFilters((prev) => ({ ...prev, category }));
  };

  const handlePresetSearch = (preset: string) => {
    setSearchQuery(preset);
    setActiveTab('browse');
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-[#242326] text-white px-4 py-2.5 rounded-2xl shadow-xl text-xs font-medium flex items-center gap-2 border border-white/10 animate-in fade-in slide-in-from-bottom-4">
          <Check className="w-4 h-4 text-[#B49361]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header & Breadcrumb */}
      <div className="flex items-center justify-between text-left">
        <button
          onClick={() => onNavigate('home')}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5C585E] hover:text-[#242326] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>

        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#B49361] bg-[#FAF7F2] px-2.5 py-1 rounded-full border border-[#B49361]/25">
          South Africa Smart Retail · Demo Mode
        </span>
      </div>

      {/* Hero Title Section */}
      <div className="text-left space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#9C6A61] flex items-center gap-1">
            <ShoppingBag className="w-3.5 h-3.5" />
            Personal Shopping Assistant
          </span>
          {profile?.personal?.firstName && (
            <span className="text-[10px] text-[#5C585E]">
              · Tailored for {profile.personal.firstName}
            </span>
          )}
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#242326]">
          Shop Your Style
        </h1>
        <p className="text-xs sm:text-sm text-[#5C585E] max-w-xl">
          Beautiful finds. Smart choices. Prices that work for you.
        </p>
      </div>

      {/* Prominent Search Field with Presets */}
      <div className="space-y-2.5 text-left">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5C585E]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="What are you looking for?"
            className="w-full pl-11 pr-10 py-3.5 rounded-2xl bg-white border border-[#242326]/12 text-sm text-[#242326] placeholder-[#5C585E]/70 focus:outline-hidden focus:border-[#9C6A61] focus:ring-1 focus:ring-[#9C6A61] transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-[#5C585E] hover:text-[#242326] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Demonstration Search Suggestion Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-left">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#5C585E] shrink-0 mr-1">
            Try:
          </span>
          {POPULAR_SEARCH_PRESETS.map((preset) => (
            <button
              key={preset}
              onClick={() => handlePresetSearch(preset)}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-white border border-[#242326]/10 text-[#5C585E] hover:text-[#242326] hover:border-[#9C6A61]/40 shrink-0 transition-colors cursor-pointer"
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Shop the Look Active Context Banner (if passed from Discover or Stylist) */}
      {preloadedContext && (
        <ShopTheLookBanner
          context={preloadedContext}
          onClear={() => {
            if (onClearPreloadedContext) onClearPreloadedContext();
            handleResetFilters();
          }}
        />
      )}

      {/* Photographic Categories Carousel */}
      <CategoryCardsCarousel
        selectedCategory={filters.category}
        onSelectCategory={handleCategorySelect}
      />

      {/* Main Tab Navigation: All Items vs Saved Wishlist */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#242326]/10 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('browse')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'browse'
                ? 'bg-[#242326] text-white shadow-xs'
                : 'bg-white text-[#5C585E] hover:text-[#242326] border border-[#242326]/10'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Catalogue</span>
            <span className="text-[10px] opacity-75">({displayedProducts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('saved')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'saved'
                ? 'bg-[#242326] text-white shadow-xs'
                : 'bg-white text-[#5C585E] hover:text-[#242326] border border-[#242326]/10'
            }`}
          >
            <Heart className="w-3.5 h-3.5 text-[#9C6A61] fill-current" />
            <span>Saved Wishlist</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#FAF7F2] text-[#242326]">
              {savedCount}
            </span>
          </button>
        </div>

        {/* Mobile Filter Button */}
        {activeTab === 'browse' && (
          <button
            onClick={() => setIsFilterDrawerOpen(true)}
            className="sm:hidden px-3 py-2 rounded-xl border border-[#242326]/12 bg-white text-xs font-medium text-[#242326] flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#9C6A61]" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#9C6A61] text-white text-[9px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Main Browse Content */}
      {activeTab === 'browse' ? (
        <div className="space-y-6">
          {/* Controls Bar: Sort, Filter Button, Result Count */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left">
            <div className="text-xs text-[#5C585E]">
              Showing <strong className="text-[#242326]">{displayedProducts.length}</strong>{' '}
              curated items
              {filters.category !== 'All' && <span> in {filters.category}</span>}
              {searchQuery && <span> matching "{searchQuery}"</span>}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              {/* Filter Drawer Trigger (Desktop) */}
              <button
                onClick={() => setIsFilterDrawerOpen(true)}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#242326]/12 text-xs font-semibold text-[#242326] hover:border-[#9C6A61] transition-colors cursor-pointer shadow-2xs"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#9C6A61]" />
                <span>Filters</span>
                {activeFilterCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-[#9C6A61] text-white text-[10px] font-bold">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {/* Sorting Dropdown */}
              <div className="flex items-center gap-1.5 bg-white border border-[#242326]/12 rounded-xl px-2.5 py-1.5 shadow-2xs">
                <ArrowUpDown className="w-3.5 h-3.5 text-[#5C585E]" />
                <label htmlFor="shop-sort-select" className="text-[11px] text-[#5C585E] font-medium hidden xs:inline">
                  Sort:
                </label>
                <select
                  id="shop-sort-select"
                  aria-label="Sort products by"
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as ShoppingSortOption)}
                  className="text-xs font-semibold text-[#242326] bg-transparent focus:outline-hidden cursor-pointer"
                >
                  <option value="recommended">
                    {profile ? 'Recommended (Personalised)' : 'Recommended'}
                  </option>
                  <option value="price-low-high">Price: Low to High</option>
                  <option value="price-high-low">Price: High to Low</option>
                  <option value="biggest-saving">Biggest Demo Saving</option>
                  <option value="newest">Newest in Collection</option>
                </select>
              </div>
            </div>
          </div>

          {/* Active Filter Chips (if any active) */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-left">
              <span className="text-[10px] uppercase font-bold text-[#5C585E] mr-1">
                Active Filters:
              </span>

              {filters.category !== 'All' && (
                <span className="text-[11px] px-2.5 py-1 rounded-lg bg-white border border-[#242326]/10 text-[#242326] flex items-center gap-1">
                  Category: {filters.category}
                  <button
                    onClick={() => setFilters((p) => ({ ...p, category: 'All' }))}
                    className="hover:text-[#9C6A61]"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {filters.retailers.map((ret) => (
                <span
                  key={ret}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-white border border-[#242326]/10 text-[#242326] flex items-center gap-1"
                >
                  {ret}
                  <button
                    onClick={() =>
                      setFilters((p) => ({
                        ...p,
                        retailers: p.retailers.filter((r) => r !== ret),
                      }))
                    }
                    className="hover:text-[#9C6A61]"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              {filters.sizes.map((sz) => (
                <span
                  key={sz}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-white border border-[#242326]/10 text-[#242326] flex items-center gap-1"
                >
                  Size {sz}
                  <button
                    onClick={() =>
                      setFilters((p) => ({
                        ...p,
                        sizes: p.sizes.filter((s) => s !== sz),
                      }))
                    }
                    className="hover:text-[#9C6A61]"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              {filters.onlyDemoSale && (
                <span className="text-[11px] px-2.5 py-1 rounded-lg bg-[#FAF7F2] border border-[#9C6A61]/30 text-[#9C6A61] font-semibold flex items-center gap-1">
                  Demo Sale
                  <button
                    onClick={() => setFilters((p) => ({ ...p, onlyDemoSale: false }))}
                    className="hover:text-[#7d5048]"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              <button
                onClick={handleResetFilters}
                className="text-[11px] font-semibold text-[#9C6A61] hover:underline ml-1 cursor-pointer"
              >
                Clear All
              </button>
            </div>
          )}

          {/* Products Grid */}
          {displayedProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
              {displayedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onOpenDetail={(prod) => setSelectedProduct(prod)}
                  onTryItem={onSendToTryOn}
                  onToast={showToast}
                />
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="text-center py-16 px-4 bg-white rounded-3xl border border-[#242326]/10 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[#FAF7F2] text-[#5C585E] flex items-center justify-center mx-auto">
                <Search className="w-7 h-7" />
              </div>
              <div className="max-w-md mx-auto">
                <h3 className="font-serif text-lg font-semibold text-[#242326]">
                  No Matching Products Found
                </h3>
                <p className="text-xs sm:text-sm text-[#5C585E] mt-1.5 leading-relaxed">
                  We couldn't find items matching your current search or filters. Try adjusting your size, colour or price range.
                </p>
              </div>
              <div className="pt-2">
                <Button variant="secondary" size="md" onClick={handleResetFilters}>
                  Clear All Filters & Search
                </Button>
              </div>
            </div>
          )}

          {/* South African Retailer Quality Disclaimer */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF7F2]/60 border border-[#242326]/8 text-left space-y-1 text-xs text-[#5C585E]">
            <div className="flex items-center gap-2 text-[#242326] font-semibold">
              <Info className="w-4 h-4 text-[#B49361]" />
              <span>South African Demonstration Retail Notice</span>
            </div>
            <p className="leading-relaxed">
              All store names (Woolworths, Superbalist, Zara, Bash, H&M, Cotton On, Mr Price, Takealot), product listings, and prices shown are illustrative demonstration mockups for testing the MyStyle AI user interface. Authentic retailer APIs, automated price scrapers, and verified stock updates will be activated in Phase 2 in Cursor.
            </p>
          </div>
        </div>
      ) : (
        /* Saved Products View */
        <SavedProductsView
          onOpenDetail={(prod) => setSelectedProduct(prod)}
          onTryItem={onSendToTryOn}
          onSwitchToBrowse={() => setActiveTab('browse')}
          onToast={showToast}
        />
      )}

      {/* Filter Slide-up Drawer */}
      <ShopFiltersDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        filters={filters}
        onChangeFilters={setFilters}
        onResetFilters={handleResetFilters}
        matchingCount={displayedProducts.length}
      />

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onTryItem={onSendToTryOn}
        onToast={showToast}
      />
    </div>
  );
};
