import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { ApiError } from '../errors.js';
import type { Sql } from '../db.js';
import { verifyPassword } from '../auth/password.js';
import { getPreferences, getProfile } from '../domain/profiles.js';
import { listConsentState } from './consent.js';
import { createStoreZip, sha256Hex } from './zip.js';

const EXPORT_TTL_MS = 60 * 60 * 1000;
const MAX_EXPORT_BYTES = 40 * 1024 * 1024;
const MAX_MEDIA_FILES = 40;

function resolveUnder(root: string, key: string): string {
  if (!key || key.includes('..') || key.includes('/') || key.includes('\\')) {
    throw new ApiError('invalid_path', 'The storage path was rejected.', 400);
  }
  const full = path.resolve(root, key);
  if (!full.startsWith(path.resolve(root))) throw new ApiError('invalid_path', 'The storage path was rejected.', 400);
  return full;
}

export function assertRecentPassword(db: Sql, userId: string, password: unknown): void {
  if (typeof password !== 'string' || password.length < 12) {
    throw new ApiError('reauth_required', 'Confirm with your current password to continue.', 401);
  }
  const user = db.prepare(`SELECT password_hash AS passwordHash, status FROM users WHERE id = ?`).get(userId) as
    | { passwordHash: string; status: string }
    | undefined;
  if (!user || user.status !== 'active' || !verifyPassword(password, user.passwordHash)) {
    throw new ApiError('reauth_failed', 'The password was not accepted.', 401);
  }
}

function rows(db: Sql, sql: string, userId: string): Record<string, unknown>[] {
  return db.prepare(sql).all(userId) as Record<string, unknown>[];
}

export function buildAccountExportPayload(db: Sql, userId: string) {
  const account = db.prepare(
    `SELECT id, email, status, created_at AS createdAt, updated_at AS updatedAt, last_login_at AS lastLoginAt
     FROM users WHERE id = ?`,
  ).get(userId) as Record<string, unknown> | undefined;
  if (!account) throw new ApiError('not_found', 'That account was not found.', 404);

  return {
    exportedAt: new Date().toISOString(),
    formatVersion: 1,
    source: 'mystyle_account_api',
    note: 'This archive contains authenticated account records only. Browser demonstration localStorage is not included.',
    exclusions: [
      'password_hash',
      'session secrets and CSRF tokens',
      'API keys and operator tokens',
      'other accounts',
      'browser demonstration localStorage',
    ],
    account: {
      id: account.id,
      email: account.email,
      status: account.status,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
      lastLoginAt: account.lastLoginAt,
    },
    profile: getProfile(db, userId),
    preferences: getPreferences(db, userId),
    consent: listConsentState(db, userId),
    familyProfiles: rows(db, `SELECT * FROM family_relationships WHERE owner_user_id = ?`, userId),
    familyEvents: rows(db, `SELECT * FROM family_events WHERE owner_user_id = ?`, userId),
    familyEventParticipants: db.prepare(
      `SELECT p.* FROM family_event_participants p
       JOIN family_events e ON e.id = p.event_id
       WHERE e.owner_user_id = ?`,
    ).all(userId),
    wardrobeItems: rows(db, `SELECT * FROM wardrobe_items WHERE user_id = ?`, userId),
    outfitPlans: rows(db, `SELECT * FROM outfit_plans WHERE user_id = ?`, userId),
    savedLooks: rows(db, `SELECT * FROM saved_looks WHERE user_id = ?`, userId),
    savedLookItems: db.prepare(
      `SELECT i.* FROM saved_look_items i JOIN saved_looks l ON l.id = i.look_id WHERE l.user_id = ?`,
    ).all(userId),
    savedProducts: rows(db, `SELECT * FROM saved_products WHERE user_id = ?`, userId),
    beautyPreferences: rows(db, `SELECT * FROM beauty_preferences WHERE user_id = ?`, userId),
    beautyLooks: rows(db, `SELECT * FROM beauty_looks WHERE user_id = ?`, userId),
    beautyOutfitLinks: db.prepare(
      `SELECT link.* FROM beauty_outfit_links link JOIN beauty_looks look ON look.id = link.look_id WHERE look.user_id = ?`,
    ).all(userId),
    aiConversations: rows(db, `SELECT id, title, created_at AS createdAt, last_activity_at AS lastActivityAt FROM ai_conversations WHERE user_id = ?`, userId),
    aiMessages: db.prepare(
      `SELECT m.id, m.conversation_id AS conversationId, m.role, m.content, m.recommendation_json AS recommendationJson, m.created_at AS createdAt
       FROM ai_messages m JOIN ai_conversations c ON c.id = m.conversation_id WHERE c.user_id = ?`,
    ).all(userId),
    entitlements: rows(db, `SELECT id, plan_code AS planCode, status, effective_from AS effectiveFrom, effective_to AS effectiveTo, source, feature_keys_json AS featureKeysJson FROM subscription_entitlements WHERE user_id = ?`, userId),
    creditLedger: rows(db, `SELECT id, entry_type AS entryType, delta, operation_id AS operationId, reason, resulting_balance AS resultingBalance, created_at AS createdAt FROM credit_ledger WHERE user_id = ?`, userId),
    providerCosts: rows(db, `SELECT id, operation_id AS operationId, provider, model, operation_type AS operationType, credits_consumed AS creditsConsumed, usage_units AS usageUnits, currency, reported_cost_minor AS reportedCostMinor, estimated_cost_minor AS estimatedCostMinor, cost_status AS costStatus, request_status AS requestStatus, created_at AS createdAt FROM provider_costs WHERE user_id = ?`, userId),
    aiUsage: rows(db, `SELECT id, provider, model, operation_type AS operationType, request_status AS requestStatus, cost_status AS costStatus, cost_usd AS costUsd, created_at AS createdAt FROM ai_usage WHERE user_id = ?`, userId),
    mediaManifest: rows(db, `SELECT id, purpose, content_type AS contentType, byte_size AS byteSize, created_at AS createdAt, retain_until AS retainUntil FROM media_assets WHERE user_id = ? AND deleted_at IS NULL`, userId),
    accountingNote: 'Credit ledger and provider usage rows are included for the account. Password hashes, sessions, and operator credentials are excluded.',
  };
}

