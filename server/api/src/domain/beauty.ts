import { randomUUID } from 'node:crypto';
import { ApiError } from '../errors.js';
import type { Sql } from '../db.js';

const CATEGORIES = new Set(['hairstyles', 'hair-colours', 'makeup', 'nails', 'complete-looks']);
const PARTS = new Set(['hairstyle', 'hair-colour', 'makeup', 'nails']);

function text(value: unknown, field: string, max: number, required = false): string | null {
  if (value == null || value === '') {
    if (required) throw new ApiError('invalid_beauty', `${field} is required.`, 400);
    return null;
  }
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) throw new ApiError('invalid_beauty', `${field} is not valid.`, 400);
  return value.trim();
}

function list(value: unknown): string[] {
  if (value == null) return [];
  if (!Array.isArray(value) || value.length > 12) throw new ApiError('invalid_beauty', 'A preference list is not valid.', 400);
  return value.map((entry) => {
    if (typeof entry !== 'string' || !entry.trim() || entry.trim().length > 80) throw new ApiError('invalid_beauty', 'A preference list is not valid.', 400);
    return entry.trim();
  });
}

function storedList(value: unknown): string[] {
  if (typeof value !== 'string' || !value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((entry): entry is string => typeof entry === 'string') : [];
  } catch {
    return [];
  }
}

function cents(value: unknown, field: string): number | null {
  if (value == null || value === '') return null;
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value > 100_000_000) {
    throw new ApiError('invalid_beauty', `${field} must be a whole number of cents.`, 400);
  }
  return value;
}

function refusePrivate(body: Record<string, unknown>): void {
  const blocked = ['photo', 'photograph', 'image', 'imageBase64', 'mediaId', 'face', 'diagnosis', 'skinCondition'];
  if (blocked.some((key) => body[key] != null && body[key] !== '')) {
    throw new ApiError('beauty_photo_refused', 'Beauty photographs and health details are not accepted.', 400);
  }
}

function imageUrl(value: unknown): string | null {
  const url = text(value, 'imageUrl', 500);
  if (!url) return null;
  if (!url.startsWith('https://') || url.startsWith('data:')) throw new ApiError('invalid_beauty', 'An inspiration image must be an editorial https address.', 400);
  return url;
}

function emptyPreferences(userId: string): Record<string, unknown> {
  return {
    userId,
    hairstyles: [],
    hairColours: [],
    makeupStyles: [],
    nailStyles: [],
    nailColours: [],
    interests: [],
    occasions: [],
    budgetMinCents: null,
    budgetMaxCents: null,
    updatedAt: null,
    generation: 'not_connected',
  };
}

export function getBeautyPreferences(db: Sql, userId: string): Record<string, unknown> {
  const row = db.prepare(
    `SELECT hairstyles_json AS hairstylesJson, hair_colours_json AS hairColoursJson, makeup_styles_json AS makeupStylesJson,
      nail_styles_json AS nailStylesJson, nail_colours_json AS nailColoursJson, interests_json AS interestsJson,
      occasions_json AS occasionsJson, budget_min_cents AS budgetMinCents, budget_max_cents AS budgetMaxCents, updated_at AS updatedAt
     FROM beauty_preferences WHERE user_id = ?`,
  ).get(userId) as Record<string, unknown> | undefined;
  if (!row) return emptyPreferences(userId);
  return {
    userId,
    hairstyles: storedList(row.hairstylesJson),
    hairColours: storedList(row.hairColoursJson),
    makeupStyles: storedList(row.makeupStylesJson),
    nailStyles: storedList(row.nailStylesJson),
    nailColours: storedList(row.nailColoursJson),
    interests: storedList(row.interestsJson),
    occasions: storedList(row.occasionsJson),
    budgetMinCents: row.budgetMinCents,
    budgetMaxCents: row.budgetMaxCents,
    updatedAt: row.updatedAt,
    generation: 'not_connected',
  };
}

export function saveBeautyPreferences(db: Sql, userId: string, body: Record<string, unknown>, now: number): Record<string, unknown> {
  refusePrivate(body);
  const min = cents(body.budgetMinCents, 'budgetMinCents');
  const max = cents(body.budgetMaxCents, 'budgetMaxCents');
  if (min != null && max != null && min > max) throw new ApiError('invalid_beauty', 'The budget range is not valid.', 400);
  const stamp = new Date(now).toISOString();
  db.prepare(
    `INSERT INTO beauty_preferences (
      user_id, hairstyles_json, hair_colours_json, makeup_styles_json, nail_styles_json, nail_colours_json, interests_json, occasions_json, budget_min_cents, budget_max_cents, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      hairstyles_json = excluded.hairstyles_json, hair_colours_json = excluded.hair_colours_json, makeup_styles_json = excluded.makeup_styles_json,
      nail_styles_json = excluded.nail_styles_json, nail_colours_json = excluded.nail_colours_json, interests_json = excluded.interests_json,
      occasions_json = excluded.occasions_json, budget_min_cents = excluded.budget_min_cents, budget_max_cents = excluded.budget_max_cents, updated_at = excluded.updated_at`,
  ).run(
    userId, JSON.stringify(list(body.hairstyles)), JSON.stringify(list(body.hairColours)), JSON.stringify(list(body.makeupStyles)),
    JSON.stringify(list(body.nailStyles)), JSON.stringify(list(body.nailColours)), JSON.stringify(list(body.interests)), JSON.stringify(list(body.occasions)),
    min, max, stamp,
  );
  return getBeautyPreferences(db, userId);
}

