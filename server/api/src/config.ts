import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Sql } from './db.js';

const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export interface ApiConfig {
  host: '127.0.0.1' | 'localhost';
  port: number;
  sessionMs: number;
  mediaMaxBytes: number;
  authRateLimit: number;
  authRateWindowMs: number;
  adminToken: string | null;
  dataDir: string;
  databasePath: string;
  mediaDir: string;
  retentionMs: number;
  migrationsDir: string;
  allowedOrigins: string[];
}

function intEnv(env: NodeJS.ProcessEnv, name: string, fallback: number): number {
  const raw = env[name];
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) throw new Error(`${name} must be a non-negative number.`);
  return value;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): ApiConfig {
  const host = env.API_HOST ?? '127.0.0.1';
  if (host !== '127.0.0.1' && host !== 'localhost') {
    throw new Error('API_HOST must be 127.0.0.1 or localhost.');
  }
  const admin = env.API_ADMIN_TOKEN?.trim() ?? '';
  if (admin && admin.length < 20) throw new Error('API_ADMIN_TOKEN must be at least 20 characters when set.');
  const dataDir = path.join(apiRoot, 'private');
  return {
    host,
    port: intEnv(env, 'API_PORT', 4331),
    sessionMs: intEnv(env, 'API_SESSION_HOURS', 168) * 60 * 60 * 1000,
    mediaMaxBytes: intEnv(env, 'API_MEDIA_MAX_BYTES', 8 * 1024 * 1024),
    authRateLimit: intEnv(env, 'API_AUTH_RATE_LIMIT', 20),
    authRateWindowMs: intEnv(env, 'API_AUTH_RATE_WINDOW_MS', 15 * 60 * 1000),
    adminToken: admin || null,
    dataDir,
    databasePath: path.join(dataDir, 'mystyle.sqlite'),
    mediaDir: path.join(dataDir, 'media'),
    retentionMs: intEnv(env, 'API_MEDIA_RETENTION_DAYS', 30) * 24 * 60 * 60 * 1000,
    migrationsDir: path.join(apiRoot, 'migrations'),
    allowedOrigins: (env.API_ALLOWED_ORIGINS ?? '').split(',').map((item) => item.trim()).filter(Boolean),
  };
}

export function apiDirectory(): string {
  return apiRoot;
}

export function pingDatabase(db: Sql): void {
  db.prepare('SELECT 1 AS ok').get();
}
