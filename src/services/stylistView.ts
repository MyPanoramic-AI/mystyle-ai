import type { ChatMessage, StylistOutfitRecommendation, StylistQuickAction } from '../types';
import type { StylistServerMessage } from './accountApi';
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

export function conceptCard(message: StylistServerMessage): StylistOutfitRecommendation | undefined {
  const recommendation = message.recommendation;
  if (!recommendation || recommendation.availability === 'not_connected') return undefined;
  const components = Array.isArray(recommendation.outfitComponents) ? recommendation.outfitComponents : [];
  if (!components.length && typeof recommendation.outfitTitle !== 'string') return undefined;
  const pieces = components.slice(0, 6).map((item) => {
    const piece = item && typeof item === 'object' ? item as Record<string, unknown> : {};
    return {
      name: typeof piece.name === 'string' ? piece.name : 'Garment concept',
      retailer: 'Style suggestion',
      priceZar: 0,
      category: category(piece.category),
    };
  });
  const colours = Array.isArray(recommendation.suggestedColours) ? recommendation.suggestedColours.filter((item): item is string => typeof item === 'string') : [];
  return {
    id: message.id,
    title: typeof recommendation.outfitTitle === 'string' ? recommendation.outfitTitle : 'Outfit concept',
    aesthetic: 'Style suggestion',
    occasion: typeof recommendation.occasion === 'string' ? recommendation.occasion : 'Outfit concept',
    imageUrl: imageFor(typeof recommendation.occasion === 'string' ? recommendation.occasion : ''),
    stylistRationale: message.content,
    pieces,
    palette: (colours.length ? colours : ['ivory']).slice(0, 4).map(swatch),
    stylingTips: [],
    totalEstimatedZar: 0,
    conceptOnly: true,
  };
}

export function followUps(message: StylistServerMessage): StylistQuickAction[] {
  const questions = message.recommendation?.followUpQuestions;
  if (!Array.isArray(questions)) return [];
  return questions.filter((item): item is string => typeof item === 'string').slice(0, 2).map((prompt, index) => ({
    id: `${message.id}-follow-${index}`,
    label: prompt,
    prompt,
    variant: 'secondary' as const,
  }));
}

export function toChatMessage(message: StylistServerMessage): ChatMessage {
  return {
    id: message.id,
    sender: message.role === 'assistant' ? 'stylist' : 'user',
    timestamp: 'Saved',
    text: message.content,
    outfitCard: message.role === 'assistant' ? conceptCard(message) : undefined,
    quickActions: message.role === 'assistant' ? followUps(message) : undefined,
  };
}
