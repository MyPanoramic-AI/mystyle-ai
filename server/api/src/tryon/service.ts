import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { ApiError } from '../errors.js';
import type { Sql } from '../db.js';
import { deleteOwnedMedia, inspectImage, readOwnedMedia, saveMedia } from '../media/store.js';
import { hasGrantedConsent } from '../privacy/consent.js';
import { readCredits, readEntitlement, reserveCredits, settleOperation } from '../domain/membership.js';
import {
  estimatedProviderUsd,
  listAccountProviders,
  providerRuntime,
  resolveAccountProvider,
  type GarmentCategory,
  type MockScenario,
  type Quality,
  type TryOnProviderId,
} from './providers.js';
import type { TryOnConfig } from './tryonConfig.js';

const CATEGORIES = new Set<GarmentCategory>(['tops', 'bottoms', 'one-pieces', 'outerwear', 'shoes', 'bags', 'accessories']);
const QUALITIES = new Set<Quality>(['draft', 'standard', 'high']);
const PROVIDERS = new Set<TryOnProviderId>(['mock', 'fashn-tryon-v1.6', 'fashn-tryon-max']);
/** tryon_result allows sequential outfit layering (jacket/shoes/accessories on a prior fitting). */
const PERSON_PURPOSES = new Set(['full_body_front', 'full_body_additional', 'profile_portrait', 'profile', 'tryon_result']);
const GARMENT_PURPOSES = new Set(['garment_reference', 'wardrobe']);
const ACTIVE = new Set(['queued', 'running']);

export type TryOnJobStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled';

export interface TryOnJobView {
  id: string;
  status: TryOnJobStatus;
  providerId: string;
  model: string;
  category: GarmentCategory;
  quality: Quality;
  personMediaId: string;
  garmentMediaId: string;
  resultMediaId: string | null;
  resultKind: 'demonstration' | 'provider' | null;
  demonstration: boolean;
  label: string;
  errorCode: string | null;
  errorMessage: string | null;
  creditsReserved: number | null;
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  duplicate?: boolean;
}

interface JobRow {
  id: string;
  userId: string;
  status: TryOnJobStatus;
  providerId: TryOnProviderId;
  model: string;
  category: GarmentCategory;
  quality: Quality;
  personMediaId: string;
  garmentMediaId: string;
  resultMediaId: string | null;
  resultKind: 'demonstration' | 'provider' | null;
  demonstration: number;
  creditReservationId: string | null;
  creditOperationId: string | null;
  creditsReserved: number | null;
  mockScenario: MockScenario | null;
  errorCode: string | null;
  errorMessage: string | null;
  providerJobId: string | null;
  cancelRequested: number;
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  finishedAt: string | null;
}

const running = new Set<string>();

function stamp(now: number): string {
  return new Date(now).toISOString();
}

function text(value: unknown, field: string, min = 1, max = 120): string {
  if (typeof value !== 'string' || value.trim().length < min || value.trim().length > max) {
    throw new ApiError('invalid_tryon', `${field} is not valid.`, 400);
  }
  return value.trim();
}

function assertCategory(value: unknown): GarmentCategory {
  if (typeof value !== 'string' || !CATEGORIES.has(value as GarmentCategory)) {
    throw new ApiError(
      'invalid_category',
      'Category must be tops, bottoms, one-pieces, outerwear, shoes, bags, or accessories.',
      400,
    );
  }
  return value as GarmentCategory;
}

/** Prompts for Try-On Max when the person image is already a prior fitting result. */
function additiveLayerPrompt(category: GarmentCategory): string {
  switch (category) {
    case 'outerwear':
      return 'Add only this jacket or coat over the clothing already worn. Keep the existing dress or outfit underneath completely unchanged. Do not replace the dress, trousers, top, or shoes.';
    case 'shoes':
      return 'Change only the footwear to match this product. Keep every other garment in the current outfit exactly as worn.';
    case 'bags':
      return 'Add only this bag as a carried accessory. Do not change the clothing already worn.';
    case 'accessories':
      return 'Add only this accessory. Keep the existing outfit underneath completely unchanged.';
    case 'tops':
      return 'Replace only the top layer if needed, but preserve any dress or one-piece already worn whenever possible.';
    case 'bottoms':
      return 'Change only the lower garment. Keep the top or dress already worn unchanged.';
    default:
      return 'Add this item to the existing outfit without replacing the clothing already worn.';
  }
}

function assertQuality(value: unknown): Quality {
  if (value === undefined || value === null || value === '') return 'standard';
  if (typeof value !== 'string' || !QUALITIES.has(value as Quality)) {
    throw new ApiError('invalid_quality', 'Quality must be draft, standard, or high.', 400);
  }
  return value as Quality;
}

function assertProvider(value: unknown): TryOnProviderId {
  if (value === undefined || value === null || value === '') return 'mock';
  if (typeof value !== 'string' || !PROVIDERS.has(value as TryOnProviderId)) {
    throw new ApiError('unknown_provider', 'Provider must be mock, fashn-tryon-v1.6, or fashn-tryon-max.', 400);
  }
  return value as TryOnProviderId;
}

