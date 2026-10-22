import { randomUUID } from 'node:crypto';
import { ApiError } from '../errors.js';
import type { Sql } from '../db.js';

const CATEGORIES = new Set(['tops', 'bottoms', 'dresses', 'outerwear', 'shoes', 'bags', 'accessories']);
const SEASONS = new Set(['summer', 'autumn', 'winter', 'spring', 'all-season']);
const OCCASIONS = new Set(['work', 'evening', 'casual', 'cocktail', 'formal', 'weekend', 'vacation', 'travel']);
const LOOK_KINDS = new Set(['wardrobe_outfit', 'inspiration', 'concept']);

function optionalText(value: unknown, max: number): string | null {
  if (value == null || value === '') return null;
  if (typeof value !== 'string' || value.trim().length > max) throw new ApiError('invalid_wardrobe', 'A text field is too long.', 400);
  return value.trim() || null;
}

function stringList(value: unknown, allowed: Set<string>, field: string): string[] {
  if (value == null) return [];
  if (!Array.isArray(value) || value.length > 12) throw new ApiError('invalid_wardrobe', `${field} is not valid.`, 400);
  return value.map((entry) => {
    if (typeof entry !== 'string' || !allowed.has(entry)) throw new ApiError('invalid_wardrobe', `${field} is not valid.`, 400);
    return entry;
  });
}

function parseList(value: unknown): string[] {
  if (typeof value !== 'string' || !value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((entry): entry is string => typeof entry === 'string') : [];
  } catch {
    return [];
  }
}

function flag(value: unknown): number {
  return value === true ? 1 : 0;
}

function imageReference(value: unknown): string | null {
  const text = optionalText(value, 500);
  if (!text) return null;
  if (text.startsWith('data:') || text.length > 500) throw new ApiError('invalid_wardrobe', 'Photographs must be uploaded as private images.', 400);
  return text;
}

function requiredText(value: unknown, field: string, max: number): string {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) {
    throw new ApiError('invalid_wardrobe', `${field} is required.`, 400);
  }
  return value.trim();
}

const ITEM_SELECT = `id, name, category, colour, size_label AS sizeLabel, media_id AS mediaId, brand, subcategory,
  colour_hex AS colourHex, seasons_json AS seasonsJson, occasions_json AS occasionsJson, notes, fabric,
  care_note AS careNote, pairing_notes AS pairingNotes, image_url AS imageUrl, is_favorite AS isFavorite,
  is_capsule AS isCapsule, times_worn AS timesWorn, last_worn_at AS lastWornAt, created_at AS createdAt, updated_at AS updatedAt`;

function ownedMedia(db: Sql, userId: string, mediaId: string | null): void {
  if (!mediaId) return;
  const owned = db.prepare('SELECT id FROM media_assets WHERE id = ? AND user_id = ? AND deleted_at IS NULL').get(mediaId, userId);
  if (!owned) throw new ApiError('not_found', 'That photograph was not found.', 404);
}

function presentItem(row: Record<string, unknown>): Record<string, unknown> {
  return {
    ...row,
    seasons: parseList(row.seasonsJson),
    occasions: parseList(row.occasionsJson),
    isFavorite: row.isFavorite === 1,
    isCapsule: row.isCapsule === 1,
    timesWorn: Number(row.timesWorn ?? 0),
    seasonsJson: undefined,
    occasionsJson: undefined,
  };
}

