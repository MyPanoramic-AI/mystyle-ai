import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import type { AddressInfo } from 'node:net';
import type { LabConfig } from '../src/config.js';
import { createApp } from '../src/http/app.js';
import { JobService } from '../src/jobs/service.js';
import { FileStore } from '../src/storage/files.js';
import { solidPng } from '../src/testing/png.js';
import { loadBenchmark } from '../src/benchmark/summary.js';

async function startServer() {
  const dir = await mkdtemp(path.join(tmpdir(), 'tryon-http-'));
  const config: LabConfig = {
    host: '127.0.0.1',
    port: 0,
    token: 'lab-token-test',
    allowLive: false,
    maxBudgetUsd: 0,
    maxAutoRetries: 0,
    retentionMs: 86_400_000,
    pollIntervalMs: 1,
    providerTimeoutMs: 1000,
    fashnApiKey: null,
    fashnBaseUrl: 'https://api.fashn.ai/v1',
    dataDir: dir,
    benchmarkDir: dir,
  };
  const jobs = new JobService({
    config,
    files: new FileStore(path.join(dir, 'images')),
    now: () => Date.parse('2026-10-16T08:00:00.000Z'),
    sleep: async () => undefined,
    fetchImpl: globalThis.fetch,
  });
  await jobs.init();
  const server = createApp({ config, jobs }).listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', () => resolve()));
  const address = server.address() as AddressInfo;
  return {
    base: `http://127.0.0.1:${address.port}`,
    async close() {
      await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
      await rm(dir, { recursive: true, force: true });
    },
  };
}

test('health is local and the API rejects a missing token', async () => {
  const server = await startServer();
  try {
    const health = await fetch(`${server.base}/api/health`);
    assert.equal(health.status, 200);
    const denied = await fetch(`${server.base}/api/providers`);
    assert.equal(denied.status, 401);
    const page = await fetch(`${server.base}/`);
    assert.equal(page.status, 200);
    assert.match(await page.text(), /Internal virtual try-on lab/);
  } finally {
    await server.close();
  }
});

test('the HTTP lifecycle covers validation, mock success, and duplicate submission', async () => {
  const server = await startServer();
  const headers = { Authorization: 'Bearer lab-token-test', 'Content-Type': 'application/json' };
  try {
    const bad = await fetch(`${server.base}/api/files`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ data: Buffer.from('GIF89a not an image').toString('base64') }),
    });
    assert.equal(bad.status, 400);
    const badBody = (await bad.json()) as { error: string };
    assert.equal(badBody.error, 'unsupported_format');

    const upload = async () => {
      const response = await fetch(`${server.base}/api/files`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ data: solidPng(48, 64).toString('base64') }),
      });
      assert.equal(response.status, 201);
      return (await response.json()) as { id: string };
    };
    const person = await upload();
    const garment = await upload();
    const body = {
      idempotencyKey: 'http-request-1',
      providerId: 'mock',
      category: 'one-pieces',
      quality: 'draft',
      personFileId: person.id,
      garmentFileId: garment.id,
    };
    const created = await fetch(`${server.base}/api/jobs`, { method: 'POST', headers, body: JSON.stringify(body) });
    assert.equal(created.status, 201);
    const createdBody = (await created.json()) as { job: { id: string; estimatedCostUsd: number } };
    const duplicate = await fetch(`${server.base}/api/jobs`, { method: 'POST', headers, body: JSON.stringify(body) });
    const duplicateBody = (await duplicate.json()) as { duplicate: boolean; job: { id: string } };
    assert.equal(duplicateBody.duplicate, true);
    assert.equal(duplicateBody.job.id, createdBody.job.id);

    const started = await fetch(`${server.base}/api/jobs/${createdBody.job.id}/start`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ adultConsentConfirmed: true, approveLiveCall: false }),
    });
    const startedBody = (await started.json()) as { job: { status: string; outputFileId: string; errorMessage: string | null } };
    assert.equal(startedBody.job.status, 'succeeded');
    assert.equal(startedBody.job.errorMessage, null);
    const output = await fetch(`${server.base}/api/jobs/${createdBody.job.id}/files/output`, {
      headers: { Authorization: 'Bearer lab-token-test' },
    });
    assert.equal(output.status, 200);
    assert.equal(output.headers.get('cache-control'), 'no-store');
    const benchmark = await fetch(`${server.base}/api/benchmark`, { headers: { Authorization: 'Bearer lab-token-test' } });
    const benchmarkBody = (await benchmark.json()) as { cases: unknown[]; summary: { providerValidated: boolean } };
    assert.equal(benchmarkBody.cases.length, 20);
    assert.equal(benchmarkBody.summary.providerValidated, false);
    assert.equal(loadBenchmark().length, 20);
  } finally {
    await server.close();
  }
});
