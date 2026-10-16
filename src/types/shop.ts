/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * TypeScript definitions for South African Smart Shopping & Price Comparison
 */

export type ProductCategory =
  | 'Dresses'
  | 'Tops & Blouses'
  | 'Jeans & Trousers'
  | 'Jackets & Blazers'
  | 'Shoes'
  | 'Bags'
  | 'Jewellery & Accessories'
  | 'Activewear';

export type SouthAfricanRetailer =
  | 'Woolworths'
  | 'Mr Price'
  | 'Superbalist'
  | 'Bash'
  | 'Cotton On'
  | 'H&M'
  | 'Zara'
  | 'Takealot';

export type RetailerDataQualityState =
  | 'Verified Offer'
  | 'Price Needs Confirmation'
  | 'Similar Item'
  | 'Demo Listing'
  | 'Unavailable';

export interface ProductOffer {
  id: string;
  retailer: SouthAfricanRetailer;
  priceZar: number;
  deliveryFeeZar: number;
  estimatedTotalZar: number;
  availableSizes: string[];
  status: 'Lowest Demo Price' | 'Exact Match' | 'Similar Alternative' | 'Standard';
  dataQualityState: RetailerDataQualityState;
  inStock: boolean;
  deliveryEstimate: string;
  note?: string;
}

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  colour: string;
  sizes: string[];
  styleCategory: string;
  imageUrl: string;
  retailer: SouthAfricanRetailer;
  demoPriceZar: number;
  demoOriginalPriceZar?: number;
  demoDiscountPercent?: number;
  occasionTags: string[];
  shortDescription: string;
  longDescription: string;
  stylingSuggestions: string[];
  dataQualityState: RetailerDataQualityState;
  lastChecked: string;
  offers: ProductOffer[];
  curatedForAesthetics?: string[];
  isDemoSale?: boolean;
  isNewArrival?: boolean;
}

export interface ShoppingFilters {
  category: ProductCategory | 'All';
  retailers: SouthAfricanRetailer[];
  sizes: string[];
  colours: string[];
  minPrice: number;
  maxPrice: number;
  styleCategory: string | 'All';
  occasion: string | 'All';
  onlyDemoSale: boolean;
}

export type ShoppingSortOption =
  | 'recommended'
  | 'price-low-high'
  | 'price-high-low'
  | 'biggest-saving'
  | 'newest';

export interface PreloadedGarment {
  productId: string;
  productName: string;
  imageUrl: string;
  category: string;
  retailer: string;
  priceZar: number;
}
