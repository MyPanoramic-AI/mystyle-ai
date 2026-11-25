import type { ChatMessage, StylistOutfitRecommendation, StylistQuickAction, UserProfile } from '../types';
import type { StylistServerMessage } from './accountApi';
import { garmentFollowUpActions } from '../data/garmentFollowUps';
import { enrichOutfitWithShopMatches } from './stylistShopMatch';
import workOfficeImg from '../assets/images/fashion_work_office_1791978399975.jpg';
import weddingGuestImg from '../assets/images/fashion_wedding_guest_1791978399342.jpg';
import weekendCasualImg from '../assets/images/fashion_weekend_casual_1791978401075.jpg';

const SWATCHES: Record<string, string> = {
  navy: '#1B2A4A',
  ivory: '#F4EDE4',
  champagne: '#E5CDBE',
  sage: '#8A9A84',
  camel: '#C4A574',
  stone: '#D9D1C7',
  sand: '#E6D3B3',
  coral: '#D9896C',
  white: '#F7F4EF',
  black: '#242326',
  gold: '#B49361',
  neutral: '#C8B8A8',
};

function imageFor(occasion: string): string {
  const value = occasion.toLowerCase();
  if (value.includes('wedding')) return weddingGuestImg;
  if (value.includes('party') || value.includes('summer') || value.includes('weekend')) return weekendCasualImg;
  return workOfficeImg;
}

function swatch(name: string): string {
  return SWATCHES[name.trim().toLowerCase()] ?? '#E5CDBE';
}

function category(value: unknown): StylistOutfitRecommendation['pieces'][number]['category'] {
  if (value === 'bottoms' || value === 'shoes' || value === 'outerwear' || value === 'accessories') return value;
  if (value === 'dresses') return 'dress';
  return 'tops';
}

function piecesFromComponents(components: unknown[]): StylistOutfitRecommendation['pieces'] {
  return components.slice(0, 6).map((item) => {
    const piece = item && typeof item === 'object' ? item as Record<string, unknown> : {};
    return {
      name: typeof piece.name === 'string' ? piece.name : 'Garment concept',
      retailer: 'Style suggestion',
      priceZar: 0,
      category: category(piece.category),
    };
  });
}

function buildConceptCard(input: {
  id: string;
  title: string;
  occasion: string;
  rationale: string;
  components: unknown[];
  colours: string[];
  accessories: string[];
  generatedMediaId: string | null;
  aesthetic?: string;
}): StylistOutfitRecommendation | undefined {
  const pieces = piecesFromComponents(input.components);
  if (!pieces.length && input.accessories.length) {
    for (const name of input.accessories.slice(0, 4)) {
      pieces.push({ name, retailer: 'Style suggestion', priceZar: 0, category: 'accessories' });
    }
  }
  if (!pieces.length && !input.generatedMediaId && !input.title) return undefined;
  return {
    id: input.id,
    title: input.title || (input.generatedMediaId ? 'Look visualization' : 'Outfit concept'),
    aesthetic: input.aesthetic || (input.generatedMediaId ? 'Generated look' : 'Style suggestion'),
    occasion: input.occasion || (input.generatedMediaId ? 'Styled look' : 'Outfit concept'),
    imageUrl: input.generatedMediaId
      ? `/api/media/${input.generatedMediaId}`
      : imageFor(input.occasion),
    stylistRationale: input.rationale,
    pieces,
    palette: (input.colours.length ? input.colours : ['ivory']).slice(0, 4).map(swatch),
    stylingTips: [],
    totalEstimatedZar: 0,
    conceptOnly: true,
  };
}

