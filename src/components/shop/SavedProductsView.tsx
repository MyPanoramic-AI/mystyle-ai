/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Product, PreloadedGarment } from '../../types/shop';
import { savedProductsService } from '../../services/savedProductsService';
import { SHOP_PRODUCTS } from '../../data/shopData';
import { ProductCard } from './ProductCard';
import { Button } from '../common/Button';
import { Heart, ShoppingBag, Sparkles, ArrowRight } from 'lucide-react';

interface SavedProductsViewProps {
  onOpenDetail: (product: Product) => void;
  onTryItem: (garment: PreloadedGarment) => void;
  onSwitchToBrowse: () => void;
  onToast?: (message: string) => void;
}

export const SavedProductsView: React.FC<SavedProductsViewProps> = ({
  onOpenDetail,
  onTryItem,
  onSwitchToBrowse,
  onToast,
}) => {
  const [savedIds, setSavedIds] = useState<string[]>(() =>
    savedProductsService.getSavedProductIds()
  );

  useEffect(() => {
    const unsubscribe = savedProductsService.subscribe(() => {
      setSavedIds(savedProductsService.getSavedProductIds());
    });
    return unsubscribe;
  }, []);

  const savedProducts = SHOP_PRODUCTS.filter((p) => savedIds.includes(p.id));

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-[#9C6A61] fill-current" />
            <h2 className="font-serif text-xl sm:text-2xl font-semibold text-[#242326]">
              Your Saved Products
            </h2>
          </div>
          <p className="text-xs text-[#5C585E] mt-0.5">
            Personal wishlist stored privately in your browser session.
          </p>
        </div>

        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#FAF7F2] border border-[#242326]/10 text-[#242326]">
          {savedProducts.length} {savedProducts.length === 1 ? 'item' : 'items'}
        </span>
      </div>

      {/* Empty State */}
      {savedProducts.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white rounded-3xl border border-[#242326]/10 space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#FAF7F2] text-[#9C6A61] flex items-center justify-center mx-auto shadow-xs">
            <Heart className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="font-serif text-lg font-semibold text-[#242326]">
              No Saved Products Yet
            </h3>
            <p className="text-xs sm:text-sm text-[#5C585E] mt-1.5 leading-relaxed">
              Tap the heart icon on any blazer, dress, shoes, or accessory while browsing to build your personal wish list.
            </p>
          </div>
          <div className="pt-2">
            <Button
              variant="primary"
              size="md"
              icon={<ShoppingBag className="w-4 h-4" />}
              onClick={onSwitchToBrowse}
            >
              Browse Shop Catalogue
            </Button>
          </div>
        </div>
      ) : (
        /* Saved Products Grid */
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
          {savedProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onOpenDetail={onOpenDetail}
              onTryItem={onTryItem}
              onToast={onToast}
            />
          ))}
        </div>
      )}
    </div>
  );
};
