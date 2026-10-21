import { randomUUID } from 'node:crypto';
import type { Sql } from '../db.js';
import type { CapturedEmail, Mailer, OutboundEmail } from './types.js';

/** Development and automated-test mailer. Persists messages locally and never contacts a provider. */
export function createCaptureMailer(db: Sql, now: () => number): Mailer {
  return {
    providerName: 'local_capture',
    async send(message: OutboundEmail): Promise<void> {
      db.prepare(
        `INSERT INTO transactional_email_capture
          (id, kind, recipient, subject, text_body, html_body, action_path, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        randomUUID(),
        message.kind,
        message.to,
        message.subject,
        message.text,
        message.html,
        message.actionPath ?? null,
        new Date(now()).toISOString(),
      );
    },
  };
}

export function listCapturedEmails(db: Sql, limit = 50): Omit<CapturedEmail, 'textBody' | 'htmlBody' | 'actionPath'>[] {
  return db.prepare(
    `SELECT id, kind, recipient, subject, created_at AS createdAt
     FROM transactional_email_capture ORDER BY created_at DESC LIMIT ?`,
  ).all(limit) as Omit<CapturedEmail, 'textBody' | 'htmlBody' | 'actionPath'>[];
}

export function readCapturedAction(db: Sql, id: string): { id: string; kind: string; actionPath: string } | null {
  const row = db.prepare(
    `SELECT id, kind, action_path AS actionPath FROM transactional_email_capture WHERE id = ?`,
  ).get(id) as { id: string; kind: string; actionPath: string | null } | undefined;
  if (!row?.actionPath) return null;
  return { id: row.id, kind: row.kind, actionPath: row.actionPath };
}

export function latestCapturedFor(db: Sql, recipient: string, kind: string): CapturedEmail | null {
  const row = db.prepare(
    `SELECT id, kind, recipient, subject, text_body AS textBody, html_body AS htmlBody,
            action_path AS actionPath, created_at AS createdAt
     FROM transactional_email_capture
     WHERE lower(recipient) = lower(?) AND kind = ?
     ORDER BY created_at DESC, rowid DESC LIMIT 1`,
  ).get(recipient, kind) as CapturedEmail | undefined;
  return row ?? null;
}

/** Mailer that refuses delivery — used when capture is off and no live provider is approved. */
export function createDisabledMailer(): Mailer {
  return {
    providerName: 'disabled',
    async send(): Promise<void> {
      throw new Error('Transactional email delivery is disabled in this environment.');
    },
  };
}
