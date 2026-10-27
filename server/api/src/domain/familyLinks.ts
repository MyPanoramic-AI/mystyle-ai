import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { ApiError } from '../errors.js';
import type { Sql } from '../db.js';
import { buildTransactionalEmail } from '../email/templates.js';
import type { Mailer } from '../email/types.js';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STATUSES = new Set(['pending', 'accepted', 'declined', 'cancelled']);

function normalEmail(value: unknown): string {
  if (typeof value !== 'string') throw new ApiError('invalid_email', 'Enter a valid email address.', 400);
  const email = value.trim().toLowerCase();
  if (!EMAIL.test(email) || email.length > 254) throw new ApiError('invalid_email', 'Enter a valid email address.', 400);
  return email;
}

function optionalLabel(value: unknown): string | null {
  if (value == null || value === '') return null;
  if (typeof value !== 'string' || value.trim().length > 40) {
    throw new ApiError('invalid_family', 'Relationship label must be at most 40 characters.', 400);
  }
  return value.trim();
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function stampOf(now: number): string {
  return new Date(now).toISOString();
}

function userEmail(db: Sql, userId: string): string {
  const row = db.prepare('SELECT email FROM users WHERE id = ?').get(userId) as { email: string } | undefined;
  if (!row?.email) throw new ApiError('not_found', 'Account not found.', 404);
  return row.email;
}

function userDisplayName(db: Sql, userId: string): string {
  const profile = db.prepare('SELECT display_name AS displayName FROM customer_profiles WHERE user_id = ?').get(userId) as
    | { displayName: string | null }
    | undefined;
  if (profile?.displayName?.trim()) return profile.displayName.trim();
  const email = userEmail(db, userId);
  return email.split('@')[0] || 'Family member';
}

function findUserIdByEmail(db: Sql, email: string): string | null {
  const row = db.prepare('SELECT id FROM users WHERE email = ? AND status = ?').get(email, 'active') as { id: string } | undefined;
  return row?.id ?? null;
}

function alreadyLinked(db: Sql, ownerUserId: string, linkedUserId: string): boolean {
  const row = db.prepare(
    `SELECT id FROM family_relationships
     WHERE owner_user_id = ? AND linked_user_id = ? AND access_status = 'active' LIMIT 1`,
  ).get(ownerUserId, linkedUserId);
  return Boolean(row);
}

function presentInvite(row: Record<string, unknown>, direction: 'incoming' | 'outgoing'): Record<string, unknown> {
  return {
    id: row.id,
    direction,
    status: row.status,
    relationshipLabel: row.relationshipLabel ?? null,
    fromUserId: row.fromUserId,
    fromEmail: row.fromEmail ?? null,
    fromDisplayName: row.fromDisplayName ?? null,
    toEmail: row.toEmail,
    toUserId: row.toUserId ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    respondedAt: row.respondedAt ?? null,
  };
}

function createLinkedMember(db: Sql, ownerUserId: string, linkedUserId: string, relationshipLabel: string | null, now: number): string {
  const id = randomUUID();
  const stamp = stampOf(now);
  const displayName = userDisplayName(db, linkedUserId);
  db.prepare(
    `INSERT INTO family_relationships (
      id, owner_user_id, display_name, member_kind, relationship_label, permission_level, access_status,
      created_at, updated_at, styles_json, colours_json, occasions_json, sizes_json, categories_json, comfort_json, budget_cents, linked_user_id
    ) VALUES (?, ?, ?, 'adult', ?, 'viewer', 'active', ?, ?, '[]', '[]', '[]', '{}', '[]', '[]', NULL, ?)`,
  ).run(id, ownerUserId, displayName, relationshipLabel, stamp, stamp, linkedUserId);
  return id;
}

export async function createFamilyLinkInvite(
  db: Sql,
  fromUserId: string,
  body: Record<string, unknown>,
  now: number,
  mailer: Mailer,
  appPublicUrl: string,
): Promise<Record<string, unknown>> {
  const toEmail = normalEmail(body.email ?? body.toEmail);
  const relationshipLabel = optionalLabel(body.relationshipLabel);
  const fromEmail = userEmail(db, fromUserId);
  if (toEmail === fromEmail) {
    throw new ApiError('invalid_family', 'You cannot send a family link request to your own email.', 400);
  }

  const toUserId = findUserIdByEmail(db, toEmail);
  if (toUserId && alreadyLinked(db, fromUserId, toUserId)) {
    throw new ApiError('already_linked', 'That account is already linked in your family profiles.', 409);
  }

  const existing = db.prepare(
    `SELECT id FROM family_link_invites
     WHERE from_user_id = ? AND to_email = ? AND status = 'pending' LIMIT 1`,
  ).get(fromUserId, toEmail);
  if (existing) {
    throw new ApiError('invite_pending', 'A family link request to that email is already pending.', 409);
  }

  const reversePending = toUserId
    ? db.prepare(
      `SELECT id FROM family_link_invites
       WHERE from_user_id = ? AND to_user_id = ? AND status = 'pending' LIMIT 1`,
    ).get(toUserId, fromUserId)
    : null;
  if (reversePending) {
    throw new ApiError(
      'invite_pending',
      'That person already sent you a family link request. Check incoming requests to accept or decline it.',
      409,
    );
  }

  const id = randomUUID();
  const stamp = stampOf(now);
  const token = randomBytes(32).toString('base64url');
  db.prepare(
    `INSERT INTO family_link_invites (
      id, from_user_id, to_email, to_user_id, relationship_label, status, token_hash, created_at, updated_at, responded_at
    ) VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?, NULL)`,
  ).run(id, fromUserId, toEmail, toUserId, relationshipLabel, hashToken(token), stamp, stamp);

  const fromDisplayName = userDisplayName(db, fromUserId);
  let emailed = false;
  if (mailer.providerName !== 'disabled' && appPublicUrl) {
    const message = buildTransactionalEmail({
      kind: 'family_link_invite',
      to: toEmail,
      appPublicUrl,
      actionPath: '/',
      fromDisplayName,
      relationshipLabel,
    });
    await mailer.send(message);
    emailed = true;
  }

  return {
    id,
    status: 'pending',
    toEmail,
    toUserId,
    relationshipLabel,
    createdAt: stamp,
    emailed,
    note: emailed
      ? 'Request sent by email. They can also accept or decline when signed in to MyStyle AI.'
      : toUserId
        ? 'Request sent. They will see it when signed in to MyStyle AI.'
        : 'If that email has a MyStyle AI account, they will see the request when signed in. We do not confirm whether the address is registered.',
  };
}

export function listFamilyLinkInvites(db: Sql, userId: string, now = Date.now()): {
  outgoing: Record<string, unknown>[];
  incoming: Record<string, unknown>[];
} {
  const email = userEmail(db, userId);

  // Attach known accounts to pending invites addressed to this email.
  db.prepare(
    `UPDATE family_link_invites SET to_user_id = ?, updated_at = ?
     WHERE status = 'pending' AND to_user_id IS NULL AND to_email = ?`,
  ).run(userId, stampOf(now), email);

  const outgoingRows = db.prepare(
    `SELECT i.id, i.from_user_id AS fromUserId, i.to_email AS toEmail, i.to_user_id AS toUserId,
            i.relationship_label AS relationshipLabel, i.status, i.created_at AS createdAt,
            i.updated_at AS updatedAt, i.responded_at AS respondedAt
     FROM family_link_invites i
     WHERE i.from_user_id = ?
     ORDER BY i.created_at DESC
     LIMIT 50`,
  ).all(userId) as Record<string, unknown>[];

  const incomingRows = db.prepare(
    `SELECT i.id, i.from_user_id AS fromUserId, i.to_email AS toEmail, i.to_user_id AS toUserId,
            i.relationship_label AS relationshipLabel, i.status, i.created_at AS createdAt,
            i.updated_at AS updatedAt, i.responded_at AS respondedAt,
            u.email AS fromEmail, p.display_name AS fromDisplayName
     FROM family_link_invites i
     JOIN users u ON u.id = i.from_user_id
     LEFT JOIN customer_profiles p ON p.user_id = i.from_user_id
     WHERE i.status = 'pending' AND (i.to_user_id = ? OR (i.to_user_id IS NULL AND i.to_email = ?))
     ORDER BY i.created_at DESC
     LIMIT 50`,
  ).all(userId, email) as Record<string, unknown>[];

  return {
    outgoing: outgoingRows.map((row) => presentInvite(row, 'outgoing')),
    incoming: incomingRows.map((row) => presentInvite(row, 'incoming')),
  };
}

export function respondFamilyLinkInvite(
  db: Sql,
  userId: string,
  inviteId: string,
  decision: 'accepted' | 'declined',
  now: number,
): Record<string, unknown> {
  if (!STATUSES.has(decision)) throw new ApiError('invalid_family', 'Choose accept or decline.', 400);
  const email = userEmail(db, userId);
  const invite = db.prepare(
    `SELECT id, from_user_id AS fromUserId, to_email AS toEmail, to_user_id AS toUserId,
            relationship_label AS relationshipLabel, status
     FROM family_link_invites WHERE id = ?`,
  ).get(inviteId) as {
    id: string;
    fromUserId: string;
    toEmail: string;
    toUserId: string | null;
    relationshipLabel: string | null;
    status: string;
  } | undefined;

  if (!invite || invite.status !== 'pending') {
    throw new ApiError('not_found', 'That family link request was not found.', 404);
  }
  const isRecipient = invite.toUserId === userId || (!invite.toUserId && invite.toEmail === email);
  if (!isRecipient) throw new ApiError('not_found', 'That family link request was not found.', 404);
  if (invite.fromUserId === userId) {
    throw new ApiError('invalid_family', 'You cannot respond to your own family link request.', 400);
  }

  const stamp = stampOf(now);
  if (decision === 'declined') {
    db.prepare(
      `UPDATE family_link_invites SET status = 'declined', to_user_id = ?, updated_at = ?, responded_at = ? WHERE id = ?`,
    ).run(userId, stamp, stamp, inviteId);
    return { id: inviteId, status: 'declined', respondedAt: stamp };
  }

  if (alreadyLinked(db, invite.fromUserId, userId) || alreadyLinked(db, userId, invite.fromUserId)) {
    db.prepare(
      `UPDATE family_link_invites SET status = 'accepted', to_user_id = ?, updated_at = ?, responded_at = ? WHERE id = ?`,
    ).run(userId, stamp, stamp, inviteId);
    return { id: inviteId, status: 'accepted', respondedAt: stamp, note: 'Accounts were already linked.' };
  }

  const forwardId = createLinkedMember(db, invite.fromUserId, userId, invite.relationshipLabel, now);
  const reverseLabel = invite.relationshipLabel === 'Partner / Spouse'
    ? 'Partner / Spouse'
    : invite.relationshipLabel === 'Parent'
      ? 'Other Family Member'
      : 'Other Family Member';
  const reverseId = createLinkedMember(db, userId, invite.fromUserId, reverseLabel, now);
  db.prepare(
    `UPDATE family_link_invites SET status = 'accepted', to_user_id = ?, updated_at = ?, responded_at = ? WHERE id = ?`,
  ).run(userId, stamp, stamp, inviteId);

  return {
    id: inviteId,
    status: 'accepted',
    respondedAt: stamp,
    memberIds: { forInviter: forwardId, forRecipient: reverseId },
  };
}

export function cancelFamilyLinkInvite(db: Sql, userId: string, inviteId: string, now: number): Record<string, unknown> {
  const invite = db.prepare(
    `SELECT id, from_user_id AS fromUserId, status FROM family_link_invites WHERE id = ?`,
  ).get(inviteId) as { id: string; fromUserId: string; status: string } | undefined;
  if (!invite || invite.fromUserId !== userId || invite.status !== 'pending') {
    throw new ApiError('not_found', 'That family link request was not found.', 404);
  }
  const stamp = stampOf(now);
  db.prepare(
    `UPDATE family_link_invites SET status = 'cancelled', updated_at = ?, responded_at = ? WHERE id = ?`,
  ).run(stamp, stamp, inviteId);
  return { id: inviteId, status: 'cancelled', respondedAt: stamp };
}
