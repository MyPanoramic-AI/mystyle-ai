import { randomUUID } from 'node:crypto';
import type { Sql } from '../db.js';

export interface PendingPushAlert {
  id: string;
  kind: string;
  title: string;
  body: string;
  url: string;
  tag: string | null;
  createdAt: string;
}

export function enqueuePendingPush(
  db: Sql,
  userId: string,
  payload: { title: string; body: string; url?: string; kind?: string; tag?: string },
  now: number,
): PendingPushAlert {
  const id = randomUUID();
  const createdAt = new Date(now).toISOString();
  db.prepare(
    `INSERT INTO push_pending (id, user_id, kind, title, body, url, tag, created_at, delivered_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
  ).run(
    id,
    userId,
    payload.kind || 'generic',
    payload.title.slice(0, 120),
    payload.body.slice(0, 280),
    (payload.url || '/').slice(0, 300),
    (payload.tag || payload.kind || 'istyleu').slice(0, 80),
    createdAt,
  );
  return {
    id,
    kind: payload.kind || 'generic',
    title: payload.title.slice(0, 120),
    body: payload.body.slice(0, 280),
    url: payload.url || '/',
    tag: payload.tag || payload.kind || 'istyleu',
    createdAt,
  };
}

export function listPendingPushForUser(db: Sql, userId: string, limit = 20): PendingPushAlert[] {
  const rows = db.prepare(
    `SELECT id, kind, title, body, url, tag, created_at AS createdAt
     FROM push_pending
     WHERE user_id = ? AND delivered_at IS NULL
     ORDER BY created_at ASC
     LIMIT ?`,
  ).all(userId, limit) as Array<Record<string, unknown>>;
  return rows.map((row) => ({
    id: String(row.id),
    kind: String(row.kind),
    title: String(row.title),
    body: String(row.body),
    url: String(row.url || '/'),
    tag: row.tag == null ? null : String(row.tag),
    createdAt: String(row.createdAt),
  }));
}

export function acknowledgePendingPush(
  db: Sql,
  userId: string,
  ids: string[],
  now: number,
): { acknowledged: number } {
  if (!ids.length) return { acknowledged: 0 };
  const stamp = new Date(now).toISOString();
  let acknowledged = 0;
  const stmt = db.prepare(
    `UPDATE push_pending SET delivered_at = ?
     WHERE id = ? AND user_id = ? AND delivered_at IS NULL`,
  );
  for (const id of ids) {
    if (typeof id !== 'string' || !id.trim()) continue;
    const result = stmt.run(stamp, id.trim(), userId);
    acknowledged += Number(result.changes || 0);
  }
  return { acknowledged };
}
