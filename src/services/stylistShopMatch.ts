/**
 * Match stylist outfit concepts to demonstration catalogue listings,
 * preferring the customer's favourite retailers when set.
 * Owned wardrobe pieces keep their names/images and are never sold as shop demos.
 */

import type { UserProfile } from '../types';
import type { OutfitPieceItem, StylistOutfitRecommendation } from '../types/stylist';
import type { Product } from '../types/shop';
import type { WardrobeItem } from '../types/wardrobe';
import { SHOP_PRODUCTS, rankProductsForProfile } from '../data/shopData';
import type { ShopPreloadedContext } from '../components/pages/ShopPlaceholder';

const STOP = new Set([
  'the', 'and', 'with', 'from', 'your', 'wardrobe', 'already', 'owned', 'own',
  'piece', 'item', 'look', 'option', 'soft', 'fine', 'gauge',
]);

function categoryToShop(category: OutfitPieceItem['category']): string[] {
  if (category === 'dress') return ['Dresses'];
  if (category === 'tops') return ['Tops & Blouses', 'Activewear'];
  if (category === 'bottoms') return ['Jeans & Trousers', 'Activewear'];
  if (category === 'outerwear') return ['Jackets & Blazers'];
  if (category === 'shoes') return ['Shoes'];
  if (category === 'accessories') return ['Bags', 'Jewellery & Accessories'];
  return [];
}

function wardrobeCategoryToPiece(category: WardrobeItem['category']): OutfitPieceItem['category'] {
  if (category === 'dresses') return 'dress';
  if (category === 'bags') return 'accessories';
  if (category === 'tops' || category === 'bottoms' || category === 'outerwear' || category === 'shoes' || category === 'accessories') {
    return category;
  }
  return 'tops';
}

function tokens(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((part) => part.length > 2 && !STOP.has(part));
}

function tokenOverlapScore(left: string, right: string): number {
  const a = tokens(left);
  const b = new Set(tokens(right));
  let score = 0;
  for (const token of a) {
    if (b.has(token)) score += 3;
  }
  return score;
}

export function isWardrobeLabeledPiece(piece: { name: string; notes?: string | null; owned?: boolean }): boolean {
  if (piece.owned === true) return true;
  const blob = `${piece.name} ${piece.notes ?? ''}`.toLowerCase();
  return /\bfrom (your )?wardrobe\b|\balready own(?:ed)?\b|\bin (?:your )?wardrobe\b|\bowned piece\b/.test(blob);
}

