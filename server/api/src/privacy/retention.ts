import { existsSync, readdirSync, rmSync, statSync } from 'node:fs';
import path from 'node:path';
import { ApiError } from '../errors.js';
import type { Sql } from '../db.js';
import { cleanupExpiredMedia } from '../media/store.js';
import { cleanupExpiredExports } from './export.js';

export function listRetentionPolicies(db: Sql) {
  return db.prepare(
    `SELECT category, policy_status AS policyStatus, retention_days AS retentionDays, action_on_expiry AS actionOnExpiry, notes
     FROM retention_policies ORDER BY category`,
  ).all();
}

export function retentionDryRun(
  db: Sql,
  input: { mediaDir: string; exportsDir: string; now: number; userId?: string },
) {
  const stamp = new Date(input.now).toISOString();
  const customerScoped = Boolean(input.userId);

  const expiredSessions = (customerScoped
    ? db.prepare(`SELECT COUNT(*) AS count FROM sessions WHERE user_id = ? AND expires_at <= ?`).get(input.userId, stamp)
    : db.prepare(`SELECT COUNT(*) AS count FROM sessions WHERE expires_at <= ?`).get(stamp)) as { count: number };
  const expiredMedia = (customerScoped
    ? db.prepare(
        `SELECT COUNT(*) AS count FROM media_assets WHERE user_id = ? AND deleted_at IS NULL AND retain_until IS NOT NULL AND retain_until <= ?`,
      ).get(input.userId, stamp)
    : db.prepare(
        `SELECT COUNT(*) AS count FROM media_assets WHERE deleted_at IS NULL AND retain_until IS NOT NULL AND retain_until <= ?`,
      ).get(stamp)) as { count: number };
  const expiredExports = (customerScoped
    ? db.prepare(
        `SELECT COUNT(*) AS count FROM data_export_jobs WHERE user_id = ? AND status = 'ready' AND expires_at IS NOT NULL AND expires_at <= ?`,
      ).get(input.userId, stamp)
    : db.prepare(
        `SELECT COUNT(*) AS count FROM data_export_jobs WHERE status = 'ready' AND expires_at IS NOT NULL AND expires_at <= ?`,
      ).get(stamp)) as { count: number };

  let orphanedMediaFiles = 0;
  if (!customerScoped && existsSync(input.mediaDir)) {
    const known = new Set(
      (db.prepare(`SELECT storage_key AS storageKey FROM media_assets`).all() as { storageKey: string }[])
        .map((row) => row.storageKey),
    );
    for (const name of readdirSync(input.mediaDir)) {
      if (name.includes('..') || name.includes('/') || name.includes('\\')) continue;
      if (!known.has(name)) orphanedMediaFiles += 1;
    }
  }

  const deletedAccounts = customerScoped
    ? { count: 0 }
    : db.prepare(`SELECT COUNT(*) AS count FROM users WHERE status = 'deleted'`).get() as { count: number };

  const scoped = input.userId
    ? {
        conversations: (db.prepare(`SELECT COUNT(*) AS count FROM ai_conversations WHERE user_id = ?`).get(input.userId) as { count: number }).count,
        media: (db.prepare(`SELECT COUNT(*) AS count FROM media_assets WHERE user_id = ? AND deleted_at IS NULL`).get(input.userId) as { count: number }).count,
      }
    : null;

  return {
    mode: 'dry_run',
    destructiveCleanupEnabled: false,
    generatedAt: stamp,
    wouldActOn: {
      expiredSessions: Number(expiredSessions.count),
      expiredMedia: Number(expiredMedia.count),
      expiredExports: Number(expiredExports.count),
      orphanedMediaFiles,
      deletedAccountTombsstones: Number(deletedAccounts.count),
    },
    accountScope: scoped,
    scope: customerScoped ? 'account' : 'platform',
    policies: listRetentionPolicies(db),
    note: customerScoped
      ? 'Account-scoped preview only. Platform-wide retention counts are available to operators. No data was deleted.'
      : 'No data was deleted. Automatic destructive cleanup remains disabled unless an operator explicitly enables it.',
  };
}

export function runRetentionCleanup(
  db: Sql,
  input: {
    mediaDir: string;
    exportsDir: string;
    now: number;
    enabled: boolean;
    allowDestructive: boolean;
  },
) {
  if (!input.enabled || !input.allowDestructive) {
    throw new ApiError('cleanup_disabled', 'Destructive retention cleanup is disabled.', 403);
  }
  const expiredExports = cleanupExpiredExports(db, input.exportsDir, input.now);
  const expiredMedia = cleanupExpiredMedia(db, input.mediaDir, input.now);
  const sessions = db.prepare(`DELETE FROM sessions WHERE expires_at <= ?`).run(new Date(input.now).toISOString()) as { changes?: number };
  let orphanedRemoved = 0;
  if (existsSync(input.mediaDir)) {
    const known = new Set(
      (db.prepare(`SELECT storage_key AS storageKey FROM media_assets`).all() as { storageKey: string }[])
        .map((row) => row.storageKey),
    );
    for (const name of readdirSync(input.mediaDir)) {
      if (name.includes('..') || name.includes('/') || name.includes('\\')) continue;
      if (known.has(name)) continue;
      const full = path.resolve(input.mediaDir, name);
      const root = path.resolve(input.mediaDir);
      if (full !== root && !full.startsWith(root + path.sep)) continue;
      if (statSync(full).isFile()) {
        rmSync(full, { force: true });
        orphanedRemoved += 1;
      }
    }
  }
  return {
    mode: 'destructive',
    expiredExports,
    expiredMedia,
    expiredSessionsRemoved: Number(sessions.changes ?? 0),
    orphanedMediaRemoved: orphanedRemoved,
  };
}

export function findOrphanedMedia(db: Sql, mediaDir: string): string[] {
  if (!existsSync(mediaDir)) return [];
  const known = new Set(
    (db.prepare(`SELECT storage_key AS storageKey FROM media_assets`).all() as { storageKey: string }[])
      .map((row) => row.storageKey),
  );
  return readdirSync(mediaDir).filter((name) => {
    if (name.includes('..') || name.includes('/') || name.includes('\\')) return false;
    return !known.has(name);
  });
}
