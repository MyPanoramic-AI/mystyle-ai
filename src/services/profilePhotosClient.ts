import type { TemporaryPhotos } from '../types';
import type { ProfilePhotoSlot, ProfilePhotoSlots } from './accountApi';

export function mediaDisplayUrl(mediaId: string): string {
  return `/api/media/${mediaId}`;
}

export function photosFromSlots(slots: ProfilePhotoSlots): TemporaryPhotos {
  return {
    portraitMediaId: slots.portraitMediaId ?? undefined,
    fullBodyFrontMediaId: slots.fullBodyFrontMediaId ?? undefined,
    fullBodyAdditionalMediaId: slots.fullBodyAdditionalMediaId ?? undefined,
    profilePhotoUrl: slots.portraitMediaId ? mediaDisplayUrl(slots.portraitMediaId) : undefined,
    fullBodyFrontUrl: slots.fullBodyFrontMediaId ? mediaDisplayUrl(slots.fullBodyFrontMediaId) : undefined,
    fullBodyAdditionalUrl: slots.fullBodyAdditionalMediaId ? mediaDisplayUrl(slots.fullBodyAdditionalMediaId) : undefined,
  };
}

export function urlKeyForSlot(slot: ProfilePhotoSlot): keyof TemporaryPhotos {
  if (slot === 'portrait') return 'profilePhotoUrl';
  if (slot === 'full_body_front') return 'fullBodyFrontUrl';
  return 'fullBodyAdditionalUrl';
}

export function mediaKeyForSlot(slot: ProfilePhotoSlot): keyof TemporaryPhotos {
  if (slot === 'portrait') return 'portraitMediaId';
  if (slot === 'full_body_front') return 'fullBodyFrontMediaId';
  return 'fullBodyAdditionalMediaId';
}

export function slotForUrlKey(key: 'profilePhotoUrl' | 'fullBodyFrontUrl' | 'fullBodyAdditionalUrl'): ProfilePhotoSlot {
  if (key === 'profilePhotoUrl') return 'portrait';
  if (key === 'fullBodyFrontUrl') return 'full_body_front';
  return 'full_body_additional';
}

export async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let index = 0; index < bytes.length; index += 1) binary += String.fromCharCode(bytes[index]!);
  return btoa(binary);
}
