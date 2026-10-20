import { mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';

const dataDir = path.join(tmpdir(), 'mystyle-qa-e2e');
mkdirSync(dataDir, { recursive: true });
const apiPort = '4341';
const webPort = '4173';
const origin = `http://127.0.0.1:${webPort}`;

export default defineConfig({
  testDir: './e2e',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'line',
  use: {
    ...devices['Desktop Chrome'],
    channel: 'chrome',
    baseURL: origin,
    trace: 'off',
    screenshot: 'off',
    video: 'off',
  },
  webServer: [
    {
      command: 'npx tsx server/api/src/index.ts',
      url: `http://127.0.0.1:${apiPort}/api/health`,
      reuseExistingServer: false,
      timeout: 30_000,
      env: {
        ...process.env,
        API_PORT: apiPort,
        API_HOST: '127.0.0.1',
        API_DATA_DIR: dataDir,
        API_ALLOWED_ORIGINS: `${origin},http://localhost:${webPort}`,
        AI_PROVIDER: 'mock',
        AI_ALLOW_LIVE: 'false',
        AI_MAX_BUDGET_USD: '0',
        RENDER: '',
      },
    },
    {
      command: `npx vite --port ${webPort} --host 127.0.0.1 --strictPort`,
      url: origin,
      reuseExistingServer: false,
      timeout: 30_000,
      env: {
        ...process.env,
        VITE_API_PROXY: `http://127.0.0.1:${apiPort}`,
      },
    },
  ],
});
