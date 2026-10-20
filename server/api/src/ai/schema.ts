export type RecommendationType = 'style_suggestion' | 'clarification' | 'shopping_unavailable' | 'try_on_unavailable';
export type SpecialistId = 'style' | 'shopping' | 'try_on' | 'beauty' | 'wardrobe';
export type GarmentCategory = 'tops' | 'bottoms' | 'dresses' | 'outerwear' | 'shoes' | 'bags' | 'accessories';

export interface OutfitComponent {
  name: string;
  category: GarmentCategory;
  colour: string | null;
  notes: string | null;
}

export interface StylistReply {
  responseText: string;
  recommendationType: RecommendationType;
  specialist: SpecialistId;
  availability: 'ready' | 'not_connected';
  source: 'mock' | 'live';
  outfitTitle: string | null;
  outfitComponents: OutfitComponent[];
  suggestedColours: string[];
  accessories: string[];
  budgetGuidance: string | null;
  occasion: string | null;
  followUpQuestions: string[];
  shoppingSearchIntent: string | null;
  tryOnIntent: boolean;
  savedLookIntent: boolean;
}

const TYPES = new Set<RecommendationType>(['style_suggestion', 'clarification', 'shopping_unavailable', 'try_on_unavailable']);
const SPECIALISTS = new Set<SpecialistId>(['style', 'shopping', 'try_on', 'beauty', 'wardrobe']);
const CATEGORIES = new Set<GarmentCategory>(['tops', 'bottoms', 'dresses', 'outerwear', 'shoes', 'bags', 'accessories']);

function text(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

function textList(value: unknown, maxItems: number, maxLen: number): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean).slice(0, maxItems).map((item) => item.slice(0, maxLen));
}

export function validateStylistReply(value: unknown, source: 'mock' | 'live'): StylistReply | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  const responseText = text(raw.responseText, 2000);
  const recommendationType = raw.recommendationType;
  const specialist = raw.specialist;
  if (!responseText || typeof recommendationType !== 'string' || !TYPES.has(recommendationType as RecommendationType)) return null;
  if (typeof specialist !== 'string' || !SPECIALISTS.has(specialist as SpecialistId)) return null;
  if (/price|url|stock|retailer|sku|https?:\/\//i.test(JSON.stringify(raw.outfitComponents ?? ''))) return null;
  const components = Array.isArray(raw.outfitComponents) ? raw.outfitComponents : [];
  const outfitComponents: OutfitComponent[] = [];
  for (const item of components.slice(0, 6)) {
    if (!item || typeof item !== 'object') continue;
    const piece = item as Record<string, unknown>;
    const name = text(piece.name, 80);
    const category = piece.category;
    if (!name || typeof category !== 'string' || !CATEGORIES.has(category as GarmentCategory)) continue;
    outfitComponents.push({
      name,
      category: category as GarmentCategory,
      colour: text(piece.colour, 40),
      notes: text(piece.notes, 160),
    });
  }
  return {
    responseText,
    recommendationType: recommendationType as RecommendationType,
    specialist: specialist as SpecialistId,
    availability: raw.availability === 'not_connected' ? 'not_connected' : 'ready',
    source,
    outfitTitle: text(raw.outfitTitle, 80),
    outfitComponents,
    suggestedColours: textList(raw.suggestedColours, 6, 40),
    accessories: textList(raw.accessories, 4, 60),
    budgetGuidance: text(raw.budgetGuidance, 200),
    occasion: text(raw.occasion, 60),
    followUpQuestions: textList(raw.followUpQuestions, 2, 160),
    shoppingSearchIntent: text(raw.shoppingSearchIntent, 160),
    tryOnIntent: raw.tryOnIntent === true,
    savedLookIntent: raw.savedLookIntent === true,
  };
}
