import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { ApiError } from '../errors.js';
import type { Sql } from '../db.js';

export const SESSION_COOKIE = 'mystyle_session';

export interface SessionRecord {
  id: string;
  userId: string;
  email: string;
  status: string;
  csrfToken: string;
  expiresAt: string;
}

export function newSecret(): string {
  return randomBytes(32).toString('base64url');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function safeEqual(leftValue: string, rightValue: string): boolean {
  const left = Buffer.from(leftValue);
  const right = Buffer.from(rightValue);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function readCookie(header: string | undefined, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return null;
}

export function sessionCookie(token: string, maxAgeSeconds: number, secure = false): string {
  const secureFlag = secure ? '; Secure' : '';
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAgeSeconds}${secureFlag}`;
}

export function clearSessionCookie(secure = false): string {
  const secureFlag = secure ? '; Secure' : '';
  return `${SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secureFlag}`;
}

export function createSession(db: Sql, userId: string, now: number, sessionMs: number): { token: string; csrfToken: string; expiresAt: string } {
  const token = newSecret();
  const csrfToken = newSecret();
  const expiresAt = new Date(now + sessionMs).toISOString();
  db.prepare(
    `INSERT INTO sessions (id, user_id, token_hash, csrf_token, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(newSecret(), userId, hashToken(token), csrfToken, expiresAt, new Date(now).toISOString());
  return { token, csrfToken, expiresAt };
}

export function findSession(db: Sql, token: string | null, now: number): SessionRecord | null {
  if (!token) return null;
  const row = db.prepare(
    `SELECT s.id, s.user_id AS userId, s.csrf_token AS csrfToken, s.expires_at AS expiresAt, u.email, u.status
     FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ?`,
  ).get(hashToken(token)) as SessionRecord | undefined;
  if (!row) return null;
  if (Date.parse(row.expiresAt) <= now) return null;
  if (row.status !== 'active') return null;
  return row;
}

export function destroySession(db: Sql, sessionId: string): void {
  db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
}

export function requireCsrf(header: string | undefined, session: SessionRecord): void {
  if (!header || !safeEqual(header, session.csrfToken)) {
    throw new ApiError('invalid_csrf', 'The security token was missing or incorrect.', 403);
  }
}
