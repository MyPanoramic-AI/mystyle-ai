import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { LabError } from '../src/errors.js';
import type { LabConfig } from '../src/config.js';
import { JobService } from '../src/jobs/service.js';
import { buildFashnBody, FashnProvider } from '../src/providers/fashnProvider.js';
import { FileStore } from '../src/storage/files.js';
import { solidPng } from '../src/testing/png.js';
import { summarise } from '../src/benchmark/summary.js';

async function harness(overrides: Partial<LabConfig> = {}) {
  const dir = await mkdtemp(path.join(tmpdir(), 'tryon-lab-'));
  let now = Date.parse('2026-10-16T08:00:00.000Z');
  const config: LabConfig = {
    host: '127.0.0.1',
    port: 0,
    token: 'lab-token-test',
    allowLive: false,
    maxBudgetUsd: 0,
    maxAutoRetries: 0,
    retentionMs: 60_000,
    pollIntervalMs: 10,
    providerTimeoutMs: 5,
    fashnApiKey: null,
    fashnBaseUrl: 'https://api.fashn.ai/v1',
    dataDir: dir,
    benchmarkDir: dir,
    ...overrides,
  };
  const files = new FileStore(path.join(dir, 'images'));
  const jobs = new JobService({
    config,
    files,
    now: () => now,
    sleep: async (ms) => {
      now += ms;
    },
    fetchImpl: globalThis.fetch,
  });
  await jobs.init();
  return {
    dir,
    jobs,
    config,
    advance: (ms: number) => {
      now += ms;
    },
    async close() {
      await rm(dir, { recursive: true, force: true });
    },
  };
}

async function draft(jobs: JobService, providerId = 'mock', extra: Record<string, unknown> = {}) {
  const person = await jobs.saveImage(solidPng(64, 96));
  const garment = await jobs.saveImage(solidPng(64, 64));
  return jobs.createDraft({
    idempotencyKey: 'request-key-1',
    providerId,
    category: 'tops',
    quality: 'standard',
    personFileId: person.id,
    garmentFileId: garment.id,
    ...extra,
  });
}

test('mock success records cost and leaves review empty', async () => {
  const lab = await harness();
  try {
    const created = await draft(lab.jobs);
    const job = await lab.jobs.start(created.job.id, { approveLiveCall: false, adultConsentConfirmed: true });
    assert.equal(job.status, 'succeeded');
    assert.equal(job.actualCostUsd, 0);
    assert.equal(job.liveCall, false);
    assert.equal(job.review.accepted, null);
    assert.ok(job.outputFileId);
    assert.ok((job.durationMs ?? 0) >= 0);
  } finally {
    await lab.close();
  }
});

test('missing photographs are rejected before a provider call', async () => {
  const lab = await harness();
  try {
    const person = await lab.jobs.saveImage(solidPng(32, 32));
    await assert.rejects(
      lab.jobs.createDraft({
        idempotencyKey: 'missing-garment-1',
        providerId: 'mock',
        category: 'tops',
        quality: 'draft',
        personFileId: person.id,
        garmentFileId: 'missing-garment',
      }),
      (error: unknown) => error instanceof LabError && error.code === 'missing_garment',
    );
    await assert.rejects(
      lab.jobs.createDraft({
        idempotencyKey: 'missing-person-1',
        providerId: 'mock',
        category: 'tops',
        quality: 'draft',
        personFileId: 'missing-person',
        garmentFileId: person.id,
      }),
      (error: unknown) => error instanceof LabError && error.code === 'missing_person',
    );
  } finally {
    await lab.close();
  }
});

test('duplicate and second start do not run generation twice', async () => {
  const lab = await harness();
  try {
    const first = await draft(lab.jobs);
    const second = await draft(lab.jobs);
    assert.equal(second.duplicate, true);
    assert.equal(second.job.id, first.job.id);
    const started = await lab.jobs.start(first.job.id, { approveLiveCall: false, adultConsentConfirmed: true });
    const again = await lab.jobs.start(first.job.id, { approveLiveCall: false, adultConsentConfirmed: true });
    assert.equal(again.attempts, started.attempts);
    assert.equal(again.outputFileId, started.outputFileId);
  } finally {
    await lab.close();
  }
});

