/**
 * Build demonstration outfit cards from spoken/typed Option 1–3 text
 * so Talk and Type can show the same garment-preview cards.
 */

import type { StylistOutfitRecommendation, UserProfile } from '../types';
import type { WardrobeItem } from '../types/wardrobe';
import { enrichOutfitWithShopMatches } from '../services/stylistShopMatch';
import workOfficeImg from '../assets/images/fashion_work_office_1791978399975.jpg';
import weddingGuestImg from '../assets/images/fashion_wedding_guest_1791978399342.jpg';
import weekendCasualImg from '../assets/images/fashion_weekend_casual_1791978401075.jpg';

const OPTION_SPLIT =
  /\boption\s*(1|2|3|one|two|three|een|twee|drie)\b[:.\s-]*/gi;

function optionNumber(token: string): number | null {
  const value = token.toLowerCase();
  if (value === '1' || value === 'one' || value === 'een') return 1;
  if (value === '2' || value === 'two' || value === 'twee') return 2;
  if (value === '3' || value === 'three' || value === 'drie') return 3;
  return null;
}

function imageFor(text: string): string {
  const value = text.toLowerCase();
  if (value.includes('wedding')) return weddingGuestImg;
  if (value.includes('party') || value.includes('summer') || value.includes('weekend') || value.includes('picnic')) {
    return weekendCasualImg;
  }
  return workOfficeImg;
}

function guessCategory(name: string): StylistOutfitRecommendation['pieces'][number]['category'] {
  const value = name.toLowerCase();
  if (/dress|gown|slip|jumpsuit|romper/.test(value)) return 'dress';
  if (/shoe|heel|pump|sandal|loafer|sneaker|boot|slipper|mule|flat|trainer/.test(value)) return 'shoes';
  if (/jacket|blazer|coat|trench|cardigan|outerwear/.test(value)) return 'outerwear';
  if (/bag|tote|clutch|earring|necklace|bracelet|scarf|sunglass|hat|belt|jewellery|jewelry/.test(value)) {
    return 'accessories';
  }
  if (/trouser|pant|jean|skirt|short|legging|bottom/.test(value)) return 'bottoms';
  return 'tops';
}

/** Pull garment-like phrases from an option description. */
export function extractGarmentNames(optionBody: string): string[] {
  const cleaned = optionBody
    .replace(/\bwhy (?:it|this) works[:\s-]*/i, ' · ')
    .replace(/\s+/g, ' ')
    .trim();
  const chunks = cleaned
    .split(/\s*(?:,|\band\b|\bwith\b|\bplus\b|\bpaired with\b|\bfinished with\b|;|·|\.|then)\s*/i)
    .map((part) => part.replace(/^(?:a|an|the|soft|simple|clean|polished)\s+/i, '').trim())
    .filter((part) => part.length > 3 && part.length < 90);

  const names: string[] = [];
  for (const chunk of chunks) {
    if (/^(option|because|this|that|which|perfect|ideal|works|looks)\b/i.test(chunk)) continue;
    if (!/[a-z]/i.test(chunk)) continue;
    // Prefer chunks that look like garments.
    if (!/\b(dress|top|blouse|shirt|trouser|pant|jean|skirt|jacket|blazer|coat|shoe|heel|pump|sandal|loafer|sneaker|boot|slipper|bag|tote|clutch|earring|necklace|scarf|knit|sweater|cardigan|jumpsuit|suit|midi|maxi|mini|gown|tee|tank)\b/i.test(chunk)
      && names.length >= 2) {
      continue;
    }
    const title = chunk.charAt(0).toUpperCase() + chunk.slice(1);
    if (!names.some((existing) => existing.toLowerCase() === title.toLowerCase())) {
      names.push(title);
    }
    if (names.length >= 5) break;
  }
  if (!names.length && cleaned) {
    names.push(cleaned.slice(0, 80));
  }
  return names;
}

export function parseSpokenOutfitOptions(text: string): Array<{ index: number; body: string }> {
  const source = text.replace(/\s+/g, ' ').trim();
  if (!source) return [];
  const matches = [...source.matchAll(OPTION_SPLIT)];
  if (matches.length < 2) return [];

  const options: Array<{ index: number; body: string }> = [];
  for (let i = 0; i < matches.length; i += 1) {
    const match = matches[i];
    const num = optionNumber(match[1] || '');
    if (!num) continue;
    const start = (match.index ?? 0) + match[0].length;
    const end = i + 1 < matches.length ? (matches[i + 1].index ?? source.length) : source.length;
    const body = source.slice(start, end).trim();
    if (body.length < 8) continue;
    options.push({ index: num, body });
  }
  // Unique by option index, keep first occurrence.
  const seen = new Set<number>();
  return options.filter((option) => {
    if (seen.has(option.index)) return false;
    seen.add(option.index);
    return true;
  }).sort((a, b) => a.index - b.index);
}

export function spokenTextHasOutfitOptions(text: string): boolean {
  return parseSpokenOutfitOptions(text).length >= 2;
}

export function voiceOutfitCardsFromText(
  text: string,
  opts?: {
    idPrefix?: string;
    profile?: UserProfile | null;
    wardrobeItems?: WardrobeItem[] | null;
    occasion?: string;
  },
): StylistOutfitRecommendation[] {
  const parsed = parseSpokenOutfitOptions(text);
  if (parsed.length < 2) return [];
  const idPrefix = opts?.idPrefix || `voice-opt-${Date.now()}`;
  const occasion = opts?.occasion || 'Outfit options';
  const cards: StylistOutfitRecommendation[] = [];

  for (const option of parsed.slice(0, 3)) {
    const whyMatch = option.body.match(/\bwhy (?:it|this) works[:\s-]*(.+)$/i);
    const why = whyMatch?.[1]?.trim() || option.body.slice(0, 180);
    const garmentNames = extractGarmentNames(option.body);
    const pieces = garmentNames.map((name) => ({
      name,
      retailer: 'Style suggestion',
      priceZar: 0,
      category: guessCategory(name),
      owned: false,
    }));
    const card: StylistOutfitRecommendation = {
      id: `${idPrefix}-${option.index}`,
      title: `Option ${option.index}: ${garmentNames[0] || `Option ${option.index}`}`,
      aesthetic: `Option ${option.index}`,
      occasion,
      imageUrl: imageFor(`${occasion} ${option.body}`),
      stylistRationale: why,
      pieces,
      palette: ['#F4EDE4', '#E5CDBE', '#C4A574'].slice(0, 3),
      stylingTips: [],
      totalEstimatedZar: 0,
      conceptOnly: true,
    };
    cards.push(enrichOutfitWithShopMatches(card, opts?.profile, opts?.wardrobeItems));
  }
  return cards;
}
