import path from 'node:path';
import { fileURLToPath } from 'node:url';

const labRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const FASHN_ON_DEMAND_USD_PER_CREDIT = 0.075;
export const LOCAL_IMAGE_MAX_BYTES = 15 * 1024 * 1024;

export interface LabConfig {
  host: '127.0.0.1' | 'localhost';
  port: number;
  token: string | null;
  allowLive: boolean;
  maxBudgetUsd: number;
  maxAutoRetries: 0 | 1;
  retentionMs: number;
  pollIntervalMs: number;
  providerTimeoutMs: number;
  fashnApiKey: string | null;
  fashnBaseUrl: string;
  dataDir: string;
  benchmarkDir: string;
}

function intEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): LabConfig {
  const host = env.TRYON_LAB_HOST ?? '127.0.0.1';
  if (host !== '127.0.0.1' && host !== 'localhost') {
    throw new Error('TRYON_LAB_HOST must be 127.0.0.1 or localhost.');
  }
  const retries = intEnv('TRYON_MAX_AUTO_RETRIES', 0);
  const token = env.TRYON_LAB_TOKEN?.trim() || null;
  return {
    host,
    port: intEnv('TRYON_LAB_PORT', 4317),
    token,
    allowLive: env.TRYON_ALLOW_LIVE === 'true',
    maxBudgetUsd: Math.max(0, intEnv('TRYON_MAX_BUDGET_USD', 0)),
    maxAutoRetries: retries >= 1 ? 1 : 0,
    retentionMs: Math.max(60_000, intEnv('TRYON_RETENTION_HOURS', 24) * 60 * 60 * 1000),
    pollIntervalMs: 1000,
    providerTimeoutMs: intEnv('TRYON_PROVIDER_TIMEOUT_MS', 90_000),
    fashnApiKey: env.FASHN_API_KEY?.trim() || null,
    fashnBaseUrl: 'https://api.fashn.ai/v1',
    dataDir: path.join(labRoot, 'private'),
    benchmarkDir: path.join(labRoot, 'private-benchmark'),
  };
}

export function labDirectory(): string {
  return labRoot;
}
