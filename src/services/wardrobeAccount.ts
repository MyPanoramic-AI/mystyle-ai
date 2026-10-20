import type { AccountApi, LookRecord, PlanRecord, WardrobeRecord } from './accountApi';
import type { PlannedEvent, WardrobeItem, WardrobeOutfit } from '../types/wardrobe';

function mediaUrl(mediaId: string | null, imageUrl: string | null): string {
  if (mediaId) return `/api/media/${mediaId}`;
  return imageUrl && !imageUrl.startsWith('data:') ? imageUrl : '';
}

export function itemFromRecord(row: WardrobeRecord): WardrobeItem {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    subcategory: row.subcategory || 'Garment',
    brand: row.brand || '',
    color: row.colour || '',
    colorHex: row.colourHex || '#F5F2EB',
    seasons: row.seasons.length ? row.seasons : ['all-season'],
    occasions: row.occasions.length ? row.occasions : ['casual'],
    imageUrl: mediaUrl(row.mediaId, row.imageUrl),
    timesWorn: row.timesWorn,
    lastWornDate: row.lastWornAt || undefined,
    dateAdded: row.createdAt.slice(0, 10),
    isFavorite: row.isFavorite,
    isCapsuleStaple: row.isCapsule,
    fabric: row.fabric || undefined,
    careNote: row.careNote || undefined,
    pairingNotes: row.pairingNotes || row.notes || undefined,
    sizeLabel: row.sizeLabel || undefined,
  };
}

function itemBody(item: Omit<WardrobeItem, 'id' | 'dateAdded' | 'timesWorn'> & { id?: string; timesWorn?: number }, mediaId?: string | null): Record<string, unknown> {
  const privatePhoto = item.imageUrl.startsWith('/api/media/');
  return {
    name: item.name,
    category: item.category,
    colour: item.color,
    colourHex: item.colorHex,
    sizeLabel: item.sizeLabel ?? null,
    brand: item.brand,
    subcategory: item.subcategory,
    seasons: item.seasons,
    occasions: item.occasions,
    fabric: item.fabric ?? null,
    careNote: item.careNote ?? null,
    pairingNotes: item.pairingNotes ?? null,
    notes: item.pairingNotes ?? null,
    imageUrl: privatePhoto ? null : item.imageUrl || null,
    mediaId: mediaId === undefined ? (privatePhoto ? item.imageUrl.split('/').pop() : null) : mediaId,
    isFavorite: item.isFavorite,
    isCapsule: item.isCapsuleStaple,
    timesWorn: item.timesWorn ?? 0,
    lastWornAt: item.lastWornDate ?? null,
  };
}

export function outfitFromRecord(row: LookRecord): WardrobeOutfit {
  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    occasion: row.occasion || 'casual',
    season: row.season || 'all-season',
    slots: row.slots || {},
    harmonyScore: row.harmonyScore ?? 0,
    harmonyCritique: row.harmonyNote || '',
    colorPalette: row.colorPalette || [],
    isFavorite: row.isFavorite,
    dateCreated: row.createdAt.slice(0, 10),
    lastWornDate: row.lastWornAt || undefined,
    wearCount: row.wearCount,
  };
}

function outfitBody(outfit: Omit<WardrobeOutfit, 'id' | 'dateCreated' | 'wearCount'> & { id?: string; wearCount?: number }): Record<string, unknown> {
  const ids = [
    outfit.slots.topId, outfit.slots.bottomId, outfit.slots.dressId, outfit.slots.outerwearId,
    outfit.slots.shoesId, outfit.slots.bagId, ...(outfit.slots.accessoryIds || []),
  ].filter((id): id is string => Boolean(id));
  return {
    title: outfit.title,
    kind: 'wardrobe_outfit',
    description: outfit.description,
    occasion: outfit.occasion,
    season: outfit.season,
    slots: outfit.slots,
    harmonyScore: outfit.harmonyScore,
    harmonyNote: outfit.harmonyCritique,
    colorPalette: outfit.colorPalette,
    isFavorite: outfit.isFavorite,
    wearCount: outfit.wearCount ?? 0,
    lastWornAt: outfit.lastWornDate ?? null,
    wardrobeItemIds: ids,
  };
}

