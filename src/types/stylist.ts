/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface OutfitPieceItem {
  name: string;
  retailer: string;
  priceZar: number;
  category: 'tops' | 'bottoms' | 'dress' | 'shoes' | 'outerwear' | 'accessories';
  retailerUrl?: string;
  inStock?: boolean;
}

export interface StylistOutfitRecommendation {
  id: string;
  title: string;
  aesthetic: string;
  occasion: string;
  imageUrl: string;
  stylistRationale: string;
  pieces: OutfitPieceItem[];
  palette: string[];
  stylingTips: string[];
  matchScore?: number;
  totalEstimatedZar: number;
}

export interface StylistBeautyTip {
  hairstyle: {
    title: string;
    description: string;
    imageUrl?: string;
  };
  makeup: {
    title: string;
    description: string;
    palette: string[];
  };
  nails: {
    title: string;
    colorName: string;
    hex: string;
  };
}

export interface StylistQuickAction {
  id: string;
  label: string;
  icon?: string;
  prompt: string;
  variant?: 'primary' | 'secondary' | 'neutral';
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'stylist';
  timestamp: string;
  text: string;
  outfitCard?: StylistOutfitRecommendation;
  beautyTip?: StylistBeautyTip;
  quickActions?: StylistQuickAction[];
  userAttachmentUrl?: string;
  userAttachmentName?: string;
  isSaved?: boolean;
}

export interface StylistFilterLens {
  occasion: string;
  formality: 'Relaxed' | 'Smart-Casual' | 'Formal' | 'Black-Tie';
  budgetTier: string;
}
