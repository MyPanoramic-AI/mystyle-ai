import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Sql } from './db.js';
import { assertProductionSafeConfig, resolveAppEnvironment, type AppEnvironment } from './ops/environment.js';
import { classifyDataPersistence, type DataPersistence } from './ops/persistence.js';

const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export interface ApiConfig {
  appEnv: AppEnvironment;
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
  dataPersistence: DataPersistence;
  databasePath: string;
  mediaDir: string;
  exportsDir: string;
  backupDir: string;
  retentionMs: number;
  retentionCleanupEnabled: boolean;
  migrationsDir: string;
  allowedOrigins: string[];
  trustProxy: boolean;
  logLevel: 'info' | 'warn' | 'error';
  appPublicUrl: string;
  verificationTokenMs: number;
  resetTokenMs: number;
  requireVerifiedForSensitive: boolean;
  emailCaptureEnabled: boolean;
  smtp: {
    enabled: boolean;
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
    from: string;
  } | null;
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
  const appEnv = resolveAppEnvironment(env);
  const onRender = env.RENDER === 'true';
  const hosted = onRender || appEnv === 'staging' || appEnv === 'production';
  const host = env.API_HOST ?? (hosted ? '0.0.0.0' : '127.0.0.1');
  const allowedHosts = hosted ? ['0.0.0.0', '127.0.0.1', 'localhost'] : ['127.0.0.1', 'localhost'];
  if (!allowedHosts.includes(host)) {
    throw new Error('API_HOST must be 127.0.0.1 or localhost for local development.');
  }
  const admin = env.API_ADMIN_TOKEN?.trim() ?? '';
  if (admin && admin.length < 20) throw new Error('API_ADMIN_TOKEN must be at least 20 characters when set.');
  const requestedDataDir = env.API_DATA_DIR?.trim() ?? '';
  if (requestedDataDir && !path.isAbsolute(requestedDataDir)) {
    throw new Error('API_DATA_DIR must be an absolute path.');
  }
  // Prefer an explicit absolute data directory (local QA isolation or a Render disk mount).
  // When unset, fall back to server/api/private under the application tree.
  const dataDir = requestedDataDir ? path.resolve(requestedDataDir) : path.join(apiRoot, 'private');
  const dataPersistence = classifyDataPersistence({
    dataDir,
    apiDataDirEnv: requestedDataDir || null,
    onRender,
  });
  const publicOrigin = (env.API_PUBLIC_ORIGIN ?? env.RENDER_EXTERNAL_URL)?.replace(/\/$/, '') || null;
  const allowedOrigins = configuredOrigins(env.API_ALLOWED_ORIGINS);
  if (publicOrigin && !allowedOrigins.includes(publicOrigin)) allowedOrigins.push(publicOrigin);

  const secureCookie = env.API_SECURE_COOKIE === 'true'
    || onRender
    || appEnv === 'staging'
    || appEnv === 'production';

  const serveStatic = onRender || env.API_SERVE_STATIC === 'true' || appEnv === 'staging' || appEnv === 'production';
  const retentionCleanupEnabled = env.API_RETENTION_CLEANUP_ENABLED === 'true';
  const liveAiEnabled = env.AI_ALLOW_LIVE === 'true';
  const liveTryOnEnabled = env.TRYON_ALLOW_LIVE === 'true';

  assertProductionSafeConfig({
    envName: appEnv,
    publicOrigin,
    secureCookie,
    adminToken: admin || null,
    retentionCleanupEnabled,
    retentionCleanupAck: env.API_RETENTION_CLEANUP_ACK ?? null,
    allowedOrigins,
    liveAiEnabled,
    liveAiApprovalAck: env.AI_LIVE_APPROVAL_ACK ?? null,
    liveTryOnEnabled,
    liveTryOnApprovalAck: env.TRYON_LIVE_APPROVAL_ACK ?? null,
    paymentsEnabled: env.PAYMENTS_ENABLED === 'true',
  });

  const appPublicUrl = (env.APP_PUBLIC_URL ?? publicOrigin)?.replace(/\/$/, '')
    || (appEnv === 'development' || appEnv === 'test' ? 'http://127.0.0.1:4173' : '');
  if ((appEnv === 'staging' || appEnv === 'production') && !appPublicUrl.startsWith('https://')) {
    throw new Error('Staging/production require APP_PUBLIC_URL or an https public origin for email links.');
  }

  const emailCaptureEnabled = env.EMAIL_CAPTURE_ENABLED === 'true'
    || ((appEnv === 'development' || appEnv === 'test') && env.EMAIL_CAPTURE_ENABLED !== 'false');
  if ((appEnv === 'staging' || appEnv === 'production') && emailCaptureEnabled) {
    throw new Error('EMAIL_CAPTURE_ENABLED cannot be true in staging or production.');
  }

  const smtpHost = (env.SMTP_HOST ?? '').trim();
  const smtpUser = (env.SMTP_USER ?? '').trim();
  const smtpPass = (env.SMTP_PASS ?? env.SMTP_PASSWORD ?? '').trim();
  const smtpFrom = (env.SMTP_FROM ?? smtpUser).trim();
  const smtpPort = env.SMTP_PORT ? intEnv(env, 'SMTP_PORT', 587) : 587;
  const smtpSecure = env.SMTP_SECURE === 'true';
  const smtpPlaceholder = !smtpPass || /^your_/i.test(smtpPass) || /_here$/i.test(smtpPass);
  const smtpConfigured = Boolean(smtpHost && smtpUser && smtpFrom && !smtpPlaceholder);
  if ((env.SMTP_HOST || env.SMTP_USER || env.SMTP_PASS || env.SMTP_PASSWORD) && !smtpConfigured) {
    throw new Error('SMTP settings are incomplete. Set SMTP_HOST, SMTP_USER, and SMTP_PASS (or SMTP_PASSWORD).');
  }
  if (smtpConfigured && emailCaptureEnabled) {
    throw new Error('Disable EMAIL_CAPTURE_ENABLED when SMTP delivery is configured.');
  }

  return {
    appEnv,
    host: host as ApiConfig['host'],
    port: env.PORT ? intEnv(env, 'PORT', 10000) : intEnv(env, 'API_PORT', 4331),
    secureCookie,
    publicOrigin,
    staticDir: serveStatic ? path.resolve(apiRoot, '../../dist') : null,
    sessionMs: intEnv(env, 'API_SESSION_HOURS', 168) * 60 * 60 * 1000,
    mediaMaxBytes: intEnv(env, 'API_MEDIA_MAX_BYTES', 8 * 1024 * 1024),
    authRateLimit: intEnv(env, 'API_AUTH_RATE_LIMIT', 20),
    authRateWindowMs: intEnv(env, 'API_AUTH_RATE_WINDOW_MS', 15 * 60 * 1000),
    adminToken: admin || null,
    dataDir,
    dataPersistence,
    databasePath: path.join(dataDir, 'mystyle.sqlite'),
    mediaDir: path.join(dataDir, 'media'),
    exportsDir: path.join(dataDir, 'exports'),
    backupDir: path.join(dataDir, 'backups'),
    retentionMs: intEnv(env, 'API_MEDIA_RETENTION_DAYS', 30) * 24 * 60 * 60 * 1000,
    retentionCleanupEnabled,
    migrationsDir: path.join(apiRoot, 'migrations'),
    allowedOrigins,
    trustProxy: env.API_TRUST_PROXY === 'true' || hosted,
    logLevel: env.API_LOG_LEVEL === 'warn' || env.API_LOG_LEVEL === 'error' ? env.API_LOG_LEVEL : 'info',
    appPublicUrl,
    verificationTokenMs: intEnv(env, 'API_VERIFICATION_TOKEN_MINUTES', 60) * 60 * 1000,
    resetTokenMs: intEnv(env, 'API_RESET_TOKEN_MINUTES', 30) * 60 * 1000,
    requireVerifiedForSensitive: env.API_REQUIRE_EMAIL_VERIFIED === 'true',
    emailCaptureEnabled,
    smtp: smtpConfigured
      ? {
        enabled: true,
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        user: smtpUser,
        pass: smtpPass,
        from: smtpFrom.includes('<') ? smtpFrom : `MyStyle AI <${smtpFrom}>`,
      }
      : null,
  };
}

export function apiDirectory(): string {
  return apiRoot;
}

export function pingDatabase(db: Sql): void {
  db.prepare('SELECT 1 AS ok').get();
}
