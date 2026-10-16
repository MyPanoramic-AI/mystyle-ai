import { randomUUID } from 'node:crypto';
import { ApiError } from '../errors.js';
import type { Sql } from '../db.js';

function nameOf(value: unknown): string {
  if (typeof value !== 'string' || value.trim().length < 1 || value.trim().length > 80) {
    throw new ApiError('invalid_family', 'Enter a display name of up to 80 characters.', 400);
  }
  return value.trim();
}

export function createFamilyMember(db: Sql, userId: string, body: Record<string, unknown>, now: number): Record<string, unknown> {
  const memberKind = body.memberKind === 'dependent' ? 'dependent' : body.memberKind === 'adult' ? 'adult' : '';
  if (!memberKind) throw new ApiError('invalid_family', 'memberKind must be adult or dependent.', 400);
  const permission = memberKind === 'dependent' ? 'viewer' : body.permissionLevel === 'editor' ? 'editor' : 'viewer';
  if (memberKind === 'dependent' && body.permissionLevel === 'editor') {
    throw new ApiError('invalid_family', 'A dependent profile cannot be given editor access.', 400);
  }
  const id = randomUUID();
  const stamp = new Date(now).toISOString();
  const relationship = typeof body.relationshipLabel === 'string' ? body.relationshipLabel.trim().slice(0, 40) : null;
  db.prepare(
    `INSERT INTO family_relationships (id, owner_user_id, display_name, member_kind, relationship_label, permission_level, access_status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
  ).run(id, userId, nameOf(body.displayName), memberKind, relationship, permission, stamp, stamp);
  return getFamilyMember(db, userId, id);
}

export function listFamily(db: Sql, userId: string): Record<string, unknown>[] {
  return db.prepare(
    `SELECT id, display_name AS displayName, member_kind AS memberKind, relationship_label AS relationshipLabel,
      permission_level AS permissionLevel, access_status AS accessStatus FROM family_relationships WHERE owner_user_id = ? ORDER BY created_at`,
  ).all(userId) as Record<string, unknown>[];
}

export function getFamilyMember(db: Sql, userId: string, id: string): Record<string, unknown> {
  const row = db.prepare(
    `SELECT id, display_name AS displayName, member_kind AS memberKind, relationship_label AS relationshipLabel,
      permission_level AS permissionLevel, access_status AS accessStatus FROM family_relationships WHERE id = ? AND owner_user_id = ?`,
  ).get(id, userId) as Record<string, unknown> | undefined;
  if (!row) throw new ApiError('not_found', 'That family profile was not found.', 404);
  return row;
}

export function updateFamilyMember(db: Sql, userId: string, id: string, body: Record<string, unknown>, now: number): Record<string, unknown> {
  const current = getFamilyMember(db, userId, id);
  const access = body.accessStatus === undefined ? current.accessStatus : body.accessStatus === 'revoked' ? 'revoked' : body.accessStatus === 'active' ? 'active' : '';
  if (!access) throw new ApiError('invalid_family', 'accessStatus must be active or revoked.', 400);
  db.prepare('UPDATE family_relationships SET access_status = ?, updated_at = ? WHERE id = ? AND owner_user_id = ?').run(access, new Date(now).toISOString(), id, userId);
  return getFamilyMember(db, userId, id);
}
