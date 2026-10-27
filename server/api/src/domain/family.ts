import { randomUUID } from 'node:crypto';
import { ApiError } from '../errors.js';
import type { Sql } from '../db.js';
import { splitBudgetCents } from './familyPlans.js';

const STATUSES = new Set(['planned', 'ready', 'archived']);

function nameOf(value: unknown): string {
  if (typeof value !== 'string' || value.trim().length < 1 || value.trim().length > 80) {
    throw new ApiError('invalid_family', 'Enter a display name of up to 80 characters.', 400);
  }
  return value.trim();
}

function optionalText(value: unknown, max: number): string | null {
  if (value == null || value === '') return null;
  if (typeof value !== 'string' || value.trim().length > max) throw new ApiError('invalid_family', 'A text field is too long.', 400);
  return value.trim() || null;
}

function stringList(value: unknown, maxItems = 12): string[] {
  if (value == null) return [];
  if (!Array.isArray(value) || value.length > maxItems) throw new ApiError('invalid_family', 'A preference list is not valid.', 400);
  return value.map((entry) => {
    if (typeof entry !== 'string' || !entry.trim() || entry.trim().length > 80) throw new ApiError('invalid_family', 'A preference list is not valid.', 400);
    return entry.trim();
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

function parseObject(value: unknown): Record<string, string> {
  if (typeof value !== 'string' || !value) return {};
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const result: Record<string, string> = {};
    for (const [key, entry] of Object.entries(parsed)) {
      if (typeof entry === 'string') result[key] = entry;
    }
    return result;
  } catch {
    return {};
  }
}

function cents(value: unknown, field: string, allowNull = false): number | null {
  if (value == null || value === '') return allowNull ? null : 0;
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value > 100_000_000) {
    throw new ApiError('invalid_family', `${field} must be a whole number of cents.`, 400);
  }
  return value;
}

function refuseSensitive(body: Record<string, unknown>): void {
  const blocked = ['photo', 'photograph', 'image', 'imageBase64', 'mediaId', 'dateOfBirth', 'birthDate'];
  if (blocked.some((key) => body[key] != null && body[key] !== '')) {
    throw new ApiError('family_photo_refused', 'Family photographs and dates of birth are not accepted.', 400);
  }
}

function kindOf(value: unknown, current?: string): 'adult' | 'dependent' {
  if (value === undefined && current) return current === 'dependent' ? 'dependent' : 'adult';
  if (value === 'dependent' || value === 'adult') return value;
  throw new ApiError('invalid_family', 'memberKind must be adult or dependent.', 400);
}

const MEMBER_SELECT = `id, display_name AS displayName, member_kind AS memberKind, relationship_label AS relationshipLabel,
  permission_level AS permissionLevel, access_status AS accessStatus, styles_json AS stylesJson, colours_json AS coloursJson,
  occasions_json AS occasionsJson, sizes_json AS sizesJson, categories_json AS categoriesJson, comfort_json AS comfortJson,
  budget_cents AS budgetCents, linked_user_id AS linkedUserId, created_at AS createdAt, updated_at AS updatedAt`;

function presentMember(row: Record<string, unknown>): Record<string, unknown> {
  const linkedUserId = typeof row.linkedUserId === 'string' ? row.linkedUserId : null;
  return {
    ...row,
    linkedUserId,
    linkSource: linkedUserId ? 'account_link' : 'manual',
    styles: parseList(row.stylesJson),
    colours: parseList(row.coloursJson),
    occasions: parseList(row.occasionsJson),
    categories: parseList(row.categoriesJson),
    comfort: parseList(row.comfortJson),
    sizes: parseObject(row.sizesJson),
    canAuthenticate: false,
    stylesJson: undefined,
    coloursJson: undefined,
    occasionsJson: undefined,
    sizesJson: undefined,
    categoriesJson: undefined,
    comfortJson: undefined,
  };
}

function memberValues(body: Record<string, unknown>, current: Record<string, unknown> | null) {
  refuseSensitive(body);
  const memberKind = kindOf(body.memberKind, current ? String(current.memberKind) : undefined);
  if (memberKind === 'dependent' && body.permissionLevel === 'editor') {
    throw new ApiError('invalid_family', 'A dependent profile cannot be given editor access.', 400);
  }
  const permission = memberKind === 'dependent' ? 'viewer' : body.permissionLevel === 'editor' ? 'editor' : 'viewer';
  const sizes = body.sizes === undefined && current ? (current.sizes as Record<string, string>) : body.sizes;
  if (sizes != null && (typeof sizes !== 'object' || Array.isArray(sizes))) throw new ApiError('invalid_family', 'Sizes are not valid.', 400);
  const sizeRecord: Record<string, string> = {};
  for (const [key, value] of Object.entries((sizes ?? {}) as Record<string, unknown>)) {
    if (typeof value === 'string' && value.trim()) sizeRecord[key.slice(0, 40)] = value.trim().slice(0, 40);
  }
  return {
    displayName: body.displayName === undefined && current ? String(current.displayName) : nameOf(body.displayName),
    memberKind,
    relationshipLabel: body.relationshipLabel === undefined && current ? optionalText(current.relationshipLabel, 40) : optionalText(body.relationshipLabel, 40),
    permission,
    accessStatus: body.accessStatus === undefined && current ? String(current.accessStatus) : body.accessStatus === 'revoked' ? 'revoked' : 'active',
    styles: body.styles === undefined && current ? stringList(current.styles) : stringList(body.styles),
    colours: body.colours === undefined && current ? stringList(current.colours) : stringList(body.colours),
    occasions: body.occasions === undefined && current ? stringList(current.occasions) : stringList(body.occasions),
    categories: body.categories === undefined && current ? stringList(current.categories) : stringList(body.categories),
    comfort: body.comfort === undefined && current ? stringList(current.comfort) : stringList(body.comfort),
    sizes: sizeRecord,
    budgetCents: body.budgetCents === undefined && current ? (current.budgetCents == null ? null : cents(current.budgetCents, 'budgetCents', true)) : cents(body.budgetCents, 'budgetCents', true),
  };
}

export function createFamilyMember(db: Sql, userId: string, body: Record<string, unknown>, now: number): Record<string, unknown> {
  const values = memberValues(body, null);
  const id = randomUUID();
  const stamp = new Date(now).toISOString();
  db.prepare(
    `INSERT INTO family_relationships (
      id, owner_user_id, display_name, member_kind, relationship_label, permission_level, access_status, created_at, updated_at,
      styles_json, colours_json, occasions_json, sizes_json, categories_json, comfort_json, budget_cents
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id, userId, values.displayName, values.memberKind, values.relationshipLabel, values.permission, values.accessStatus, stamp, stamp,
    JSON.stringify(values.styles), JSON.stringify(values.colours), JSON.stringify(values.occasions), JSON.stringify(values.sizes),
    JSON.stringify(values.categories), JSON.stringify(values.comfort), values.budgetCents,
  );
  return getFamilyMember(db, userId, id);
}

export function listFamily(db: Sql, userId: string): Record<string, unknown>[] {
  return (db.prepare(`SELECT ${MEMBER_SELECT} FROM family_relationships WHERE owner_user_id = ? ORDER BY created_at`).all(userId) as Record<string, unknown>[]).map(presentMember);
}

export function getFamilyMember(db: Sql, userId: string, id: string): Record<string, unknown> {
  const row = db.prepare(`SELECT ${MEMBER_SELECT} FROM family_relationships WHERE id = ? AND owner_user_id = ?`).get(id, userId) as Record<string, unknown> | undefined;
  if (!row) throw new ApiError('not_found', 'That family profile was not found.', 404);
  return presentMember(row);
}

export function updateFamilyMember(db: Sql, userId: string, id: string, body: Record<string, unknown>, now: number): Record<string, unknown> {
  const current = getFamilyMember(db, userId, id);
  const values = memberValues(body, current);
  db.prepare(
    `UPDATE family_relationships SET display_name = ?, member_kind = ?, relationship_label = ?, permission_level = ?, access_status = ?, updated_at = ?,
      styles_json = ?, colours_json = ?, occasions_json = ?, sizes_json = ?, categories_json = ?, comfort_json = ?, budget_cents = ?
     WHERE id = ? AND owner_user_id = ?`,
  ).run(
    values.displayName, values.memberKind, values.relationshipLabel, values.permission, values.accessStatus, new Date(now).toISOString(),
    JSON.stringify(values.styles), JSON.stringify(values.colours), JSON.stringify(values.occasions), JSON.stringify(values.sizes),
    JSON.stringify(values.categories), JSON.stringify(values.comfort), values.budgetCents, id, userId,
  );
  return getFamilyMember(db, userId, id);
}

export function deleteFamilyMember(db: Sql, userId: string, id: string): void {
  getFamilyMember(db, userId, id);
  db.exec('BEGIN');
  try {
    db.prepare('DELETE FROM family_event_participants WHERE member_id = ? AND event_id IN (SELECT id FROM family_events WHERE owner_user_id = ?)').run(id, userId);
    const result = db.prepare('DELETE FROM family_relationships WHERE id = ? AND owner_user_id = ?').run(id, userId) as { changes?: number };
    if (!result.changes) throw new ApiError('not_found', 'That family profile was not found.', 404);
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

function ownedMember(db: Sql, userId: string, id: string): void {
  getFamilyMember(db, userId, id);
}

function ownedWardrobe(db: Sql, userId: string, id: string): void {
  const row = db.prepare('SELECT id FROM wardrobe_items WHERE id = ? AND user_id = ?').get(id, userId);
  if (!row) throw new ApiError('not_found', 'That wardrobe item was not found.', 404);
}

function participantsOf(body: Record<string, unknown>, total: number): { memberId: string; allocatedBudgetCents: number; outfitNote: string | null; wardrobeItemId: string | null }[] {
  if (!Array.isArray(body.participants) || body.participants.length < 1 || body.participants.length > 12) {
    throw new ApiError('invalid_family', 'Choose at least one family profile.', 400);
  }
  const rows = body.participants.map((entry) => {
    if (!entry || typeof entry !== 'object') throw new ApiError('invalid_family', 'A participant is not valid.', 400);
    const record = entry as Record<string, unknown>;
    if (typeof record.memberId !== 'string') throw new ApiError('invalid_family', 'A participant is not valid.', 400);
    if (record.wardrobeItemId != null && typeof record.wardrobeItemId !== 'string') throw new ApiError('invalid_family', 'A wardrobe reference is not valid.', 400);
    return {
      memberId: record.memberId,
      allocatedBudgetCents: record.allocatedBudgetCents === undefined ? -1 : cents(record.allocatedBudgetCents, 'allocatedBudgetCents') ?? 0,
      outfitNote: optionalText(record.outfitNote, 500),
      wardrobeItemId: typeof record.wardrobeItemId === 'string' ? record.wardrobeItemId : null,
    };
  });
  const unique = new Set(rows.map((row) => row.memberId));
  if (unique.size !== rows.length) throw new ApiError('invalid_family', 'A family profile can only be added once.', 400);
  if (rows.some((row) => row.allocatedBudgetCents < 0)) {
    const split = splitBudgetCents(total, rows.length);
    rows.forEach((row, index) => {
      row.allocatedBudgetCents = split[index] ?? 0;
    });
  }
  return rows;
}

function presentEvent(db: Sql, event: Record<string, unknown>): Record<string, unknown> {
  const participants = db.prepare(
    `SELECT member_id AS memberId, allocated_budget_cents AS allocatedBudgetCents, outfit_note AS outfitNote FROM family_event_participants WHERE event_id = ?`,
  ).all(String(event.id)) as Record<string, unknown>[];
  let colourTheme: unknown = {};
  try {
    colourTheme = typeof event.colourThemeJson === 'string' ? JSON.parse(event.colourThemeJson) : {};
  } catch {
    colourTheme = {};
  }
  return { ...event, colourTheme, participants, colourThemeJson: undefined, plannedOnly: true };
}

const EVENT_SELECT = `id, title, event_date AS eventDate, occasion, formality, style_direction AS styleDirection, colour_theme_json AS colourThemeJson,
  total_budget_cents AS totalBudgetCents, notes, status, created_at AS createdAt, updated_at AS updatedAt`;

export function createFamilyEvent(db: Sql, userId: string, body: Record<string, unknown>, now: number): Record<string, unknown> {
  refuseSensitive(body);
  const total = cents(body.totalBudgetCents, 'totalBudgetCents') ?? 0;
  const participants = participantsOf(body, total);
  for (const participant of participants) {
    if (participant.memberId !== 'self') ownedMember(db, userId, participant.memberId);
    if (participant.wardrobeItemId) ownedWardrobe(db, userId, participant.wardrobeItemId);
  }
  const status = typeof body.status === 'string' && STATUSES.has(body.status) ? body.status : 'planned';
  const id = randomUUID();
  const stamp = new Date(now).toISOString();
  db.exec('BEGIN');
  try {
    db.prepare(
      `INSERT INTO family_events (id, owner_user_id, title, event_date, occasion, formality, style_direction, colour_theme_json, total_budget_cents, notes, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id, userId, nameOf(body.title), optionalText(body.eventDate, 40), nameOf(body.occasion), optionalText(body.formality, 40), optionalText(body.styleDirection, 80),
      JSON.stringify(body.colourTheme ?? {}).slice(0, 1000), total, optionalText(body.notes, 500), status, stamp, stamp,
    );
    for (const participant of participants) {
      const note = participant.wardrobeItemId ? `${participant.outfitNote ?? ''} wardrobe:${participant.wardrobeItemId}`.trim() : participant.outfitNote;
      db.prepare('INSERT INTO family_event_participants (event_id, member_id, allocated_budget_cents, outfit_note) VALUES (?, ?, ?, ?)').run(id, participant.memberId, participant.allocatedBudgetCents, note);
    }
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
  return getFamilyEvent(db, userId, id);
}

export function updateFamilyEvent(db: Sql, userId: string, id: string, body: Record<string, unknown>, now: number): Record<string, unknown> {
  const current = getFamilyEvent(db, userId, id);
  const next = {
    ...current,
    title: body.title === undefined ? current.title : nameOf(body.title),
    eventDate: body.eventDate === undefined ? current.eventDate : optionalText(body.eventDate, 40),
    occasion: body.occasion === undefined ? current.occasion : nameOf(body.occasion),
    formality: body.formality === undefined ? current.formality : optionalText(body.formality, 40),
    styleDirection: body.styleDirection === undefined ? current.styleDirection : optionalText(body.styleDirection, 80),
    totalBudgetCents: body.totalBudgetCents === undefined ? current.totalBudgetCents : cents(body.totalBudgetCents, 'totalBudgetCents'),
    notes: body.notes === undefined ? current.notes : optionalText(body.notes, 500),
    status: body.status === undefined ? current.status : (typeof body.status === 'string' && STATUSES.has(body.status) ? body.status : ''),
    colourTheme: body.colourTheme === undefined ? current.colourTheme : body.colourTheme,
  };
  if (!next.status) throw new ApiError('invalid_family', 'Event status is not supported.', 400);
  const participants = body.participants === undefined ? (current.participants as { memberId: string; allocatedBudgetCents: number; outfitNote: string | null }[]) : participantsOf(body, Number(next.totalBudgetCents));
  for (const participant of participants) {
    if (String(participant.memberId) !== 'self') ownedMember(db, userId, String(participant.memberId));
  }
  db.exec('BEGIN');
  try {
    db.prepare(
      `UPDATE family_events SET title = ?, event_date = ?, occasion = ?, formality = ?, style_direction = ?, colour_theme_json = ?, total_budget_cents = ?, notes = ?, status = ?, updated_at = ?
       WHERE id = ? AND owner_user_id = ?`,
    ).run(next.title, next.eventDate, next.occasion, next.formality, next.styleDirection, JSON.stringify(next.colourTheme ?? {}).slice(0, 1000), next.totalBudgetCents, next.notes, next.status, new Date(now).toISOString(), id, userId);
    if (body.participants !== undefined) {
      db.prepare('DELETE FROM family_event_participants WHERE event_id = ?').run(id);
      for (const participant of participants) {
        db.prepare('INSERT INTO family_event_participants (event_id, member_id, allocated_budget_cents, outfit_note) VALUES (?, ?, ?, ?)').run(id, participant.memberId, participant.allocatedBudgetCents, participant.outfitNote);
      }
    }
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
  return getFamilyEvent(db, userId, id);
}

export function deleteFamilyEvent(db: Sql, userId: string, id: string): void {
  getFamilyEvent(db, userId, id);
  db.prepare('DELETE FROM family_event_participants WHERE event_id = ?').run(id);
  const result = db.prepare('DELETE FROM family_events WHERE id = ? AND owner_user_id = ?').run(id, userId) as { changes?: number };
  if (!result.changes) throw new ApiError('not_found', 'That family event was not found.', 404);
}

export function getFamilyEvent(db: Sql, userId: string, id: string): Record<string, unknown> {
  const row = db.prepare(`SELECT ${EVENT_SELECT} FROM family_events WHERE id = ? AND owner_user_id = ?`).get(id, userId) as Record<string, unknown> | undefined;
  if (!row) throw new ApiError('not_found', 'That family event was not found.', 404);
  return presentEvent(db, row);
}

export function listFamilyEvents(db: Sql, userId: string): Record<string, unknown>[] {
  const rows = db.prepare(`SELECT ${EVENT_SELECT} FROM family_events WHERE owner_user_id = ? ORDER BY created_at`).all(userId) as Record<string, unknown>[];
  return rows.map((row) => presentEvent(db, row));
}
