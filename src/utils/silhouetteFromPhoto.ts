import {
  classifyFromWidths,
  estimateSilhouetteFromImageData,
  type PhotoSilhouetteEstimate,
} from './silhouettePhotoAnalysis';

function loadImageElement(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    // Same-origin /api/media URLs need cookies; blob: and data: ignore this.
    if (url.startsWith('http') || url.startsWith('/')) {
      image.crossOrigin = 'use-credentials';
    }
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('The styling photograph could not be loaded for scanning.'));
    image.src = url;
  });
}

function toImageData(image: HTMLImageElement): ImageData {
  const maxWidth = 360;
  const scale = Math.min(1, maxWidth / Math.max(image.naturalWidth || image.width, 1));
  const width = Math.max(32, Math.round((image.naturalWidth || image.width) * scale));
  const height = Math.max(64, Math.round((image.naturalHeight || image.height) * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Photograph scanning is unavailable in this browser.');
  context.drawImage(image, 0, 0, width, height);
  return context.getImageData(0, 0, width, height);
}

/** Scan a full-body photograph in the browser — pixels never leave the device for this path. */
export async function estimateSilhouetteFromPhotoUrl(url: string): Promise<PhotoSilhouetteEstimate> {
  const image = await loadImageElement(url);
  const pixels = toImageData(image);
  return estimateSilhouetteFromImageData(pixels);
}

export async function estimateSilhouetteFromPhotoUrls(urls: string[]): Promise<PhotoSilhouetteEstimate> {
  const usable = urls.filter(Boolean);
  if (!usable.length) {
    throw new Error('Add a full-body front photograph first, then scan for your styling silhouette.');
  }
  const estimates: PhotoSilhouetteEstimate[] = [];
  const errors: string[] = [];
  for (const url of usable) {
    try {
      estimates.push(await estimateSilhouetteFromPhotoUrl(url));
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Scan failed.');
    }
  }
  if (!estimates.length) {
    throw new Error(errors[0] || 'Photograph scan failed.');
  }
  if (estimates.length === 1) return estimates[0]!;

  // Average band widths across angles, then re-classify.
  const shoulder = estimates.reduce((sum, item) => sum + item.bands.shoulder, 0) / estimates.length;
  const waist = estimates.reduce((sum, item) => sum + item.bands.waist, 0) / estimates.length;
  const hip = estimates.reduce((sum, item) => sum + item.bands.hip, 0) / estimates.length;
  const coverage = estimates.reduce((sum, item) => sum + item.bands.coverage, 0) / estimates.length;
  const merged = classifyFromWidths(shoulder, waist, hip);
  return { ...merged, bands: { shoulder, waist, hip, coverage } };
}
