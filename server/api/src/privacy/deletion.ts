import { randomUUID } from 'node:crypto';
import { existsSync, rmSync } from 'node:fs';
import path from 'node:path';
import { ApiError } from '../errors.js';
import type { Sql } from '../db.js';
import { assertRecentPassword } from './export.js';

export const DELETION_EXPLANATION = {
  title: 'Delete your MyStyle AI account',
  consequences: [
    'You will be signed out on this device and other sessions for this account will end.',
    'Your style profile, wardrobe, family plans, beauty looks, and AI conversations will be removed.',
    'Private photographs owned by this account will be deleted from private storage.',
    'You will not be able to sign in again with this email on this account.',
    'Credit ledger, provider-usage, and audit records may be kept in a minimised form for accounting or security until a retention period is approved.',
    'This action does not clear browser demonstration data on other devices. Use Clear local demonstration data for this browser.',
  ],
  retainedPendingReview: [
    'credit_ledger',
    'provider_costs',
    'ai_usage',
    'audit_events',
    'consent_records',
    'account_deletion_requests',
  ],
  legalNote: 'Retention of accounting and audit rows is pending legal review. Identifiable email and profile content are removed from the active account.',
};

type Progress = {
  steps: Record<string, 'pending' | 'done' | 'failed'>;
  lastError?: string;
};

function emptyProgress(): Progress {
  return {
    steps: {
      revoke_sessions: 'pending',
      delete_media_files: 'pending',
      delete_personal_tables: 'pending',
      delete_conversations: 'pending',
      anonymise_account: 'pending',
      cancel_entitlement: 'pending',
    },
  };
}

export function startDeletionRequest(db: Sql, userId: string, now: number) {
  const existing = db.prepare(
    `SELECT id, status FROM account_deletion_requests WHERE user_id = ? AND status IN ('pending', 'running', 'failed') ORDER BY created_at DESC LIMIT 1`,
  ).get(userId) as { id: string; status: string } | undefined;
  if (existing?.status === 'running') {
    throw new ApiError('deletion_in_progress', 'Account deletion is already running.', 409);
  }
  if (existing?.status === 'pending') {
    return { requestId: existing.id, status: 'pending', explanation: DELETION_EXPLANATION };
  }
  const id = randomUUID();
  const stamp = new Date(now).toISOString();
  const retentionSubjectId = randomUUID();
  db.prepare(
    `INSERT INTO account_deletion_requests (id, user_id, status, retention_subject_id, progress_json, created_at, updated_at)
     VALUES (?, ?, 'pending', ?, ?, ?, ?)`,
  ).run(id, userId, retentionSubjectId, JSON.stringify(emptyProgress()), stamp, stamp);
  db.prepare(
    `INSERT INTO audit_events (id, event_type, actor_user_id, resource_type, resource_id, metadata_json, created_at)
     VALUES (?, 'deletion_requested', ?, 'account_deletion', ?, '{}', ?)`,
  ).run(randomUUID(), userId, id, stamp);
  return { requestId: id, status: 'pending', explanation: DELETION_EXPLANATION };
}

export function cancelDeletionRequest(db: Sql, userId: string, now: number) {
  const row = db.prepare(
    `SELECT id, status FROM account_deletion_requests WHERE user_id = ? AND status = 'pending' ORDER BY created_at DESC LIMIT 1`,
  ).get(userId) as { id: string; status: string } | undefined;
  if (!row) throw new ApiError('not_found', 'There is no pending deletion request.', 404);
  const stamp = new Date(now).toISOString();
  db.prepare(`UPDATE account_deletion_requests SET status = 'cancelled', cancelled_at = ?, updated_at = ? WHERE id = ?`).run(stamp, stamp, row.id);
  db.prepare(
    `INSERT INTO audit_events (id, event_type, actor_user_id, resource_type, resource_id, metadata_json, created_at)
     VALUES (?, 'deletion_cancelled', ?, 'account_deletion', ?, '{}', ?)`,
  ).run(randomUUID(), userId, row.id, stamp);
  return { requestId: row.id, status: 'cancelled' };
}

export function deletionStatus(db: Sql, userId: string) {
  const row = db.prepare(
    `SELECT id, status, progress_json AS progressJson, created_at AS createdAt, completed_at AS completedAt, cancelled_at AS cancelledAt, error_code AS errorCode
     FROM account_deletion_requests WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`,
  ).get(userId) as Record<string, unknown> | undefined;
  if (!row) return { request: null, explanation: DELETION_EXPLANATION };
  return {
    request: {
      id: row.id,
      status: row.status,
      progress: JSON.parse(String(row.progressJson)),
      createdAt: row.createdAt,
      completedAt: row.completedAt,
      cancelledAt: row.cancelledAt,
      errorCode: row.errorCode,
    },
    explanation: DELETION_EXPLANATION,
  };
}

