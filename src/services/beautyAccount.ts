import type { AccountApi } from './accountApi';
import { AccountApiError } from './accountApi';
import type { CompleteBeautyLook, HairColorItem, HairstyleItem, MakeupItem, NailItem } from '../types/beauty';

export interface BeautyPreferenceRecord {
  hairstyles: string[];
  hairColours: string[];
  makeupStyles: string[];
  nailStyles: string[];
  nailColours: string[];
  interests: string[];
  occasions: string[];
  budgetMinCents: number | null;
  budgetMaxCents: number | null;
}

export interface AccountBeautyLook {
  id: string;
  category: string;
  title: string;
  description: string | null;
  styleLabel: string | null;
  colourLabel: string | null;
  occasion: string | null;
  sourceLabel: string | null;
  sourceKey: string | null;
  imageUrl: string | null;
  notes: string | null;
  parts: { kind: string; title: string }[];
  links: { id: string; outfitId: string | null; planId: string | null }[];
  previewAvailable: boolean;
}

export function beautyStatus(error: unknown): string {
  if (error instanceof AccountApiError) {
    if (error.status === 401) return 'Session expired.';
    if (error.status === 409) return 'That inspiration is already saved.';
    if (error.status === 0) return 'Backend unavailable.';
    return 'Unable to save look.';
  }
  return 'Backend unavailable.';
}

function asLook(row: Record<string, unknown>): AccountBeautyLook {
  return {
    id: String(row.id),
    category: String(row.category),
    title: String(row.title),
    description: typeof row.description === 'string' ? row.description : null,
    styleLabel: typeof row.styleLabel === 'string' ? row.styleLabel : null,
    colourLabel: typeof row.colourLabel === 'string' ? row.colourLabel : null,
    occasion: typeof row.occasion === 'string' ? row.occasion : null,
    sourceLabel: typeof row.sourceLabel === 'string' ? row.sourceLabel : null,
    sourceKey: typeof row.sourceKey === 'string' ? row.sourceKey : null,
    imageUrl: typeof row.imageUrl === 'string' ? row.imageUrl : null,
    notes: typeof row.notes === 'string' ? row.notes : null,
    parts: Array.isArray(row.parts) ? row.parts as { kind: string; title: string }[] : [],
    links: Array.isArray(row.links) ? row.links as AccountBeautyLook['links'] : [],
    previewAvailable: false,
  };
}

function preferencesFrom(row: Record<string, unknown>): BeautyPreferenceRecord {
  const strings = (value: unknown) => Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : [];
  return {
    hairstyles: strings(row.hairstyles),
    hairColours: strings(row.hairColours),
    makeupStyles: strings(row.makeupStyles),
    nailStyles: strings(row.nailStyles),
    nailColours: strings(row.nailColours),
    interests: strings(row.interests),
    occasions: strings(row.occasions),
    budgetMinCents: typeof row.budgetMinCents === 'number' ? row.budgetMinCents : null,
    budgetMaxCents: typeof row.budgetMaxCents === 'number' ? row.budgetMaxCents : null,
  };
}

export function rankByPreference<T>(items: T[], preferred: string[], label: (item: T) => string): T[] {
  if (preferred.length === 0) return items;
  const wanted = preferred.map((entry) => entry.toLowerCase());
  return [...items].sort((left, right) => {
    const leftMatch = wanted.some((entry) => label(left).toLowerCase().includes(entry));
    const rightMatch = wanted.some((entry) => label(right).toLowerCase().includes(entry));
    return Number(rightMatch) - Number(leftMatch);
  });
}

export function createAccountBeauty(api: AccountApi) {
  return {
    async loadPreferences() {
      return preferencesFrom(await api.beautyPreferences());
    },
    savePreferences(body: BeautyPreferenceRecord) {
      return api.saveBeautyPreferences({ ...body } as Record<string, unknown>).then(preferencesFrom);
    },
    async loadLooks() {
      const listed = await api.beautyLooks();
      return listed.looks.map(asLook);
    },
    async saveLook(body: Record<string, unknown>) {
      return asLook(await api.createBeautyLook(body));
    },
    async updateLook(id: string, body: Record<string, unknown>) {
      return asLook(await api.updateBeautyLook(id, body));
    },
    deleteLook: (id: string) => api.deleteBeautyLook(id),
    async linkOutfit(id: string, outfitId: string) {
      return asLook(await api.linkBeautyLook(id, { outfitId }));
    },
    async linkPlan(id: string, planId: string) {
      return asLook(await api.linkBeautyLook(id, { planId }));
    },
    async unlink(id: string, linkId: string) {
      return asLook(await api.unlinkBeautyLook(id, linkId));
    },
    inspirationBody(item: HairstyleItem | HairColorItem | MakeupItem | NailItem): Record<string, unknown> {
      const colour = item.category === 'hair-colours' ? item.swatchHex : item.category === 'makeup' ? item.lipHex : item.category === 'nails' ? item.primaryHex : null;
      const style = item.category === 'hairstyles' ? item.texture : item.category === 'hair-colours' ? item.shadeFamily : item.category === 'makeup' ? item.style : item.style;
      return {
        category: item.category,
        title: item.title,
        description: item.description,
        styleLabel: style,
        colourLabel: item.category === 'nails' ? item.style : null,
        colourHex: colour,
        occasion: item.recommendedOccasions[0] ?? null,
        sourceKey: `${item.category}:${item.id}`,
        sourceLabel: 'Editorial inspiration',
        imageUrl: item.imageUrl.startsWith('https://') ? item.imageUrl : null,
      };
    },
    completeBody(look: CompleteBeautyLook): Record<string, unknown> {
      return {
        category: 'complete-looks',
        title: look.title,
        description: look.description,
        occasion: look.occasion,
        sourceKey: look.id,
        sourceLabel: 'Editorial inspiration',
        imageUrl: look.imageUrl.startsWith('https://') ? look.imageUrl : null,
        parts: [
          { kind: 'hairstyle', title: look.hairstyle.title, styleLabel: look.hairstyle.texture },
          { kind: 'hair-colour', title: look.hairColor.title, colourLabel: look.hairColor.shadeFamily },
          { kind: 'makeup', title: look.makeup.title, styleLabel: look.makeup.style },
          { kind: 'nails', title: look.nails.title, styleLabel: look.nails.shape },
        ],
      };
    },
  };
}

export type AccountBeauty = ReturnType<typeof createAccountBeauty>;
