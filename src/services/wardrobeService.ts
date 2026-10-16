/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Local persistence service for MyStyle AI - Digital Wardrobe & Outfit Planning.
 * Handles storage of custom items, custom outfits, calendar events, and gap analysis.
 */

import {
  WardrobeItem,
  WardrobeOutfit,
  PlannedEvent,
  WardrobeGap,
  CapsuleCollection,
} from '../types/wardrobe';
import {
  DEMO_WARDROBE_ITEMS,
  DEMO_WARDROBE_OUTFITS,
  DEMO_PLANNED_EVENTS,
  DEMO_WARDROBE_GAPS,
  DEMO_CAPSULES,
} from '../data/wardrobeData';

const ITEMS_KEY = 'mystyle_wardrobe_items_v1';
const OUTFITS_KEY = 'mystyle_wardrobe_outfits_v1';
const EVENTS_KEY = 'mystyle_wardrobe_events_v1';

// --- WARDROBE ITEMS ---
export function getWardrobeItems(): WardrobeItem[] {
  try {
    const raw = localStorage.getItem(ITEMS_KEY);
    if (!raw) {
      localStorage.setItem(ITEMS_KEY, JSON.stringify(DEMO_WARDROBE_ITEMS));
      return DEMO_WARDROBE_ITEMS;
    }
    return JSON.parse(raw);
  } catch {
    return DEMO_WARDROBE_ITEMS;
  }
}

export function saveWardrobeItem(item: Omit<WardrobeItem, 'id' | 'dateAdded' | 'timesWorn'> & { id?: string }): WardrobeItem {
  const current = getWardrobeItems();
  const newItem: WardrobeItem = {
    ...item,
    id: item.id || `custom-w-${Date.now()}`,
    dateAdded: new Date().toISOString().split('T')[0],
    timesWorn: 0,
    isFavorite: item.isFavorite ?? false,
    isCapsuleStaple: item.isCapsuleStaple ?? false,
  };

  const existingIndex = current.findIndex((i) => i.id === newItem.id);
  let updated: WardrobeItem[];
  if (existingIndex >= 0) {
    updated = [...current];
    updated[existingIndex] = { ...current[existingIndex], ...newItem };
  } else {
    updated = [newItem, ...current];
  }

  localStorage.setItem(ITEMS_KEY, JSON.stringify(updated));
  return newItem;
}

export function toggleFavoriteItem(itemId: string): WardrobeItem[] {
  const current = getWardrobeItems();
  const updated = current.map((item) =>
    item.id === itemId ? { ...item, isFavorite: !item.isFavorite } : item
  );
  localStorage.setItem(ITEMS_KEY, JSON.stringify(updated));
  return updated;
}

export function logItemWorn(itemId: string): WardrobeItem[] {
  const current = getWardrobeItems();
  const updated = current.map((item) =>
    item.id === itemId
      ? {
          ...item,
          timesWorn: item.timesWorn + 1,
          lastWornDate: 'Today',
        }
      : item
  );
  localStorage.setItem(ITEMS_KEY, JSON.stringify(updated));
  return updated;
}

export function deleteWardrobeItem(itemId: string): WardrobeItem[] {
  const current = getWardrobeItems();
  const updated = current.filter((item) => item.id !== itemId);
  localStorage.setItem(ITEMS_KEY, JSON.stringify(updated));
  return updated;
}

// --- WARDROBE OUTFITS ---
export function getWardrobeOutfits(): WardrobeOutfit[] {
  try {
    const raw = localStorage.getItem(OUTFITS_KEY);
    if (!raw) {
      localStorage.setItem(OUTFITS_KEY, JSON.stringify(DEMO_WARDROBE_OUTFITS));
      return DEMO_WARDROBE_OUTFITS;
    }
    return JSON.parse(raw);
  } catch {
    return DEMO_WARDROBE_OUTFITS;
  }
}

export function saveWardrobeOutfit(outfit: Omit<WardrobeOutfit, 'id' | 'dateCreated' | 'wearCount'> & { id?: string }): WardrobeOutfit {
  const current = getWardrobeOutfits();
  const newOutfit: WardrobeOutfit = {
    ...outfit,
    id: outfit.id || `custom-outfit-${Date.now()}`,
    dateCreated: new Date().toISOString().split('T')[0],
    wearCount: 0,
    isFavorite: outfit.isFavorite ?? false,
  };

  const existingIndex = current.findIndex((o) => o.id === newOutfit.id);
  let updated: WardrobeOutfit[];
  if (existingIndex >= 0) {
    updated = [...current];
    updated[existingIndex] = { ...current[existingIndex], ...newOutfit };
  } else {
    updated = [newOutfit, ...current];
  }

  localStorage.setItem(OUTFITS_KEY, JSON.stringify(updated));
  return newOutfit;
}

export function toggleFavoriteOutfit(outfitId: string): WardrobeOutfit[] {
  const current = getWardrobeOutfits();
  const updated = current.map((outfit) =>
    outfit.id === outfitId ? { ...outfit, isFavorite: !outfit.isFavorite } : outfit
  );
  localStorage.setItem(OUTFITS_KEY, JSON.stringify(updated));
  return updated;
}

export function deleteWardrobeOutfit(outfitId: string): WardrobeOutfit[] {
  const current = getWardrobeOutfits();
  const updated = current.filter((outfit) => outfit.id !== outfitId);
  localStorage.setItem(OUTFITS_KEY, JSON.stringify(updated));
  return updated;
}

// --- PLANNED EVENTS ---
export function getPlannedEvents(): PlannedEvent[] {
  try {
    const raw = localStorage.getItem(EVENTS_KEY);
    if (!raw) {
      localStorage.setItem(EVENTS_KEY, JSON.stringify(DEMO_PLANNED_EVENTS));
      return DEMO_PLANNED_EVENTS;
    }
    return JSON.parse(raw);
  } catch {
    return DEMO_PLANNED_EVENTS;
  }
}

export function savePlannedEvent(event: Omit<PlannedEvent, 'id'> & { id?: string }): PlannedEvent {
  const current = getPlannedEvents();
  const newEvent: PlannedEvent = {
    ...event,
    id: event.id || `event-${Date.now()}`,
    completed: event.completed ?? false,
  };

  const existingIndex = current.findIndex((e) => e.id === newEvent.id);
  let updated: PlannedEvent[];
  if (existingIndex >= 0) {
    updated = [...current];
    updated[existingIndex] = newEvent;
  } else {
    updated = [newEvent, ...current];
  }

  localStorage.setItem(EVENTS_KEY, JSON.stringify(updated));
  return newEvent;
}

export function deletePlannedEvent(eventId: string): PlannedEvent[] {
  const current = getPlannedEvents();
  const updated = current.filter((e) => e.id !== eventId);
  localStorage.setItem(EVENTS_KEY, JSON.stringify(updated));
  return updated;
}

// --- GAPS & CAPSULES ---
export function getWardrobeGaps(): WardrobeGap[] {
  return DEMO_WARDROBE_GAPS;
}

export function getCapsuleCollections(): CapsuleCollection[] {
  return DEMO_CAPSULES;
}
