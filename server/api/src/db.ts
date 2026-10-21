import { readdirSync, readFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

export interface Statement {
  run(...args: unknown[]): unknown;
  get(...args: unknown[]): unknown;
  all(...args: unknown[]): unknown[];
}

export interface Sql {
  exec(sql: string): void;
  prepare(sql: string): Statement;
}

export function openDatabase(databasePath: string): DatabaseSync {
  if (databasePath !== ':memory:') mkdirSync(path.dirname(databasePath), { recursive: true });
  const db = new DatabaseSync(databasePath);
  db.exec('PRAGMA foreign_keys = ON');
  db.exec('PRAGMA busy_timeout = 5000');
  if (databasePath !== ':memory:') db.exec('PRAGMA journal_mode = WAL');
  return db;
}

export function migrate(db: Sql, migrationsDir: string, now = () => new Date().toISOString()): string[] {
  db.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
    version TEXT PRIMARY KEY,
    applied_at TEXT NOT NULL
  )`);
  const applied = new Set(
    (db.prepare('SELECT version FROM schema_migrations').all() as { version: string }[]).map((row) => row.version),
  );
  const files = readdirSync(migrationsDir).filter((name) => name.endsWith('.sql')).sort();
  const ran: string[] = [];
  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = readFileSync(path.join(migrationsDir, file), 'utf8');
    db.exec('BEGIN');
    try {
      db.exec(sql);
      db.prepare('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)').run(file, now());
      db.exec('COMMIT');
      ran.push(file);
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  }
  return ran;
}