export function planFromRecord(row: PlanRecord, outfits: WardrobeOutfit[]): PlannedEvent {
  return {
    id: row.id,
    title: row.title,
    date: row.planDate,
    time: row.timeLabel || undefined,
    location: row.locationLabel || '',
    occasion: row.occasion || '',
    weatherForecast: row.weatherLabel || '',
    outfitId: row.outfitId || undefined,
    outfitTitle: outfits.find((outfit) => outfit.id === row.outfitId)?.title,
    notes: row.notes || undefined,
    completed: row.completed,
  };
}

export interface AccountWardrobe {
  load(): Promise<{ items: WardrobeItem[]; outfits: WardrobeOutfit[]; events: PlannedEvent[] }>;
  saveItem(item: Omit<WardrobeItem, 'id' | 'dateAdded' | 'timesWorn'> & { id?: string }, file?: File | null): Promise<WardrobeItem>;
  updateItem(item: WardrobeItem): Promise<WardrobeItem>;
  deleteItem(id: string): Promise<void>;
  saveOutfit(outfit: Omit<WardrobeOutfit, 'id' | 'dateCreated' | 'wearCount'>): Promise<WardrobeOutfit>;
  updateOutfit(outfit: WardrobeOutfit): Promise<WardrobeOutfit>;
  deleteOutfit(id: string): Promise<void>;
  saveEvent(event: Omit<PlannedEvent, 'id'> & { id?: string }): Promise<PlannedEvent>;
  deleteEvent(id: string): Promise<void>;
}

async function fileBase64(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let text = '';
  for (const byte of bytes) text += String.fromCharCode(byte);
  return btoa(text);
}

export function createAccountWardrobe(api: AccountApi): AccountWardrobe {
  return {
    async load() {
      const [items, looks, plans] = await Promise.all([api.wardrobeItems(), api.looks(), api.outfitPlans()]);
      const outfits = looks.looks.filter((look) => look.kind === 'wardrobe_outfit').map(outfitFromRecord);
      return {
        items: items.items.map(itemFromRecord),
        outfits,
        events: plans.plans.map((plan) => planFromRecord(plan, outfits)),
      };
    },
    async saveItem(item, file) {
      const mediaId = file ? (await api.uploadWardrobePhoto(await fileBase64(file))).id : undefined;
      const saved = item.id
        ? await api.updateWardrobeItem(item.id, itemBody({ ...item, timesWorn: 0 }, mediaId))
        : await api.createWardrobeItem(itemBody(item, mediaId));
      return itemFromRecord(saved);
    },
    async updateItem(item) {
      return itemFromRecord(await api.updateWardrobeItem(item.id, itemBody(item)));
    },
    deleteItem: (id) => api.deleteWardrobeItem(id),
    async saveOutfit(outfit) {
      return outfitFromRecord(await api.createLook(outfitBody(outfit)));
    },
    async updateOutfit(outfit) {
      return outfitFromRecord(await api.updateLook(outfit.id, outfitBody(outfit)));
    },
    deleteOutfit: (id) => api.deleteLook(id),
    async saveEvent(event) {
      const body = {
        title: event.title,
        planDate: event.date,
        occasion: event.occasion,
        notes: event.notes ?? null,
        outfitId: event.outfitId ?? null,
        timeLabel: event.time ?? null,
        locationLabel: event.location || null,
        weatherLabel: event.weatherForecast || null,
        completed: event.completed === true,
      };
      const saved = event.id ? await api.updateOutfitPlan(event.id, body) : await api.createOutfitPlan(body);
      return planFromRecord(saved, []);
    },
    deleteEvent: (id) => api.deleteOutfitPlan(id),
  };
}
