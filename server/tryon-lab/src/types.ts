export type GarmentCategory = 'tops' | 'bottoms' | 'one-pieces' | 'outerwear';
export type Quality = 'draft' | 'standard' | 'high';
export type JobStatus = 'draft' | 'running' | 'succeeded' | 'failed';
export type ImageFormat = 'jpeg' | 'png' | 'webp';
export type MockScenario =
  | 'success'
  | 'timeout'
  | 'rate_limit'
  | 'provider_error'
  | 'invalid_output'
  | 'invalid_credentials'
  | 'missing_key';

export interface ImageFacts {
  format: ImageFormat;
  width: number;
  height: number;
  byteSize: number;
  sha256: string;
}

export interface StoredFile extends ImageFacts {
  id: string;
  createdAt: string;
}

export interface ReviewScores {
  personalLikeness: number | null;
  bodyProportions: number | null;
  garmentAccuracy: number | null;
  colourAccuracy: number | null;
  garmentDetails: number | null;
  imageRealism: number | null;
  backgroundPreservation: number | null;
  defects: string;
  accepted: boolean | null;
  reviewedAt: string | null;
}

export interface JobRecord {
  id: string;
  idempotencyKey: string;
  providerId: string;
  model: string;
  category: GarmentCategory;
  quality: Quality;
  status: JobStatus;
  personFileId: string;
  garmentFileId: string;
  outputFileId: string | null;
  benchmarkTestId: string | null;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  durationMs: number | null;
  estimatedCostUsd: number;
  actualCostUsd: number | null;
  actualCredits: number | null;
  providerJobId: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  attempts: number;
  imagesLeaveEnvironment: boolean;
  retentionSummary: string;
  warnings: string[];
  review: ReviewScores;
  liveCall: boolean;
  mockScenario: MockScenario | null;
}

export interface Quote {
  providerId: string;
  model: string;
  estimatedCostUsd: number;
  estimatedCredits: number;
  generations: 1;
  imagesLeaveEnvironment: boolean;
  retentionSummary: string;
  availability: 'ready' | 'unavailable';
  unavailableReason?: string;
}

export const CATEGORIES: GarmentCategory[] = ['tops', 'bottoms', 'one-pieces', 'outerwear'];
export const QUALITIES: Quality[] = ['draft', 'standard', 'high'];

export function emptyReview(): ReviewScores {
  return {
    personalLikeness: null,
    bodyProportions: null,
    garmentAccuracy: null,
    colourAccuracy: null,
    garmentDetails: null,
    imageRealism: null,
    backgroundPreservation: null,
    defects: '',
    accepted: null,
    reviewedAt: null,
  };
}
