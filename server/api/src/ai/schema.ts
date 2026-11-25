export type RecommendationType = 'style_suggestion' | 'clarification' | 'shopping_unavailable' | 'try_on_unavailable';
export type SpecialistId = 'style' | 'shopping' | 'try_on' | 'beauty' | 'wardrobe';
export type GarmentCategory = 'tops' | 'bottoms' | 'dresses' | 'outerwear' | 'shoes' | 'bags' | 'accessories';

export interface OutfitComponent {
  name: string;
  category: GarmentCategory;
  colour: string | null;
  notes: string | null;
}

export interface OutfitOption {
  title: string;
  components: OutfitComponent[];
  whyItWorks: string | null;
}

export interface StylistReply {
  responseText: string;
  recommendationType: RecommendationType;
  specialist: SpecialistId;
  availability: 'ready' | 'not_connected';
  source: 'mock' | 'live';
  outfitTitle: string | null;
  outfitComponents: OutfitComponent[];
  /** Exactly three complete outfit options when recommending clothes. */
  outfitOptions: OutfitOption[];
  suggestedColours: string[];
  accessories: string[];
  budgetGuidance: string | null;
  occasion: string | null;
  followUpQuestions: string[];
  shoppingSearchIntent: string | null;
  tryOnIntent: boolean;
  savedLookIntent: boolean;
  /** Model asks for a look visualization image. */
  lookVisualIntent: boolean;
  /** Short image brief from the model (optional). */
  lookVisualPrompt: string | null;
  /** Server-filled after OpenAI Images succeeds. */
  generatedMediaId: string | null;
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

function parseComponents(value: unknown, maxItems = 6): OutfitComponent[] {
  if (!Array.isArray(value)) return [];
  const outfitComponents: OutfitComponent[] = [];
  for (const item of value.slice(0, maxItems)) {
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
  return outfitComponents;
}

function parseOutfitOptions(value: unknown): OutfitOption[] {
  if (!Array.isArray(value)) return [];
  const options: OutfitOption[] = [];
  for (const item of value.slice(0, 3)) {
    if (!item || typeof item !== 'object') continue;
    const option = item as Record<string, unknown>;
    const title = text(option.title, 80);
    const components = parseComponents(option.components, 6);
    if (!title || !components.length) continue;
    options.push({
      title,
      components,
      whyItWorks: text(option.whyItWorks, 220),
    });
  }
  return options;
}

export function validateStylistReply(value: unknown, source: 'mock' | 'live'): StylistReply | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  const responseText = text(raw.responseText, 3500);
  const recommendationType = raw.recommendationType;
  const specialist = raw.specialist;
  if (!responseText || typeof recommendationType !== 'string' || !TYPES.has(recommendationType as RecommendationType)) return null;
  if (typeof specialist !== 'string' || !SPECIALISTS.has(specialist as SpecialistId)) return null;
  const componentsBlob = JSON.stringify({
    outfitComponents: raw.outfitComponents ?? '',
    outfitOptions: raw.outfitOptions ?? '',
  });
  if (/price|url|stock|retailer|sku|https?:\/\//i.test(componentsBlob)) return null;
  const outfitOptions = parseOutfitOptions(raw.outfitOptions);
  let outfitComponents = parseComponents(raw.outfitComponents);
  let outfitTitle = text(raw.outfitTitle, 80);
  // Prefer structured options; keep primary fields aligned with option 1 for older clients.
  if (outfitOptions.length) {
    if (!outfitTitle) outfitTitle = outfitOptions[0].title;
    if (!outfitComponents.length) outfitComponents = outfitOptions[0].components;
  }
  return {
    responseText,
    recommendationType: recommendationType as RecommendationType,
    specialist: specialist as SpecialistId,
    availability: raw.availability === 'not_connected' ? 'not_connected' : 'ready',
    source,
    outfitTitle,
    outfitComponents,
    outfitOptions,
    suggestedColours: textList(raw.suggestedColours, 6, 40),
    accessories: textList(raw.accessories, 4, 60),
    budgetGuidance: text(raw.budgetGuidance, 200),
    occasion: text(raw.occasion, 60),
    followUpQuestions: textList(raw.followUpQuestions, 2, 160),
    shoppingSearchIntent: text(raw.shoppingSearchIntent, 160),
    tryOnIntent: raw.tryOnIntent === true,
    savedLookIntent: raw.savedLookIntent === true,
    lookVisualIntent: raw.lookVisualIntent === true,
    lookVisualPrompt: text(raw.lookVisualPrompt, 700),
    generatedMediaId: null,
  };
}
