/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Local persistence service for saved outfit inspirations.
 * Non-sensitive ID-only storage with reactive listeners.
 */

import { SavedLookItem } from '../types/discover';

const STORAGE_KEY = 'mystyle_saved_looks_v1';

// Default starter saved looks for an immediately engaging experience
const DEFAULT_SAVED: SavedLookItem[] = [
  { lookId: 'look-parisian-chic', savedAt: 'Yesterday' },
  { lookId: 'look-coastal-summer', savedAt: '3 days ago' },
];

class SavedLooksService {
  private listeners: Set<() => void> = new Set();

  public getSavedLooks(): SavedLookItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        this.saveToStorage(DEFAULT_SAVED);
        return DEFAULT_SAVED;
      }
      return JSON.parse(raw);
    } catch {
      return DEFAULT_SAVED;
    }
  }

  public getSavedLookIds(): string[] {
    return this.getSavedLooks().map((item) => item.lookId);
  }

  public isLookSaved(lookId: string): boolean {
    const list = this.getSavedLooks();
    return list.some((item) => item.lookId === lookId);
  }

  public toggleSaveLook(lookId: string): boolean {
    const current = this.getSavedLooks();
    const exists = current.some((item) => item.lookId === lookId);

    let updated: SavedLookItem[];
    if (exists) {
      updated = current.filter((item) => item.lookId !== lookId);
    } else {
      updated = [{ lookId, savedAt: 'Just now' }, ...current];
    }

    this.saveToStorage(updated);
    this.notify();
    return !exists;
  }

  public removeSavedLook(lookId: string): void {
    const current = this.getSavedLooks();
    const updated = current.filter((item) => item.lookId !== lookId);
    this.saveToStorage(updated);
    this.notify();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private saveToStorage(items: SavedLookItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('Unable to write saved looks to localStorage', e);
    }
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn());
  }
}

export const savedLooksService = new SavedLooksService();