export function conceptCards(
  message: StylistServerMessage,
  profile?: UserProfile | null,
): StylistOutfitRecommendation[] {
  const recommendation = message.recommendation;
  if (!recommendation) return [];
  // Keep outfit cards for style suggestions even when a specialist notes shopping is not live-verified.
  const generatedMediaId = typeof recommendation.generatedMediaId === 'string' && recommendation.generatedMediaId.trim()
    ? recommendation.generatedMediaId.trim()
    : null;
  const colours = Array.isArray(recommendation.suggestedColours)
    ? recommendation.suggestedColours.filter((item): item is string => typeof item === 'string')
    : [];
  const accessories = Array.isArray(recommendation.accessories)
    ? recommendation.accessories.filter((item): item is string => typeof item === 'string')
    : [];
  const occasion = typeof recommendation.occasion === 'string' ? recommendation.occasion : '';
  const options = Array.isArray(recommendation.outfitOptions) ? recommendation.outfitOptions : [];
  const fromOptions: StylistOutfitRecommendation[] = [];
  for (let index = 0; index < Math.min(options.length, 3); index += 1) {
    const option = options[index];
    if (!option || typeof option !== 'object') continue;
    const row = option as Record<string, unknown>;
    const title = typeof row.title === 'string' ? row.title : `Option ${index + 1}`;
    const components = Array.isArray(row.components) ? row.components : [];
    const why = typeof row.whyItWorks === 'string' && row.whyItWorks.trim()
      ? row.whyItWorks.trim()
      : message.content;
    const card = buildConceptCard({
      id: `${message.id}-opt-${index + 1}`,
      title: `Option ${index + 1}: ${title}`,
      occasion,
      rationale: why,
      components,
      colours,
      accessories: index === 0 ? accessories : [],
      generatedMediaId: null,
      aesthetic: `Option ${index + 1}`,
    });
    if (card) fromOptions.push(enrichOutfitWithShopMatches(card, profile));
  }
  if (fromOptions.length) return fromOptions;

  const components = Array.isArray(recommendation.outfitComponents) ? recommendation.outfitComponents : [];
  if (!components.length && typeof recommendation.outfitTitle !== 'string' && !generatedMediaId) return [];
  const single = buildConceptCard({
    id: message.id,
    title: typeof recommendation.outfitTitle === 'string' ? recommendation.outfitTitle : '',
    occasion,
    rationale: message.content,
    components,
    colours,
    accessories,
    generatedMediaId,
  });
  return single ? [enrichOutfitWithShopMatches(single, profile)] : [];
}

export function conceptCard(
  message: StylistServerMessage,
  profile?: UserProfile | null,
): StylistOutfitRecommendation | undefined {
  return conceptCards(message, profile)[0];
}

export function followUps(message: StylistServerMessage, options?: { includeGarmentFollowUps?: boolean }): StylistQuickAction[] {
  const questions = message.recommendation?.followUpQuestions;
  const fromModel = Array.isArray(questions)
    ? questions.filter((item): item is string => typeof item === 'string').slice(0, 2).map((prompt, index) => ({
      id: `${message.id}-follow-${index}`,
      label: prompt,
      prompt,
      variant: 'secondary' as const,
    }))
    : [];
  if (!options?.includeGarmentFollowUps) return fromModel;
  return [...garmentFollowUpActions(message.id), ...fromModel].slice(0, 6);
}

export function toChatMessage(
  message: StylistServerMessage,
  options?: { includeGarmentFollowUps?: boolean; profile?: UserProfile | null },
): ChatMessage {
  const attachmentIds = Array.isArray(message.attachmentMediaIds) ? message.attachmentMediaIds : [];
  const userAttachments = message.role === 'user'
    ? attachmentIds.map((id, index) => ({
      name: attachmentIds.length > 1 ? `Photo ${index + 1}` : 'Attached photo',
      url: `/api/media/${id}`,
    }))
    : undefined;
  const cards = message.role === 'assistant' ? conceptCards(message, options?.profile) : [];
  return {
    id: message.id,
    sender: message.role === 'assistant' ? 'stylist' : 'user',
    timestamp: 'Saved',
    text: message.content,
    userAttachmentUrl: userAttachments?.[0]?.url,
    userAttachmentName: userAttachments?.[0]?.name,
    userAttachments,
    lookImageUrl: message.role === 'assistant'
      && typeof message.recommendation?.generatedMediaId === 'string'
      && message.recommendation.generatedMediaId.trim()
      ? `/api/media/${message.recommendation.generatedMediaId.trim()}`
      : undefined,
    outfitCard: cards[0],
    outfitCards: cards.length ? cards : undefined,
    quickActions: message.role === 'assistant'
      ? followUps(message, { includeGarmentFollowUps: options?.includeGarmentFollowUps })
      : undefined,
  };
}
