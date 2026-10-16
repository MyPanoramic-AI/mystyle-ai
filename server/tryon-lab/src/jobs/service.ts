import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { LabError, publicErrorMessage } from '../errors.js';
import { FASHN_ON_DEMAND_USD_PER_CREDIT } from '../config.js';
import type { LabConfig } from '../config.js';
import { resolveProvider } from '../providers/registry.js';
import type { ProviderRuntime } from '../providers/types.js';
import { FileStore } from '../storage/files.js';
import { inspectImage, suitabilityWarnings } from '../validation/images.js';
import {
  CATEGORIES,
  QUALITIES,
  emptyReview,
  type GarmentCategory,
  type JobRecord,
  type MockScenario,
  type Quality,
  type ReviewScores,
} from '../types.js';

export interface LabDeps {
  config: LabConfig;
  files: FileStore;
  now: () => number;
  sleep: (ms: number) => Promise<void>;
  fetchImpl: typeof fetch;
}

export interface DraftInput {
  idempotencyKey: string;
  providerId: string;
  category: GarmentCategory;
  quality: Quality;
  personFileId: string;
  garmentFileId: string;
  benchmarkTestId?: string | null;
  mockScenario?: MockScenario | null;
}

export interface StartInput {
  approveLiveCall: boolean;
  adultConsentConfirmed: boolean;
}

export class JobService {
  private readonly jobs = new Map<string, JobRecord>();
  private readonly locks = new Map<string, Promise<void>>();
  private budgetLock: Promise<void> = Promise.resolve();

  constructor(private readonly deps: LabDeps) {}

  async init(): Promise<void> {
    await this.deps.files.init();
    await mkdir(this.deps.config.dataDir, { recursive: true });
    try {
      const raw = await readFile(this.storePath(), 'utf8');
      const parsed = JSON.parse(raw) as JobRecord[];
      for (const job of parsed) this.jobs.set(job.id, job);
    } catch {
      await this.persist();
    }
  }

  async saveImage(contents: Buffer) {
    return this.deps.files.save(contents);
  }

  async readImage(id: string) {
    const record = this.deps.files.get(id);
    const bytes = await this.deps.files.read(id);
    return { record, bytes };
  }

  setFetch(fetchImpl: typeof fetch): void {
    this.deps.fetchImpl = fetchImpl;
  }

  spentUsd(): number {
    let total = 0;
    for (const job of this.jobs.values()) {
      if (job.actualCostUsd !== null) total += job.actualCostUsd;
      else if (job.status === 'running' || job.status === 'succeeded') total += job.estimatedCostUsd;
    }
    return round(total);
  }

  async createDraft(input: DraftInput): Promise<{ job: JobRecord; duplicate: boolean }> {
    assertKey(input.idempotencyKey);
    const existing = this.findByKey(input.idempotencyKey);
    if (existing) return { job: existing, duplicate: true };
    if (!CATEGORIES.includes(input.category)) {
      throw new LabError('invalid_category', 'Choose tops, bottoms, one-pieces, or outerwear.', 400);
    }
    if (!QUALITIES.includes(input.quality)) {
      throw new LabError('invalid_quality', 'Choose draft, standard, or high.', 400);
    }
    const person = this.deps.files.get(input.personFileId);
    const garment = this.deps.files.get(input.garmentFileId);
    if (!person) throw new LabError('missing_person', 'Select a person photograph before review.', 400);
    if (!garment) throw new LabError('missing_garment', 'Select a garment photograph before review.', 400);
    const provider = providerOrThrow(input.providerId, input.mockScenario ?? null);
    if (provider.availability !== 'ready') {
      throw new LabError('provider_unavailable', provider.unavailableReason ?? 'That provider is not available.', 400);
    }
    const credits = provider.estimatedCredits(input.quality);
    const warnings = [...suitabilityWarnings(person), ...suitabilityWarnings(garment)];
    const job: JobRecord = {
      id: randomUUID(),
      idempotencyKey: input.idempotencyKey,
      providerId: provider.id,
      model: provider.model,
      category: input.category,
      quality: input.quality,
      status: 'draft',
      personFileId: person.id,
      garmentFileId: garment.id,
      outputFileId: null,
      benchmarkTestId: input.benchmarkTestId ?? null,
      createdAt: new Date(this.deps.now()).toISOString(),
      startedAt: null,
      finishedAt: null,
      durationMs: null,
      estimatedCostUsd: round(credits * (provider.id === 'mock' ? 0 : FASHN_ON_DEMAND_USD_PER_CREDIT)),
      actualCostUsd: null,
      actualCredits: null,
      providerJobId: null,
      errorCode: null,
      errorMessage: null,
      attempts: 0,
      imagesLeaveEnvironment: provider.imagesLeaveEnvironment,
      retentionSummary: provider.retentionSummary,
      warnings,
      review: emptyReview(),
      liveCall: provider.id !== 'mock',
      mockScenario: provider.id === 'mock' ? (input.mockScenario ?? 'success') : null,
    };
    this.jobs.set(job.id, job);
    await this.persist();
    return { job, duplicate: false };
  }

