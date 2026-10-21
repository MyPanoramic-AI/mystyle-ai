import { randomUUID } from 'node:crypto';
import { ApiError } from '../errors.js';
import type { Sql } from '../db.js';
import { assertPassword, hashPassword, verifyPassword } from '../auth/password.js';
import { hashToken, newSecret } from '../auth/sessions.js';
import { buildTransactionalEmail } from '../email/templates.js';
import type { Mailer } from '../email/types.js';
import { normalEmail } from './accounts.js';

export interface EmailSecurityConfig {
  appPublicUrl: string;
  verificationTokenMs: number;
  resetTokenMs: number;
  requireVerifiedForSensitive: boolean;
}

function audit(db: Sql, eventType: string, userId: string | null, metadata: Record<string, string | boolean | number>, now: number): void {
  db.prepare(
    `INSERT INTO audit_events (id, event_type, actor_user_id, resource_type, resource_id, metadata_json, created_at)
     VALUES (?, ?, ?, 'user', ?, ?, ?)`,
  ).run(randomUUID(), eventType, userId, userId ?? 'unknown', JSON.stringify(metadata), new Date(now).toISOString());
}

function invalidateOpenTokens(db: Sql, table: 'email_verification_tokens' | 'password_reset_tokens', userId: string, now: number): void {
  db.prepare(
    `UPDATE ${table} SET superseded_at = ? WHERE user_id = ? AND consumed_at IS NULL AND superseded_at IS NULL`,
  ).run(new Date(now).toISOString(), userId);
}

export function readEmailStatus(db: Sql, userId: string): { email: string; emailVerified: boolean; verifiedAt: string | null } {
  const row = db.prepare(
    `SELECT email, email_verified_at AS verifiedAt FROM users WHERE id = ?`,
  ).get(userId) as { email: string; verifiedAt: string | null } | undefined;
  if (!row) throw new ApiError('unauthorised', 'Sign in is required.', 401);
  return { email: row.email, emailVerified: Boolean(row.verifiedAt), verifiedAt: row.verifiedAt };
}

export function assertEmailVerifiedForSensitive(db: Sql, userId: string, requireVerified: boolean): void {
  if (!requireVerified) return;
  const status = readEmailStatus(db, userId);
  if (!status.emailVerified) {
    throw new ApiError('email_unverified', 'Verify your email before continuing with this account action.', 403);
  }
}

export async function issueEmailVerification(input: {
  db: Sql;
  mailer: Mailer;
  userId: string;
  config: EmailSecurityConfig;
  now: number;
  reason: 'register' | 'resend';
}): Promise<{ sent: boolean }> {
  const status = readEmailStatus(input.db, input.userId);
  if (status.emailVerified) return { sent: false };

  const token = newSecret();
  const stamp = new Date(input.now).toISOString();
  const expiresAt = new Date(input.now + input.config.verificationTokenMs).toISOString();
  const actionPath = `/?action=verify-email&token=${encodeURIComponent(token)}`;

  input.db.exec('BEGIN');
  try {
    invalidateOpenTokens(input.db, 'email_verification_tokens', input.userId, input.now);
    input.db.prepare(
      `INSERT INTO email_verification_tokens (id, user_id, token_hash, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?)`,
    ).run(randomUUID(), input.userId, hashToken(token), expiresAt, stamp);
    audit(input.db, 'email_verification_issued', input.userId, { reason: input.reason }, input.now);
    input.db.exec('COMMIT');
  } catch (error) {
    input.db.exec('ROLLBACK');
    throw error;
  }

  const message = buildTransactionalEmail({
    kind: 'email_verification',
    to: status.email,
    appPublicUrl: input.config.appPublicUrl,
    actionPath,
    expiresMinutes: Math.max(1, Math.round(input.config.verificationTokenMs / 60000)),
  });
  await input.mailer.send(message);
  return { sent: true };
}

