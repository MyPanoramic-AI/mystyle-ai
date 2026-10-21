import type { AddressInfo } from 'node:net';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { loadConfig, type ApiConfig } from '../src/config.js';
import { migrate, openDatabase } from '../src/db.js';
import { RateLimiter } from '../src/auth/rateLimit.js';
import { createApp } from '../src/http/app.js';
import type { Sql } from '../src/db.js';

export interface RunningApi {
  base: string;
  db: Sql;
  clock: { value: number };
  close: () => Promise<void>;
}

export async function startApi(overrides: Partial<ApiConfig> = {}, extras: { aiConfig?: import('../src/ai/aiConfig.js').AiConfig; aiFetch?: typeof fetch } = {}): Promise<RunningApi> {
  const dir = mkdtempSync(path.join(tmpdir(), 'mystyle-api-'));
  const config: ApiConfig = {
    ...loadConfig({ API_HOST: '127.0.0.1' }),
    dataDir: dir,
    databasePath: ':memory:',
    mediaDir: path.join(dir, 'media'),
    adminToken: null,
    ...overrides,
  };
  const clock = { value: Date.parse('2026-10-16T12:00:00.000Z') };
  const db = openDatabase(':memory:');
  migrate(db, config.migrationsDir);
  const app = createApp({
    db,
    config,
    now: () => clock.value,
    rateLimiter: new RateLimiter(config.authRateLimit, config.authRateWindowMs, () => clock.value),
    aiConfig: extras.aiConfig,
    aiFetch: extras.aiFetch,
  });
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', () => resolve()));
  const address = server.address() as AddressInfo;
  return {
    base: `http://127.0.0.1:${address.port}`,
    db,
    clock,
    close: async () => {
      await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

export function cookieFrom(response: Response): string {
  const lined = typeof response.headers.getSetCookie === 'function' ? response.headers.getSetCookie() : [];
  const line = lined[0] ?? response.headers.get('set-cookie') ?? '';
  return line.split(';')[0] ?? '';
}

export async function register(base: string, email: string, password = 'correct-horse-12') {
  const response = await fetch(`${base}/api/auth/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const body = await response.json() as { userId: string; csrfToken: string; emailVerified?: boolean; code?: string };
  return { response, body, cookie: cookieFrom(response) };
}

export function authHeaders(cookie: string, csrf: string): Record<string, string> {
  return { cookie, 'x-csrf-token': csrf, 'content-type': 'application/json' };
}
