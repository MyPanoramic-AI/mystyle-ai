import { AccountApiError, type AccountApi, type LookRecord, type PlanRecord, type WardrobeRecord } from './accountApi';
import type { PlannedEvent, WardrobeItem, WardrobeOutfit } from '../types/wardrobe';

function mediaUrl(mediaId: string | null, imageUrl: string | null): string {
  if (mediaId) return `/api/media/${mediaId}`;
  return imageUrl && !imageUrl.startsWith('data:') && !imageUrl.startsWith('blob:') ? imageUrl : '';
}

/** Drop browser-only / unusable image references before they hit the API. */
export function sanitizeWardrobeImageUrl(imageUrl: string | null | undefined): string | null {
  const value = (imageUrl || '').trim();
  if (!value) return null;
  if (value.startsWith('blob:') || value.startsWith('data:')) return null;
  if (value.startsWith('/assets/') || value.startsWith('/images/') || value.startsWith('/api/media/')) return value;
  if (/^https:\/\//i.test(value)) return value.slice(0, 1000);
  // Same-origin relative paths (Vite hashed assets without leading intent)
  if (value.startsWith('/')) return value.slice(0, 1000);
  return null;
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
    dateAdded: (row.createdAt || new Date().toISOString()).slice(0, 10),
    isFavorite: row.isFavorite,
    isCapsuleStaple: row.isCapsule,
    fabric: row.fabric || undefined,
    careNote: row.careNote || undefined,
    pairingNotes: row.pairingNotes || row.notes || undefined,
    sizeLabel: row.sizeLabel || undefined,
  };
}

function itemBody(
  item: Omit<WardrobeItem, 'id' | 'dateAdded' | 'timesWorn'> & { id?: string; timesWorn?: number },
  mediaId?: string | null,
): Record<string, unknown> {
  const cleanedImage = sanitizeWardrobeImageUrl(item.imageUrl);
  const privatePhoto = Boolean(cleanedImage?.startsWith('/api/media/'));
  const resolvedMediaId = mediaId === undefined
    ? (privatePhoto ? cleanedImage!.split('/').pop() ?? null : null)
    : mediaId;
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
    // Prefer private mediaId; never persist blob/data URLs.
    imageUrl: resolvedMediaId ? null : cleanedImage,
    mediaId: resolvedMediaId,
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
    dateCreated: (row.createdAt || new Date().toISOString()).slice(0, 10),
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
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      const comma = result.indexOf(',');
      if (comma < 0) {
        reject(new AccountApiError('invalid_image', 'The photograph could not be encoded.', 400));
        return;
      }
      resolve(result.slice(comma + 1));
    };
    reader.onerror = () => reject(new AccountApiError('invalid_image', 'The photograph could not be read.', 400));
    reader.readAsDataURL(file);
  });
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
      // Warm CSRF from session before the first wardrobe mutation.
      await api.session();

      let mediaId: string | null | undefined;
      if (file) {
        try {
          mediaId = (await api.uploadWardrobePhoto(await fileBase64(file))).id;
        } catch (error) {
          if (error instanceof AccountApiError && error.code === 'private_photo_consent_required') {
            throw new AccountApiError(
              error.code,
              'Grant private photograph storage consent in Profile → Privacy before uploading a wardrobe photo. You can still save with a preset image.',
              error.status,
            );
          }
          throw error;
        }
      }

      const cleaned = sanitizeWardrobeImageUrl(item.imageUrl);
      if (!mediaId && !cleaned) {
        throw new AccountApiError(
          'invalid_wardrobe',
          'Choose a preset image or upload a photograph before saving this piece.',
          400,
        );
      }

      const payload = {
        ...item,
        imageUrl: cleaned || '',
        timesWorn: 0,
      };
      const body = itemBody(payload, mediaId ?? undefined);
      // Updates must not reset wear count from the add-item form.
      if (item.id) delete body.timesWorn;
      const saved = item.id
        ? await api.updateWardrobeItem(item.id, body)
        : await api.createWardrobeItem(body);
      return itemFromRecord(saved);
    },
    async updateItem(item) {
      await api.session();
      return itemFromRecord(await api.updateWardrobeItem(item.id, itemBody(item)));
    },
    deleteItem: (id) => api.deleteWardrobeItem(id),
    async saveOutfit(outfit) {
      await api.session();
      return outfitFromRecord(await api.createLook(outfitBody(outfit)));
    },
    async updateOutfit(outfit) {
      await api.session();
      return outfitFromRecord(await api.updateLook(outfit.id, outfitBody(outfit)));
    },
    deleteOutfit: (id) => api.deleteLook(id),
    async saveEvent(event) {
      await api.session();
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
