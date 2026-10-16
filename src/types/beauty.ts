/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type BeautyCategory =
  | 'complete-looks'
  | 'hairstyles'
  | 'hair-colours'
  | 'makeup'
  | 'nails';

export interface BeautyProductItem {
  id: string;
  name: string;
  brand: string;
  retailer: string;
  priceZar: number;
  shade?: string;
  productType: 'lipstick' | 'foundation' | 'eyeshadow' | 'blush' | 'nail-polish' | 'hair-care' | 'serum';
  imageUrl: string;
}

export interface HairstyleItem {
  id: string;
  title: string;
  category: 'hairstyles';
  length: 'short' | 'medium' | 'long' | 'updo';
  texture: 'straight' | 'wavy' | 'curly' | 'coily' | 'braided';
  vibe: string;
  description: string;
  faceShapes: string[];
  recommendedOccasions: string[];
  necklinePairings: string[];
  maintenanceLevel: 'low' | 'medium' | 'high';
  imageUrl: string;
  productsUsed?: BeautyProductItem[];
}

export interface HairColorItem {
  id: string;
  title: string;
  category: 'hair-colours';
  tone: 'warm' | 'cool' | 'neutral' | 'statement';
  shadeFamily: 'caramel-honey' | 'espresso-black' | 'copper-auburn' | 'ash-blonde' | 'burgundy-plum';
  swatchHex: string;
  description: string;
  bestSkinUndertones: string[];
  recommendedOccasions: string[];
  maintenanceLevel: 'low' | 'medium' | 'high';
  imageUrl: string;
  productsUsed?: BeautyProductItem[];
}

export interface MakeupItem {
  id: string;
  title: string;
  category: 'makeup';
  style: 'natural-glow' | 'editorial' | 'soft-glam' | 'bold-lip' | 'smokey';
  description: string;
  lipShade: string;
  lipHex: string;
  eyeLook: string;
  blushTone: string;
  blushHex: string;
  bestForTime: 'day' | 'evening' | 'versatile';
  recommendedOccasions: string[];
  imageUrl: string;
  productsUsed?: BeautyProductItem[];
}

export interface NailItem {
  id: string;
  title: string;
  category: 'nails';
  shape: 'almond' | 'square' | 'oval' | 'coffin';
  style: 'minimalist-nude' | 'glazed-donut' | 'french-modern' | 'deep-jewel' | 'nail-art';
  primaryHex: string;
  accentHex?: string;
  description: string;
  bestOutfits: string[];
  recommendedOccasions: string[];
  imageUrl: string;
  productsUsed?: BeautyProductItem[];
}

export interface CompleteBeautyLook {
  id: string;
  title: string;
  category: 'complete-looks';
  tagline: string;
  occasion: string;
  aesthetic: string;
  description: string;
  imageUrl: string;
  hairstyle: HairstyleItem;
  hairColor: HairColorItem;
  makeup: MakeupItem;
  nails: NailItem;
  matchingOutfitTitle?: string;
  curatedProducts: BeautyProductItem[];
  colorPalette: {
    name: string;
    hex: string;
  }[];
}

export interface SavedBeautyLook {
  id: string;
  title: string;
  savedAt: string;
  notes?: string;
  look?: CompleteBeautyLook;
  customSelections?: {
    hairstyle?: HairstyleItem;
    hairColor?: HairColorItem;
    makeup?: MakeupItem;
    nails?: NailItem;
  };
  totalProductsPriceZar: number;
}