function assertScenario(value: unknown): MockScenario | null {
  if (value === undefined || value === null || value === '') return null;
  const allowed: MockScenario[] = ['success', 'timeout', 'rate_limit', 'provider_error', 'invalid_output', 'invalid_credentials', 'missing_key'];
  if (typeof value !== 'string' || !allowed.includes(value as MockScenario)) {
    throw new ApiError('invalid_mock_scenario', 'That demonstration scenario is not supported.', 400);
  }
  return value as MockScenario;
}

function formatToKind(contentType: string): 'jpeg' | 'png' | 'webp' {
  if (contentType === 'image/jpeg') return 'jpeg';
  if (contentType === 'image/png') return 'png';
  if (contentType === 'image/webp') return 'webp';
  throw new ApiError('invalid_image', 'Upload a JPEG, PNG, or WebP image.', 400);
}

function ownedMediaMeta(db: Sql, userId: string, mediaId: string): { purpose: string } {
  const row = db.prepare(
    `SELECT purpose FROM media_assets WHERE id = ? AND user_id = ? AND deleted_at IS NULL`,
  ).get(mediaId, userId) as { purpose: string } | undefined;
  if (!row) throw new ApiError('not_found', 'That photograph was not found.', 404);
  return row;
}

function toView(row: JobRow, duplicate = false): TryOnJobView {
  return {
    id: row.id,
    status: row.status,
    providerId: row.providerId,
    model: row.model,
    category: row.category,
    quality: row.quality,
    personMediaId: row.personMediaId,
    garmentMediaId: row.garmentMediaId,
    resultMediaId: row.resultMediaId,
    resultKind: row.resultKind,
    demonstration: row.demonstration === 1,
    label: row.demonstration === 1
      ? 'Demonstration output — not a real virtual try-on.'
      : 'Provider try-on result',
    errorCode: row.errorCode,
    errorMessage: row.errorMessage,
    creditsReserved: row.creditsReserved,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    startedAt: row.startedAt,
    finishedAt: row.finishedAt,
    ...(duplicate ? { duplicate: true } : {}),
  };
}

function readJobRow(db: Sql, userId: string, id: string): JobRow {
  const row = db.prepare(
    `SELECT id, user_id AS userId, status, provider_id AS providerId, model, category, quality,
      person_media_id AS personMediaId, garment_media_id AS garmentMediaId, result_media_id AS resultMediaId,
      result_kind AS resultKind, demonstration, credit_reservation_id AS creditReservationId,
      credit_operation_id AS creditOperationId, credits_reserved AS creditsReserved, mock_scenario AS mockScenario,
      error_code AS errorCode, error_message AS errorMessage, provider_job_id AS providerJobId,
      cancel_requested AS cancelRequested, created_at AS createdAt, updated_at AS updatedAt,
      started_at AS startedAt, finished_at AS finishedAt
     FROM tryon_jobs WHERE id = ? AND user_id = ?`,
  ).get(id, userId) as JobRow | undefined;
  if (!row) throw new ApiError('not_found', 'That try-on job was not found.', 404);
  return row;
}

function spentLiveUsd(db: Sql): number {
  // Count provider jobs, not customer membership credits_reserved (those can be 0 or unrelated).
  const row = db.prepare(
    `SELECT COUNT(*) AS count
     FROM tryon_jobs
     WHERE provider_id IN ('fashn-tryon-v1.6', 'fashn-tryon-max')
       AND status IN ('queued', 'running', 'succeeded')`,
  ).get() as { count: number };
  return Number(row.count || 0) * 0.075;
}

function isInsideDir(rootDir: string, candidate: string): boolean {
  const root = path.resolve(rootDir);
  const full = path.resolve(candidate);
  return full === root || full.startsWith(root + path.sep);
}

const ALLOWED_REMOTE_GARMENT_HOSTS = new Set([
  'images.unsplash.com',
  'plus.unsplash.com',
]);

function cataloguePathname(raw: string, appPublicUrl: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > 500) return null;
  if (trimmed.startsWith('/')) {
    try {
      return new URL(trimmed, 'https://catalogue.invalid').pathname;
    } catch {
      return null;
    }
  }
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }
  if (!appPublicUrl) return null;
  let allowed: URL;
  try {
    allowed = new URL(appPublicUrl);
  } catch {
    return null;
  }
  if (url.origin !== allowed.origin) return null;
  return url.pathname;
}

function readStaticCatalogueBytes(staticDir: string, pathname: string, maxBytes: number): Buffer | null {
  if (!pathname.startsWith('/assets/') && !pathname.startsWith('/images/')) return null;
  const relative = pathname.replace(/^\/+/, '');
  const full = path.resolve(staticDir, relative);
  if (!isInsideDir(staticDir, full) || !existsSync(full)) return null;
  const bytes = readFileSync(full);
  if (bytes.length === 0 || bytes.length > maxBytes) {
    throw new ApiError('invalid_image', 'The image is empty or larger than the configured limit.', 400);
  }
  inspectImage(bytes);
  return bytes;
}

