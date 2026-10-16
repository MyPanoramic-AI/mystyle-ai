/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * TypeScript definitions for Family Profiles & Coordinated Family Styling
 */

export type FamilyRelationship =
  | 'Partner / Spouse'
  | 'Son'
  | 'Daughter'
  | 'Parent'
  | 'Other Family Member';

export type FamilyClassification = 'Adult' | 'Child';

export interface FamilyClothingSizes {
  topsSize: string;
  bottomsSize: string;
  shoeSize: string;
  dressSize?: string;
}

export interface FamilyProfile {
  id: string;
  name: string;
  relationship: FamilyRelationship;
  classification: FamilyClassification;
  ageRange?: string;
  sizes: FamilyClothingSizes;
  favoriteStyles: string[];
  favoriteColors: string[];
  comfortPreferences: string[];
  individualBudgetZar?: number;
  avatarSeed?: string;
  photoConsentNotice?: string;
  createdAt: string;
}

export type OccasionType =
  | 'Wedding'
  | 'Family Dinner'
  | 'Birthday Celebration'
  | 'Holiday'
  | 'Family Photoshoot'
  | 'Graduation'
  | 'Christmas Celebration'
  | 'Formal Event'
  | 'Casual Weekend Outing';

export type FormalityLevel =
  | 'Casual'
  | 'Smart Casual'
  | 'Semi-Formal'
  | 'Formal'
  | 'Black Tie';

export type StyleDirection =
  | 'Coordinated Colours'
  | 'Complementary Outfits'
  | 'Matching Theme'
  | 'Elegant & Classic'
  | 'Modern & Trendy'
  | 'Relaxed & Comfortable';

export interface ColorPaletteOption {
  id: string;
  name: string;
  colors: string[];
  description: string;
  recommendedFor: OccasionType[];
}

export interface FamilyOutfitPiece {
  id: string;
  name: string;
  category: string;
  estimatedPriceZar: number;
}

export interface FamilyOutfitConcept {
  id: string;
  familyMemberId: string;
  familyMemberName: string;
  conceptTitle: string;
  imageUrl: string;
  pieces: FamilyOutfitPiece[];
  colorPalette: string[];
  stylingExplanation: string;
  styleCategory: string;
  allocatedBudgetZar: number;
}

export interface FamilyBudgetAllocation {
  familyMemberId: string;
  familyMemberName: string;
  allocatedAmountZar: number;
}

export type ShoppingItemStatus = 'Planned' | 'Already Owned' | 'Need to Buy';

export interface FamilyShoppingItem {
  id: string;
  familyMemberId: string;
  familyMemberName: string;
  pieceName: string;
  category: string;
  status: ShoppingItemStatus;
  estimatedPriceZar: number;
  sizeSuggestion?: string;
}

export interface FamilyStylePlan {
  id: string;
  title: string;
  occasion: OccasionType;
  eventDate?: string;
  formality: FormalityLevel;
  styleDirection: StyleDirection;
  colorPalette: ColorPaletteOption;
  totalBudgetZar: number;
  participatingMemberIds: string[];
  outfitConcepts: FamilyOutfitConcept[];
  budgetAllocations: FamilyBudgetAllocation[];
  shoppingItems: FamilyShoppingItem[];
  coordinationNote: string;
  savedAt: string;
}