test('failure scenarios stay failed and retries are capped at one', async () => {
  const once = await harness();
  try {
    const created = await draft(once.jobs, 'mock', { idempotencyKey: 'timeout-once-1', mockScenario: 'timeout' });
    const job = await once.jobs.start(created.job.id, { approveLiveCall: false, adultConsentConfirmed: true });
    assert.equal(job.status, 'failed');
    assert.equal(job.errorCode, 'timeout');
    assert.equal(job.attempts, 1);
    assert.equal(job.outputFileId, null);
  } finally {
    await once.close();
  }
  const twice = await harness({ maxAutoRetries: 1 });
  try {
    const created = await draft(twice.jobs, 'mock', { idempotencyKey: 'timeout-twice-1', mockScenario: 'timeout' });
    const job = await twice.jobs.start(created.job.id, { approveLiveCall: false, adultConsentConfirmed: true });
    assert.equal(job.attempts, 2);
    assert.equal(job.status, 'failed');
  } finally {
    await twice.close();
  }
});

test('invalid output, credentials, rate limit, and provider errors are recorded', async () => {
  for (const scenario of ['invalid_output', 'invalid_credentials', 'rate_limit', 'provider_error', 'missing_key'] as const) {
    const lab = await harness();
    try {
      const created = await draft(lab.jobs, 'mock', { idempotencyKey: `scenario-${scenario}`, mockScenario: scenario });
      const job = await lab.jobs.start(created.job.id, { approveLiveCall: false, adultConsentConfirmed: true });
      assert.equal(job.status, 'failed', scenario);
      assert.equal(job.errorCode, scenario === 'missing_key' ? 'missing_api_key' : scenario);
      assert.equal(job.outputFileId, null);
    } finally {
      await lab.close();
    }
  }
});

test('live calls require approval, a key, and budget, and do not call fetch otherwise', async () => {
  let calls = 0;
  const lab = await harness({
    allowLive: false,
    fashnApiKey: 'secret-key-value',
    maxBudgetUsd: 0,
  });
  lab.jobs.setFetch(async () => {
    calls += 1;
    return new Response('{}', { status: 200 });
  });
  try {
    const created = await draft(lab.jobs, 'fashn-tryon-v1.6', { idempotencyKey: 'live-blocked-1' });
    await assert.rejects(
      lab.jobs.start(created.job.id, { approveLiveCall: true, adultConsentConfirmed: true }),
      (error: unknown) => error instanceof LabError && error.code === 'live_not_approved',
    );
    assert.equal(calls, 0);
  } finally {
    await lab.close();
  }

  const approved = await harness({ allowLive: true, fashnApiKey: null, maxBudgetUsd: 5 });
  try {
    const created = await draft(approved.jobs, 'fashn-tryon-v1.6', { idempotencyKey: 'live-nokey-1' });
    await assert.rejects(
      approved.jobs.start(created.job.id, { approveLiveCall: true, adultConsentConfirmed: true }),
      (error: unknown) => error instanceof LabError && error.code === 'missing_api_key',
    );
  } finally {
    await approved.close();
  }

  const budget = await harness({ allowLive: true, fashnApiKey: 'secret-key-value', maxBudgetUsd: 0 });
  budget.jobs.setFetch(async () => {
    calls += 1;
    return new Response('{}', { status: 200 });
  });
  try {
    const created = await draft(budget.jobs, 'fashn-tryon-v1.6', { idempotencyKey: 'live-budget-1' });
    await assert.rejects(
      budget.jobs.start(created.job.id, { approveLiveCall: true, adultConsentConfirmed: true }),
      (error: unknown) => error instanceof LabError && error.code === 'budget_exceeded',
    );
    assert.equal(calls, 0);
  } finally {
    await budget.close();
  }
});

test('one generation of budget cannot be spent by two overlapping live starts', async () => {
  const output = solidPng(32, 48).toString('base64');
  let calls = 0;
  const lab = await harness({ allowLive: true, fashnApiKey: 'secret-key-value', maxBudgetUsd: 0.075, maxAutoRetries: 0 });
  lab.jobs.setFetch(async (url) => {
    calls += 1;
    if (String(url).endsWith('/run')) {
      return new Response(JSON.stringify({ id: 'pred-budget', error: null }), { status: 200 });
    }
    return new Response(
      JSON.stringify({ id: 'pred-budget', status: 'completed', output: [`data:image/png;base64,${output}`], error: null }),
      { status: 200, headers: { 'x-fashn-credits-used': '1' } },
    );
  });
  try {
    const first = await draft(lab.jobs, 'fashn-tryon-v1.6', { idempotencyKey: 'budget-race-1' });
    const second = await draft(lab.jobs, 'fashn-tryon-v1.6', { idempotencyKey: 'budget-race-2' });
    const results = await Promise.allSettled([
      lab.jobs.start(first.job.id, { approveLiveCall: true, adultConsentConfirmed: true }),
      lab.jobs.start(second.job.id, { approveLiveCall: true, adultConsentConfirmed: true }),
    ]);
    const succeeded = results.filter((result) => result.status === 'fulfilled');
    const rejected = results.filter((result) => result.status === 'rejected');
    assert.equal(succeeded.length, 1);
    assert.equal(rejected.length, 1);
    assert.equal(rejected[0].status, 'rejected');
    assert.ok(rejected[0].reason instanceof LabError);
    assert.equal(rejected[0].reason.code, 'budget_exceeded');
    assert.equal(calls, 2);
  } finally {
    await lab.close();
  }
});