async function fetchGarmentBytes(options: {
  url: URL;
  maxBytes: number;
  fetchImpl: typeof fetch;
}): Promise<Buffer> {
  if (options.url.protocol !== 'https:' && options.url.protocol !== 'http:') {
    throw new ApiError('invalid_garment_url', 'That garment image URL is not supported.', 400);
  }
  const response = await options.fetchImpl(options.url, {
    redirect: 'error',
    headers: { accept: 'image/*,*/*;q=0.8' },
  });
  if (!response.ok) {
    throw new ApiError('invalid_garment_url', 'The garment image could not be downloaded.', 400);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length === 0 || buffer.length > options.maxBytes) {
    throw new ApiError('invalid_image', 'The image is empty or larger than the configured limit.', 400);
  }
  inspectImage(buffer);
  return buffer;
}

/**
 * Load a shop/catalogue/wardrobe preview image.
 * Same-origin /assets|/images from disk (or appPublicUrl fetch), plus a small Unsplash allowlist.
 * Never follows arbitrary remote hosts.
 */
async function loadCatalogueGarmentBytes(options: {
  garmentImageUrl: string;
  staticDir: string | null;
  appPublicUrl: string;
  maxBytes: number;
  fetchImpl?: typeof fetch;
}): Promise<Buffer> {
  const trimmed = options.garmentImageUrl.trim();
  const fetchImpl = options.fetchImpl ?? fetch;
  const pathname = cataloguePathname(trimmed, options.appPublicUrl);

  if (pathname && (pathname.startsWith('/assets/') || pathname.startsWith('/images/'))) {
    if (options.staticDir) {
      const fromDisk = readStaticCatalogueBytes(options.staticDir, pathname, options.maxBytes);
      if (fromDisk) return fromDisk;
    }
    if (options.appPublicUrl) {
      try {
        const absolute = new URL(pathname, `${options.appPublicUrl.replace(/\/$/, '')}/`);
        return await fetchGarmentBytes({ url: absolute, maxBytes: options.maxBytes, fetchImpl });
      } catch (error) {
        if (error instanceof ApiError) throw error;
      }
    }
    throw new ApiError('invalid_garment_url', 'That catalogue garment image was not found on the server.', 404);
  }

  let remote: URL;
  try {
    remote = new URL(trimmed);
  } catch {
    throw new ApiError(
      'invalid_garment_url',
      'Shop garment images must be catalogue assets or an allowed demonstration image host.',
      400,
    );
  }
  if (remote.protocol !== 'https:' || !ALLOWED_REMOTE_GARMENT_HOSTS.has(remote.hostname)) {
    throw new ApiError(
      'invalid_garment_url',
      'That garment image host is not allowed. Use a Shop listing, wardrobe photo, or upload.',
      400,
    );
  }
  return fetchGarmentBytes({ url: remote, maxBytes: options.maxBytes, fetchImpl });
}

function hasAiImageFeature(db: Sql, userId: string, now = Date.now()): boolean {
  const { entitlement } = readEntitlement(db, userId, now) as {
    entitlement: { status?: string; featureKeys?: string[] } | null;
  };
  if (!entitlement || entitlement.status !== 'active') return false;
  const keys = Array.isArray(entitlement.featureKeys) ? entitlement.featureKeys : [];
  return keys.includes('ai.image');
}

export function tryOnAvailability(db: Sql, userId: string, config: TryOnConfig) {
  const externalPhotoAiConsent = hasGrantedConsent(db, userId, 'external_photo_ai');
  const privatePhotoStorageConsent = hasGrantedConsent(db, userId, 'private_photo_storage');
  const spentUsd = spentLiveUsd(db);
  const keyConfigured = Boolean(config.fashnApiKey);
  const budgetOk = config.maxBudgetUsd > 0;
  const aiImageEntitlement = hasAiImageFeature(db, userId);
  const creditBalance = readCredits(db, userId).balance;
  const estimatedCustomerCredits = config.customerCreditCost;
  const liveReady = config.allowLive && keyConfigured && budgetOk && externalPhotoAiConsent && aiImageEntitlement
    && creditBalance >= estimatedCustomerCredits;
  const customerMockAllowed = config.allowCustomerMock && privatePhotoStorageConsent;
  const generationMode: 'live' | 'local_mock' | 'unavailable' = liveReady
    ? 'live'
    : customerMockAllowed
      ? 'local_mock'
      : 'unavailable';
  return {
    liveEnabled: config.allowLive,
    allowCustomerMock: config.allowCustomerMock,
    generationMode,
    defaultLiveProviderId: config.defaultLiveProviderId,
    maxBudgetUsd: config.maxBudgetUsd,
    spentUsd: Math.round(spentUsd * 1000) / 1000,
    remainingBudgetUsd: Math.max(0, Math.round((config.maxBudgetUsd - spentUsd) * 1000) / 1000),
    externalPhotoAiConsent,
    privatePhotoStorageConsent,
    aiImageEntitlement,
    creditBalance,
    estimatedCustomerCredits,
    providers: listAccountProviders(config),
    readiness: {
      mockReady: customerMockAllowed,
      liveReady,
      checks: {
        tryonAllowLive: config.allowLive,
        fashnApiKeyConfigured: keyConfigured,
        nonzeroBudget: budgetOk,
        externalPhotoAiConsent,
        privatePhotoStorageConsent,
        aiImageEntitlement,
        sufficientCredits: creditBalance >= estimatedCustomerCredits,
        allowCustomerMock: config.allowCustomerMock,
      },
    },
    estimatedLiveCostUsd: {
      'fashn-tryon-v1.6': estimatedProviderUsd('fashn-tryon-v1.6', 'standard'),
      'fashn-tryon-max': estimatedProviderUsd('fashn-tryon-max', 'standard'),
    },
    note: generationMode === 'live'
      ? 'Live FASHN generation is available for this account when consent and credits allow. Images leave this environment.'
      : generationMode === 'local_mock'
        ? 'Local development demonstration mode only. This does not call FASHN and is not a real virtual try-on.'
        : 'Virtual Try-On is currently unavailable. Your photographs have not been sent for AI processing.',
  };
}

