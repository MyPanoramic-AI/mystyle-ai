/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type FashionCategoryType =
  | 'All Styles'
  | 'Elegant'
  | 'Casual'
  | 'Professional'
  | 'Minimalist'
  | 'Trendy'
  | 'Romantic'
  | 'Sporty'
  | 'Evening Wear';

export interface OutfitPiece {
  id: string;
  name: string;
  category: 'Dress' | 'Tops' | 'Bottoms' | 'Outerwear' | 'Footwear' | 'Accessories';
  stylingNote?: string;
}

export interface FashionLook {
  id: string;
  title: string;
  shortDescription: string;
  category: Exclude<FashionCategoryType, 'All Styles'>;
  occasions: string[];
  seasons: Array<'Summer' | 'Winter' | 'Spring' | 'Autumn' | 'All-Season'>;
  colorPalette: string[];
  pieces: OutfitPiece[];
  whyItWorks: string;
  imageUrl: string;
  collectionIds: string[];
  matchAesthetics: string[];
}

export interface FashionCollection {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  seasonBadge?: string;
  filterTag?: string;
}

export interface SavedLookItem {
  lookId: string;
  savedAt: string;
  serverId?: string;
}