test('FASHN request uses a data URI, one image, and the documented status URL', async () => {
  const person = solidPng(32, 32);
  const garment = solidPng(40, 40);
  const body = buildFashnBody('tryon-v1.6', {
    person,
    personFormat: 'png',
    garment,
    garmentFormat: 'png',
    category: 'outerwear',
    quality: 'standard',
  });
  const inputs = body.inputs as Record<string, unknown>;
  assert.equal(body.model_name, 'tryon-v1.6');
  assert.equal(inputs.num_samples, 1);
  assert.equal(inputs.return_base64, true);
  assert.equal(inputs.category, 'tops');
  assert.equal(String(inputs.model_image).startsWith('data:image/png;base64,'), true);
  assert.equal(String(inputs.model_image).includes('http'), false);

  const calls: string[] = [];
  const output = solidPng(32, 48).toString('base64');
  const provider = new FashnProvider('fashn-tryon-v1.6', 'FASHN', 'tryon-v1.6');
  const result = await provider.run(
    {
      person,
      personFormat: 'png',
      garment,
      garmentFormat: 'png',
      category: 'tops',
      quality: 'draft',
    },
    {
      apiKey: 'secret-key-value',
      baseUrl: 'https://api.fashn.ai/v1',
      timeoutMs: 1000,
      pollIntervalMs: 10,
      now: (() => {
        let clock = 0;
        return () => clock;
      })(),
      sleep: async () => undefined,
      fetchImpl: async (url, init) => {
        calls.push(String(url));
        const text = JSON.stringify(init?.body ?? '');
        assert.equal(text.includes('secret-key-value'), false);
        if (String(url).endsWith('/run')) {
          return new Response(JSON.stringify({ id: 'pred-1', error: null }), { status: 200 });
        }
        return new Response(
          JSON.stringify({ id: 'pred-1', status: 'completed', output: [`data:image/png;base64,${output}`], error: null }),
          { status: 200, headers: { 'x-fashn-credits-used': '1' } },
        );
      },
    },
  );
  assert.deepEqual(calls, ['https://api.fashn.ai/v1/run', 'https://api.fashn.ai/v1/status/pred-1']);
  assert.equal(result.actualCredits, 1);
  assert.equal(result.actualCostUsd, 0.075);
  assert.equal(JSON.stringify(result).includes('secret-key-value'), false);
});

test('FASHN credential and timeout failures do not invent an image', async () => {
  const provider = new FashnProvider('fashn-tryon-v1.6', 'FASHN', 'tryon-v1.6');
  const input = {
    person: solidPng(32, 32),
    personFormat: 'png' as const,
    garment: solidPng(32, 32),
    garmentFormat: 'png' as const,
    category: 'tops' as const,
    quality: 'standard' as const,
  };
  await assert.rejects(
    provider.run(input, {
      apiKey: null,
      baseUrl: 'https://api.fashn.ai/v1',
      timeoutMs: 10,
      pollIntervalMs: 1,
      now: () => 0,
      sleep: async () => undefined,
      fetchImpl: async () => new Response('{}'),
    }),
    (error: unknown) => error instanceof LabError && error.code === 'missing_api_key',
  );
  await assert.rejects(
    provider.run(input, {
      apiKey: 'secret-key-value',
      baseUrl: 'https://api.fashn.ai/v1',
      timeoutMs: 10,
      pollIntervalMs: 1,
      now: () => 0,
      sleep: async () => undefined,
      fetchImpl: async () => new Response(JSON.stringify({ error: 'Unauthorized', message: 'secret-key-value' }), { status: 401 }),
    }),
    (error: unknown) => error instanceof LabError && error.code === 'invalid_credentials' && !error.message.includes('secret-key-value'),
  );
});

test('cleanup deletes private image files', async () => {
  const lab = await harness({ retentionMs: 1_000 });
  try {
    const created = await draft(lab.jobs);
    const started = await lab.jobs.start(created.job.id, { approveLiveCall: false, adultConsentConfirmed: true });
    lab.advance(5_000);
    const deleted = await lab.jobs.cleanupExpired();
    assert.equal(deleted, 1);
    await assert.rejects(lab.jobs.readImage(started.personFileId));
    assert.equal(summarise(lab.jobs.list()).providerValidated, false);
    assert.equal(summarise(lab.jobs.list()).phaseStatus, 'AWAITING_LIVE_VALIDATION');
  } finally {
    await lab.close();
  }
});
