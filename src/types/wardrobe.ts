/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Types for MyStyle AI - Digital Wardrobe & Intelligent Outfit Planning.
 */

export type WardrobeCategory =
  | 'tops'
  | 'bottoms'
  | 'dresses'
  | 'outerwear'
  | 'shoes'
  | 'bags'
  | 'accessories';

export type WardrobeSeason = 'summer' | 'autumn' | 'winter' | 'spring' | 'all-season';

export type WardrobeOccasion =
  | 'work'
  | 'evening'
  | 'casual'
  | 'cocktail'
  | 'formal'
  | 'weekend'
  | 'vacation'
  | 'travel';

export interface WardrobeItem {
  id: string;
  name: string;
  category: WardrobeCategory;
  subcategory: string;
  brand: string;
  color: string;
  colorHex: string;
  sizeLabel?: string;
  seasons: WardrobeSeason[];
  occasions: WardrobeOccasion[];
  imageUrl: string;
  timesWorn: number;
  lastWornDate?: string;
  dateAdded: string;
  isFavorite: boolean;
  isCapsuleStaple: boolean;
  fabric?: string;
  careNote?: string;
  pairingNotes?: string;
}

export interface WardrobeOutfitSlotMap {
  topId?: string;
  bottomId?: string;
  dressId?: string;
  outerwearId?: string;
  shoesId?: string;
  bagId?: string;
  accessoryIds?: string[];
}

export interface WardrobeOutfit {
  id: string;
  title: string;
  description: string;
  occasion: string;
  season: string;
  slots: WardrobeOutfitSlotMap;
  harmonyScore: number;
  harmonyCritique: string;
  colorPalette: { name: string; hex: string }[];
  isFavorite: boolean;
  dateCreated: string;
  lastWornDate?: string;
  wearCount: number;
}

export interface PlannedEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  location: string;
  occasion: string;
  weatherForecast: string;
  outfitId?: string;
  outfitTitle?: string;
  notes?: string;
  completed?: boolean;
}

export interface WardrobeGap {
  id: string;
  title: string;
  category: WardrobeCategory;
  whyMissing: string;
  outfitPotentialCount: number;
  recommendedRetailers: string[];
  estimatedPriceZar: number;
  searchQuery: string;
  imageUrl: string;
  priority: 'essential' | 'high' | 'recommended';
}

export interface CapsuleCollection {
  id: string;
  title: string;
  subtitle: string;
  itemCount: number;
  potentialOutfitsCount: number;
  description: string;
  season: string;
  itemIds: string[];
  imageUrl: string;
}
