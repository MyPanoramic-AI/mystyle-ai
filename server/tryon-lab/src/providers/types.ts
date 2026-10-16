import type { GarmentCategory, Quality } from '../types.js';

export interface ProviderRunInput {
  person: Buffer;
  personFormat: 'jpeg' | 'png' | 'webp';
  garment: Buffer;
  garmentFormat: 'jpeg' | 'png' | 'webp';
  category: GarmentCategory;
  quality: Quality;
}

export interface ProviderRunResult {
  providerJobId: string;
  outputBytes: Buffer;
  actualCredits: number | null;
  actualCostUsd: number | null;
}

export interface ProviderRuntime {
  fetchImpl: typeof fetch;
  now: () => number;
  sleep: (ms: number) => Promise<void>;
  timeoutMs: number;
  pollIntervalMs: number;
  apiKey: string | null;
  baseUrl: string;
}

export interface TryOnProvider {
  id: string;
  label: string;
  model: string;
  availability: 'ready' | 'unavailable';
  unavailableReason?: string;
  imagesLeaveEnvironment: boolean;
  retentionSummary: string;
  estimatedCredits(quality: Quality): number;
  run(input: ProviderRunInput, runtime: ProviderRuntime): Promise<ProviderRunResult>;
}
