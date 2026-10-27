/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { ArrowRight, Camera, Gem, ShoppingBag } from 'lucide-react';
import { SHOP_PRODUCTS } from '../../data/shopData';
import type { PreloadedGarment, Product, ProductCategory } from '../../types/shop';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { Button } from '../common/Button';
import { ProductDetailModal } from '../shop/ProductDetailModal';

const ACCESSORY_CATEGORIES: ProductCategory[] = ['Shoes', 'Bags', 'Jewellery & Accessories'];

type AccessoryFilter = 'All' | ProductCategory;

interface AccessoriesSectionProps {
  onTryItem: (garment: PreloadedGarment) => void;
  onBrowseShop: (category: ProductCategory) => void;
}

function formatZar(value: number): string {
  return `R${value.toLocaleString('en-ZA')}`;
}

export const AccessoriesSection: React.FC<AccessoriesSectionProps> = ({
  onTryItem,
  onBrowseShop,
}) => {
  const [filter, setFilter] = useState<AccessoryFilter>('All');
  const [selected, setSelected] = useState<Product | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const accessories = useMemo(
    () => SHOP_PRODUCTS.filter((product) => ACCESSORY_CATEGORIES.includes(product.category)),
    [],
  );

  const visible = useMemo(() => {
    const list = filter === 'All' ? accessories : accessories.filter((item) => item.category === filter);
    return list.slice(0, 8);
  }, [accessories, filter]);

  const filters: AccessoryFilter[] = ['All', 'Shoes', 'Bags', 'Jewellery & Accessories'];

  return (
    <section className="mb-10 sm:mb-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold tracking-wider uppercase text-[#866a40]">
              Finish the look
            </span>
            <span className="text-[10px] font-semibold text-[#6b433e] bg-[#E5CDBE]/30 px-2 py-0.5 rounded-md">
              Try on · Compare · Buy
            </span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-[#242326]">
            Accessories to try and shop
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-[#5C585E] max-w-2xl leading-relaxed">
            Shoes, bags, jewellery, and finishing pieces from South African demo retailers. Preview in the fitting room, compare offers, or open a retailer listing.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onBrowseShop('Jewellery & Accessories')}
          icon={<ArrowRight className="w-3.5 h-3.5" />}
          className="shrink-0 self-start sm:self-auto"
        >
          Browse all accessories
        </Button>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4 pb-1">
        {filters.map((item) => {
          const active = filter === item;
          return (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                active
                  ? 'bg-[#9C6A61] text-white border-[#9C6A61]'
                  : 'bg-white text-[#5C585E] border-[#242326]/10 hover:border-[#9C6A61]/40'
              }`}
            >
              {item === 'Jewellery & Accessories' ? 'Jewellery' : item}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {visible.map((product) => (
          <article
            key={product.id}
            className="group flex flex-col rounded-2xl bg-white border border-[#242326]/10 overflow-hidden shadow-2xs hover:shadow-md hover:border-[#9C6A61]/35 transition-all"
          >
            <button
              type="button"
              onClick={() => setSelected(product)}
              className="relative aspect-[4/5] w-full overflow-hidden bg-[#FAF7F2] text-left cursor-pointer"
            >
              <ImageWithFallback
                src={product.imageUrl}
                alt={product.name}
                fallbackTitle={product.name}
                className="w-full h-full"
                imageClassName="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <span className="absolute top-2 left-2 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/95 text-[#242326] shadow-xs">
                {product.category === 'Jewellery & Accessories' ? 'Jewellery' : product.category}
              </span>
              {product.isDemoSale ? (
                <span className="absolute top-2 right-2 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#9C6A61] text-white shadow-xs">
                  Sale
                </span>
              ) : null}
            </button>

            <div className="flex flex-col flex-1 p-3 sm:p-3.5 gap-2">
              <div className="min-h-[3.25rem]">
                <p className="text-[10px] font-medium uppercase tracking-wider text-[#866a40] truncate">
                  {product.retailer}
                </p>
                <h3 className="text-xs sm:text-sm font-semibold text-[#242326] leading-snug line-clamp-2">
                  {product.name}
                </h3>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm font-semibold text-[#242326]">{formatZar(product.demoPriceZar)}</span>
                {product.demoOriginalPriceZar ? (
                  <span className="text-[11px] text-[#5C585E] line-through">
                    {formatZar(product.demoOriginalPriceZar)}
                  </span>
                ) : null}
              </div>

              <div className="mt-auto grid grid-cols-2 gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => onTryItem({
                    productId: product.id,
                    productName: product.name,
                    imageUrl: product.imageUrl,
                    category: product.category,
                    retailer: product.retailer,
                    priceZar: product.demoPriceZar,
                  })}
                  className="inline-flex items-center justify-center gap-1 min-h-[36px] px-2 rounded-xl bg-[#242326] text-white text-[11px] font-semibold hover:bg-[#343237] cursor-pointer"
                >
                  <Camera className="w-3 h-3" />
                  Try on
                </button>
                <button
                  type="button"
                  onClick={() => setSelected(product)}
                  className="inline-flex items-center justify-center gap-1 min-h-[36px] px-2 rounded-xl bg-white border border-[#242326]/12 text-[#242326] text-[11px] font-semibold hover:bg-[#F6F2EC] cursor-pointer"
                >
                  <ShoppingBag className="w-3 h-3" />
                  Buy
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-4 p-4 rounded-2xl bg-white border border-[#242326]/8 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#B49361]/15 text-[#866a40] flex items-center justify-center shrink-0">
            <Gem className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#242326]">Need a category deep dive?</p>
            <p className="text-[11px] text-[#5C585E] leading-relaxed">
              Open Shop filtered to shoes, bags, or jewellery with full price comparison across demo SA retailers.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {ACCESSORY_CATEGORIES.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => onBrowseShop(category)}
              className="px-3 py-2 rounded-xl text-[11px] font-semibold bg-[#F6F2EC] border border-[#242326]/10 hover:border-[#9C6A61]/40 text-[#242326] cursor-pointer"
            >
              {category === 'Jewellery & Accessories' ? 'Jewellery' : category}
            </button>
          ))}
        </div>
      </div>

      <ProductDetailModal
        product={selected}
        isOpen={Boolean(selected)}
        onClose={() => setSelected(null)}
        onTryItem={(garment) => {
          setSelected(null);
          onTryItem(garment);
        }}
        onToast={(message) => {
          setToast(message);
          window.setTimeout(() => setToast(null), 2500);
        }}
      />

      {toast ? (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-[#242326] text-white text-xs shadow-lg" role="status">
          {toast}
        </div>
      ) : null}
    </section>
  );
};