function partsOf(value: unknown): { kind: string; title: string; styleLabel: string | null; colourLabel: string | null }[] {
  if (value == null) return [];
  if (!Array.isArray(value) || value.length > 4) throw new ApiError('invalid_beauty', 'Beauty look parts are not valid.', 400);
  return value.map((entry) => {
    if (!entry || typeof entry !== 'object') throw new ApiError('invalid_beauty', 'Beauty look parts are not valid.', 400);
    const record = entry as Record<string, unknown>;
    if (typeof record.kind !== 'string' || !PARTS.has(record.kind)) throw new ApiError('invalid_beauty', 'Beauty look parts are not valid.', 400);
    return {
      kind: record.kind,
      title: text(record.title, 'part title', 80, true) as string,
      styleLabel: text(record.styleLabel, 'styleLabel', 80),
      colourLabel: text(record.colourLabel, 'colourLabel', 80),
    };
  });
}

function present(db: Sql, row: Record<string, unknown>): Record<string, unknown> {
  let parts: unknown = [];
  try {
    parts = typeof row.partsJson === 'string' ? JSON.parse(row.partsJson) : [];
  } catch {
    parts = [];
  }
  const links = db.prepare('SELECT id, outfit_id AS outfitId, plan_id AS planId FROM beauty_outfit_links WHERE look_id = ?').all(String(row.id));
  return { ...row, parts, links, partsJson: undefined, generated: false, previewAvailable: false };
}

const LOOK_SELECT = `id, category, title, description, style_label AS styleLabel, colour_label AS colourLabel, colour_hex AS colourHex,
  occasion, budget_cents AS budgetCents, source_label AS sourceLabel, source_key AS sourceKey, image_url AS imageUrl, notes,
  parts_json AS partsJson, created_at AS createdAt, updated_at AS updatedAt`;

export function listBeautyLooks(db: Sql, userId: string, query: { category?: unknown; q?: unknown }): Record<string, unknown>[] {
  const category = query.category == null || query.category === '' ? null : text(query.category, 'category', 40, true);
  if (category && !CATEGORIES.has(category)) throw new ApiError('invalid_beauty', 'That beauty category is not supported.', 400);
  const search = text(query.q, 'q', 80);
  const like = search ? `%${search.replace(/[\\%_]/g, '')}%` : null;
  const rows = db.prepare(
    `SELECT ${LOOK_SELECT} FROM beauty_looks WHERE user_id = ?
      AND (? IS NULL OR category = ?)
      AND (? IS NULL OR title LIKE ? OR IFNULL(description, '') LIKE ? OR IFNULL(style_label, '') LIKE ?)
     ORDER BY updated_at DESC`,
  ).all(userId, category, category, like, like, like, like) as Record<string, unknown>[];
  return rows.map((row) => present(db, row));
}

export function getBeautyLook(db: Sql, userId: string, id: string): Record<string, unknown> {
  const row = db.prepare(`SELECT ${LOOK_SELECT} FROM beauty_looks WHERE id = ? AND user_id = ?`).get(id, userId) as Record<string, unknown> | undefined;
  if (!row) throw new ApiError('not_found', 'That beauty look was not found.', 404);
  return present(db, row);
}

function lookValues(body: Record<string, unknown>, current: Record<string, unknown> | null) {
  refusePrivate(body);
  const category = body.category === undefined && current ? String(current.category) : text(body.category, 'category', 40, true);
  if (!category || !CATEGORIES.has(category)) throw new ApiError('invalid_beauty', 'That beauty category is not supported.', 400);
  return {
    category,
    title: body.title === undefined && current ? String(current.title) : text(body.title, 'title', 80, true),
    description: body.description === undefined && current ? current.description : text(body.description, 'description', 500),
    styleLabel: body.styleLabel === undefined && current ? current.styleLabel : text(body.styleLabel, 'styleLabel', 80),
    colourLabel: body.colourLabel === undefined && current ? current.colourLabel : text(body.colourLabel, 'colourLabel', 80),
    colourHex: body.colourHex === undefined && current ? current.colourHex : text(body.colourHex, 'colourHex', 7),
    occasion: body.occasion === undefined && current ? current.occasion : text(body.occasion, 'occasion', 80),
    budgetCents: body.budgetCents === undefined && current ? current.budgetCents : cents(body.budgetCents, 'budgetCents'),
    sourceLabel: body.sourceLabel === undefined && current ? current.sourceLabel : text(body.sourceLabel, 'sourceLabel', 120),
    sourceKey: body.sourceKey === undefined && current ? current.sourceKey : text(body.sourceKey, 'sourceKey', 80),
    imageUrl: body.imageUrl === undefined && current ? current.imageUrl : imageUrl(body.imageUrl),
    notes: body.notes === undefined && current ? current.notes : text(body.notes, 'notes', 500),
    parts: body.parts === undefined && current ? current.parts : partsOf(body.parts),
  };
}

