import { timingSafeEqual } from 'node:crypto';
import express, { type NextFunction, type Request, type Response } from 'express';
import path from 'node:path';
import { LabError } from '../errors.js';
import { labDirectory, type LabConfig } from '../config.js';
import { loadBenchmark, summarise } from '../benchmark/summary.js';
import { JobService } from '../jobs/service.js';
import { listProviders } from '../providers/registry.js';
import { decodeImagePayload } from '../validation/images.js';
import type { GarmentCategory, MockScenario, Quality, ReviewScores } from '../types.js';

export interface AppDeps {
  config: LabConfig;
  jobs: JobService;
}

export function createApp(deps: AppDeps): express.Express {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '24mb' }));
  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      bind: deps.config.host,
      liveCallsEnabled: deps.config.allowLive,
      budgetUsd: deps.config.maxBudgetUsd,
    });
  });
  app.get('/', (_req, res) => {
    res.sendFile(path.join(labDirectory(), 'lab-ui', 'index.html'));
  });
  app.use('/api', (req, res, next) => {
    if (!deps.config.token) {
      res.status(503).json({ error: 'lab_token_missing', message: 'Set TRYON_LAB_TOKEN before using the lab API.' });
      return;
    }
    const header = req.header('authorization') ?? '';
    const presented = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (!safeEqual(presented, deps.config.token)) {
      res.status(401).json({ error: 'unauthorised', message: 'The lab token was missing or incorrect.' });
      return;
    }
    next();
  });

  app.get('/api/providers', (_req, res) => {
    res.json({ providers: listProviders(Boolean(deps.config.fashnApiKey)) });
  });
  app.get('/api/benchmark', (_req, res) => {
    res.json({ cases: loadBenchmark(), summary: summarise(deps.jobs.list()) });
  });
  app.get('/api/jobs', (_req, res) => {
    res.json({ jobs: deps.jobs.list().map(publicJob), summary: summarise(deps.jobs.list()) });
  });
  app.post('/api/files', async (req, res, next) => {
    try {
      const data = stringValue(req.body, 'data');
      if (!data) throw new LabError('empty_image', 'Choose an image file.', 400);
      const saved = await deps.jobs.saveImage(decodeImagePayload(data));
      res.status(201).json({
        id: saved.id,
        format: saved.format,
        width: saved.width,
        height: saved.height,
        byteSize: saved.byteSize,
      });
    } catch (error) {
      next(error);
    }
  });
  app.post('/api/jobs', async (req, res, next) => {
    try {
      const created = await deps.jobs.createDraft({
        idempotencyKey: stringValue(req.body, 'idempotencyKey') ?? '',
        providerId: stringValue(req.body, 'providerId') ?? '',
        category: stringValue(req.body, 'category') as GarmentCategory,
        quality: stringValue(req.body, 'quality') as Quality,
        personFileId: stringValue(req.body, 'personFileId') ?? '',
        garmentFileId: stringValue(req.body, 'garmentFileId') ?? '',
        benchmarkTestId: stringValue(req.body, 'benchmarkTestId'),
        mockScenario: stringValue(req.body, 'mockScenario') as MockScenario | null,
      });
      res.status(created.duplicate ? 200 : 201).json({ duplicate: created.duplicate, job: publicJob(created.job) });
    } catch (error) {
      next(error);
    }
  });
  app.post('/api/jobs/:id/start', async (req, res, next) => {
    try {
      const job = await deps.jobs.start(req.params.id, {
        approveLiveCall: req.body?.approveLiveCall === true,
        adultConsentConfirmed: req.body?.adultConsentConfirmed === true,
      });
      res.json({ job: publicJob(job) });
    } catch (error) {
      next(error);
    }
  });
  app.get('/api/jobs/:id', (req, res, next) => {
    try {
      res.json({ job: publicJob(deps.jobs.get(req.params.id)) });
    } catch (error) {
      next(error);
    }
  });
  app.get('/api/jobs/:id/files/:role', async (req, res, next) => {
    try {
      const job = deps.jobs.get(req.params.id);
      const role = req.params.role;
      const fileId = role === 'person' ? job.personFileId : role === 'garment' ? job.garmentFileId : role === 'output' ? job.outputFileId : null;
      if (!fileId) throw new LabError('missing_file', 'That image is not available.', 404);
      const image = await deps.jobs.readImage(fileId);
      const format = image.record?.format;
      res.setHeader('Content-Type', format === 'jpeg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png');
      res.setHeader('Cache-Control', 'no-store');
      res.send(image.bytes);
    } catch (error) {
      next(error);
    }
  });
  app.post('/api/jobs/:id/review', async (req, res, next) => {
    try {
      const body = req.body ?? {};
      const review: ReviewScores = {
        personalLikeness: score(body.personalLikeness),
        bodyProportions: score(body.bodyProportions),
        garmentAccuracy: score(body.garmentAccuracy),
        colourAccuracy: score(body.colourAccuracy),
        garmentDetails: score(body.garmentDetails),
        imageRealism: score(body.imageRealism),
        backgroundPreservation: score(body.backgroundPreservation),
        defects: typeof body.defects === 'string' ? body.defects : '',
        accepted: typeof body.accepted === 'boolean' ? body.accepted : null,
        reviewedAt: null,
      };
      res.json({ job: publicJob(await deps.jobs.saveReview(req.params.id, review)) });
    } catch (error) {
      next(error);
    }
  });
  app.delete('/api/jobs/:id', async (req, res, next) => {
    try {
      await deps.jobs.delete(req.params.id);
      res.json({ deleted: true });
    } catch (error) {
      next(error);
    }
  });
  app.post('/api/maintenance/cleanup', async (_req, res, next) => {
    try {
      res.json({ deleted: await deps.jobs.cleanupExpired() });
    } catch (error) {
      next(error);
    }
  });
  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (error instanceof LabError) {
      res.status(error.status).json({ error: error.code, message: error.message });
      return;
    }
    res.status(500).json({ error: 'internal_error', message: 'The lab could not complete that request.' });
  });
  return app;
}

function publicJob(job: ReturnType<JobService['get']>) {
  return {
    ...job,
    generations: 1,
    phaseStatus: 'AWAITING_LIVE_VALIDATION',
    providerSuccessIsNotQualityPass: true,
  };
}

function stringValue(body: unknown, key: string): string | null {
  if (!body || typeof body !== 'object' || !(key in body)) return null;
  const value = (body as Record<string, unknown>)[key];
  return typeof value === 'string' ? value : null;
}

function score(value: unknown): number | null {
  if (value === null || value === '' || value === undefined) return null;
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(number) ? number : null;
}

function safeEqual(presented: string, expected: string): boolean {
  const left = Buffer.from(presented);
  const right = Buffer.from(expected);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