export function createDataExport(
  db: Sql,
  input: { userId: string; password: unknown; mediaDir: string; exportsDir: string },
  now: number,
) {
  assertRecentPassword(db, input.userId, input.password);
  const recent = db.prepare(
    `SELECT COUNT(*) AS count FROM data_export_jobs WHERE user_id = ? AND created_at >= ?`,
  ).get(input.userId, new Date(now - EXPORT_TTL_MS).toISOString()) as { count: number };
  if (Number(recent.count) >= 3) {
    throw new ApiError('export_rate_limited', 'Wait before requesting another export.', 429);
  }

  const id = randomUUID();
  const stamp = new Date(now).toISOString();
  db.prepare(
    `INSERT INTO data_export_jobs (id, user_id, status, storage_key, byte_size, media_count, expires_at, created_at, completed_at)
     VALUES (?, ?, 'running', NULL, NULL, 0, ?, ?, NULL)`,
  ).run(id, input.userId, new Date(now + EXPORT_TTL_MS).toISOString(), stamp);

  try {
    const payload = buildAccountExportPayload(db, input.userId);
    const mediaRows = db.prepare(
      `SELECT id, storage_key AS storageKey, content_type AS contentType FROM media_assets WHERE user_id = ? AND deleted_at IS NULL ORDER BY created_at LIMIT ?`,
    ).all(input.userId, MAX_MEDIA_FILES) as { id: string; storageKey: string; contentType: string }[];

    const entries: { name: string; data: Buffer }[] = [
      { name: 'manifest.json', data: Buffer.from(JSON.stringify({
        exportId: id,
        userId: input.userId,
        createdAt: stamp,
        expiresAt: new Date(now + EXPORT_TTL_MS).toISOString(),
        mediaFiles: mediaRows.map((row) => ({ id: row.id, path: `media/${row.id}`, contentType: row.contentType })),
        accountDataPath: 'account.json',
        note: 'Authenticated export. Secrets and other accounts are excluded.',
      }, null, 2), 'utf8') },
      { name: 'account.json', data: Buffer.from(JSON.stringify(payload, null, 2), 'utf8') },
    ];

    for (const row of mediaRows) {
      const full = resolveUnder(input.mediaDir, row.storageKey);
      if (!existsSync(full)) continue;
      entries.push({ name: `media/${row.id}`, data: readFileSync(full) });
    }

    const zip = createStoreZip(entries);
    if (zip.length > MAX_EXPORT_BYTES) {
      throw new ApiError('export_too_large', 'The export exceeded the configured size limit.', 413);
    }

    mkdirSync(input.exportsDir, { recursive: true });
    const storageKey = `${id}.zip`;
    writeFileSync(resolveUnder(input.exportsDir, storageKey), zip);
    const completed = new Date(now).toISOString();
    db.prepare(
      `UPDATE data_export_jobs SET status = 'ready', storage_key = ?, byte_size = ?, media_count = ?, completed_at = ? WHERE id = ? AND user_id = ?`,
    ).run(storageKey, zip.length, mediaRows.length, completed, id, input.userId);
    db.prepare(
      `INSERT INTO audit_events (id, event_type, actor_user_id, resource_type, resource_id, metadata_json, created_at)
       VALUES (?, 'data_export_created', ?, 'data_export', ?, ?, ?)`,
    ).run(randomUUID(), input.userId, id, JSON.stringify({ byteSize: zip.length, mediaCount: mediaRows.length, sha256: sha256Hex(zip) }), completed);

    return {
      exportId: id,
      status: 'ready',
      byteSize: zip.length,
      mediaCount: mediaRows.length,
      expiresAt: new Date(now + EXPORT_TTL_MS).toISOString(),
      downloadPath: `/api/privacy/export/${id}/download`,
    };
  } catch (error) {
    db.prepare(`UPDATE data_export_jobs SET status = 'failed', error_code = ? WHERE id = ?`).run(
      error instanceof ApiError ? error.code : 'export_failed',
      id,
    );
    throw error;
  }
}

