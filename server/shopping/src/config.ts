import path from 'node:path';
import { fileURLToPath } from 'node:url';

const shoppingRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export interface ShoppingConfig {
  host: '127.0.0.1' | 'localhost';
  port: number;
  token: string | null;
  freshMs: number;
  dataDir: string;
  databasePath: string;
}

function intEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): ShoppingConfig {
  const host = env.SHOPPING_LAB_HOST ?? '127.0.0.1';
  if (host !== '127.0.0.1' && host !== 'localhost') {
    throw new Error('SHOPPING_LAB_HOST must be 127.0.0.1 or localhost.');
  }
  const dataDir = path.join(shoppingRoot, 'private');
  return {
    host,
    port: intEnv('SHOPPING_LAB_PORT', 4321),
    token: env.SHOPPING_LAB_TOKEN?.trim() || null,
    freshMs: Math.max(60_000, intEnv('SHOPPING_FRESH_HOURS', 24) * 60 * 60 * 1000),
    dataDir,
    databasePath: path.join(dataDir, 'catalogue.sqlite'),
  };
}

export function shoppingDirectory(): string {
  return shoppingRoot;
}
