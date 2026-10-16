import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { labDirectory } from '../config.js';
import type { GarmentCategory, JobRecord } from '../types.js';

export interface BenchmarkCase {
  testId: string;
  garmentCategory: GarmentCategory;
  colour: string;
  bodyProportion: string;
  pose: string;
  background: string;
  lighting: string;
  complexity: string;
  personFile: string;
  garmentFile: string;
}

export interface BenchmarkRow extends BenchmarkCase {
  personPresent: boolean;
  garmentPresent: boolean;
}

export function loadBenchmark(): BenchmarkRow[] {
  const file = path.join(labDirectory(), 'data', 'benchmark-manifest.json');
  const parsed = JSON.parse(readFileSync(file, 'utf8')) as { cases: BenchmarkCase[] };
  const folder = path.join(labDirectory(), 'private-benchmark');
  return parsed.cases.map((item) => ({
    ...item,
    personPresent: existsSync(path.join(folder, item.personFile)),
    garmentPresent: existsSync(path.join(folder, item.garmentFile)),
  }));
}

export function summarise(jobs: JobRecord[]) {
  const live = jobs.filter((job) => job.liveCall && job.status !== 'draft');
  const accepted = live.filter((job) => job.review.accepted === true);
  return {
    phaseStatus: 'AWAITING_LIVE_VALIDATION' as const,
    providerValidated: false,
    liveCalls: live.length,
    liveSuccesses: live.filter((job) => job.status === 'succeeded').length,
    liveFailures: live.filter((job) => job.status === 'failed').length,
    humanAccepted: accepted.length,
    note:
      live.length === 0
        ? 'No live provider call has been made. Mock jobs are operational tests and are not quality evidence.'
        : 'Live calls are recorded separately from review scores. Provider success is not a quality pass.',
  };
}
