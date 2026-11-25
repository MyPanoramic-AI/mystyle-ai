/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Strip the photograph background and flatten onto a plain light-grey backdrop
 * before profile photos are previewed or saved.
 */

import { removeBackground } from '@imgly/background-removal';

/** Plain studio-style backdrop for every saved styling photograph. */
export const PROFILE_PHOTO_BACKDROP = '#E8E8E8';

const MAX_EDGE_PX = 1600;

function loadImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('That photograph could not be prepared.'));
    };
    image.src = url;
  });
}

function canvasToJpegBlob(canvas: HTMLCanvasElement, quality = 0.92): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('That photograph could not be prepared.'));
          return;
        }
        resolve(blob);
      },
      'image/jpeg',
      quality,
    );
  });
}

async function flattenOnLightGrey(source: Blob): Promise<Blob> {
  const image = await loadImage(source);
  const sourceWidth = Math.max(1, image.naturalWidth || image.width);
  const sourceHeight = Math.max(1, image.naturalHeight || image.height);
  const scale = Math.min(1, MAX_EDGE_PX / Math.max(sourceWidth, sourceHeight));
  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Photograph preparation is unavailable in this browser.');

  context.fillStyle = PROFILE_PHOTO_BACKDROP;
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);
  return canvasToJpegBlob(canvas);
}

function asStudioFile(blob: Blob, original: File): File {
  const baseName = original.name.replace(/\.[^.]+$/, '') || 'styling-photo';
  return new File([blob], `${baseName}-studio.jpg`, {
    type: 'image/jpeg',
    lastModified: Date.now(),
  });
}

/**
 * Remove the background and replace it with a light-grey plain backdrop.
 * Returns a JPEG File ready for preview or private upload.
 * If cutout fails, still saves a resized studio JPEG so upload is not blocked.
 */
export async function prepareProfilePhoto(file: File): Promise<File> {
  try {
    const cutout = await removeBackground(file, {
      // Quantized model: smaller download and more reliable on phones / low memory.
      model: 'isnet_quint8',
      device: 'cpu',
      proxyToWorker: false,
      output: { format: 'image/png', quality: 0.9 },
    });
    return asStudioFile(await flattenOnLightGrey(cutout), file);
  } catch (cutoutError) {
    console.warn('[prepareProfilePhoto] background removal failed; saving studio flatten instead', cutoutError);
    try {
      return asStudioFile(await flattenOnLightGrey(file), file);
    } catch {
      if (cutoutError instanceof Error && cutoutError.message.trim()) {
        throw new Error(
          cutoutError.message.includes('photograph')
            ? cutoutError.message
            : 'The background could not be removed from that photograph. Try another clear photo.',
        );
      }
      throw new Error('The background could not be removed from that photograph. Try another clear photo.');
    }
  }
}
