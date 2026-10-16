import { randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { ApiError } from '../errors.js';
import type { Sql } from '../db.js';

const PURPOSES = new Set(['wardrobe', 'profile', 'garment_reference']);

export function inspectImage(bytes: Buffer): string {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (bytes.length >= png.length && bytes.subarray(0, png.length).equals(png)) return 'image/png';
  if (bytes.length >= 12 && bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP') {
    return 'image/webp';
  }
  throw new ApiError('invalid_image', 'Upload a JPEG, PNG, or WebP image.', 400);
}

export function assertPurpose(purpose: unknown): string {
  if (typeof purpose === 'string' && /child|minor|dependent/i.test(purpose)) {
    throw new ApiError('child_media_refused', 'Child photographs are not accepted.', 403);
  }
  if (typeof purpose !== 'string' || !PURPOSES.has(purpose)) {
    throw new ApiError('invalid_purpose', 'Purpose must be wardrobe, profile, or garment_reference.', 400);
  }
  return purpose;
}

export function saveMedia(options: {
  db: Sql;
  mediaDir: string;
  userId: string;
  bytes: Buffer;
  purpose: string;
  now: number;
  maxBytes: number;
  retentionMs: number;
}): { id: string; contentType: string; byteSize: number } {
  if (options.bytes.length === 0 || options.bytes.length > options.maxBytes) {
    throw new ApiError('invalid_image', 'The image is empty or larger than the configured limit.', 400);
  }
  const contentType = inspectImage(options.bytes);
  const id = randomUUID();
  const storageKey = `${id}.img`;
  mkdirSync(options.mediaDir, { recursive: true });
  const full = path.join(options.mediaDir, storageKey);
  if (!full.startsWith(path.resolve(options.mediaDir))) {
    throw new ApiError('invalid_path', 'The storage path was rejected.', 400);
  }
  writeFileSync(full, options.bytes);
  const created = new Date(options.now).toISOString();
  options.db.prepare(
    `INSERT INTO media_assets (id, user_id, storage_key, content_type, byte_size, purpose, created_at, deleted_at, retain_until)
     VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?)`,
  ).run(id, options.userId, storageKey, contentType, options.bytes.length, options.purpose, created, new Date(options.now + options.retentionMs).toISOString());
  return { id, contentType, byteSize: options.bytes.length };
}

export function readOwnedMedia(db: Sql, mediaDir: string, userId: string, id: string): { bytes: Buffer; contentType: string } {
  const row = db.prepare(
    `SELECT storage_key AS storageKey, content_type AS contentType FROM media_assets WHERE id = ? AND user_id = ? AND deleted_at IS NULL`,
  ).get(id, userId) as { storageKey: string; contentType: string } | undefined;
  if (!row || row.storageKey.includes('..') || row.storageKey.includes('/') || row.storageKey.includes('\\')) {
    throw new ApiError('not_found', 'That photograph was not found.', 404);
  }
  const full = path.resolve(mediaDir, row.storageKey);
  if (!full.startsWith(path.resolve(mediaDir))) throw new ApiError('not_found', 'That photograph was not found.', 404);
  return { bytes: readFileSync(full), contentType: row.contentType };
}

export function deleteOwnedMedia(db: Sql, mediaDir: string, userId: string, id: string, now: number): void {
  const row = db.prepare(
    `SELECT storage_key AS storageKey FROM media_assets WHERE id = ? AND user_id = ? AND deleted_at IS NULL`,
  ).get(id, userId) as { storageKey: string } | undefined;
  if (!row) throw new ApiError('not_found', 'That photograph was not found.', 404);
  db.prepare('UPDATE media_assets SET deleted_at = ? WHERE id = ?').run(new Date(now).toISOString(), id);
  db.prepare('UPDATE wardrobe_items SET media_id = NULL WHERE media_id = ? AND user_id = ?').run(id, userId);
  const full = path.resolve(mediaDir, row.storageKey);
  if (full.startsWith(path.resolve(mediaDir))) rmSync(full, { force: true });
}

export function cleanupExpiredMedia(db: Sql, mediaDir: string, now: number): number {
  const rows = db.prepare(
    `SELECT id, storage_key AS storageKey FROM media_assets WHERE deleted_at IS NULL AND retain_until IS NOT NULL AND retain_until <= ?`,
  ).all(new Date(now).toISOString()) as { id: string; storageKey: string }[];
  for (const row of rows) {
    db.prepare('UPDATE media_assets SET deleted_at = ? WHERE id = ?').run(new Date(now).toISOString(), row.id);
    rmSync(path.resolve(mediaDir, row.storageKey), { force: true });
  }
  return rows.length;
}
