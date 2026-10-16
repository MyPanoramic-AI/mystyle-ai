import { randomUUID } from 'node:crypto';
import { ApiError } from '../errors.js';
import type { Sql } from '../db.js';
import { assertPassword, hashPassword, verifyPassword } from '../auth/password.js';
import { createSession } from '../auth/sessions.js';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalEmail(value: unknown): string {
  if (typeof value !== 'string') throw new ApiError('invalid_email', 'Enter a valid email address.', 400);
  const email = value.trim().toLowerCase();
  if (!EMAIL.test(email) || email.length > 254) throw new ApiError('invalid_email', 'Enter a valid email address.', 400);
  return email;
}

export function registerAccount(db: Sql, emailRaw: unknown, passwordRaw: unknown, now: number, sessionMs: number): { userId: string; token: string; csrfToken: string } {
  const email = normalEmail(emailRaw);
  let password: string;
  try {
    password = assertPassword(passwordRaw);
  } catch {
    throw new ApiError('invalid_password', 'Use a password of at least 12 characters.', 400);
  }
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) throw new ApiError('duplicate_email', 'An account with that email already exists.', 409);
  const userId = randomUUID();
  const stamp = new Date(now).toISOString();
  db.exec('BEGIN');
  try {
    db.prepare(
      `INSERT INTO users (id, email, password_hash, status, created_at, updated_at, last_login_at) VALUES (?, ?, ?, 'active', ?, ?, ?)`,
    ).run(userId, email, hashPassword(password), stamp, stamp, stamp);
    db.prepare(
      `INSERT INTO customer_profiles (
        user_id, display_name, style_preferences_json, favourite_colours_json, avoid_colours_json, fashion_interests_json, completion_status, updated_at
      ) VALUES (?, NULL, '[]', '[]', '[]', '[]', 'incomplete', ?)`,
    ).run(userId, stamp);
    db.prepare(
      `INSERT INTO user_preferences (user_id, privacy_json, notifications_json, ai_personalisation_consent, marketing_opt_in, updated_at)
       VALUES (?, ?, ?, 0, 0, ?)`,
    ).run(userId, JSON.stringify({ shareProfileWithStylist: false }), JSON.stringify({ productAlerts: false }), stamp);
    const session = createSession(db, userId, now, sessionMs);
    db.prepare(
      `INSERT INTO audit_events (id, event_type, actor_user_id, resource_type, resource_id, metadata_json, created_at)
       VALUES (?, 'register', ?, 'user', ?, '{}', ?)`,
    ).run(randomUUID(), userId, userId, stamp);
    db.exec('COMMIT');
    return { userId, token: session.token, csrfToken: session.csrfToken };
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

export function loginAccount(db: Sql, emailRaw: unknown, passwordRaw: unknown, now: number, sessionMs: number): { userId: string; token: string; csrfToken: string } {
  const email = normalEmail(emailRaw);
  const password = typeof passwordRaw === 'string' ? passwordRaw : '';
  const user = db.prepare('SELECT id, password_hash AS passwordHash, status FROM users WHERE email = ?').get(email) as
    | { id: string; passwordHash: string; status: string }
    | undefined;
  if (!user || !verifyPassword(password, user.passwordHash)) {
    throw new ApiError('invalid_credentials', 'The email or password was not accepted.', 401);
  }
  if (user.status !== 'active') throw new ApiError('account_disabled', 'This account cannot sign in.', 403);
  const stamp = new Date(now).toISOString();
  db.prepare('UPDATE users SET last_login_at = ?, updated_at = ? WHERE id = ?').run(stamp, stamp, user.id);
  const session = createSession(db, user.id, now, sessionMs);
  db.prepare(
    `INSERT INTO audit_events (id, event_type, actor_user_id, resource_type, resource_id, metadata_json, created_at)
     VALUES (?, 'login', ?, 'user', ?, '{}', ?)`,
  ).run(randomUUID(), user.id, user.id, stamp);
  return { userId: user.id, token: session.token, csrfToken: session.csrfToken };
}
