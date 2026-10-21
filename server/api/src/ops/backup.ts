import { createHash, randomUUID } from 'node:crypto';
import {
  copyFileSync,
  createReadStream,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { backup, DatabaseSync } from 'node:sqlite';
import { openDatabase, migrate, type Sql } from '../db.js';

export interface BackupManifest {
  id: string;
  createdAt: string;
  method: 'sqlite_backup_api';
  sourceDatabaseName: string;
  databaseFile: string;
  databaseBytes: number;
  databaseSha256: string;
  mediaFiles: { relativePath: string; bytes: number; sha256: string }[];
  mediaCount: number;
  mediaBytes: number;
  exportsNote: string;
  integrity: {
    databaseOpenable: boolean;
    migrationCount: number;
    foreignKeys: string;
  };
  encryption: 'none_local_only';
  accessNote: string;
}

function resolveUnder(root: string, relative: string): string {
  if (!relative || relative.includes('..') || path.isAbsolute(relative)) {
    throw new Error('invalid_backup_path');
  }
  const full = path.resolve(root, relative);
  if (!full.startsWith(path.resolve(root))) throw new Error('invalid_backup_path');
  return full;
}

function sha256File(filePath: string): string {
  const hash = createHash('sha256');
  hash.update(readFileSync(filePath));
  return hash.digest('hex');
}

function listMediaFiles(mediaDir: string): { relativePath: string; fullPath: string; bytes: number; sha256: string }[] {
  if (!existsSync(mediaDir)) return [];
  const out: { relativePath: string; fullPath: string; bytes: number; sha256: string }[] = [];
  for (const name of readdirSync(mediaDir)) {
    if (name.includes('..') || name.includes('/') || name.includes('\\')) continue;
    const full = path.resolve(mediaDir, name);
    if (!full.startsWith(path.resolve(mediaDir))) continue;
    if (!statSync(full).isFile()) continue;
    out.push({ relativePath: name, fullPath: full, bytes: statSync(full).size, sha256: sha256File(full) });
  }
  return out.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}

export async function createSqliteBackup(input: {
  databasePath: string;
  mediaDir: string;
  backupRoot: string;
  now?: number;
}): Promise<{ backupDir: string; manifest: BackupManifest }> {
  if (input.databasePath === ':memory:') throw new Error('Cannot back up an in-memory database.');
  if (!existsSync(input.databasePath)) throw new Error('The database file was not found.');
  if (!path.isAbsolute(input.backupRoot)) throw new Error('Backup root must be an absolute path.');

  const stamp = new Date(input.now ?? Date.now()).toISOString().replace(/[:.]/g, '-');
  const id = `backup-${stamp}-${randomUUID().slice(0, 8)}`;
  const backupDir = path.join(input.backupRoot, id);
  mkdirSync(backupDir, { recursive: true });
  const databaseFile = 'mystyle.sqlite';
  const targetDb = path.join(backupDir, databaseFile);

  const source = new DatabaseSync(input.databasePath, { open: true });
  try {
    await backup(source, targetDb);
  } finally {
    source.close();
  }

  const media = listMediaFiles(input.mediaDir);
  const mediaDir = path.join(backupDir, 'media');
  mkdirSync(mediaDir, { recursive: true });
  for (const file of media) {
    copyFileSync(file.fullPath, path.join(mediaDir, file.relativePath));
  }

  const verifyDb = openDatabase(targetDb);
  let migrationCount = 0;
  let foreignKeys = 'unknown';
  try {
    migrationCount = Number((verifyDb.prepare(`SELECT COUNT(*) AS count FROM schema_migrations`).get() as { count: number }).count);
    foreignKeys = String((verifyDb.prepare('PRAGMA foreign_keys').get() as { foreign_keys: number }).foreign_keys);
    verifyDb.prepare('SELECT 1 AS ok').get();
  } finally {
    verifyDb.close();
  }

  const manifest: BackupManifest = {
    id,
    createdAt: new Date(input.now ?? Date.now()).toISOString(),
    method: 'sqlite_backup_api',
    sourceDatabaseName: path.basename(input.databasePath),
    databaseFile,
    databaseBytes: statSync(targetDb).size,
    databaseSha256: sha256File(targetDb),
    mediaFiles: media.map((file) => ({ relativePath: file.relativePath, bytes: file.bytes, sha256: file.sha256 })),
    mediaCount: media.length,
    mediaBytes: media.reduce((sum, file) => sum + file.bytes, 0),
    exportsNote: 'Temporary export ZIP archives are intentionally omitted from backups.',
    integrity: {
      databaseOpenable: true,
      migrationCount,
      foreignKeys,
    },
    encryption: 'none_local_only',
    accessNote: 'Local operator backup only. Store off-service with restricted access. Do not commit backups.',
  };
  writeFileSync(path.join(backupDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  return { backupDir, manifest };
}

export function verifyBackup(backupDir: string): { ok: boolean; reasons: string[]; manifest: BackupManifest } {
  const reasons: string[] = [];
  const manifestPath = path.join(backupDir, 'manifest.json');
  if (!existsSync(manifestPath)) return { ok: false, reasons: ['manifest_missing'], manifest: null as unknown as BackupManifest };
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as BackupManifest;
  const dbPath = path.join(backupDir, manifest.databaseFile);
  if (!existsSync(dbPath)) reasons.push('database_missing');
  else if (sha256File(dbPath) !== manifest.databaseSha256) reasons.push('database_checksum_mismatch');
  else if (statSync(dbPath).size !== manifest.databaseBytes) reasons.push('database_size_mismatch');

  for (const file of manifest.mediaFiles) {
    const full = resolveUnder(path.join(backupDir, 'media'), file.relativePath);
    if (!existsSync(full)) {
      reasons.push(`media_missing:${file.relativePath}`);
      continue;
    }
    if (sha256File(full) !== file.sha256) reasons.push(`media_checksum_mismatch:${file.relativePath}`);
  }

  if (reasons.length === 0) {
    const db = openDatabase(dbPath);
    try {
      db.prepare('SELECT 1 AS ok').get();
      const count = Number((db.prepare(`SELECT COUNT(*) AS count FROM schema_migrations`).get() as { count: number }).count);
      if (count !== manifest.integrity.migrationCount) reasons.push('migration_count_mismatch');
    } catch {
      reasons.push('database_unreadable');
    } finally {
      db.close();
    }
  }

  return { ok: reasons.length === 0, reasons, manifest };
}

export function restoreBackup(input: {
  backupDir: string;
  destinationDir: string;
  migrationsDir: string;
}): { restoredDatabase: string; mediaRestored: number; migrationsApplied: string[]; verification: ReturnType<typeof verifyBackup> } {
  if (!path.isAbsolute(input.destinationDir)) throw new Error('Restore destination must be an absolute path.');
  const verification = verifyBackup(input.backupDir);
  if (!verification.ok) throw new Error(`Backup verification failed: ${verification.reasons.join(',')}`);

  mkdirSync(input.destinationDir, { recursive: true });
  const restoredDatabase = path.join(input.destinationDir, 'mystyle.sqlite');
  const restoredMedia = path.join(input.destinationDir, 'media');
  if (existsSync(restoredDatabase) || existsSync(restoredMedia)) {
    throw new Error('Restore destination already contains database or media files.');
  }

  copyFileSync(path.join(input.backupDir, verification.manifest.databaseFile), restoredDatabase);
  mkdirSync(restoredMedia, { recursive: true });
  let mediaRestored = 0;
  for (const file of verification.manifest.mediaFiles) {
    copyFileSync(resolveUnder(path.join(input.backupDir, 'media'), file.relativePath), path.join(restoredMedia, file.relativePath));
    mediaRestored += 1;
  }

  const db = openDatabase(restoredDatabase);
  let migrationsApplied: string[] = [];
  try {
    migrationsApplied = migrate(db, input.migrationsDir);
    db.prepare('PRAGMA foreign_key_check').all();
    db.prepare('SELECT 1 AS ok').get();
  } finally {
    db.close();
  }

  return { restoredDatabase, mediaRestored, migrationsApplied, verification };
}

export function mediaLedgerConsistency(db: Sql, mediaDir: string): { missingFiles: string[]; orphanFiles: string[] } {
  const rows = db.prepare(
    `SELECT id, storage_key AS storageKey FROM media_assets WHERE deleted_at IS NULL`,
  ).all() as { id: string; storageKey: string }[];
  const missingFiles: string[] = [];
  const known = new Set<string>();
  for (const row of rows) {
    if (row.storageKey.includes('..') || row.storageKey.includes('/') || row.storageKey.includes('\\')) {
      missingFiles.push(row.id);
      continue;
    }
    known.add(row.storageKey);
    const full = path.resolve(mediaDir, row.storageKey);
    if (!full.startsWith(path.resolve(mediaDir)) || !existsSync(full)) missingFiles.push(row.storageKey);
  }
  const orphanFiles: string[] = [];
  if (existsSync(mediaDir)) {
    for (const name of readdirSync(mediaDir)) {
      if (name.includes('..') || name.includes('/') || name.includes('\\')) continue;
      if (!known.has(name)) orphanFiles.push(name);
    }
  }
  return { missingFiles, orphanFiles };
}

/** Destructive prune is intentionally not implemented. Operators must delete backups manually after review. */
export function assertBackupPruneDisabled(): void {
  throw new Error('Automatic backup pruning is disabled.');
}

export function removeDirectory(target: string): void {
  rmSync(target, { recursive: true, force: true });
}

export function streamExists(filePath: string): boolean {
  return existsSync(filePath) && createReadStream(filePath).readable;
}
