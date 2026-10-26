import { ApiError } from '../errors.js';
import type { Sql } from '../db.js';
import { hasGrantedConsent } from '../privacy/consent.js';
import { readProfilePhotoSlots } from './profilePhotos.js';

export const SILHOUETTE_IDS = [
  'hourglass',
  'pear',
  'inverted-triangle',
  'apple',
  'rectangle',
] as const;

export type SilhouetteId = (typeof SILHOUETTE_IDS)[number];

const LABELS: Record<SilhouetteId, string> = {
  hourglass: 'Hourglass',
  pear: 'Pear',
  'inverted-triangle': 'Inverted triangle',
  apple: 'Apple',
  rectangle: 'Rectangle',
};

const NOTES: Record<SilhouetteId, string> = {
  hourglass: 'Defined waist with balanced bust and hip — wrap dresses and belted jackets usually flatter.',
  pear: 'Fuller through the hip relative to the bust — A-line skirts and structured shoulders balance proportion.',
  'inverted-triangle': 'Broader through the shoulder/bust relative to the hip — soft volume on the lower half helps balance.',
  apple: 'Fuller through the midsection — empire waists and open necklines often elongate.',
  rectangle: 'Similar width through bust, waist, and hip — layering and belts create shape.',
};

export interface SilhouetteEstimate {
  id: SilhouetteId;
  label: string;
  note: string;
  source: 'measurements' | 'manual' | 'photo_scan' | 'photos_unavailable';
  confidence: 'high' | 'medium' | 'low';
  photosReady: boolean;
  /** True only when photographs were sent to an external vision provider. Local photo scans stay false. */
  usedPhotoAi: boolean;
  disclaimer: string;
}

function asCm(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  const n = Math.round(value);
  if (n < 40 || n > 250) return null;
  return n;
}

/** Fashion-industry ratio heuristic — styling silhouette only, not a body diagnosis. */
export function estimateFromMeasurements(bustCm: number, waistCm: number, hipCm: number): Omit<SilhouetteEstimate, 'photosReady' | 'usedPhotoAi' | 'disclaimer'> {
  const bust = bustCm;
  const waist = waistCm;
  const hip = hipCm;
  const bustHipDelta = Math.abs(bust - hip) / Math.max(bust, hip);
  const waistDrop = (Math.min(bust, hip) - waist) / Math.min(bust, hip);

  let id: SilhouetteId;
  let confidence: 'high' | 'medium' | 'low' = 'medium';

  if (bustHipDelta <= 0.05 && waistDrop >= 0.22) {
    id = 'hourglass';
    confidence = waistDrop >= 0.28 ? 'high' : 'medium';
  } else if (hip > bust * 1.05) {
    id = 'pear';
    confidence = hip > bust * 1.12 ? 'high' : 'medium';
  } else if (bust > hip * 1.05) {
    id = 'inverted-triangle';
    confidence = bust > hip * 1.12 ? 'high' : 'medium';
  } else if (waist >= bust * 0.95 && waist >= hip * 0.95) {
    id = 'apple';
    confidence = 'medium';
  } else {
    id = 'rectangle';
    confidence = bustHipDelta <= 0.08 ? 'high' : 'low';
  }

  return {
    id,
    label: LABELS[id],
    note: NOTES[id],
    source: 'measurements',
    confidence,
  };
}

export function assertSilhouetteId(value: unknown): SilhouetteId {
  if (typeof value !== 'string' || !(SILHOUETTE_IDS as readonly string[]).includes(value)) {
    throw new ApiError('invalid_silhouette', 'Choose hourglass, pear, inverted-triangle, apple, or rectangle.', 400);
  }
  return value as SilhouetteId;
}