function itemValues(body: Record<string, unknown>, current: Record<string, unknown> | null) {
  const category = body.category === undefined && current ? String(current.category) : requiredText(body.category, 'category', 40);
  if (!CATEGORIES.has(category)) throw new ApiError('invalid_wardrobe', 'Category is not supported.', 400);
  const times = body.timesWorn === undefined ? (current ? Number(current.timesWorn ?? 0) : 0) : body.timesWorn;
  if (typeof times !== 'number' || !Number.isInteger(times) || times < 0 || times > 10000) {
    throw new ApiError('invalid_wardrobe', 'Wear count is not valid.', 400);
  }
  return {
    name: body.name === undefined && current ? String(current.name) : requiredText(body.name, 'name', 120),
    category,
    colour: body.colour === undefined && current ? optionalText(current.colour, 40) : optionalText(body.colour, 40),
    sizeLabel: body.sizeLabel === undefined && current ? optionalText(current.sizeLabel, 16) : optionalText(body.sizeLabel, 16),
    brand: body.brand === undefined && current ? optionalText(current.brand, 80) : optionalText(body.brand, 80),
    subcategory: body.subcategory === undefined && current ? optionalText(current.subcategory, 80) : optionalText(body.subcategory, 80),
    colourHex: body.colourHex === undefined && current ? optionalText(current.colourHex, 16) : optionalText(body.colourHex, 16),
    seasons: body.seasons === undefined && current ? stringList(current.seasons, SEASONS, 'seasons') : stringList(body.seasons, SEASONS, 'seasons'),
    occasions: body.occasions === undefined && current ? stringList(current.occasions, OCCASIONS, 'occasions') : stringList(body.occasions, OCCASIONS, 'occasions'),
    notes: body.notes === undefined && current ? optionalText(current.notes, 500) : optionalText(body.notes, 500),
    fabric: body.fabric === undefined && current ? optionalText(current.fabric, 80) : optionalText(body.fabric, 80),
    careNote: body.careNote === undefined && current ? optionalText(current.careNote, 160) : optionalText(body.careNote, 160),
    pairingNotes: body.pairingNotes === undefined && current ? optionalText(current.pairingNotes, 500) : optionalText(body.pairingNotes, 500),
    imageUrl: body.imageUrl === undefined && current ? imageReference(current.imageUrl) : imageReference(body.imageUrl),
    isFavorite: body.isFavorite === undefined && current ? current.isFavorite === true : body.isFavorite === true,
    isCapsule: body.isCapsule === undefined && current ? current.isCapsule === true : body.isCapsule === true,
    timesWorn: times,
    lastWornAt: body.lastWornAt === undefined && current ? optionalText(current.lastWornAt, 40) : optionalText(body.lastWornAt, 40),
    mediaId: body.mediaId === undefined && current ? (typeof current.mediaId === 'string' ? current.mediaId : null) : (typeof body.mediaId === 'string' ? body.mediaId : null),
  };
}