export function confirmEmailVerification(db: Sql, tokenRaw: unknown, now: number): { emailVerified: boolean } {
  if (typeof tokenRaw !== 'string' || tokenRaw.length < 20 || tokenRaw.length > 200) {
    throw new ApiError('invalid_token', 'That verification link is not valid.', 400);
  }
  const tokenHash = hashToken(tokenRaw);
  const stamp = new Date(now).toISOString();

  db.exec('BEGIN');
  let failed: ApiError | null = null;
  try {
    const row = db.prepare(
      `SELECT id, user_id AS userId, expires_at AS expiresAt, consumed_at AS consumedAt, superseded_at AS supersededAt
       FROM email_verification_tokens WHERE token_hash = ?`,
    ).get(tokenHash) as
      | { id: string; userId: string; expiresAt: string; consumedAt: string | null; supersededAt: string | null }
      | undefined;

    if (!row || row.supersededAt) failed = new ApiError('invalid_token', 'That verification link is not valid.', 400);
    else if (row.consumedAt) failed = new ApiError('token_used', 'That verification link was already used.', 400);
    else if (Date.parse(row.expiresAt) <= now) failed = new ApiError('token_expired', 'That verification link has expired.', 400);
    else {
      const updated = db.prepare(
        `UPDATE email_verification_tokens SET consumed_at = ? WHERE id = ? AND consumed_at IS NULL`,
      ).run(stamp, row.id) as { changes?: number };
      if (!updated || Number(updated.changes ?? 0) !== 1) {
        failed = new ApiError('token_used', 'That verification link was already used.', 400);
      } else {
        db.prepare(`UPDATE users SET email_verified_at = COALESCE(email_verified_at, ?), updated_at = ? WHERE id = ?`)
          .run(stamp, stamp, row.userId);
        invalidateOpenTokens(db, 'email_verification_tokens', row.userId, now);
        audit(db, 'email_verified', row.userId, {}, now);
        db.exec('COMMIT');
        return { emailVerified: true };
      }
    }
    db.exec('ROLLBACK');
  } catch (error) {
    try { db.exec('ROLLBACK'); } catch { /* ignore */ }
    throw error;
  }
  throw failed ?? new ApiError('invalid_token', 'That verification link is not valid.', 400);
}

export async function requestPasswordReset(input: {
  db: Sql;
  mailer: Mailer;
  emailRaw: unknown;
  config: EmailSecurityConfig;
  now: number;
}): Promise<{ accepted: true }> {
  // Always return the same shape. Do not reveal whether the email exists.
  let email: string;
  try {
    email = normalEmail(input.emailRaw);
  } catch {
    return { accepted: true };
  }

  const user = input.db.prepare(
    `SELECT id, status FROM users WHERE email = ?`,
  ).get(email) as { id: string; status: string } | undefined;

  if (!user || user.status !== 'active') {
    audit(input.db, 'password_reset_requested', null, { known: false }, input.now);
    return { accepted: true };
  }

  const token = newSecret();
  const stamp = new Date(input.now).toISOString();
  const expiresAt = new Date(input.now + input.config.resetTokenMs).toISOString();
  const actionPath = `/?action=reset-password&token=${encodeURIComponent(token)}`;

  input.db.exec('BEGIN');
  try {
    invalidateOpenTokens(input.db, 'password_reset_tokens', user.id, input.now);
    input.db.prepare(
      `INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?)`,
    ).run(randomUUID(), user.id, hashToken(token), expiresAt, stamp);
    audit(input.db, 'password_reset_requested', user.id, { known: true }, input.now);
    input.db.exec('COMMIT');
  } catch (error) {
    input.db.exec('ROLLBACK');
    throw error;
  }

  try {
    const message = buildTransactionalEmail({
      kind: 'password_reset',
      to: email,
      appPublicUrl: input.config.appPublicUrl,
      actionPath,
      expiresMinutes: Math.max(1, Math.round(input.config.resetTokenMs / 60000)),
    });
    await input.mailer.send(message);
  } catch {
    // Still return accepted so callers cannot probe delivery failures as existence.
  }
  return { accepted: true };
}