export function readSilhouette(db: Sql, userId: string): {
  bodyShape: SilhouetteId | null;
  bodyShapeLabel: string | null;
  bodyShapeSource: string | null;
  bodyShapeUpdatedAt: string | null;
  note: string | null;
} {
  const row = db.prepare(
    `SELECT body_shape AS bodyShape, body_shape_source AS bodyShapeSource, body_shape_updated_at AS bodyShapeUpdatedAt
     FROM customer_profiles WHERE user_id = ?`,
  ).get(userId) as { bodyShape: string | null; bodyShapeSource: string | null; bodyShapeUpdatedAt: string | null } | undefined;
  if (!row?.bodyShape || !(SILHOUETTE_IDS as readonly string[]).includes(row.bodyShape)) {
    return { bodyShape: null, bodyShapeLabel: null, bodyShapeSource: null, bodyShapeUpdatedAt: null, note: null };
  }
  const id = row.bodyShape as SilhouetteId;
  return {
    bodyShape: id,
    bodyShapeLabel: LABELS[id],
    bodyShapeSource: row.bodyShapeSource,
    bodyShapeUpdatedAt: row.bodyShapeUpdatedAt,
    note: NOTES[id],
  };
}

export function saveSilhouette(db: Sql, userId: string, id: SilhouetteId, source: string, now: number): ReturnType<typeof readSilhouette> {
  const stamp = new Date(now).toISOString();
  db.prepare(
    `UPDATE customer_profiles SET body_shape = ?, body_shape_source = ?, body_shape_updated_at = ?, updated_at = ? WHERE user_id = ?`,
  ).run(id, source, stamp, stamp, userId);
  return readSilhouette(db, userId);
}

export function estimateSilhouetteForUser(db: Sql, userId: string): SilhouetteEstimate {
  const photos = readProfilePhotoSlots(db, userId);
  const photosReady = Boolean(photos.fullBodyFrontMediaId || photos.fullBodyAdditionalMediaId);
  const disclaimer = 'Styling silhouette estimate for outfit cut suggestions only — not a medical or body assessment.';

  const measurements = db.prepare(
    `SELECT bust_cm AS bustCm, waist_cm AS waistCm, hip_cm AS hipCm FROM profile_measurements WHERE user_id = ?`,
  ).get(userId) as { bustCm: number | null; waistCm: number | null; hipCm: number | null } | undefined;

  const bust = asCm(measurements?.bustCm);
  const waist = asCm(measurements?.waistCm);
  const hip = asCm(measurements?.hipCm);

  if (bust != null && waist != null && hip != null) {
    const estimated = estimateFromMeasurements(bust, waist, hip);
    return {
      ...estimated,
      photosReady,
      usedPhotoAi: false,
      disclaimer: photosReady
        ? `${disclaimer} Calculated from your bust, waist, and hip measurements. Full-body photographs stay private and were not sent to an external AI.`
        : `${disclaimer} Calculated from your bust, waist, and hip measurements.`,
    };
  }

  // Photos alone: we do not silently send private photographs to external vision models.
  // Require measurements (or a manual pick) so Profile remains privacy-first.
  throw new ApiError(
    'measurements_required',
    photosReady
      ? 'Your full-body photographs are ready for Virtual Try-On. Add bust, waist, and hip measurements in Sizes to estimate your styling silhouette — photographs are not sent to external AI from Profile.'
      : 'Add bust, waist, and hip measurements in Sizes (or upload a full-body photograph and measurements) to estimate your styling silhouette.',
    400,
  );
}

export function listSilhouetteOptions(): { id: SilhouetteId; label: string; note: string }[] {
  return SILHOUETTE_IDS.map((id) => ({ id, label: LABELS[id], note: NOTES[id] }));
}

export function requireExternalPhotoConsentForVision(db: Sql, userId: string): void {
  if (!hasGrantedConsent(db, userId, 'external_photo_ai')) {
    throw new ApiError(
      'external_photo_ai_consent_required',
      'External photograph AI consent is required before any photograph can leave this account for AI analysis.',
      403,
    );
  }
}
