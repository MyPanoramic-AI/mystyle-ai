/**
 * Match stylist outfit concepts to demonstration catalogue listings,
 * preferring the customer's favourite retailers when set.
 */

import type { UserProfile } from '../types';
import type { OutfitPieceItem, StylistOutfitRecommendation } from '../types/stylist';
import type { Product } from '../types/shop';
import { SHOP_PRODUCTS, rankProductsForProfile } from '../data/shopData';
import type { ShopPreloadedContext } from '../components/pages/ShopPlaceholder';

function categoryToShop(category: OutfitPieceItem['category']): string[] {
  if (category === 'dress') return ['Dresses'];
  if (category === 'tops') return ['Tops & Blouses', 'Activewear'];
  if (category === 'bottoms') return ['Jeans & Trousers', 'Activewear'];
  if (category === 'outerwear') return ['Jackets & Blazers'];
  if (category === 'shoes') return ['Shoes'];
  if (category === 'accessories') return ['Bags', 'Jewellery & Accessories'];
  return [];
}

function tokens(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((part) => part.length > 2);
}

function scoreProductForPiece(product: Product, piece: OutfitPieceItem, preferredRetailers: string[]): number {
  let score = 0;
  const shopCats = categoryToShop(piece.category);
  if (shopCats.includes(product.category)) score += 8;
  const pieceTokens = tokens(piece.name);
  const haystack = `${product.name} ${product.shortDescription} ${product.colour}`.toLowerCase();
  for (const token of pieceTokens) {
    if (haystack.includes(token)) score += 3;
  }
  if (piece.category === 'shoes' && /heel|loafer|sandal|sneaker|flat|boot/.test(piece.name.toLowerCase())) {
    if (haystack.includes('heel') || haystack.includes('loafer') || haystack.includes('sandal') || haystack.includes('sneaker')) {
      score += 2;
    }
  }
  if (preferredRetailers.length) {
    const preferred = preferredRetailers.some((retailer) => {
      const left = retailer.toLowerCase();
      const right = product.retailer.toLowerCase();
      return left.includes(right) || right.includes(left);
    });
    if (preferred) score += 10;
    else score -= 2;
  }
  return score;
}

export function matchShopProductForPiece(
  piece: OutfitPieceItem,
  profile?: UserProfile | null,
): Product | null {
  const preferred = profile?.shopping?.favoriteRetailers ?? [];
  let best: Product | null = null;
  let bestScore = 0;
  for (const product of SHOP_PRODUCTS) {
    const score = scoreProductForPiece(product, piece, preferred);
    if (score > bestScore) {
      best = product;
      bestScore = score;
    }
  }
  return bestScore >= 8 ? best : null;
}

export function enrichOutfitWithShopMatches(
  outfit: StylistOutfitRecommendation,
  profile?: UserProfile | null,
): StylistOutfitRecommendation {
  const pieces = outfit.pieces.map((piece) => {
    const match = matchShopProductForPiece(piece, profile);
    if (!match) return piece;
    return {
      ...piece,
      name: match.name,
      retailer: match.retailer,
      priceZar: match.demoPriceZar,
      inStock: match.offers?.some((offer) => offer.inStock) ?? true,
      productId: match.id,
    };
  });
  const matched = pieces.filter((piece) => Boolean((piece as OutfitPieceItem & { productId?: string }).productId));
  const totalEstimatedZar = pieces.reduce((sum, piece) => sum + (piece.priceZar || 0), 0);
  return {
    ...outfit,
    pieces,
    totalEstimatedZar,
    conceptOnly: matched.length === 0,
    imageUrl: matched[0]
      ? (SHOP_PRODUCTS.find((product) => product.id === (matched[0] as OutfitPieceItem & { productId?: string }).productId)?.imageUrl || outfit.imageUrl)
      : outfit.imageUrl,
  };
}

export function shopContextFromOutfit(
  outfit: StylistOutfitRecommendation,
  profile?: UserProfile | null,
): ShopPreloadedContext {
  const enriched = enrichOutfitWithShopMatches(outfit, profile);
  const focus = enriched.pieces.find((piece) => (piece as OutfitPieceItem & { productId?: string }).productId) as
    | (OutfitPieceItem & { productId?: string })
    | undefined;
  const preferred = profile?.shopping?.favoriteRetailers?.filter(Boolean) ?? [];
  return {
    outfitTitle: enriched.title,
    category: enriched.occasion || enriched.pieces[0]?.category || 'tops',
    pieces: enriched.pieces.map((piece) => {
      const label = piece.retailer && piece.retailer !== 'Style suggestion'
        ? `${piece.name} · ${piece.retailer}`
        : piece.name;
      return label;
    }),
    focusProductId: focus?.productId,
    preferredRetailers: preferred.length ? preferred : undefined,
  };
}

/** Fallback products for a look when piece matching is weak. */
export function suggestedShopProductsForLook(
  outfit: StylistOutfitRecommendation,
  profile?: UserProfile | null,
  limit = 6,
): Product[] {
  const query = [outfit.title, outfit.occasion, ...outfit.pieces.map((piece) => piece.name)].join(' ');
  const ranked = rankProductsForProfile(SHOP_PRODUCTS, profile ?? undefined, Math.max(limit * 3, 12));
  const preferred = profile?.shopping?.favoriteRetailers ?? [];
  const scored = ranked.map((product) => {
    let score = 0;
    const haystack = `${product.name} ${product.category} ${product.styleCategory}`.toLowerCase();
    for (const token of tokens(query)) {
      if (haystack.includes(token)) score += 2;
    }
    if (preferred.some((retailer) => {
      const left = retailer.toLowerCase();
      const right = product.retailer.toLowerCase();
      return left.includes(right) || right.includes(left);
    })) score += 5;
    return { product, score };
  });
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((row) => row.product);
}
