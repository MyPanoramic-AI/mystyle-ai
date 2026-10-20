import type { StylistReply } from './schema.js';

function unavailable(specialist: StylistReply['specialist'], recommendationType: StylistReply['recommendationType'], responseText: string, extra: Partial<StylistReply> = {}): StylistReply {
  return {
    responseText,
    recommendationType,
    specialist,
    availability: 'not_connected',
    source: 'mock',
    outfitTitle: null,
    outfitComponents: [],
    suggestedColours: [],
    accessories: [],
    budgetGuidance: null,
    occasion: null,
    followUpQuestions: [],
    shoppingSearchIntent: null,
    tryOnIntent: false,
    savedLookIntent: false,
    ...extra,
  };
}

export function shoppingUnavailable(request: string): StylistReply {
  return unavailable('shopping', 'shopping_unavailable', 'Verified retailer shopping is not connected. I have not searched a shop, and I cannot give a price, a promotion, or a product link.', {
    shoppingSearchIntent: request.slice(0, 160),
  });
}

export function tryOnUnavailable(): StylistReply {
  return unavailable('try_on', 'try_on_unavailable', 'Virtual try-on is not connected. I cannot generate or analyse a photograph. I can still describe an outfit concept if you tell me the occasion.', {
    tryOnIntent: true,
  });
}

export function beautyUnavailable(): StylistReply {
  return unavailable('beauty', 'clarification', 'Beauty guidance for hair, makeup, and nails is not connected yet. I can still help with clothing colours and outfit concepts.');
}

export function wardrobeUnavailable(): StylistReply {
  return unavailable('wardrobe', 'clarification', 'Your saved wardrobe is not connected, so I will not guess which clothes you already own.');
}

export function routeSpecialist(text: string): 'style' | 'shopping' | 'try_on' | 'beauty' | 'wardrobe' {
  const value = text.toLowerCase();
  if (/\b(try-on|try on|virtual try)\b/.test(value)) return 'try_on';
  if (/\b(makeup|hairstyle|nail polish|nails)\b/.test(value)) return 'beauty';
  if (/\b(buy|purchase|in stock|product link|add to cart|shop this)\b/.test(value) || /\bretailers?\b/.test(value)) return 'shopping';
  if (/\b(my wardrobe|clothes i own|already own)\b/.test(value)) return 'wardrobe';
  return 'style';
}
