/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Product, PreloadedGarment } from '../../types/shop';
import { savedProductsService } from '../../services/savedProductsService';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { Button } from '../common/Button';
import { PriceComparisonModal } from './PriceComparisonModal';
import {
  X,
  Heart,
  Shirt,
  Scale,
  ExternalLink,
  Sparkles,
  Check,
  ShieldCheck,
  Tag,
  Info,
} from 'lucide-react';

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onTryItem: (garment: PreloadedGarment) => void;
  onToast?: (message: string) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isOpen,
  onClose,
  onTryItem,
  onToast,
}) => {
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [showPriceComparison, setShowPriceComparison] = useState<boolean>(false);
  const [showRetailerNotice, setShowRetailerNotice] = useState<boolean>(false);

  useEffect(() => {
    if (product) {
      setIsSaved(savedProductsService.isProductSaved(product.id));
      setSelectedSize(product.sizes[0] || 'M');
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const handleToggleSave = () => {
    const nowSaved = savedProductsService.toggleSaveProduct(product.id);
    setIsSaved(nowSaved);
    if (onToast) {
      onToast(
        nowSaved
          ? `Saved "${product.name}" to your wishlist`
          : `Removed "${product.name}" from saved items`
      );
    }
  };

  const handleSendToTryOn = () => {
    onTryItem({
      productId: product.id,
      productName: product.name,
      imageUrl: product.imageUrl,
      category: product.category,
      retailer: product.retailer,
      priceZar: product.demoPriceZar,
    });
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#242326]/60 backdrop-blur-xs animate-in fade-in duration-200">
        <div
          className="relative w-full max-w-4xl max-h-[92vh] bg-white rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden animate-in zoom-in-95 duration-200 text-left"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button top right */}
          <button
            onClick={onClose}
            aria-label="Close product details"
            className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-white/90 text-[#242326] hover:bg-white shadow-md flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Left Column: Editorial Product Image */}
          <div className="relative w-full md:w-1/2 aspect-[4/5] md:aspect-auto md:h-full bg-[#FAF7F2] shrink-0 overflow-hidden">
            <ImageWithFallback
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent md:hidden" />

            {/* Quality & Retailer Badge Overlay */}
            <div className="absolute bottom-4 left-4 flex flex-col gap-1.5 items-start">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-lg bg-[#242326]/90 text-white backdrop-blur-xs shadow-xs">
                {product.retailer} · Demo Listing
              </span>
              <span className="text-[10px] text-white/90 drop-shadow-sm">
                {product.lastChecked}
              </span>
            </div>
          </div>

          {/* Right Column: Details & Actions */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              {/* Category, Aesthetic & Retailer Bar */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#9C6A61] bg-[#FAF7F2] px-2.5 py-1 rounded-md">
                    {product.category}
                  </span>
                  <span className="text-[10px] text-[#5C585E]">
                    {product.styleCategory} · {product.colour}
                  </span>
                </div>

                {/* Save Heart Button */}
                <button
                  onClick={handleToggleSave}
                  className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-medium ${
                    isSaved
                      ? 'bg-[#FAF7F2] border-[#9C6A61] text-[#9C6A61]'
                      : 'border-[#242326]/12 text-[#5C585E] hover:text-[#242326]'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isSaved ? 'fill-[#9C6A61]' : ''}`} />
                  <span className="hidden sm:inline">{isSaved ? 'Saved' : 'Save'}</span>
                </button>
              </div>

              {/* Title */}
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#242326] leading-tight">
                {product.name}
              </h2>

              {/* Price Banner */}
              <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#B49361]/25 flex items-baseline justify-between flex-wrap gap-2">
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-[#242326]">
                    Demo price: R{product.demoPriceZar}
                  </div>
                  {product.demoOriginalPriceZar && (
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-[#5C585E] line-through">
                        R{product.demoOriginalPriceZar}
                      </span>
                      <span className="text-xs font-semibold text-[#9C6A61]">
                        Save {product.demoDiscountPercent}% (Demo Saving)
                      </span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setShowPriceComparison(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#9C6A61] hover:text-[#7d5048] hover:underline cursor-pointer"
                >
                  <Scale className="w-3.5 h-3.5" />
                  <span>Compare {product.offers.length} Stores</span>
                </button>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#242326] mb-1.5">
                  About This Piece
                </h4>
                <p className="text-xs sm:text-sm text-[#5C585E] leading-relaxed">
                  {product.longDescription}
                </p>
              </div>

              {/* Available Sizes Selector */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#242326]">
                    Demonstration Sizes
                  </label>
                  <span className="text-[10px] text-[#5C585E]">
                    Simulated In-Stock
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setSelectedSize(sz)}
                      className={`min-w-10 h-10 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        selectedSize === sz
                          ? 'bg-[#242326] text-white border-[#242326]'
                          : 'bg-white text-[#242326] border-[#242326]/15 hover:border-[#9C6A61]'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>

              {/* Occasion Tags */}
              <div className="flex flex-wrap gap-1.5">
                {product.occasionTags.map((occ, i) => (
                  <span
                    key={i}
                    className="text-[10px] px-2.5 py-1 rounded-full bg-[#F6F2EC] text-[#242326] font-medium"
                  >
                    {occ}
                  </span>
                ))}
              </div>

              {/* Styling Suggestions Box */}
              {product.stylingSuggestions.length > 0 && (
                <div className="p-4 rounded-2xl bg-[#F6F2EC]/60 border border-[#242326]/8 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#9C6A61]">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>How to Style This Piece</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-[#5C585E]">
                    {product.stylingSuggestions.map((tip, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#B49361] mt-1.5 shrink-0" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Action Buttons Row */}
            <div className="pt-4 border-t border-[#242326]/8 space-y-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* 1. Try This Item */}
                <Button
                  variant="primary"
                  size="md"
                  icon={<Shirt className="w-4 h-4 text-[#E5CDBE]" />}
                  onClick={handleSendToTryOn}
                >
                  Try This Item
                </Button>

                {/* 2. Compare Prices */}
                <Button
                  variant="secondary"
                  size="md"
                  icon={<Scale className="w-4 h-4 text-[#B49361]" />}
                  onClick={() => setShowPriceComparison(true)}
                >
                  Compare Prices
                </Button>
              </div>

              {/* 3. Visit Retailer Action */}
              <button
                type="button"
                onClick={() => setShowRetailerNotice(true)}
                className="w-full py-2 px-4 rounded-xl text-xs font-medium text-[#5C585E] hover:text-[#242326] hover:bg-[#FAF7F2] transition-colors border border-dashed border-[#242326]/15 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Visit Retailer (Phase 2 Integration Note)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Price Comparison Modal */}
      <PriceComparisonModal
        product={product}
        isOpen={showPriceComparison}
        onClose={() => setShowPriceComparison(false)}
      />

      {/* Retailer Integration Notice Modal */}
      {showRetailerNotice && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-[#242326]/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-left space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#B49361]/15 text-[#B49361] flex items-center justify-center">
              <Info className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-semibold text-[#242326]">
                Retailer Purchase Links
              </h3>
              <p className="text-xs text-[#5C585E] mt-2 leading-relaxed">
                Direct merchant checkout and live store redirection will become available once real retailer API integrations are connected in Phase 2.
              </p>
              <p className="text-xs text-[#5C585E] mt-1.5 leading-relaxed">
                No URLs or mock purchase flows are simulated to protect transaction accuracy.
              </p>
            </div>
            <div className="pt-2 flex justify-end">
              <Button
                variant="primary"
                size="md"
                onClick={() => setShowRetailerNotice(false)}
              >
                Understood
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