export async function completePasswordReset(input: {
  db: Sql;
  mailer: Mailer;
  tokenRaw: unknown;
  passwordRaw: unknown;
  config: EmailSecurityConfig;
  now: number;
}): Promise<{ reset: true }> {
  if (typeof input.tokenRaw !== 'string' || input.tokenRaw.length < 20 || input.tokenRaw.length > 200) {
    throw new ApiError('invalid_token', 'That password reset link is not valid.', 400);
  }
  let password: string;
  try {
    password = assertPassword(input.passwordRaw);
  } catch {
    throw new ApiError('invalid_password', 'Use a password of at least 12 characters.', 400);
  }

  const tokenHash = hashToken(input.tokenRaw);
  const stamp = new Date(input.now).toISOString();

  input.db.exec('BEGIN');
  let userId = '';
  let email = '';
  try {
    const row = input.db.prepare(
      `SELECT t.id, t.user_id AS userId, t.expires_at AS expiresAt, t.consumed_at AS consumedAt, t.superseded_at AS supersededAt,
              u.email, u.status
       FROM password_reset_tokens t JOIN users u ON u.id = t.user_id
       WHERE t.token_hash = ?`,
    ).get(tokenHash) as
      | {
        id: string;
        userId: string;
        expiresAt: string;
        consumedAt: string | null;
        supersededAt: string | null;
        email: string;
        status: string;
      }
      | undefined;

    if (!row || row.supersededAt || row.status !== 'active') {
      input.db.exec('ROLLBACK');
      throw new ApiError('invalid_token', 'That password reset link is not valid.', 400);
    }
    if (row.consumedAt) {
      input.db.exec('ROLLBACK');
      throw new ApiError('token_used', 'That password reset link was already used.', 400);
    }
    if (Date.parse(row.expiresAt) <= input.now) {
      input.db.exec('ROLLBACK');
      throw new ApiError('token_expired', 'That password reset link has expired.', 400);
    }

    const updated = input.db.prepare(
      `UPDATE password_reset_tokens SET consumed_at = ? WHERE id = ? AND consumed_at IS NULL`,
    ).run(stamp, row.id) as { changes?: number };
    if (!updated || Number(updated.changes ?? 0) !== 1) {
      input.db.exec('ROLLBACK');
      throw new ApiError('token_used', 'That password reset link was already used.', 400);
    }

    input.db.prepare(`UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?`)
      .run(hashPassword(password), stamp, row.userId);
    input.db.prepare(`DELETE FROM sessions WHERE user_id = ?`).run(row.userId);
    invalidateOpenTokens(input.db, 'password_reset_tokens', row.userId, input.now);
    audit(input.db, 'password_reset_completed', row.userId, {}, input.now);
    userId = row.userId;
    email = row.email;
    input.db.exec('COMMIT');
  } catch (error) {
    try { input.db.exec('ROLLBACK'); } catch { /* already rolled back */ }
    throw error;
  }

  try {
    const notice = buildTransactionalEmail({
      kind: 'password_changed',
      to: email,
      appPublicUrl: input.config.appPublicUrl,
    });
    await input.mailer.send(notice);
  } catch {
    audit(input.db, 'password_changed_email_failed', userId, {}, input.now);
  }
  return { reset: true };
}

export function verifyCurrentPassword(db: Sql, userId: string, passwordRaw: unknown): boolean {
  const password = typeof passwordRaw === 'string' ? passwordRaw : '';
  const row = db.prepare(`SELECT password_hash AS passwordHash FROM users WHERE id = ?`).get(userId) as
    | { passwordHash: string }
    | undefined;
  if (!row) return false;
  return verifyPassword(password, row.passwordHash);
}
