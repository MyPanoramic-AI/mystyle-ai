import { randomUUID } from 'node:crypto';
import { ApiError } from '../errors.js';
import type { Sql } from '../db.js';

export const CONSENT_PURPOSES = [
  'ai_personalisation',
  'marketing',
  'external_photo_ai',
  'browser_profile_import',
] as const;

export type ConsentPurpose = (typeof CONSENT_PURPOSES)[number];

const CAPTURE_METHODS = new Set(['settings_toggle', 'registration_default', 'import_review', 'api']);

export function currentNoticeVersion(db: Sql): string {
  const row = db.prepare(
    `SELECT version FROM privacy_notice_versions WHERE status IN ('draft', 'published') ORDER BY CASE status WHEN 'published' THEN 0 ELSE 1 END, version DESC LIMIT 1`,
  ).get() as { version: string } | undefined;
  return row?.version ?? 'draft-0';
}

export function readPrivacyNotice(db: Sql) {
  const row = db.prepare(
    `SELECT version, published_at AS publishedAt, status, title, summary_json AS summaryJson, contact_placeholder AS contactPlaceholder, notes
     FROM privacy_notice_versions ORDER BY CASE status WHEN 'published' THEN 0 ELSE 1 END, version DESC LIMIT 1`,
  ).get() as Record<string, unknown> | undefined;
  if (!row) throw new ApiError('notice_missing', 'A privacy notice placeholder is not available.', 404);
  return {
    version: row.version,
    publishedAt: row.publishedAt,
    status: row.status,
    title: row.title,
    summary: JSON.parse(String(row.summaryJson)),
    contactPlaceholder: row.contactPlaceholder,
    notes: row.notes,
    legalStatus: 'This text is a technical draft for legal review. It is not an approved privacy notice.',
  };
}

export function latestConsent(db: Sql, userId: string, purpose: ConsentPurpose): { status: 'granted' | 'withdrawn'; createdAt: string; noticeVersion: string } | null {
  const row = db.prepare(
    `SELECT status, created_at AS createdAt, notice_version AS noticeVersion
     FROM consent_records WHERE user_id = ? AND purpose = ? ORDER BY created_at DESC, rowid DESC LIMIT 1`,
  ).get(userId, purpose) as { status: 'granted' | 'withdrawn'; createdAt: string; noticeVersion: string } | undefined;
  return row ?? null;
}

export function listConsentState(db: Sql, userId: string) {
  const current = CONSENT_PURPOSES.map((purpose) => {
    const latest = latestConsent(db, userId, purpose);
    return {
      purpose,
      status: latest?.status ?? 'withdrawn',
      granted: latest?.status === 'granted',
      updatedAt: latest?.createdAt ?? null,
      noticeVersion: latest?.noticeVersion ?? null,
    };
  });
  const history = db.prepare(
    `SELECT id, purpose, status, notice_version AS noticeVersion, capture_method AS captureMethod, evidence_json AS evidenceJson, created_at AS createdAt
     FROM consent_records WHERE user_id = ? ORDER BY created_at DESC, rowid DESC LIMIT 100`,
  ).all(userId) as Record<string, unknown>[];
  return {
    noticeVersion: currentNoticeVersion(db),
    current,
    history: history.map((row) => ({
      id: row.id,
      purpose: row.purpose,
      status: row.status,
      noticeVersion: row.noticeVersion,
      captureMethod: row.captureMethod,
      evidence: JSON.parse(String(row.evidenceJson)),
      createdAt: row.createdAt,
    })),
    notes: {
      externalPhotoAi: 'External AI photograph processing is not active. Granting this consent does not start a provider call.',
      bundling: 'Each purpose is recorded separately. Saving a style profile does not grant photograph processing.',
      family: 'Account-holder consent does not imply consent for a dependent profile.',
    },
  };
}

export function recordConsent(
  db: Sql,
  input: {
    userId: string;
    purpose: string;
    granted: boolean;
    captureMethod: string;
    evidence?: Record<string, unknown>;
  },
  now: number,
) {
  if (!CONSENT_PURPOSES.includes(input.purpose as ConsentPurpose)) {
    throw new ApiError('invalid_consent', 'That consent purpose was not accepted.', 400);
  }
  if (!CAPTURE_METHODS.has(input.captureMethod)) {
    throw new ApiError('invalid_consent', 'That capture method was not accepted.', 400);
  }
  if (typeof input.granted !== 'boolean') {
    throw new ApiError('invalid_consent', 'Consent must be granted or withdrawn.', 400);
  }
  const purpose = input.purpose as ConsentPurpose;
  const status = input.granted ? 'granted' : 'withdrawn';
  const stamp = new Date(now).toISOString();
  const noticeVersion = currentNoticeVersion(db);
  const id = randomUUID();
  const evidence = {
    purpose,
    status,
    noticeVersion,
    ...(input.evidence ?? {}),
  };
  db.prepare(
    `INSERT INTO consent_records (id, user_id, purpose, status, notice_version, capture_method, evidence_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(id, input.userId, purpose, status, noticeVersion, input.captureMethod, JSON.stringify(evidence), stamp);

  if (purpose === 'ai_personalisation') {
    db.prepare(`UPDATE user_preferences SET ai_personalisation_consent = ?, updated_at = ? WHERE user_id = ?`).run(input.granted ? 1 : 0, stamp, input.userId);
  }
  if (purpose === 'marketing') {
    db.prepare(`UPDATE user_preferences SET marketing_opt_in = ?, updated_at = ? WHERE user_id = ?`).run(input.granted ? 1 : 0, stamp, input.userId);
  }

  db.prepare(
    `INSERT INTO audit_events (id, event_type, actor_user_id, resource_type, resource_id, metadata_json, created_at)
     VALUES (?, 'consent_recorded', ?, 'consent', ?, ?, ?)`,
  ).run(randomUUID(), input.userId, id, JSON.stringify({ purpose, status, noticeVersion }), stamp);

  return listConsentState(db, input.userId);
}

export function seedDefaultConsents(db: Sql, userId: string, now: number): void {
  const stamp = new Date(now).toISOString();
  const noticeVersion = currentNoticeVersion(db);
  for (const purpose of CONSENT_PURPOSES) {
    db.prepare(
      `INSERT INTO consent_records (id, user_id, purpose, status, notice_version, capture_method, evidence_json, created_at)
       VALUES (?, ?, ?, 'withdrawn', ?, 'registration_default', ?, ?)`,
    ).run(
      randomUUID(),
      userId,
      purpose,
      noticeVersion,
      JSON.stringify({ purpose, status: 'withdrawn', noticeVersion, note: 'Optional consent defaults to off at registration.' }),
      stamp,
    );
  }
}

export function hasGrantedConsent(db: Sql, userId: string, purpose: ConsentPurpose): boolean {
  return latestConsent(db, userId, purpose)?.status === 'granted';
}