export function listTryOnGarments(db: Sql, userId: string): {
  garments: {
    id: string;
    source: 'wardrobe' | 'garment_reference';
    wardrobeItemId: string | null;
    name: string;
    category: string | null;
    mediaId: string;
    previewUrl: string;
    authorised: true;
    note: string;
  }[];
  preferredSource: 'wardrobe' | 'garment_reference' | 'upload';
  shop: {
    selection: 'client_preload';
    note: string;
  };
} {
  const wardrobe = db.prepare(
    `SELECT id, name, category, media_id AS mediaId
     FROM wardrobe_items
     WHERE user_id = ? AND media_id IS NOT NULL
     ORDER BY updated_at DESC
     LIMIT 40`,
  ).all(userId) as { id: string; name: string; category: string | null; mediaId: string }[];
  const references = db.prepare(
    `SELECT id AS mediaId, purpose, created_at AS createdAt
     FROM media_assets
     WHERE user_id = ? AND deleted_at IS NULL AND purpose = 'garment_reference'
     ORDER BY created_at DESC
     LIMIT 20`,
  ).all(userId) as { mediaId: string; purpose: string; createdAt: string }[];

  const garments = [
    ...wardrobe.map((item) => ({
      id: `wardrobe:${item.id}`,
      source: 'wardrobe' as const,
      wardrobeItemId: item.id,
      name: item.name,
      category: item.category,
      mediaId: item.mediaId,
      previewUrl: `/api/media/${item.mediaId}`,
      authorised: true as const,
      note: 'Private wardrobe photograph stored on this account.',
    })),
    ...references.map((item, index) => ({
      id: `garment_reference:${item.mediaId}`,
      source: 'garment_reference' as const,
      wardrobeItemId: null,
      name: `Uploaded garment ${index + 1}`,
      category: null,
      mediaId: item.mediaId,
      previewUrl: `/api/media/${item.mediaId}`,
      authorised: true as const,
      note: 'Private garment reference uploaded for try-on.',
    })),
  ];
  const preferredSource = wardrobe.length > 0
    ? 'wardrobe' as const
    : references.length > 0
      ? 'garment_reference' as const
      : 'upload' as const;
  return {
    garments,
    preferredSource,
    shop: {
      selection: 'client_preload',
      note: 'MyStyle AI Shop demonstration listings are chosen in Shop and arrive here as a preloaded garment image. They are demonstration catalogue references, not verified retailer products.',
    },
  };
}

export async function prepareTryOnJob(options: {
  db: Sql;
  mediaDir: string;
  staticDir?: string | null;
  appPublicUrl?: string;
  userId: string;
  body: Record<string, unknown>;
  now: number;
  maxBytes: number;
  retentionMs: number;
  config: TryOnConfig;
  fetchImpl?: typeof fetch;
}): Promise<{
  ok: boolean;
  providerId: TryOnProviderId;
  live: boolean;
  demonstration: boolean;
  estimatedCredits: number;
  estimatedCostUsd: number;
  personMediaId: string;
  garmentMediaId: string;
  category: GarmentCategory;
  quality: Quality;
  blockers: string[];
  note: string;
}> {
  const resolved = await resolveTryOnInputs({ ...options, persistGarmentUpload: false });
  const live = resolved.providerId !== 'mock';
  const blockers: string[] = [];
  if (!live && !options.config.allowCustomerMock) blockers.push('mock_tryon_disabled');
  if (live && !options.config.allowLive) blockers.push('live_tryon_disabled');
  if (live && !hasGrantedConsent(options.db, options.userId, 'external_photo_ai')) blockers.push('external_photo_ai_consent_required');
  if (live && !options.config.fashnApiKey) blockers.push('missing_api_key');
  if (live && !hasAiImageFeature(options.db, options.userId, options.now)) blockers.push('feature_unavailable');
  if (live) {
    const cost = estimatedProviderUsd(resolved.providerId, resolved.quality);
    const spent = spentLiveUsd(options.db);
    if (options.config.maxBudgetUsd <= 0 || spent + cost > options.config.maxBudgetUsd) blockers.push('budget_exceeded');
    const creditsNeeded = options.config.customerCreditCost;
    if (creditsNeeded > 0 && readCredits(options.db, options.userId).balance < creditsNeeded) {
      blockers.push('insufficient_credits');
    }
  }
  const estimatedCredits = live ? options.config.customerCreditCost : 0;
  return {
    ok: blockers.length === 0,
    providerId: resolved.providerId,
    live,
    demonstration: !live,
    estimatedCredits,
    estimatedCostUsd: estimatedProviderUsd(resolved.providerId, resolved.quality),
    personMediaId: resolved.personMediaId,
    garmentMediaId: resolved.garmentMediaId,
    category: resolved.category,
    quality: resolved.quality,
    blockers,
    note: live
      ? 'Preparation only. No FASHN request was sent and no credits were reserved.'
      : options.config.allowCustomerMock
        ? 'Preparation only. A local development demonstration would not call FASHN or consume purchased credits.'
        : 'Virtual Try-On is unavailable. Photographs will not be sent for AI processing.',
  };
}