export function readExportJob(db: Sql, userId: string, exportId: string, now: number) {
  const row = db.prepare(
    `SELECT id, status, byte_size AS byteSize, media_count AS mediaCount, expires_at AS expiresAt, created_at AS createdAt, completed_at AS completedAt, error_code AS errorCode
     FROM data_export_jobs WHERE id = ? AND user_id = ?`,
  ).get(exportId, userId) as Record<string, unknown> | undefined;
  if (!row) throw new ApiError('not_found', 'That export was not found.', 404);
  if (typeof row.expiresAt === 'string' && Date.parse(row.expiresAt) <= now) {
    return { ...row, status: 'expired' };
  }
  return row;
}

export function downloadExport(
  db: Sql,
  input: { userId: string; exportId: string; exportsDir: string },
  now: number,
): { bytes: Buffer; fileName: string } {
  const row = db.prepare(
    `SELECT storage_key AS storageKey, status, expires_at AS expiresAt FROM data_export_jobs WHERE id = ? AND user_id = ?`,
  ).get(input.exportId, input.userId) as { storageKey: string | null; status: string; expiresAt: string } | undefined;
  if (!row || !row.storageKey || row.status !== 'ready') throw new ApiError('not_found', 'That export was not found.', 404);
  if (Date.parse(row.expiresAt) <= now) {
    expireExportFile(db, input.exportsDir, input.exportId, row.storageKey);
    throw new ApiError('export_expired', 'That export has expired.', 410);
  }
  const full = resolveUnder(input.exportsDir, row.storageKey);
  if (!existsSync(full)) throw new ApiError('not_found', 'That export was not found.', 404);
  return { bytes: readFileSync(full), fileName: `mystyle-account-export-${input.exportId}.zip` };
}

export function expireExportFile(db: Sql, exportsDir: string, exportId: string, storageKey: string): void {
  try {
    rmSync(resolveUnder(exportsDir, storageKey), { force: true });
  } catch {
    // Path checks already reject traversal; missing files are fine.
  }
  db.prepare(`UPDATE data_export_jobs SET status = 'expired', storage_key = NULL WHERE id = ?`).run(exportId);
}

export function cleanupExpiredExports(db: Sql, exportsDir: string, now: number): number {
  const rows = db.prepare(
    `SELECT id, storage_key AS storageKey FROM data_export_jobs WHERE status = 'ready' AND expires_at IS NOT NULL AND expires_at <= ?`,
  ).all(new Date(now).toISOString()) as { id: string; storageKey: string | null }[];
  for (const row of rows) {
    if (row.storageKey) expireExportFile(db, exportsDir, row.id, row.storageKey);
    else db.prepare(`UPDATE data_export_jobs SET status = 'expired' WHERE id = ?`).run(row.id);
  }
  return rows.length;
}
