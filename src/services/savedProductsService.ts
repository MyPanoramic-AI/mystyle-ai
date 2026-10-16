/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Local persistence service for saved shopping products.
 * Stores non-sensitive product IDs with reactive subscriptions.
 */

const STORAGE_KEY = 'mystyle_saved_products_v1';

export interface SavedProductItem {
  productId: string;
  savedAt: string;
}

// Starter saved products so the customer sees real utility immediately
const DEFAULT_SAVED_PRODUCTS: SavedProductItem[] = [
  { productId: 'prod-cream-sculptural-blazer', savedAt: 'Yesterday' },
  { productId: 'prod-forest-silk-slip-dress', savedAt: '2 days ago' },
];

class SavedProductsService {
  private listeners: Set<() => void> = new Set();

  public getSavedProducts(): SavedProductItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        this.saveToStorage(DEFAULT_SAVED_PRODUCTS);
        return DEFAULT_SAVED_PRODUCTS;
      }
      return JSON.parse(raw);
    } catch {
      return DEFAULT_SAVED_PRODUCTS;
    }
  }

  public getSavedProductIds(): string[] {
    return this.getSavedProducts().map((item) => item.productId);
  }

  public isProductSaved(productId: string): boolean {
    return this.getSavedProducts().some((item) => item.productId === productId);
  }

  public toggleSaveProduct(productId: string): boolean {
    const current = this.getSavedProducts();
    const exists = current.some((item) => item.productId === productId);

    let updated: SavedProductItem[];
    if (exists) {
      updated = current.filter((item) => item.productId !== productId);
    } else {
      updated = [{ productId, savedAt: 'Just now' }, ...current];
    }

    this.saveToStorage(updated);
    this.notify();
    return !exists;
  }

  public removeSavedProduct(productId: string): void {
    const current = this.getSavedProducts();
    const updated = current.filter((item) => item.productId !== productId);
    this.saveToStorage(updated);
    this.notify();
  }

  public subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notify(): void {
    this.listeners.forEach((callback) => callback());
  }

  private saveToStorage(items: SavedProductItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignore quota errors in sandbox
    }
  }
}

export const savedProductsService = new SavedProductsService();