export function listTryOnJobs(db: Sql, userId: string, limit = 20): TryOnJobView[] {
  const capped = Math.min(Math.max(limit, 1), 50);
  const rows = db.prepare(
    `SELECT id, user_id AS userId, status, provider_id AS providerId, model, category, quality,
      person_media_id AS personMediaId, garment_media_id AS garmentMediaId, result_media_id AS resultMediaId,
      result_kind AS resultKind, demonstration, credit_reservation_id AS creditReservationId,
      credit_operation_id AS creditOperationId, credits_reserved AS creditsReserved, mock_scenario AS mockScenario,
      error_code AS errorCode, error_message AS errorMessage, provider_job_id AS providerJobId,
      cancel_requested AS cancelRequested, created_at AS createdAt, updated_at AS updatedAt,
      started_at AS startedAt, finished_at AS finishedAt
     FROM tryon_jobs WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`,
  ).all(userId, capped) as JobRow[];
  return rows.map((row) => toView(row));
}

export function getTryOnJob(db: Sql, userId: string, id: string): TryOnJobView {
  return toView(readJobRow(db, userId, id));
}

async function resolveTryOnInputs(options: {
  db: Sql;
  mediaDir: string;
  staticDir?: string | null;
  appPublicUrl?: string;
  userId: string;
  body: Record<string, unknown>;
  now: number;
  maxBytes: number;
  retentionMs: number;
  config: TryOnConfig;
  persistGarmentUpload: boolean;
  fetchImpl?: typeof fetch;
}): Promise<{
  providerId: TryOnProviderId;
  quality: Quality;
  category: GarmentCategory;
  scenario: MockScenario | null;
  personMediaId: string;
  garmentMediaId: string;
}> {
  const providerId = assertProvider(options.body.providerId);
  const quality = assertQuality(options.body.quality);
  const category = assertCategory(options.body.category);
  const scenario = assertScenario(options.body.mockScenario);
  if (scenario && providerId !== 'mock') {
    throw new ApiError('invalid_mock_scenario', 'Demonstration scenarios apply only to the demonstration provider.', 400);
  }

  const personMediaId = text(options.body.personMediaId, 'personMediaId', 8, 80);
  const personMeta = ownedMediaMeta(options.db, options.userId, personMediaId);
  if (!PERSON_PURPOSES.has(personMeta.purpose)) {
    throw new ApiError('invalid_person_media', 'Select a privately stored full-body or portrait photograph from your account.', 400);
  }

  let garmentMediaId = typeof options.body.garmentMediaId === 'string' ? options.body.garmentMediaId.trim() : '';
  const wardrobeItemId = typeof options.body.wardrobeItemId === 'string' ? options.body.wardrobeItemId.trim() : '';
  const garmentImageUrl = typeof options.body.garmentImageUrl === 'string' ? options.body.garmentImageUrl.trim() : '';
  if (!garmentMediaId && wardrobeItemId) {
    const item = options.db.prepare(
      `SELECT media_id AS mediaId FROM wardrobe_items WHERE id = ? AND user_id = ?`,
    ).get(wardrobeItemId, options.userId) as { mediaId: string | null } | undefined;
    if (!item) throw new ApiError('not_found', 'That wardrobe item was not found.', 404);
    if (!item.mediaId) {
      throw new ApiError('invalid_garment_media', 'That wardrobe item has no private photograph authorised for try-on.', 400);
    }
    garmentMediaId = item.mediaId;
  }
  if (!garmentMediaId && garmentImageUrl) {
    const mediaMatch = /^\/api\/media\/([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i.exec(
      cataloguePathname(garmentImageUrl, options.appPublicUrl || '') || garmentImageUrl,
    );
    if (mediaMatch?.[1]) {
      garmentMediaId = mediaMatch[1];
    }
  }
  if (!garmentMediaId) {
    if (!hasGrantedConsent(options.db, options.userId, 'private_photo_storage')) {
      throw new ApiError(
        'private_photo_consent_required',
        'Grant private photograph storage consent before uploading a garment reference.',
        403,
      );
    }
    const encoded = typeof options.body.garmentImageBase64 === 'string' ? options.body.garmentImageBase64 : '';
    let uploadBytes: Buffer | null = null;
    if (/^[A-Za-z0-9+/=\r\n]+$/.test(encoded) && encoded.length > 0) {
      uploadBytes = Buffer.from(encoded, 'base64');
    } else if (garmentImageUrl) {
      uploadBytes = await loadCatalogueGarmentBytes({
        garmentImageUrl,
        staticDir: options.staticDir ?? null,
        appPublicUrl: options.appPublicUrl || '',
        maxBytes: options.maxBytes,
        fetchImpl: options.fetchImpl,
      });
    } else {
      throw new ApiError(
        'invalid_garment',
        'Provide a wardrobe item, garmentMediaId, garmentImageUrl, or garmentImageBase64 payload.',
        400,
      );
    }
    if (options.persistGarmentUpload) {
      const saved = saveMedia({
        db: options.db,
        mediaDir: options.mediaDir,
        userId: options.userId,
        bytes: uploadBytes,
        purpose: 'garment_reference',
        now: options.now,
        maxBytes: options.maxBytes,
        retentionMs: options.retentionMs,
      });
      garmentMediaId = saved.id;
    } else {
      inspectImage(uploadBytes);
      garmentMediaId = 'pending-upload';
    }
  } else {
    const garmentMeta = ownedMediaMeta(options.db, options.userId, garmentMediaId);
    if (!GARMENT_PURPOSES.has(garmentMeta.purpose)) {
      throw new ApiError('invalid_garment_media', 'Select an authorised garment reference or wardrobe photograph.', 400);
    }
  }

  const person = readOwnedMedia(options.db, options.mediaDir, options.userId, personMediaId);
  inspectImage(person.bytes);
  if (garmentMediaId !== 'pending-upload') {
    const garment = readOwnedMedia(options.db, options.mediaDir, options.userId, garmentMediaId);
    inspectImage(garment.bytes);
  }

  return { providerId, quality, category, scenario, personMediaId, garmentMediaId };
}

export async function createTryOnJob(options: {
  db: Sql;
  mediaDir: string;
  staticDir?: string | null;
  appPublicUrl?: string;
  userId: string;
  body: Record<string, unknown>;
  now: number;
  maxBytes: number;
  retentionMs: number;
  config: TryOnConfig;
  fetchImpl?: typeof fetch;
}): Promise<TryOnJobView> {
  const idempotencyKey = text(options.body.idempotencyKey, 'idempotencyKey', 8, 80);
  if (!/^[a-zA-Z0-9_-]+$/.test(idempotencyKey)) {
    throw new ApiError('invalid_idempotency_key', 'Use an idempotency key of 8–80 URL-safe characters.', 400);
  }

  const prior = options.db.prepare(
    `SELECT id FROM tryon_jobs WHERE user_id = ? AND idempotency_key = ?`,
  ).get(options.userId, idempotencyKey) as { id: string } | undefined;
  if (prior) return toView(readJobRow(options.db, options.userId, prior.id), true);

  const { providerId, quality, category, scenario, personMediaId, garmentMediaId } = await resolveTryOnInputs({
    ...options,
    persistGarmentUpload: true,
  });

  const live = providerId !== 'mock';
  if (!live && !options.config.allowCustomerMock) {
    throw new ApiError(
      'mock_tryon_disabled',
      'Demonstration try-on is not available in this environment. Live generation stays off until explicitly approved.',
      403,
    );
  }
  if (live) {
    if (!options.config.allowLive) {
      throw new ApiError('live_tryon_disabled', 'Live virtual try-on is disabled on this server.', 403);
    }
    if (!hasGrantedConsent(options.db, options.userId, 'external_photo_ai')) {
      throw new ApiError(
        'external_photo_ai_consent_required',
        'Grant external photograph AI consent before sending images to FASHN. Private photo storage consent alone is not sufficient.',
        403,
      );
    }
    if (!options.config.fashnApiKey) {
      throw new ApiError('missing_api_key', 'FASHN_API_KEY is not configured on the server.', 400);
    }
    if (!hasAiImageFeature(options.db, options.userId, options.now)) {
      throw new ApiError(
        'feature_unavailable',
        'Your current plan does not include AI image generation. Virtual try-on requires an entitlement that includes ai.image.',
        403,
      );
    }
    const cost = estimatedProviderUsd(providerId, quality);
    const spent = spentLiveUsd(options.db);
    if (options.config.maxBudgetUsd <= 0 || spent + cost > options.config.maxBudgetUsd) {
      throw new ApiError('budget_exceeded', 'The virtual try-on provider budget would be exceeded.', 402);
    }
  }

  const active = options.db.prepare(
    `SELECT COUNT(*) AS count FROM tryon_jobs WHERE user_id = ? AND status IN ('queued', 'running')`,
  ).get(options.userId) as { count: number };
  if (Number(active.count) >= 3) {
    throw new ApiError('tryon_limit', 'Wait for an existing try-on job to finish before starting another.', 429);
  }

  let creditReservationId: string | null = null;
  let creditOperationId: string | null = null;
  let creditsReserved: number | null = null;
  if (live && options.config.customerCreditCost > 0) {
    const credits = options.config.customerCreditCost;
    const reserved = reserveCredits(options.db, {
      userId: options.userId,
      amount: credits,
      idempotencyKey: `tryon-reserve-${idempotencyKey}`,
      operationType: 'tryon.generate',
      featureKey: 'ai.image',
      provider: 'fashn',
      reason: `Virtual try-on ${providerId}`,
    }, options.now);
    creditReservationId = reserved.reservationId;
    creditOperationId = reserved.operationId;
    creditsReserved = reserved.amount;
  }

  const id = randomUUID();
  const created = stamp(options.now);
  const provider = resolveAccountProvider(providerId, scenario);
  options.db.prepare(
    `INSERT INTO tryon_jobs (
      id, user_id, idempotency_key, status, provider_id, model, category, quality,
      person_media_id, garment_media_id, result_media_id, result_kind, demonstration,
      credit_reservation_id, credit_operation_id, credits_reserved, mock_scenario,
      error_code, error_message, provider_job_id, cancel_requested,
      created_at, updated_at, started_at, finished_at
    ) VALUES (?, ?, ?, 'queued', ?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?, ?, ?, ?, NULL, NULL, NULL, 0, ?, ?, NULL, NULL)`,
  ).run(
    id,
    options.userId,
    idempotencyKey,
    providerId,
    provider.model,
    category,
    quality,
    personMediaId,
    garmentMediaId,
    live ? 0 : 1,
    creditReservationId,
    creditOperationId,
    creditsReserved,
    scenario,
    created,
    created,
  );

  scheduleTryOnJob({
    db: options.db,
    mediaDir: options.mediaDir,
    userId: options.userId,
    jobId: id,
    now: options.now,
    maxBytes: options.maxBytes,
    retentionMs: options.retentionMs,
    config: options.config,
    fetchImpl: options.fetchImpl,
  });

  return toView(readJobRow(options.db, options.userId, id));
}

export function cancelTryOnJob(db: Sql, userId: string, id: string, now: number): TryOnJobView {
  const row = readJobRow(db, userId, id);
  if (!ACTIVE.has(row.status)) return toView(row);
  const updated = stamp(now);
  db.prepare(
    `UPDATE tryon_jobs SET cancel_requested = 1, status = CASE WHEN status = 'queued' THEN 'cancelled' ELSE status END,
      updated_at = ?, finished_at = CASE WHEN status = 'queued' THEN ? ELSE finished_at END WHERE id = ? AND user_id = ?`,
  ).run(updated, updated, id, userId);
  return toView(readJobRow(db, userId, id));
}

export function listTryOnFittings(db: Sql, userId: string, limit = 30): TryOnJobView[] {
  const capped = Math.min(Math.max(limit, 1), 50);
  const rows = db.prepare(
    `SELECT id, user_id AS userId, status, provider_id AS providerId, model, category, quality,
      person_media_id AS personMediaId, garment_media_id AS garmentMediaId, result_media_id AS resultMediaId,
      result_kind AS resultKind, demonstration, credit_reservation_id AS creditReservationId,
      credit_operation_id AS creditOperationId, credits_reserved AS creditsReserved, mock_scenario AS mockScenario,
      error_code AS errorCode, error_message AS errorMessage, provider_job_id AS providerJobId,
      cancel_requested AS cancelRequested, created_at AS createdAt, updated_at AS updatedAt,
      started_at AS startedAt, finished_at AS finishedAt
     FROM tryon_jobs
     WHERE user_id = ? AND status = 'succeeded' AND result_media_id IS NOT NULL
     ORDER BY COALESCE(finished_at, created_at) DESC
     LIMIT ?`,
  ).all(userId, capped) as JobRow[];
  return rows.map((row) => toView(row));
}

export function deleteTryOnJob(options: {
  db: Sql;
  mediaDir: string;
  userId: string;
  id: string;
  now: number;
}): { deleted: true; id: string } {
  const row = readJobRow(options.db, options.userId, options.id);
  if (ACTIVE.has(row.status)) {
    throw new ApiError('tryon_active', 'Cancel the running job before deleting it.', 409);
  }
  options.db.prepare(`DELETE FROM tryon_jobs WHERE id = ? AND user_id = ?`).run(options.id, options.userId);
  if (row.resultMediaId) {
    try {
      deleteOwnedMedia(options.db, options.mediaDir, options.userId, row.resultMediaId, options.now);
    } catch {
      // Result media may already be expired or cleared.
    }
  }
  return { deleted: true, id: options.id };
}

function scheduleTryOnJob(options: {
  db: Sql;
  mediaDir: string;
  userId: string;
  jobId: string;
  now: number;
  maxBytes: number;
  retentionMs: number;
  config: TryOnConfig;
  fetchImpl?: typeof fetch;
}): void {
  if (running.has(options.jobId)) return;
  running.add(options.jobId);
  queueMicrotask(() => {
    runTryOnJob(options).finally(() => {
      running.delete(options.jobId);
    });
  });
}

export async function runTryOnJob(options: {
  db: Sql;
  mediaDir: string;
  userId: string;
  jobId: string;
  now: number;
  maxBytes: number;
  retentionMs: number;
  config: TryOnConfig;
  fetchImpl?: typeof fetch;
}): Promise<void> {
  let row = readJobRow(options.db, options.userId, options.jobId);
  if (row.status === 'cancelled' || row.cancelRequested === 1 && row.status === 'queued') {
    mark(options.db, options.jobId, { status: 'cancelled', now: options.now });
    releaseCreditsIfNeeded(options.db, row, options.now, 'failed');
    return;
  }
  if (row.status !== 'queued' && row.status !== 'running') return;

  mark(options.db, options.jobId, { status: 'running', now: options.now, started: true });
  row = readJobRow(options.db, options.userId, options.jobId);

  try {
    if (row.cancelRequested === 1) {
      mark(options.db, options.jobId, { status: 'cancelled', now: options.now, finished: true });
      releaseCreditsIfNeeded(options.db, row, options.now, 'failed');
      return;
    }

    const person = readOwnedMedia(options.db, options.mediaDir, options.userId, row.personMediaId);
    const garment = readOwnedMedia(options.db, options.mediaDir, options.userId, row.garmentMediaId);
    const provider = resolveAccountProvider(row.providerId, row.mockScenario);
    const runtime = providerRuntime(options.config, options.fetchImpl ?? fetch);
    const personPurpose = ownedMediaMeta(options.db, options.userId, row.personMediaId).purpose;
    const additivePrompt = personPurpose === 'tryon_result' ? additiveLayerPrompt(row.category) : undefined;
    const result = await provider.run(
      {
        person: person.bytes,
        personFormat: formatToKind(person.contentType),
        garment: garment.bytes,
        garmentFormat: formatToKind(garment.contentType),
        category: row.category,
        quality: row.quality,
        prompt: additivePrompt,
      },
      runtime,
    );

    row = readJobRow(options.db, options.userId, options.jobId);
    if (row.cancelRequested === 1) {
      mark(options.db, options.jobId, { status: 'cancelled', now: options.now, finished: true });
      releaseCreditsIfNeeded(options.db, row, options.now, 'failed');
      return;
    }

    try {
      inspectImage(result.outputBytes);
    } catch {
      throw new ApiError('invalid_output', 'The provider returned a payload that is not a valid image.', 502);
    }

    const saved = saveMedia({
      db: options.db,
      mediaDir: options.mediaDir,
      userId: options.userId,
      bytes: result.outputBytes,
      purpose: 'tryon_result',
      now: options.now,
      maxBytes: options.maxBytes,
      retentionMs: options.retentionMs,
    });

    const demonstration = row.providerId === 'mock' ? 1 : 0;
    options.db.prepare(
      `UPDATE tryon_jobs SET status = 'succeeded', result_media_id = ?, result_kind = ?, demonstration = ?,
        provider_job_id = ?, updated_at = ?, finished_at = ?, error_code = NULL, error_message = NULL WHERE id = ?`,
    ).run(
      saved.id,
      demonstration ? 'demonstration' : 'provider',
      demonstration,
      result.providerJobId,
      stamp(options.now),
      stamp(options.now),
      options.jobId,
    );

    if (row.creditOperationId) {
      settleOperation(options.db, {
        userId: options.userId,
        operationId: row.creditOperationId,
        outcome: 'success',
      }, options.now);
    }
  } catch (error) {
    const mapped = mapProviderError(error);
    options.db.prepare(
      `UPDATE tryon_jobs SET status = 'failed', error_code = ?, error_message = ?, updated_at = ?, finished_at = ? WHERE id = ?`,
    ).run(mapped.code, mapped.message, stamp(options.now), stamp(options.now), options.jobId);
    const failed = readJobRow(options.db, options.userId, options.jobId);
    releaseCreditsIfNeeded(options.db, failed, options.now, 'failed');
  }
}

function mapProviderError(error: unknown): { code: string; message: string } {
  if (error instanceof ApiError) return { code: error.code, message: error.message };
  if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
    const code = String((error as { code: unknown }).code || 'provider_error');
    const message = String((error as { message: unknown }).message || 'Virtual try-on generation failed.');
    return { code, message };
  }
  return { code: 'provider_error', message: 'Virtual try-on generation failed.' };
}

function releaseCreditsIfNeeded(db: Sql, row: JobRow, now: number, outcome: 'failed' | 'success'): void {
  if (!row.creditOperationId) return;
  try {
    settleOperation(db, {
      userId: row.userId,
      operationId: row.creditOperationId,
      outcome,
    }, now);
  } catch {
    // Settlement may already be complete for duplicates.
  }
}

function mark(
  db: Sql,
  id: string,
  input: { status: TryOnJobStatus; now: number; started?: boolean; finished?: boolean },
): void {
  const updated = stamp(input.now);
  if (input.started) {
    db.prepare(`UPDATE tryon_jobs SET status = ?, updated_at = ?, started_at = COALESCE(started_at, ?) WHERE id = ?`)
      .run(input.status, updated, updated, id);
    return;
  }
  if (input.finished) {
    db.prepare(`UPDATE tryon_jobs SET status = ?, updated_at = ?, finished_at = ? WHERE id = ?`)
      .run(input.status, updated, updated, id);
    return;
  }
  db.prepare(`UPDATE tryon_jobs SET status = ?, updated_at = ? WHERE id = ?`).run(input.status, updated, id);
}

/** Test helper: wait until a job leaves queued/running. */
export async function waitForTryOnJob(
  db: Sql,
  userId: string,
  id: string,
  timeoutMs = 5_000,
): Promise<TryOnJobView> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const view = getTryOnJob(db, userId, id);
    if (!ACTIVE.has(view.status)) return view;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  return getTryOnJob(db, userId, id);
}