export function displayPieceName(name: string): string {
  return name
    .replace(/\s*\((?:from (?:your )?wardrobe|already owned|owned)\)\s*/gi, ' ')
    .replace(/\s*[-–—]\s*(?:from (?:your )?wardrobe|already owned)\s*/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function scoreProductForPiece(product: Product, piece: OutfitPieceItem, preferredRetailers: string[]): { score: number; nameHits: number } {
  let score = 0;
  const shopCats = categoryToShop(piece.category);
  if (shopCats.includes(product.category)) score += 4;
  const nameHits = tokenOverlapScore(piece.name, `${product.name} ${product.shortDescription} ${product.colour}`);
  score += nameHits;
  if (piece.category === 'shoes' && /heel|loafer|sandal|sneaker|flat|boot|slipper|pump/.test(piece.name.toLowerCase())) {
    if (/heel|loafer|sandal|sneaker|flat|boot|slipper|pump/.test(`${product.name} ${product.shortDescription}`.toLowerCase())) {
      score += 2;
    }
  }
  if (preferredRetailers.length) {
    const preferred = preferredRetailers.some((retailer) => {
      const left = retailer.toLowerCase();
      const right = product.retailer.toLowerCase();
      return left.includes(right) || right.includes(left);
    });
    if (preferred) score += 6;
    else score -= 2;
  }
  return { score, nameHits };
}

export function matchShopProductForPiece(
  piece: OutfitPieceItem,
  profile?: UserProfile | null,
): Product | null {
  if (piece.owned || isWardrobeLabeledPiece(piece)) return null;
  const preferred = profile?.shopping?.favoriteRetailers ?? [];
  let best: Product | null = null;
  let bestScore = 0;
  let bestNameHits = 0;
  for (const product of SHOP_PRODUCTS) {
    const { score, nameHits } = scoreProductForPiece(product, piece, preferred);
    if (score > bestScore) {
      best = product;
      bestScore = score;
      bestNameHits = nameHits;
    }
  }
  // Require real name overlap — category alone must never rename a wardrobe gown into an unrelated midi dress.
  if (bestNameHits < 3 || bestScore < 10) return null;
  return best;
}

export function matchWardrobeItemForPiece(
  piece: { name: string; category: OutfitPieceItem['category']; notes?: string | null; owned?: boolean },
  wardrobeItems: WardrobeItem[] | null | undefined,
): WardrobeItem | null {
  if (!wardrobeItems?.length) return null;
  const labeled = isWardrobeLabeledPiece(piece);
  const cleanName = displayPieceName(piece.name);
  let best: WardrobeItem | null = null;
  let bestScore = 0;
  for (const item of wardrobeItems) {
    let score = tokenOverlapScore(cleanName, `${item.name} ${item.color} ${item.subcategory}`);
    if (wardrobeCategoryToPiece(item.category) === piece.category) score += 2;
    if (labeled) score += 1;
    if (score > bestScore) {
      best = item;
      bestScore = score;
    }
  }
  if (!best) return null;
  if (labeled && bestScore >= 3) return best;
  if (bestScore >= 6) return best;
  return null;
}

function heroImageFor(
  pieces: OutfitPieceItem[],
  fallback: string,
): string {
  const ownedHero = pieces.find((piece) => piece.owned && piece.imageUrl)
    || pieces.find((piece) => piece.owned && piece.imageUrl && (piece.category === 'dress' || piece.category === 'tops' || piece.category === 'outerwear'));
  if (ownedHero?.imageUrl) return ownedHero.imageUrl;
  const shopHero = pieces.find((piece) => piece.productId && piece.imageUrl);
  if (shopHero?.imageUrl && !pieces.some((piece) => piece.owned)) return shopHero.imageUrl;
  return fallback;
}

export function enrichOutfitWithShopMatches(
  outfit: StylistOutfitRecommendation,
  profile?: UserProfile | null,
  wardrobeItems?: WardrobeItem[] | null,
): StylistOutfitRecommendation {
  const pieces = outfit.pieces.map((piece) => {
    const wardrobeHit = matchWardrobeItemForPiece(piece, wardrobeItems);
    if (wardrobeHit || isWardrobeLabeledPiece(piece)) {
      return {
        ...piece,
        name: displayPieceName(wardrobeHit?.name || piece.name),
        retailer: wardrobeHit?.brand?.trim() || 'Your wardrobe',
        priceZar: 0,
        inStock: undefined,
        productId: undefined,
        owned: true,
        wardrobeItemId: wardrobeHit?.id,
        imageUrl: wardrobeHit?.imageUrl || piece.imageUrl,
      } satisfies OutfitPieceItem;
    }

    const match = matchShopProductForPiece(piece, profile);
    if (!match) {
      return {
        ...piece,
        name: displayPieceName(piece.name),
        retailer: piece.retailer || 'Style suggestion',
        priceZar: 0,
        productId: undefined,
        owned: false,
      } satisfies OutfitPieceItem;
    }
    return {
      ...piece,
      name: match.name,
      retailer: match.retailer,
      priceZar: match.demoPriceZar,
      inStock: match.offers?.some((offer) => offer.inStock) ?? true,
      productId: match.id,
      owned: false,
      imageUrl: match.imageUrl,
    } satisfies OutfitPieceItem;
  });

  const shopPieces = pieces.filter((piece) => Boolean(piece.productId) && !piece.owned);
  const ownedCount = pieces.filter((piece) => piece.owned).length;
  const totalEstimatedZar = shopPieces.reduce((sum, piece) => sum + (piece.priceZar || 0), 0);
  const conceptOnly = shopPieces.length === 0;

  return {
    ...outfit,
    pieces,
    totalEstimatedZar,
    conceptOnly,
    ownedPieceCount: ownedCount,
    imageUrl: heroImageFor(pieces, outfit.imageUrl),
  };
}

const SHOP_CATEGORY_BY_PIECE: Record<OutfitPieceItem['category'], string> = {
  dress: 'Dresses',
  tops: 'Tops & Blouses',
  bottoms: 'Jeans & Trousers',
  outerwear: 'Jackets & Blazers',
  shoes: 'Shoes',
  accessories: 'Jewellery & Accessories',
};

const FOOTWEAR_TYPE_TOKENS = [
  'pump', 'pumps', 'heel', 'heels', 'loafer', 'loafers', 'sandal', 'sandals',
  'sneaker', 'sneakers', 'flat', 'flats', 'boot', 'boots', 'slipper', 'slippers',
  'mule', 'mules', 'trainer', 'trainers', 'stiletto', 'ballet',
];

/** Build a short catalogue search from shoppable gap pieces — never wardrobe-owned labels. */
export function shopSearchQueryFromOutfit(outfit: StylistOutfitRecommendation): string {
  const gapPieces = outfit.pieces.filter((piece) => !piece.owned);
  const sources = gapPieces.length ? gapPieces : [];
  // Shoes-only gaps: browse the Shoes category — specific colour/fabric names rarely exist in demo stock.
  if (sources.length > 0 && sources.every((piece) => piece.category === 'shoes')) {
    const footwearTypes: string[] = [];
    for (const piece of sources) {
      for (const token of tokens(displayPieceName(piece.name))) {
        if (FOOTWEAR_TYPE_TOKENS.includes(token) && !footwearTypes.includes(token) && footwearTypes.length < 3) {
          footwearTypes.push(token);
        }
      }
    }
    return footwearTypes.join(' ');
  }
  const keywords: string[] = [];
  for (const piece of sources) {
    const clean = displayPieceName(piece.name)
      .replace(/\b(your wardrobe|style suggestion|demonstration|from wardrobe)\b/gi, ' ')
      .trim();
    for (const token of tokens(clean)) {
      if (!keywords.includes(token) && keywords.length < 5) keywords.push(token);
    }
  }
  if (keywords.length) return keywords.join(' ');
  // Fully owned looks: leave search empty so the full catalogue still shows.
  return '';
}

export function shopContextFromOutfit(
  outfit: StylistOutfitRecommendation,
  profile?: UserProfile | null,
  wardrobeItems?: WardrobeItem[] | null,
  opts?: {
    lookImageUrl?: string | null;
    /** Force shop category (e.g. Bags / Shoes finishing browse). */
    categoryOverride?: string;
    searchQueryOverride?: string;
  },
): ShopPreloadedContext {
  const enriched = enrichOutfitWithShopMatches(outfit, profile, wardrobeItems);
  const focus = enriched.pieces.find((piece) => piece.productId && !piece.owned);
  const preferred = profile?.shopping?.favoriteRetailers?.filter(Boolean) ?? [];
  const gapPieces = enriched.pieces.filter((piece) => !piece.owned);
  const primaryGap = gapPieces[0];
  const category = opts?.categoryOverride
    || (primaryGap
      ? SHOP_CATEGORY_BY_PIECE[primaryGap.category]
      : (enriched.pieces[0] ? SHOP_CATEGORY_BY_PIECE[enriched.pieces[0].category] : 'All'));
  const lookImageUrl = opts?.lookImageUrl?.trim() || undefined;
  // Always list the full outfit so Shop the Look shows what was just styled/generated.
  const pieceLabels = enriched.pieces.map((piece) => {
    if (piece.owned) return `${piece.name} · In your wardrobe`;
    const label = piece.retailer && piece.retailer !== 'Style suggestion'
      ? `${piece.name} · ${piece.retailer}`
      : piece.name;
    return label;
  });
  return {
    outfitTitle: enriched.title,
    category,
    pieces: pieceLabels,
    searchQuery: opts?.searchQueryOverride ?? shopSearchQueryFromOutfit(enriched),
    focusProductId: focus?.productId,
    // Prefer retailers in ranking only — hard-filtering them empties the shoe/accessory grids.
    preferredRetailers: preferred.length ? preferred : undefined,
    lookImageUrl,
    completeWith: lookImageUrl
      ? {
          name: enriched.title,
          imageUrl: lookImageUrl,
          category: primaryGap?.category || enriched.pieces[0]?.category || 'dress',
        }
      : undefined,
  };
}

/** Fallback products for a look when piece matching is weak. */
export function suggestedShopProductsForLook(
  outfit: StylistOutfitRecommendation,
  profile?: UserProfile | null,
  limit = 6,
): Product[] {
  const gapNames = outfit.pieces.filter((piece) => !piece.owned).map((piece) => piece.name);
  const query = [outfit.title, outfit.occasion, ...(gapNames.length ? gapNames : outfit.pieces.map((piece) => piece.name))].join(' ');
  const ranked = rankProductsForProfile(SHOP_PRODUCTS, profile ?? undefined, Math.max(limit * 3, 12));
  const preferred = profile?.shopping?.favoriteRetailers ?? [];
  const scored = ranked.map((product) => {
    let score = 0;
    const haystack = `${product.name} ${product.category} ${product.styleCategory}`;
    score += tokenOverlapScore(query, haystack);
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
