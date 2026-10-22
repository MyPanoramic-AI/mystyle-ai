/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Saved shopping products: browser demo localStorage, or authenticated account API.
 */

export const DEMO_CATALOGUE_SOURCE = 'mystyle_demo_catalogue';

export interface SavedProductItem {
  productId: string;
  savedAt: string;
  serverId?: string;
  demonstration?: boolean;
  label?: string;
}

const STORAGE_KEY = 'mystyle_saved_products_v1';

const DEFAULT_SAVED_PRODUCTS: SavedProductItem[] = [
  { productId: 'prod-cream-sculptural-blazer', savedAt: 'Yesterday', demonstration: true },
  { productId: 'prod-forest-silk-slip-dress', savedAt: '2 days ago', demonstration: true },
];

class SavedProductsService {
  private listeners: Set<() => void> = new Set();
  private remote: {
    list: () => Promise<{ products: { id: string; externalProductId: string; savedAt: string; demonstration?: boolean; label?: string }[] }>;
    save: (externalProductId: string) => Promise<{ id: string; duplicate?: boolean; demonstration?: boolean; label?: string }>;
    remove: (id: string) => Promise<void>;
  } | null = null;
  private remoteItems: SavedProductItem[] = [];

  public async useAccount(remote: SavedProductsService['remote']): Promise<void> {
    this.remote = remote;
    if (!remote) {
      this.remoteItems = [];
      this.notify();
      return;
    }
    const listed = await remote.list();
    this.remoteItems = listed.products.map((row) => ({
      productId: row.externalProductId,
      savedAt: row.savedAt.slice(0, 10),
      serverId: row.id,
      demonstration: row.demonstration !== false,
      label: row.label,
    }));
    this.notify();
  }

  public getSavedProducts(): SavedProductItem[] {
    if (this.remote) return this.remoteItems;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        this.saveToStorage(DEFAULT_SAVED_PRODUCTS);
        return DEFAULT_SAVED_PRODUCTS;
      }
      return JSON.parse(raw) as SavedProductItem[];
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

  public async toggleSaveProduct(productId: string): Promise<boolean> {
    if (this.remote) {
      const existing = this.remoteItems.find((item) => item.productId === productId);
      if (existing?.serverId) {
        await this.remote.remove(existing.serverId);
        this.remoteItems = this.remoteItems.filter((item) => item.productId !== productId);
        this.notify();
        return false;
      }
      const saved = await this.remote.save(productId);
      this.remoteItems = [
        {
          productId,
          savedAt: 'Today',
          serverId: saved.id,
          demonstration: saved.demonstration !== false,
          label: saved.label,
        },
        ...this.remoteItems.filter((item) => item.productId !== productId),
      ];
      this.notify();
      return true;
    }
    const current = this.getSavedProducts();
    const exists = current.some((item) => item.productId === productId);
    const updated = exists
      ? current.filter((item) => item.productId !== productId)
      : [{ productId, savedAt: 'Just now', demonstration: true }, ...current];
    this.saveToStorage(updated);
    this.notify();
    return !exists;
  }

  public async removeSavedProduct(productId: string): Promise<void> {
    if (this.remote) {
      const existing = this.remoteItems.find((item) => item.productId === productId);
      if (existing?.serverId) await this.remote.remove(existing.serverId);
      this.remoteItems = this.remoteItems.filter((item) => item.productId !== productId);
      this.notify();
      return;
    }
    this.saveToStorage(this.getSavedProducts().filter((item) => item.productId !== productId));
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