export function createBeautyLook(db: Sql, userId: string, body: Record<string, unknown>, now: number): Record<string, unknown> {
  const values = lookValues(body, null);
  if (values.sourceKey) {
    const existing = db.prepare('SELECT id FROM beauty_looks WHERE user_id = ? AND source_key = ?').get(userId, values.sourceKey) as { id: string } | undefined;
    if (existing) throw new ApiError('duplicate_beauty', 'That inspiration is already saved.', 409);
  }
  const id = randomUUID();
  const stamp = new Date(now).toISOString();
  db.prepare(
    `INSERT INTO beauty_looks (
      id, user_id, category, title, description, style_label, colour_label, colour_hex, occasion, budget_cents, source_label, source_key, image_url, notes, parts_json, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id, userId, values.category, values.title, values.description, values.styleLabel, values.colourLabel, values.colourHex, values.occasion, values.budgetCents,
    values.sourceLabel, values.sourceKey, values.imageUrl, values.notes, JSON.stringify(values.parts), stamp, stamp,
  );
  return getBeautyLook(db, userId, id);
}

export function updateBeautyLook(db: Sql, userId: string, id: string, body: Record<string, unknown>, now: number): Record<string, unknown> {
  const current = getBeautyLook(db, userId, id);
  const values = lookValues(body, current);
  db.prepare(
    `UPDATE beauty_looks SET category = ?, title = ?, description = ?, style_label = ?, colour_label = ?, colour_hex = ?, occasion = ?, budget_cents = ?,
      source_label = ?, source_key = ?, image_url = ?, notes = ?, parts_json = ?, updated_at = ? WHERE id = ? AND user_id = ?`,
  ).run(
    values.category, values.title, values.description, values.styleLabel, values.colourLabel, values.colourHex, values.occasion, values.budgetCents,
    values.sourceLabel, values.sourceKey, values.imageUrl, values.notes, JSON.stringify(values.parts), new Date(now).toISOString(), id, userId,
  );
  return getBeautyLook(db, userId, id);
}

export function deleteBeautyLook(db: Sql, userId: string, id: string): void {
  getBeautyLook(db, userId, id);
  db.prepare('DELETE FROM beauty_outfit_links WHERE look_id = ?').run(id);
  const result = db.prepare('DELETE FROM beauty_looks WHERE id = ? AND user_id = ?').run(id, userId) as { changes?: number };
  if (!result.changes) throw new ApiError('not_found', 'That beauty look was not found.', 404);
}

function ownedOutfit(db: Sql, userId: string, id: string): void {
  const row = db.prepare('SELECT id FROM saved_looks WHERE id = ? AND user_id = ?').get(id, userId);
  if (!row) throw new ApiError('not_found', 'That outfit was not found.', 404);
}

function ownedPlan(db: Sql, userId: string, id: string): void {
  const row = db.prepare('SELECT id FROM outfit_plans WHERE id = ? AND user_id = ?').get(id, userId);
  if (!row) throw new ApiError('not_found', 'That outfit plan was not found.', 404);
}

export function linkBeautyOutfit(db: Sql, userId: string, lookId: string, body: Record<string, unknown>): Record<string, unknown> {
  getBeautyLook(db, userId, lookId);
  const outfitId = text(body.outfitId, 'outfitId', 80);
  const planId = text(body.planId, 'planId', 80);
  if (!outfitId && !planId) throw new ApiError('invalid_beauty', 'Choose one of your outfits or plans.', 400);
  if (outfitId) ownedOutfit(db, userId, outfitId);
  if (planId) ownedPlan(db, userId, planId);
  const id = randomUUID();
  try {
    db.prepare('INSERT INTO beauty_outfit_links (id, look_id, outfit_id, plan_id) VALUES (?, ?, ?, ?)').run(id, lookId, outfitId, planId);
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('UNIQUE')) throw new ApiError('duplicate_beauty', 'That outfit is already linked.', 409);
    throw error;
  }
  return getBeautyLook(db, userId, lookId);
}

export function unlinkBeautyOutfit(db: Sql, userId: string, lookId: string, linkId: string): Record<string, unknown> {
  getBeautyLook(db, userId, lookId);
  const result = db.prepare('DELETE FROM beauty_outfit_links WHERE id = ? AND look_id = ?').run(linkId, lookId) as { changes?: number };
  if (!result.changes) throw new ApiError('not_found', 'That outfit link was not found.', 404);
  return getBeautyLook(db, userId, lookId);
}
