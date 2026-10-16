import { randomUUID } from 'node:crypto';
import { ApiError } from '../errors.js';
import type { Sql } from '../db.js';

const CATEGORIES = new Set(['tops', 'bottoms', 'dresses', 'outerwear', 'shoes', 'bags', 'accessories']);

function requiredText(value: unknown, field: string, max: number): string {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) {
    throw new ApiError('invalid_wardrobe', `${field} is required.`, 400);
  }
  return value.trim();
}

export function createWardrobeItem(db: Sql, userId: string, body: Record<string, unknown>, now: number): Record<string, unknown> {
  const category = requiredText(body.category, 'category', 40);
  if (!CATEGORIES.has(category)) throw new ApiError('invalid_wardrobe', 'Category is not supported.', 400);
  const mediaId = typeof body.mediaId === 'string' ? body.mediaId : null;
  if (mediaId) {
    const owned = db.prepare('SELECT id FROM media_assets WHERE id = ? AND user_id = ? AND deleted_at IS NULL').get(mediaId, userId);
    if (!owned) throw new ApiError('not_found', 'That photograph was not found.', 404);
  }
  const id = randomUUID();
  const stamp = new Date(now).toISOString();
  db.prepare(
    `INSERT INTO wardrobe_items (id, user_id, name, category, colour, size_label, media_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(id, userId, requiredText(body.name, 'name', 120), category, typeof body.colour === 'string' ? body.colour.slice(0, 40) : null, typeof body.sizeLabel === 'string' ? body.sizeLabel.slice(0, 16) : null, mediaId, stamp, stamp);
  return getWardrobeItem(db, userId, id);
}

export function listWardrobe(db: Sql, userId: string): Record<string, unknown>[] {
  return db.prepare(
    `SELECT id, name, category, colour, size_label AS sizeLabel, media_id AS mediaId FROM wardrobe_items WHERE user_id = ? ORDER BY created_at`,
  ).all(userId) as Record<string, unknown>[];
}

export function getWardrobeItem(db: Sql, userId: string, id: string): Record<string, unknown> {
  const row = db.prepare(
    `SELECT id, name, category, colour, size_label AS sizeLabel, media_id AS mediaId FROM wardrobe_items WHERE id = ? AND user_id = ?`,
  ).get(id, userId) as Record<string, unknown> | undefined;
  if (!row) throw new ApiError('not_found', 'That wardrobe item was not found.', 404);
  return row;
}

export function createLook(db: Sql, userId: string, body: Record<string, unknown>, now: number): Record<string, unknown> {
  const title = requiredText(body.title, 'title', 120);
  const itemIds = Array.isArray(body.wardrobeItemIds) ? body.wardrobeItemIds.filter((id): id is string => typeof id === 'string') : [];
  for (const itemId of itemIds) getWardrobeItem(db, userId, itemId);
  const id = randomUUID();
  const stamp = new Date(now).toISOString();
  db.exec('BEGIN');
  try {
    db.prepare('INSERT INTO saved_looks (id, user_id, title, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)').run(
      id, userId, title, typeof body.notes === 'string' ? body.notes.slice(0, 500) : null, stamp, stamp,
    );
    for (const itemId of itemIds) {
      db.prepare('INSERT INTO saved_look_items (look_id, wardrobe_item_id) VALUES (?, ?)').run(id, itemId);
    }
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
  return getLook(db, userId, id);
}

export function getLook(db: Sql, userId: string, id: string): Record<string, unknown> {
  const look = db.prepare('SELECT id, title, notes FROM saved_looks WHERE id = ? AND user_id = ?').get(id, userId) as Record<string, unknown> | undefined;
  if (!look) throw new ApiError('not_found', 'That look was not found.', 404);
  const items = db.prepare('SELECT wardrobe_item_id AS id FROM saved_look_items WHERE look_id = ?').all(id) as { id: string }[];
  return { ...look, wardrobeItemIds: items.map((item) => item.id) };
}

export function listLooks(db: Sql, userId: string): Record<string, unknown>[] {
  const rows = db.prepare('SELECT id FROM saved_looks WHERE user_id = ? ORDER BY created_at').all(userId) as { id: string }[];
  return rows.map((row) => getLook(db, userId, row.id));
}

export function saveProduct(db: Sql, userId: string, body: Record<string, unknown>, now: number): Record<string, unknown> {
  const retailer = requiredText(body.retailerSource, 'retailerSource', 80);
  const externalId = requiredText(body.externalProductId, 'externalProductId', 120);
  const existing = db.prepare(
    'SELECT id, retailer_source AS retailerSource, external_product_id AS externalProductId, saved_at AS savedAt FROM saved_products WHERE user_id = ? AND retailer_source = ? AND external_product_id = ?',
  ).get(userId, retailer, externalId) as Record<string, unknown> | undefined;
  if (existing) return existing;
  const id = randomUUID();
  const stamp = new Date(now).toISOString();
  db.prepare('INSERT INTO saved_products (id, user_id, retailer_source, external_product_id, saved_at) VALUES (?, ?, ?, ?, ?)').run(id, userId, retailer, externalId, stamp);
  return { id, retailerSource: retailer, externalProductId: externalId, savedAt: stamp };
}

export function listSavedProducts(db: Sql, userId: string): Record<string, unknown>[] {
  return db.prepare(
    'SELECT id, retailer_source AS retailerSource, external_product_id AS externalProductId, saved_at AS savedAt FROM saved_products WHERE user_id = ? ORDER BY saved_at',
  ).all(userId) as Record<string, unknown>[];
}

export function deleteSavedProduct(db: Sql, userId: string, id: string): void {
  const result = db.prepare('DELETE FROM saved_products WHERE id = ? AND user_id = ?').run(id, userId) as { changes?: number };
  if (!result.changes) throw new ApiError('not_found', 'That saved product was not found.', 404);
}
