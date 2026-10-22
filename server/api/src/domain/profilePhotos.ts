import { ApiError } from '../errors.js';
import type { Sql } from '../db.js';
import { hasGrantedConsent } from '../privacy/consent.js';
import { assertPurpose, deleteOwnedMedia, saveMedia } from '../media/store.js';

export const PHOTO_SLOTS = ['portrait', 'full_body_front', 'full_body_additional'] as const;
export type PhotoSlot = (typeof PHOTO_SLOTS)[number];

const SLOT_COLUMN: Record<PhotoSlot, string> = {
  portrait: 'portrait_media_id',
  full_body_front: 'full_body_front_media_id',
  full_body_additional: 'full_body_additional_media_id',
};

const SLOT_PURPOSE: Record<PhotoSlot, string> = {
  portrait: 'profile_portrait',
  full_body_front: 'full_body_front',
  full_body_additional: 'full_body_additional',
};

export function assertPhotoSlot(value: unknown): PhotoSlot {
  if (typeof value !== 'string' || !PHOTO_SLOTS.includes(value as PhotoSlot)) {
    throw new ApiError('invalid_slot', 'Photograph slot must be portrait, full_body_front, or full_body_additional.', 400);
  }
  return value as PhotoSlot;
}

export function readProfilePhotoSlots(db: Sql, userId: string): {
  portraitMediaId: string | null;
  fullBodyFrontMediaId: string | null;
  fullBodyAdditionalMediaId: string | null;
} {
  const row = db.prepare(
    `SELECT portrait_media_id AS portraitMediaId, full_body_front_media_id AS fullBodyFrontMediaId,
      full_body_additional_media_id AS fullBodyAdditionalMediaId
     FROM customer_profiles WHERE user_id = ?`,
  ).get(userId) as {
    portraitMediaId: string | null;
    fullBodyFrontMediaId: string | null;
    fullBodyAdditionalMediaId: string | null;
  } | undefined;
  if (!row) throw new ApiError('not_found', 'Profile not found.', 404);
  return {
    portraitMediaId: row.portraitMediaId ?? null,
    fullBodyFrontMediaId: row.fullBodyFrontMediaId ?? null,
    fullBodyAdditionalMediaId: row.fullBodyAdditionalMediaId ?? null,
  };
}

function slotMediaId(slots: ReturnType<typeof readProfilePhotoSlots>, slot: PhotoSlot): string | null {
  if (slot === 'portrait') return slots.portraitMediaId;
  if (slot === 'full_body_front') return slots.fullBodyFrontMediaId;
  return slots.fullBodyAdditionalMediaId;
}

export function uploadProfilePhotoSlot(options: {
  db: Sql;
  mediaDir: string;
  userId: string;
  slot: PhotoSlot;
  bytes: Buffer;
  now: number;
  maxBytes: number;
  retentionMs: number;
}): { slot: PhotoSlot; mediaId: string; contentType: string; byteSize: number; previousMediaId: string | null } {
  if (!hasGrantedConsent(options.db, options.userId, 'private_photo_storage')) {
    throw new ApiError(
      'private_photo_consent_required',
      'Grant private photograph storage consent before uploading styling photographs. This does not authorise external AI processing.',
      403,
    );
  }
  const purpose = assertPurpose(SLOT_PURPOSE[options.slot]);
  const current = readProfilePhotoSlots(options.db, options.userId);
  const previousId = slotMediaId(current, options.slot);
  const saved = saveMedia({
    db: options.db,
    mediaDir: options.mediaDir,
    userId: options.userId,
    bytes: options.bytes,
    purpose,
    now: options.now,
    maxBytes: options.maxBytes,
    retentionMs: options.retentionMs,
  });
  options.db.prepare(
    `UPDATE customer_profiles SET ${SLOT_COLUMN[options.slot]} = ?, updated_at = ? WHERE user_id = ?`,
  ).run(saved.id, new Date(options.now).toISOString(), options.userId);
  if (previousId && previousId !== saved.id) {
    try {
      deleteOwnedMedia(options.db, options.mediaDir, options.userId, previousId, options.now);
    } catch {
      // Slot already points at the new id; orphan cleanup of previous is best-effort.
    }
  }
  return {
    slot: options.slot,
    mediaId: saved.id,
    contentType: saved.contentType,
    byteSize: saved.byteSize,
    previousMediaId: previousId,
  };
}

export function deleteProfilePhotoSlot(options: {
  db: Sql;
  mediaDir: string;
  userId: string;
  slot: PhotoSlot;
  now: number;
}): { slot: PhotoSlot; removedMediaId: string | null } {
  const current = readProfilePhotoSlots(options.db, options.userId);
  const mediaId = slotMediaId(current, options.slot);
  options.db.prepare(
    `UPDATE customer_profiles SET ${SLOT_COLUMN[options.slot]} = NULL, updated_at = ? WHERE user_id = ?`,
  ).run(new Date(options.now).toISOString(), options.userId);
  if (mediaId) {
    deleteOwnedMedia(options.db, options.mediaDir, options.userId, mediaId, options.now);
  }
  return { slot: options.slot, removedMediaId: mediaId };
}
