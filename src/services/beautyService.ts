/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedBeautyLook, CompleteBeautyLook, BeautyProductItem } from '../types/beauty';
import { DEMO_COMPLETE_LOOKS, BEAUTY_PRODUCTS } from '../data/beautyData';

const SAVED_BEAUTY_KEY = 'mystyle_saved_beauty_looks_v1';
const BEAUTY_BAG_KEY = 'mystyle_beauty_shopping_bag_v1';

export function getSavedBeautyLooks(): SavedBeautyLook[] {
  try {
    const raw = localStorage.getItem(SAVED_BEAUTY_KEY);
    if (!raw) {
      const initial: SavedBeautyLook[] = DEMO_COMPLETE_LOOKS.map((look) => ({
        id: `saved-${look.id}`,
        title: look.title,
        savedAt: 'Recently saved',
        look,
        totalProductsPriceZar: look.curatedProducts.reduce((sum, p) => sum + p.priceZar, 0),
      }));
      localStorage.setItem(SAVED_BEAUTY_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveBeautyLook(look: CompleteBeautyLook): SavedBeautyLook {
  const current = getSavedBeautyLooks();
  const existing = current.find((item) => item.look?.id === look.id);
  if (existing) return existing;

  const newSaved: SavedBeautyLook = {
    id: `saved-${Date.now()}`,
    title: look.title,
    savedAt: 'Just now',
    look,
    totalProductsPriceZar: look.curatedProducts.reduce((sum, p) => sum + p.priceZar, 0),
  };

  const updated = [newSaved, ...current];
  localStorage.setItem(SAVED_BEAUTY_KEY, JSON.stringify(updated));
  return newSaved;
}

export function removeSavedBeautyLook(id: string): void {
  const current = getSavedBeautyLooks();
  const filtered = current.filter((item) => item.id !== id);
  localStorage.setItem(SAVED_BEAUTY_KEY, JSON.stringify(filtered));
}

export function getBeautyShoppingBag(): BeautyProductItem[] {
  try {
    const raw = localStorage.getItem(BEAUTY_BAG_KEY);
    if (!raw) {
      const initial = [BEAUTY_PRODUCTS[0], BEAUTY_PRODUCTS[2]];
      localStorage.setItem(BEAUTY_BAG_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function addProductToBeautyBag(product: BeautyProductItem): void {
  const bag = getBeautyShoppingBag();
  if (bag.some((p) => p.id === product.id)) return;
  const updated = [...bag, product];
  localStorage.setItem(BEAUTY_BAG_KEY, JSON.stringify(updated));
}

export function removeProductFromBeautyBag(productId: string): void {
  const bag = getBeautyShoppingBag();
  const updated = bag.filter((p) => p.id !== productId);
  localStorage.setItem(BEAUTY_BAG_KEY, JSON.stringify(updated));
}