  async start(jobId: string, input: StartInput): Promise<JobRecord> {
    const current = this.require(jobId);
    if (!input.adultConsentConfirmed) {
      throw new LabError(
        'adult_consent_required',
        'Confirm that the photograph is of a consenting adult you are authorised to process.',
        400,
      );
    }
    if (current.status === 'running' || current.status === 'succeeded' || current.status === 'failed') {
      return current;
    }
    const previous = this.locks.get(jobId) ?? Promise.resolve();
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    this.locks.set(jobId, previous.then(() => gate));
    await previous;
    try {
      const alreadyFinished = await this.withBudgetLock(async () => {
        const job = this.require(jobId);
        if (job.status !== 'draft') return job;
        this.assertLiveAllowed(job, input.approveLiveCall);
        job.status = 'running';
        job.startedAt = new Date(this.deps.now()).toISOString();
        await this.persist();
        return null;
      });
      if (alreadyFinished) return alreadyFinished;
      const job = this.require(jobId);
      const startedAt = job.startedAt;
      if (!startedAt) {
        throw new LabError('provider_error', 'The generation did not record a start time.', 500);
      }
      const maxAttempts = 1 + this.deps.config.maxAutoRetries;
      let lastError: unknown;
      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        job.attempts = attempt;
        try {
          const result = await this.execute(job);
          try {
            inspectImage(result.outputBytes);
          } catch {
            throw new LabError('invalid_output', 'The provider returned data that is not a readable image.', 502, false);
          }
          const saved = await this.deps.files.save(result.outputBytes);
          job.outputFileId = saved.id;
          job.providerJobId = result.providerJobId;
          job.actualCredits = result.actualCredits;
          job.actualCostUsd = result.actualCostUsd;
          job.status = 'succeeded';
          job.errorCode = null;
          job.errorMessage = null;
          job.finishedAt = new Date(this.deps.now()).toISOString();
          job.durationMs = this.deps.now() - Date.parse(startedAt);
          await this.persist();
          return job;
        } catch (error) {
          lastError = error;
          const retryable = error instanceof LabError && error.retryable;
          if (!retryable || attempt === maxAttempts) break;
        }
      }
      job.status = 'failed';
      job.errorCode = lastError instanceof LabError ? lastError.code : 'provider_error';
      job.errorMessage = publicErrorMessage(lastError, this.secrets());
      job.finishedAt = new Date(this.deps.now()).toISOString();
      job.durationMs = this.deps.now() - Date.parse(startedAt);
      await this.persist();
      return job;
    } finally {
      release();
    }
  }

  get(jobId: string): JobRecord {
    return this.require(jobId);
  }

  list(): JobRecord[] {
    return [...this.jobs.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async saveReview(jobId: string, review: ReviewScores): Promise<JobRecord> {
    const job = this.require(jobId);
    for (const score of [
      review.personalLikeness,
      review.bodyProportions,
      review.garmentAccuracy,
      review.colourAccuracy,
      review.garmentDetails,
      review.imageRealism,
      review.backgroundPreservation,
    ]) {
      if (score !== null && (!Number.isInteger(score) || score < 1 || score > 5)) {
        throw new LabError('invalid_review', 'Review scores must be whole numbers from 1 to 5, or empty.', 400);
      }
    }
    job.review = { ...review, defects: review.defects.slice(0, 1000), reviewedAt: new Date(this.deps.now()).toISOString() };
    await this.persist();
    return job;
  }

  async delete(jobId: string): Promise<void> {
    const job = this.require(jobId);
    await this.deps.files.delete(job.personFileId);
    await this.deps.files.delete(job.garmentFileId);
    if (job.outputFileId) await this.deps.files.delete(job.outputFileId);
    this.jobs.delete(jobId);
    await this.persist();
  }

  async cleanupExpired(): Promise<number> {
    const cutoff = this.deps.now() - this.deps.config.retentionMs;
    const expired = this.list().filter((job) => Date.parse(job.createdAt) <= cutoff);
    for (const job of expired) await this.delete(job.id);
    return expired.length;
  }

  private async execute(job: JobRecord) {
    const provider = providerOrThrow(job.providerId, job.mockScenario);
    const person = await this.deps.files.read(job.personFileId);
    const garment = await this.deps.files.read(job.garmentFileId);
    const personFacts = this.deps.files.get(job.personFileId);
    const garmentFacts = this.deps.files.get(job.garmentFileId);
    if (!personFacts || !garmentFacts) {
      throw new LabError('missing_file', 'An input image disappeared before generation.', 400);
    }
    const runtime: ProviderRuntime = {
      fetchImpl: this.deps.fetchImpl,
      now: this.deps.now,
      sleep: this.deps.sleep,
      timeoutMs: this.deps.config.providerTimeoutMs,
      pollIntervalMs: this.deps.config.pollIntervalMs,
      apiKey: this.deps.config.fashnApiKey,
      baseUrl: this.deps.config.fashnBaseUrl,
    };
    return provider.run(
      {
        person,
        personFormat: personFacts.format,
        garment,
        garmentFormat: garmentFacts.format,
        category: job.category,
        quality: job.quality,
      },
      runtime,
    );
  }

  private async withBudgetLock<T>(work: () => Promise<T>): Promise<T> {
    const previous = this.budgetLock;
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    this.budgetLock = previous.then(() => gate, () => gate);
    await previous.catch(() => undefined);
    try {
      return await work();
    } finally {
      release();
    }
  }

  private assertLiveAllowed(job: JobRecord, approveLiveCall: boolean): void {
    if (!job.liveCall) return;
    if (!this.deps.config.allowLive || !approveLiveCall) {
      throw new LabError(
        'live_not_approved',
        'Live provider calls stay off until TRYON_ALLOW_LIVE=true and this request sets approveLiveCall.',
        403,
      );
    }
    if (job.providerId.startsWith('fashn-') && !this.deps.config.fashnApiKey) {
      throw new LabError('missing_api_key', 'FASHN_API_KEY is not configured on the server.', 400);
    }
    if (this.spentUsd() + job.estimatedCostUsd > this.deps.config.maxBudgetUsd) {
      throw new LabError(
        'budget_exceeded',
        `This generation is estimated at USD ${job.estimatedCostUsd}. The remaining lab budget does not cover it.`,
        402,
      );
    }
  }

  private require(jobId: string): JobRecord {
    const job = this.jobs.get(jobId);
    if (!job) throw new LabError('not_found', 'No generation with that id exists.', 404);
    return job;
  }

  private findByKey(key: string): JobRecord | undefined {
    return [...this.jobs.values()].find((job) => job.idempotencyKey === key);
  }

  private secrets(): string[] {
    return this.deps.config.fashnApiKey ? [this.deps.config.fashnApiKey] : [];
  }

  private storePath(): string {
    return path.join(this.deps.config.dataDir, 'jobs.json');
  }

  private async persist(): Promise<void> {
    await mkdir(this.deps.config.dataDir, { recursive: true });
    await writeFile(this.storePath(), JSON.stringify(this.list(), null, 2));
  }
}

function providerOrThrow(id: string, scenario: MockScenario | null) {
  try {
    return resolveProvider(id, scenario);
  } catch (error) {
    if (error instanceof LabError) throw error;
    throw new LabError('unknown_provider', 'Unknown provider.', 400);
  }
}

function assertKey(key: string): void {
  if (!/^[a-zA-Z0-9_-]{8,80}$/.test(key)) {
    throw new LabError('invalid_idempotency_key', 'The request id must be 8 to 80 letters, numbers, underscores, or hyphens.', 400);
  }
}

function round(value: number): number {
  return Math.round(value * 10000) / 10000;
}
