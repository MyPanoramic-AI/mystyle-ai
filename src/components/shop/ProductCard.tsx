/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Product, PreloadedGarment } from '../../types/shop';
import { savedProductsService } from '../../services/savedProductsService';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { Heart, Sparkles, Shirt } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onOpenDetail: (product: Product) => void;
  onTryItem: (garment: PreloadedGarment) => void;
  onToast?: (message: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onOpenDetail,
  onTryItem,
  onToast,
}) => {
  const [isSaved, setIsSaved] = useState(() =>
    savedProductsService.isProductSaved(product.id)
  );

  useEffect(() => {
    const unsubscribe = savedProductsService.subscribe(() => {
      setIsSaved(savedProductsService.isProductSaved(product.id));
    });
    return unsubscribe;
  }, [product.id]);

  const handleToggleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    void savedProductsService.toggleSaveProduct(product.id).then((nowSaved) => {
      setIsSaved(nowSaved);
      if (onToast) {
        onToast(
          nowSaved
            ? `Saved demonstration reference for "${product.name}"`
            : `Removed "${product.name}" from saved`,
        );
      }
    }).catch(() => {
      if (onToast) onToast('That wishlist change could not be saved.');
    });
  };

  const handleTryClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onTryItem({
      productId: product.id,
      productName: product.name,
      imageUrl: product.imageUrl,
      category: product.category,
      retailer: product.retailer,
      priceZar: product.demoPriceZar,
    });
  };

  return (
    <div
      onClick={() => onOpenDetail(product)}
      className="group relative flex flex-col rounded-2xl bg-white border border-[#242326]/10 overflow-hidden shadow-2xs hover:shadow-md transition-all duration-300 hover:border-[#9C6A61]/40 cursor-pointer"
    >
      {/* Product Image Area */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#FAF7F2]">
        <ImageWithFallback
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />

        {/* Subtle Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-start justify-between pointer-events-none">
          <div className="flex flex-col gap-1 items-start">
            <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/95 text-[#242326] shadow-xs backdrop-blur-xs">
              {product.category}
            </span>

            {product.isDemoSale && product.demoDiscountPercent && (
              <span className="text-[9px] font-bold tracking-wider px-2 py-0.5 rounded-md bg-[#9C6A61] text-white shadow-xs">
                -{product.demoDiscountPercent}% DEMO
              </span>
            )}
          </div>

          {/* Favourite Button (interactive) */}
          <button
            onClick={handleToggleSave}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all pointer-events-auto shadow-xs cursor-pointer ${
              isSaved
                ? 'bg-[#9C6A61] text-white'
                : 'bg-white/90 text-[#242326] hover:bg-white hover:text-[#91635a]'
            }`}
            title={isSaved ? 'Remove from saved' : 'Save product'}
          >
            <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Try It On — visible on touch; reinforced on hover for desktop */}
        <div className="absolute inset-x-2 bottom-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
          <button
            type="button"
            onClick={handleTryClick}
            aria-label={`Try It On ${product.name}`}
            className="w-full py-2 px-3 rounded-xl bg-[#242326]/90 hover:bg-[#242326] text-white text-xs font-medium flex items-center justify-center gap-1.5 shadow-lg backdrop-blur-xs transition-colors cursor-pointer"
          >
            <Shirt className="w-3.5 h-3.5 text-[#E5CDBE]" />
            <span>Try It On</span>
          </button>
        </div>
      </div>

      {/* Card Information */}
      <div className="p-3 sm:p-4 flex flex-col flex-1 justify-between">
        <div>
          {/* Retailer & Demo Quality Label */}
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-[11px] font-medium text-[#5C585E] truncate">
              {product.retailer}
            </span>
            <span className="text-[9px] font-semibold text-[#866a40] uppercase tracking-wider shrink-0 bg-[#FAF7F2] px-1.5 py-0.5 rounded">
              Demo Listing
            </span>
          </div>

          {/* Product Name */}
          <h3 className="font-serif text-xs sm:text-sm font-semibold text-[#242326] line-clamp-2 leading-snug group-hover:text-[#91635a] transition-colors">
            {product.name}
          </h3>

          {/* Colour and style tag */}
          <p className="text-[10px] text-[#5C585E] mt-1 line-clamp-1">
            {product.colour} · {product.styleCategory}
          </p>
        </div>

        {/* Price & Action Row */}
        <div className="mt-3 pt-2.5 border-t border-[#242326]/6 flex items-baseline justify-between">
          <div>
            <div className="text-xs sm:text-sm font-semibold text-[#242326]">
              Demo: R{product.demoPriceZar}
            </div>
            {product.demoOriginalPriceZar && (
              <span className="text-[10px] text-[#5C585E] line-through">
                R{product.demoOriginalPriceZar}
              </span>
            )}
          </div>

          <span className="text-[10px] font-semibold text-[#91635a] group-hover:underline">
            View Details
          </span>
        </div>
      </div>
    </div>
  );
};
