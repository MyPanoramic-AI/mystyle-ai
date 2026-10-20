import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Sql } from './db.js';

const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export interface ApiConfig {
  host: '127.0.0.1' | 'localhost' | '0.0.0.0';
  port: number;
  secureCookie: boolean;
  publicOrigin: string | null;
  staticDir: string | null;
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

const LOCAL_VITE_ORIGINS = [3000, 3001, 4173].flatMap((port) => [
  `http://127.0.0.1:${port}`,
  `http://localhost:${port}`,
]);

function configuredOrigins(raw: string | undefined): string[] {
  const configured = (raw ?? '').split(',').map((item) => item.trim()).filter(Boolean);
  return configured.length > 0 ? configured : LOCAL_VITE_ORIGINS;
}

function intEnv(env: NodeJS.ProcessEnv, name: string, fallback: number): number {
  const raw = env[name];
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) throw new Error(`${name} must be a non-negative number.`);
  return value;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): ApiConfig {
  const onRender = env.RENDER === 'true';
  const host = env.API_HOST ?? (onRender ? '0.0.0.0' : '127.0.0.1');
  const allowedHosts = onRender ? ['0.0.0.0', '127.0.0.1', 'localhost'] : ['127.0.0.1', 'localhost'];
  if (!allowedHosts.includes(host)) {
    throw new Error('API_HOST must be 127.0.0.1 or localhost.');
  }
  const admin = env.API_ADMIN_TOKEN?.trim() ?? '';
  if (admin && admin.length < 20) throw new Error('API_ADMIN_TOKEN must be at least 20 characters when set.');
  const requestedDataDir = env.API_DATA_DIR?.trim() ?? '';
  if (requestedDataDir && !onRender && !path.isAbsolute(requestedDataDir)) {
    throw new Error('API_DATA_DIR must be an absolute path.');
  }
  const dataDir = !onRender && requestedDataDir ? path.resolve(requestedDataDir) : path.join(apiRoot, 'private');
  const publicOrigin = env.RENDER_EXTERNAL_URL?.replace(/\/$/, '') || null;
  const allowedOrigins = configuredOrigins(env.API_ALLOWED_ORIGINS);
  if (publicOrigin && !allowedOrigins.includes(publicOrigin)) allowedOrigins.push(publicOrigin);
  return {
    host: host as ApiConfig['host'],
    port: env.PORT ? intEnv(env, 'PORT', 10000) : intEnv(env, 'API_PORT', 4331),
    secureCookie: onRender,
    publicOrigin,
    staticDir: onRender ? path.resolve(apiRoot, '../../dist') : null,
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
    allowedOrigins,
  };
}

export function apiDirectory(): string {
  return apiRoot;
}

export function pingDatabase(db: Sql): void {
  db.prepare('SELECT 1 AS ok').get();
}