function mark(progress: Progress, step: string, state: 'done' | 'failed', error?: string): void {
  progress.steps[step] = state;
  if (error) progress.lastError = error;
}

function resolveMediaPath(mediaDir: string, storageKey: string): string | null {
  if (!storageKey || storageKey.includes('..') || storageKey.includes('/') || storageKey.includes('\\')) return null;
  const full = path.resolve(mediaDir, storageKey);
  if (!full.startsWith(path.resolve(mediaDir))) return null;
  return full;
}

export function confirmDeletion(
  db: Sql,
  input: { userId: string; password: unknown; mediaDir: string; exportsDir: string },
  now: number,
) {
  assertRecentPassword(db, input.userId, input.password);
  let request = db.prepare(
    `SELECT id, status, retention_subject_id AS retentionSubjectId, progress_json AS progressJson
     FROM account_deletion_requests WHERE user_id = ? AND status IN ('pending', 'failed') ORDER BY created_at DESC LIMIT 1`,
  ).get(input.userId) as { id: string; status: string; retentionSubjectId: string; progressJson: string } | undefined;
  if (!request) {
    const started = startDeletionRequest(db, input.userId, now);
    request = db.prepare(
      `SELECT id, status, retention_subject_id AS retentionSubjectId, progress_json AS progressJson
       FROM account_deletion_requests WHERE id = ?`,
    ).get(started.requestId) as typeof request;
  }
  if (!request) throw new ApiError('not_found', 'There is no deletion request to confirm.', 404);

  const progress = JSON.parse(request.progressJson) as Progress;
  const stamp = new Date(now).toISOString();
  db.prepare(`UPDATE account_deletion_requests SET status = 'running', updated_at = ?, error_code = NULL WHERE id = ?`).run(stamp, request.id);

  try {
    if (progress.steps.revoke_sessions !== 'done') {
      db.prepare(`DELETE FROM sessions WHERE user_id = ?`).run(input.userId);
      mark(progress, 'revoke_sessions', 'done');
      saveProgress(db, request.id, progress, stamp);
    }

    if (progress.steps.delete_media_files !== 'done') {
      const media = db.prepare(
        `SELECT id, storage_key AS storageKey FROM media_assets WHERE user_id = ?`,
      ).all(input.userId) as { id: string; storageKey: string }[];
      for (const item of media) {
        const full = resolveMediaPath(input.mediaDir, item.storageKey);
        if (full && existsSync(full)) rmSync(full, { force: true });
      }
      const exports = db.prepare(
        `SELECT id, storage_key AS storageKey FROM data_export_jobs WHERE user_id = ?`,
      ).all(input.userId) as { id: string; storageKey: string | null }[];
      for (const item of exports) {
        if (!item.storageKey) continue;
        const full = resolveMediaPath(input.exportsDir, item.storageKey);
        if (full && existsSync(full)) rmSync(full, { force: true });
      }
      mark(progress, 'delete_media_files', 'done');
      saveProgress(db, request.id, progress, stamp);
    }

    if (progress.steps.delete_conversations !== 'done') {
      db.prepare(
        `DELETE FROM ai_messages WHERE conversation_id IN (SELECT id FROM ai_conversations WHERE user_id = ?)`,
      ).run(input.userId);
      db.prepare(`DELETE FROM ai_conversations WHERE user_id = ?`).run(input.userId);
      mark(progress, 'delete_conversations', 'done');
      saveProgress(db, request.id, progress, stamp);
    }

    if (progress.steps.delete_personal_tables !== 'done') {
      db.prepare(`DELETE FROM beauty_outfit_links WHERE look_id IN (SELECT id FROM beauty_looks WHERE user_id = ?)`).run(input.userId);
      db.prepare(`DELETE FROM beauty_looks WHERE user_id = ?`).run(input.userId);
      db.prepare(`DELETE FROM beauty_preferences WHERE user_id = ?`).run(input.userId);
      db.prepare(`DELETE FROM family_event_participants WHERE event_id IN (SELECT id FROM family_events WHERE owner_user_id = ?)`).run(input.userId);
      db.prepare(`DELETE FROM family_events WHERE owner_user_id = ?`).run(input.userId);
      db.prepare(`DELETE FROM family_relationships WHERE owner_user_id = ?`).run(input.userId);
      db.prepare(`DELETE FROM saved_look_items WHERE look_id IN (SELECT id FROM saved_looks WHERE user_id = ?)`).run(input.userId);
      db.prepare(`DELETE FROM saved_looks WHERE user_id = ?`).run(input.userId);
      db.prepare(`DELETE FROM outfit_plans WHERE user_id = ?`).run(input.userId);
      db.prepare(`DELETE FROM wardrobe_items WHERE user_id = ?`).run(input.userId);
      db.prepare(`DELETE FROM saved_products WHERE user_id = ?`).run(input.userId);
      db.prepare(`DELETE FROM profile_measurements WHERE user_id = ?`).run(input.userId);
      db.prepare(`DELETE FROM customer_profiles WHERE user_id = ?`).run(input.userId);
      db.prepare(`DELETE FROM user_preferences WHERE user_id = ?`).run(input.userId);
      db.prepare(`DELETE FROM media_assets WHERE user_id = ?`).run(input.userId);
      db.prepare(`DELETE FROM data_export_jobs WHERE user_id = ?`).run(input.userId);
      db.prepare(`DELETE FROM credit_reservations WHERE user_id = ?`).run(input.userId);
      db.prepare(`DELETE FROM credit_idempotency WHERE user_id = ?`).run(input.userId);
      db.prepare(`DELETE FROM allocation_periods WHERE user_id = ?`).run(input.userId);
      mark(progress, 'delete_personal_tables', 'done');
      saveProgress(db, request.id, progress, stamp);
    }

    if (progress.steps.cancel_entitlement !== 'done') {
      db.prepare(
        `UPDATE subscription_entitlements SET status = 'cancelled', updated_at = ?, feature_keys_json = '[]' WHERE user_id = ? AND status = 'active'`,
      ).run(stamp, input.userId);
      mark(progress, 'cancel_entitlement', 'done');
      saveProgress(db, request.id, progress, stamp);
    }

    if (progress.steps.anonymise_account !== 'done') {
      const anonymised = `deleted-${request.retentionSubjectId}@deleted.invalid`;
      db.prepare(
        `UPDATE users SET email = ?, password_hash = ?, status = 'deleted', updated_at = ?, last_login_at = NULL WHERE id = ?`,
      ).run(anonymised, `deleted$${request.retentionSubjectId}`, stamp, input.userId);
      mark(progress, 'anonymise_account', 'done');
      saveProgress(db, request.id, progress, stamp);
    }

    db.prepare(
      `UPDATE account_deletion_requests SET status = 'completed', completed_at = ?, updated_at = ?, progress_json = ? WHERE id = ?`,
    ).run(stamp, stamp, JSON.stringify(progress), request.id);
    db.prepare(
      `INSERT INTO audit_events (id, event_type, actor_user_id, resource_type, resource_id, metadata_json, created_at)
       VALUES (?, 'deletion_completed', ?, 'account_deletion', ?, ?, ?)`,
    ).run(randomUUID(), input.userId, request.id, JSON.stringify({ retentionSubjectId: request.retentionSubjectId, retained: DELETION_EXPLANATION.retainedPendingReview }), stamp);

    return {
      requestId: request.id,
      status: 'completed',
      retainedPendingReview: DELETION_EXPLANATION.retainedPendingReview,
      note: DELETION_EXPLANATION.legalNote,
    };
  } catch (error) {
    if (error instanceof ApiError && error.code === 'reauth_failed') throw error;
    if (error instanceof ApiError && error.code === 'reauth_required') throw error;
    const message = error instanceof Error ? error.message : 'deletion_failed';
    mark(progress, Object.keys(progress.steps).find((key) => progress.steps[key] === 'pending') ?? 'failed', 'failed', message);
    db.prepare(
      `UPDATE account_deletion_requests SET status = 'failed', error_code = ?, updated_at = ?, progress_json = ? WHERE id = ?`,
    ).run('deletion_failed', stamp, JSON.stringify(progress), request.id);
    throw new ApiError('deletion_failed', `Account deletion did not finish (${message}). Retry with the same password to continue cleanup.`, 500);
  }
}

function saveProgress(db: Sql, requestId: string, progress: Progress, stamp: string): void {
  db.prepare(`UPDATE account_deletion_requests SET progress_json = ?, updated_at = ? WHERE id = ?`).run(JSON.stringify(progress), stamp, requestId);
}