export function createWardrobeItem(db: Sql, userId: string, body: Record<string, unknown>, now: number): Record<string, unknown> {
  const values = itemValues(body, null);
  ownedMedia(db, userId, values.mediaId);
  const id = randomUUID();
  const stamp = new Date(now).toISOString();
  db.prepare(
    `INSERT INTO wardrobe_items (
      id, user_id, name, category, colour, size_label, media_id, created_at, updated_at, brand, subcategory, colour_hex,
      seasons_json, occasions_json, notes, fabric, care_note, pairing_notes, image_url, is_favorite, is_capsule, times_worn, last_worn_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id, userId, values.name, values.category, values.colour, values.sizeLabel, values.mediaId, stamp, stamp, values.brand, values.subcategory, values.colourHex,
    JSON.stringify(values.seasons), JSON.stringify(values.occasions), values.notes, values.fabric, values.careNote, values.pairingNotes, values.imageUrl,
    flag(values.isFavorite), flag(values.isCapsule), values.timesWorn, values.lastWornAt,
  );
  return getWardrobeItem(db, userId, id);
}

export function updateWardrobeItem(db: Sql, userId: string, id: string, body: Record<string, unknown>, now: number): Record<string, unknown> {
  const current = getWardrobeItem(db, userId, id);
  const values = itemValues(body, current);
  ownedMedia(db, userId, values.mediaId);
  db.prepare(
    `UPDATE wardrobe_items SET name = ?, category = ?, colour = ?, size_label = ?, media_id = ?, updated_at = ?, brand = ?, subcategory = ?, colour_hex = ?,
      seasons_json = ?, occasions_json = ?, notes = ?, fabric = ?, care_note = ?, pairing_notes = ?, image_url = ?, is_favorite = ?, is_capsule = ?, times_worn = ?, last_worn_at = ?
     WHERE id = ? AND user_id = ?`,
  ).run(
    values.name, values.category, values.colour, values.sizeLabel, values.mediaId, new Date(now).toISOString(), values.brand, values.subcategory, values.colourHex,
    JSON.stringify(values.seasons), JSON.stringify(values.occasions), values.notes, values.fabric, values.careNote, values.pairingNotes, values.imageUrl,
    flag(values.isFavorite), flag(values.isCapsule), values.timesWorn, values.lastWornAt, id, userId,
  );
  return getWardrobeItem(db, userId, id);
}

export function deleteWardrobeItem(db: Sql, userId: string, id: string): void {
  getWardrobeItem(db, userId, id);
  db.prepare('DELETE FROM saved_look_items WHERE wardrobe_item_id = ?').run(id);
  const result = db.prepare('DELETE FROM wardrobe_items WHERE id = ? AND user_id = ?').run(id, userId) as { changes?: number };
  if (!result.changes) throw new ApiError('not_found', 'That wardrobe item was not found.', 404);
}

export function listWardrobe(db: Sql, userId: string): Record<string, unknown>[] {
  return (db.prepare(`SELECT ${ITEM_SELECT} FROM wardrobe_items WHERE user_id = ? ORDER BY created_at`).all(userId) as Record<string, unknown>[]).map(presentItem);
}

export function getWardrobeItem(db: Sql, userId: string, id: string): Record<string, unknown> {
  const row = db.prepare(`SELECT ${ITEM_SELECT} FROM wardrobe_items WHERE id = ? AND user_id = ?`).get(id, userId) as Record<string, unknown> | undefined;
  if (!row) throw new ApiError('not_found', 'That wardrobe item was not found.', 404);
  return presentItem(row);
}

const LOOK_SELECT = `id, title, notes, kind, occasion, season, description, source_key AS sourceKey, slots_json AS slotsJson,
  is_favorite AS isFavorite, wear_count AS wearCount, last_worn_at AS lastWornAt, harmony_score AS harmonyScore,
  harmony_note AS harmonyNote, palette_json AS paletteJson, created_at AS createdAt, updated_at AS updatedAt`;

function presentLook(db: Sql, look: Record<string, unknown>): Record<string, unknown> {
  const items = db.prepare('SELECT wardrobe_item_id AS id FROM saved_look_items WHERE look_id = ?').all(String(look.id)) as { id: string }[];
  let slots: unknown = null;
  let palette: unknown = [];
  try {
    slots = typeof look.slotsJson === 'string' && look.slotsJson ? JSON.parse(look.slotsJson) : null;
    palette = typeof look.paletteJson === 'string' && look.paletteJson ? JSON.parse(look.paletteJson) : [];
  } catch {
    slots = null;
    palette = [];
  }
  return {
    ...look,
    kind: look.kind ?? 'wardrobe_outfit',
    isFavorite: look.isFavorite === 1,
    wearCount: Number(look.wearCount ?? 0),
    wardrobeItemIds: items.map((item) => item.id),
    slots,
    colorPalette: palette,
    slotsJson: undefined,
    paletteJson: undefined,
  };
}

function lookKind(body: Record<string, unknown>): string {
  const kind = typeof body.kind === 'string' ? body.kind : 'wardrobe_outfit';
  if (!LOOK_KINDS.has(kind)) throw new ApiError('invalid_wardrobe', 'Look kind is not supported.', 400);
  return kind;
}

function replaceLookItems(db: Sql, userId: string, lookId: string, body: Record<string, unknown>): void {
  const itemIds = Array.isArray(body.wardrobeItemIds) ? body.wardrobeItemIds.filter((id): id is string => typeof id === 'string') : [];
  const unique = [...new Set(itemIds)].slice(0, 12);
  for (const itemId of unique) getWardrobeItem(db, userId, itemId);
  db.prepare('DELETE FROM saved_look_items WHERE look_id = ?').run(lookId);
  for (const itemId of unique) db.prepare('INSERT INTO saved_look_items (look_id, wardrobe_item_id) VALUES (?, ?)').run(lookId, itemId);
}

export function createLook(db: Sql, userId: string, body: Record<string, unknown>, now: number): Record<string, unknown> {
  const kind = lookKind(body);
  const sourceKey = optionalText(body.sourceKey, 120);
  if ((kind === 'inspiration' || kind === 'concept') && sourceKey) {
    const existing = db.prepare('SELECT id FROM saved_looks WHERE user_id = ? AND kind = ? AND source_key = ?').get(userId, kind, sourceKey) as { id: string } | undefined;
    if (existing) return { ...getLook(db, userId, existing.id), duplicate: true };
  }
  const title = requiredText(body.title, 'title', 120);
  const id = randomUUID();
  const stamp = new Date(now).toISOString();
  const wearCount = body.wearCount === undefined ? 0 : body.wearCount;
  if (typeof wearCount !== 'number' || !Number.isInteger(wearCount) || wearCount < 0 || wearCount > 10000) {
    throw new ApiError('invalid_wardrobe', 'Wear count is not valid.', 400);
  }
  db.exec('BEGIN');
  try {
    db.prepare(
      `INSERT INTO saved_looks (
        id, user_id, title, notes, created_at, updated_at, kind, occasion, season, description, source_key, slots_json,
        is_favorite, wear_count, last_worn_at, harmony_score, harmony_note, palette_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id, userId, title, optionalText(body.notes, 500), stamp, stamp, kind, optionalText(body.occasion, 80), optionalText(body.season, 40),
      optionalText(body.description, 500), sourceKey, body.slots ? JSON.stringify(body.slots).slice(0, 2000) : null, flag(body.isFavorite === true),
      wearCount, optionalText(body.lastWornAt, 40), typeof body.harmonyScore === 'number' ? Math.max(0, Math.min(100, Math.round(body.harmonyScore))) : null,
      optionalText(body.harmonyNote, 500), body.colorPalette ? JSON.stringify(body.colorPalette).slice(0, 2000) : null,
    );
    if (kind === 'wardrobe_outfit') replaceLookItems(db, userId, id, body);
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
  return getLook(db, userId, id);
}

export function updateLook(db: Sql, userId: string, id: string, body: Record<string, unknown>, now: number): Record<string, unknown> {
  const current = getLook(db, userId, id);
  const title = body.title === undefined ? String(current.title) : requiredText(body.title, 'title', 120);
  db.exec('BEGIN');
  try {
    db.prepare(
      `UPDATE saved_looks SET title = ?, notes = ?, updated_at = ?, occasion = ?, season = ?, description = ?, slots_json = ?,
        is_favorite = ?, wear_count = ?, last_worn_at = ?, harmony_score = ?, harmony_note = ?, palette_json = ? WHERE id = ? AND user_id = ?`,
    ).run(
      title,
      body.notes === undefined ? current.notes : optionalText(body.notes, 500),
      new Date(now).toISOString(),
      body.occasion === undefined ? current.occasion : optionalText(body.occasion, 80),
      body.season === undefined ? current.season : optionalText(body.season, 40),
      body.description === undefined ? current.description : optionalText(body.description, 500),
      body.slots === undefined ? (current.slots ? JSON.stringify(current.slots) : null) : JSON.stringify(body.slots).slice(0, 2000),
      body.isFavorite === undefined ? flag(current.isFavorite === true) : flag(body.isFavorite === true),
      body.wearCount === undefined ? Number(current.wearCount ?? 0) : body.wearCount,
      body.lastWornAt === undefined ? current.lastWornAt : optionalText(body.lastWornAt, 40),
      body.harmonyScore === undefined ? current.harmonyScore : Math.max(0, Math.min(100, Math.round(Number(body.harmonyScore)))),
      body.harmonyNote === undefined ? current.harmonyNote : optionalText(body.harmonyNote, 500),
      body.colorPalette === undefined ? (current.colorPalette ? JSON.stringify(current.colorPalette) : null) : JSON.stringify(body.colorPalette).slice(0, 2000),
      id, userId,
    );
    if (body.wardrobeItemIds !== undefined) replaceLookItems(db, userId, id, body);
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
  return getLook(db, userId, id);
}

export function deleteLook(db: Sql, userId: string, id: string): void {
  getLook(db, userId, id);
  db.prepare('UPDATE outfit_plans SET outfit_id = NULL WHERE outfit_id = ? AND user_id = ?').run(id, userId);
  db.prepare('DELETE FROM saved_look_items WHERE look_id = ?').run(id);
  const result = db.prepare('DELETE FROM saved_looks WHERE id = ? AND user_id = ?').run(id, userId) as { changes?: number };
  if (!result.changes) throw new ApiError('not_found', 'That look was not found.', 404);
}

export function getLook(db: Sql, userId: string, id: string): Record<string, unknown> {
  const look = db.prepare(`SELECT ${LOOK_SELECT} FROM saved_looks WHERE id = ? AND user_id = ?`).get(id, userId) as Record<string, unknown> | undefined;
  if (!look) throw new ApiError('not_found', 'That look was not found.', 404);
  return presentLook(db, look);
}

export function listLooks(db: Sql, userId: string): Record<string, unknown>[] {
  const rows = db.prepare(`SELECT ${LOOK_SELECT} FROM saved_looks WHERE user_id = ? ORDER BY created_at`).all(userId) as Record<string, unknown>[];
  return rows.map((row) => presentLook(db, row));
}

export function createPlan(db: Sql, userId: string, body: Record<string, unknown>, now: number): Record<string, unknown> {
  const outfitId = typeof body.outfitId === 'string' && body.outfitId ? body.outfitId : null;
  if (outfitId) getLook(db, userId, outfitId);
  const id = randomUUID();
  const stamp = new Date(now).toISOString();
  db.prepare(
    `INSERT INTO outfit_plans (id, user_id, title, plan_date, occasion, notes, outfit_id, time_label, location_label, weather_label, completed, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id, userId, requiredText(body.title, 'title', 120), requiredText(body.planDate, 'planDate', 40), optionalText(body.occasion, 80), optionalText(body.notes, 500),
    outfitId, optionalText(body.timeLabel, 40), optionalText(body.locationLabel, 120), optionalText(body.weatherLabel, 80), flag(body.completed === true), stamp, stamp,
  );
  return getPlan(db, userId, id);
}

export function updatePlan(db: Sql, userId: string, id: string, body: Record<string, unknown>, now: number): Record<string, unknown> {
  const current = getPlan(db, userId, id);
  const outfitId = body.outfitId === undefined ? current.outfitId : (typeof body.outfitId === 'string' && body.outfitId ? body.outfitId : null);
  if (typeof outfitId === 'string') getLook(db, userId, outfitId);
  db.prepare(
    `UPDATE outfit_plans SET title = ?, plan_date = ?, occasion = ?, notes = ?, outfit_id = ?, time_label = ?, location_label = ?, weather_label = ?, completed = ?, updated_at = ?
     WHERE id = ? AND user_id = ?`,
  ).run(
    body.title === undefined ? current.title : requiredText(body.title, 'title', 120),
    body.planDate === undefined ? current.planDate : requiredText(body.planDate, 'planDate', 40),
    body.occasion === undefined ? current.occasion : optionalText(body.occasion, 80),
    body.notes === undefined ? current.notes : optionalText(body.notes, 500),
    outfitId, body.timeLabel === undefined ? current.timeLabel : optionalText(body.timeLabel, 40),
    body.locationLabel === undefined ? current.locationLabel : optionalText(body.locationLabel, 120),
    body.weatherLabel === undefined ? current.weatherLabel : optionalText(body.weatherLabel, 80),
    body.completed === undefined ? flag(current.completed === true) : flag(body.completed === true),
    new Date(now).toISOString(), id, userId,
  );
  return getPlan(db, userId, id);
}

export function deletePlan(db: Sql, userId: string, id: string): void {
  const result = db.prepare('DELETE FROM outfit_plans WHERE id = ? AND user_id = ?').run(id, userId) as { changes?: number };
  if (!result.changes) throw new ApiError('not_found', 'That plan was not found.', 404);
}

export function getPlan(db: Sql, userId: string, id: string): Record<string, unknown> {
  const row = db.prepare(
    `SELECT id, title, plan_date AS planDate, occasion, notes, outfit_id AS outfitId, time_label AS timeLabel, location_label AS locationLabel,
      weather_label AS weatherLabel, completed, created_at AS createdAt FROM outfit_plans WHERE id = ? AND user_id = ?`,
  ).get(id, userId) as Record<string, unknown> | undefined;
  if (!row) throw new ApiError('not_found', 'That plan was not found.', 404);
  return { ...row, completed: row.completed === 1 };
}

export function listPlans(db: Sql, userId: string): Record<string, unknown>[] {
  return (db.prepare(
    `SELECT id, title, plan_date AS planDate, occasion, notes, outfit_id AS outfitId, time_label AS timeLabel, location_label AS locationLabel,
      weather_label AS weatherLabel, completed, created_at AS createdAt FROM outfit_plans WHERE user_id = ? ORDER BY plan_date, created_at`,
  ).all(userId) as Record<string, unknown>[]).map((row) => ({ ...row, completed: row.completed === 1 }));
}

const DEMO_CATALOGUE_SOURCE = 'mystyle_demo_catalogue';

function savedProductView(row: Record<string, unknown>): Record<string, unknown> {
  const retailerSource = String(row.retailerSource);
  const demonstration = retailerSource === DEMO_CATALOGUE_SOURCE || retailerSource.startsWith('demo_');
  return {
    ...row,
    demonstration,
    sourceKind: demonstration ? 'demonstration_catalogue' : 'retailer_reference',
    label: demonstration
      ? 'Demonstration catalogue reference. Not a verified live retailer offer.'
      : 'Saved product reference. Availability and price are not confirmed live.',
  };
}

export function saveProduct(db: Sql, userId: string, body: Record<string, unknown>, now: number): Record<string, unknown> {
  const retailer = requiredText(body.retailerSource ?? DEMO_CATALOGUE_SOURCE, 'retailerSource', 80);
  const externalId = requiredText(body.externalProductId, 'externalProductId', 120);
  if (/child|minor|dependent/i.test(retailer) || /child|minor|dependent/i.test(externalId)) {
    throw new ApiError('invalid_product', 'That product reference was not accepted.', 400);
  }
  const existing = db.prepare(
    'SELECT id, retailer_source AS retailerSource, external_product_id AS externalProductId, saved_at AS savedAt FROM saved_products WHERE user_id = ? AND retailer_source = ? AND external_product_id = ?',
  ).get(userId, retailer, externalId) as Record<string, unknown> | undefined;
  if (existing) return savedProductView({ ...existing, duplicate: true });
  const id = randomUUID();
  const stamp = new Date(now).toISOString();
  db.prepare('INSERT INTO saved_products (id, user_id, retailer_source, external_product_id, saved_at) VALUES (?, ?, ?, ?, ?)').run(id, userId, retailer, externalId, stamp);
  return savedProductView({ id, retailerSource: retailer, externalProductId: externalId, savedAt: stamp, duplicate: false });
}

export function listSavedProducts(db: Sql, userId: string): Record<string, unknown>[] {
  return (db.prepare(
    'SELECT id, retailer_source AS retailerSource, external_product_id AS externalProductId, saved_at AS savedAt FROM saved_products WHERE user_id = ? ORDER BY saved_at',
  ).all(userId) as Record<string, unknown>[]).map(savedProductView);
}

export function deleteSavedProduct(db: Sql, userId: string, id: string): void {
  const result = db.prepare('DELETE FROM saved_products WHERE id = ? AND user_id = ?').run(id, userId) as { changes?: number };
  if (!result.changes) throw new ApiError('not_found', 'That saved product was not found.', 404);
}
