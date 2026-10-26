import type { StylingSilhouetteId } from '../types';
import { SILHOUETTE_OPTIONS } from './silhouette';

export interface PixelImage {
  data: Uint8ClampedArray | Uint8Array;
  width: number;
  height: number;
}

export interface BodyWidthBands {
  shoulder: number;
  waist: number;
  hip: number;
  /** Fraction of rows that contained a body span. */
  coverage: number;
}

export interface PhotoSilhouetteEstimate {
  id: StylingSilhouetteId;
  label: string;
  note: string;
  confidence: 'high' | 'medium' | 'low';
  source: 'photo_scan';
  bands: BodyWidthBands;
}

function luminance(r: number, g: number, b: number): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function sampleCornerAverage(image: PixelImage): { r: number; g: number; b: number; lum: number } {
  const { data, width, height } = image;
  const points = [
    [2, 2],
    [width - 3, 2],
    [2, height - 3],
    [width - 3, height - 3],
    [Math.floor(width / 2), 2],
    [2, Math.floor(height / 2)],
  ];
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  for (const [x, y] of points) {
    if (x < 0 || y < 0 || x >= width || y >= height) continue;
    const i = (y * width + x) * 4;
    r += data[i] ?? 0;
    g += data[i + 1] ?? 0;
    b += data[i + 2] ?? 0;
    n += 1;
  }
  if (!n) return { r: 245, g: 245, b: 245, lum: 245 };
  r /= n;
  g /= n;
  b /= n;
  return { r, g, b, lum: luminance(r, g, b) };
}

function isForeground(
  r: number,
  g: number,
  b: number,
  a: number,
  bg: { r: number; g: number; b: number; lum: number },
): boolean {
  if (a < 40) return false;
  const lum = luminance(r, g, b);
  const colourDist = Math.abs(r - bg.r) + Math.abs(g - bg.g) + Math.abs(b - bg.b);
  const lumDist = Math.abs(lum - bg.lum);
  // Person vs plain backdrop: either colour distance or clear luminance separation.
  return colourDist > 72 || lumDist > 28;
}

function rowSpan(image: PixelImage, y: number, bg: { r: number; g: number; b: number; lum: number }): number {
  const { data, width } = image;
  let left = -1;
  let right = -1;
  for (let x = 0; x < width; x += 1) {
    const i = (y * width + x) * 4;
    if (isForeground(data[i] ?? 0, data[i + 1] ?? 0, data[i + 2] ?? 0, data[i + 3] ?? 255, bg)) {
      if (left < 0) left = x;
      right = x;
    }
  }
  if (left < 0 || right < left) return 0;
  return right - left + 1;
}

function bandAverage(spans: number[], start: number, end: number): number {
  const from = Math.max(0, Math.floor(start));
  const to = Math.min(spans.length - 1, Math.ceil(end));
  if (to < from) return 0;
  let sum = 0;
  let count = 0;
  for (let i = from; i <= to; i += 1) {
    const value = spans[i] ?? 0;
    if (value > 0) {
      sum += value;
      count += 1;
    }
  }
  return count ? sum / count : 0;
}

/**
 * Estimate shoulder / waist / hip pixel widths from a full-body photograph
 * by measuring horizontal body spans against a plain backdrop.
 */
export function extractBodyWidths(image: PixelImage): BodyWidthBands {
  if (image.width < 24 || image.height < 48) {
    throw new Error('Photograph is too small to estimate a styling silhouette. Use a clear full-body photo.');
  }
  const bg = sampleCornerAverage(image);
  const spans: number[] = [];
  for (let y = 0; y < image.height; y += 1) {
    spans.push(rowSpan(image, y, bg));
  }

  let top = -1;
  let bottom = -1;
  for (let y = 0; y < spans.length; y += 1) {
    if ((spans[y] ?? 0) > image.width * 0.04) {
      if (top < 0) top = y;
      bottom = y;
    }
  }
  if (top < 0 || bottom - top < image.height * 0.35) {
    throw new Error(
      'Could not find a clear full-body outline. Use a front-facing photo against a plain background with arms slightly away from the torso.',
    );
  }

  const bodySpans = spans.slice(top, bottom + 1);
  const covered = bodySpans.filter((span) => span > 0).length / bodySpans.length;
  if (covered < 0.45) {
    throw new Error(
      'Could not separate the figure from the background clearly enough. Try a plainer backdrop or brighter lighting.',
    );
  }

  const len = bodySpans.length;
  // Relative bands along the detected body (head→feet).
  const shoulder = bandAverage(bodySpans, len * 0.18, len * 0.30);
  const waist = bandAverage(bodySpans, len * 0.44, len * 0.56);
  const hip = bandAverage(bodySpans, len * 0.62, len * 0.78);

  if (shoulder < 4 || waist < 4 || hip < 4) {
    throw new Error('Could not read shoulder, waist, and hip proportions from this photograph.');
  }

  return { shoulder, waist, hip, coverage: covered };
}

/** Fashion silhouette from relative body widths (pixel units, not cm). */
export function classifyFromWidths(shoulder: number, waist: number, hip: number): PhotoSilhouetteEstimate {
  const bust = shoulder; // upper torso width proxy from the photo
  const bustHipDelta = Math.abs(bust - hip) / Math.max(bust, hip);
  const waistDrop = (Math.min(bust, hip) - waist) / Math.min(bust, hip);

  let id: StylingSilhouetteId;
  let confidence: 'high' | 'medium' | 'low' = 'medium';

  if (bustHipDelta <= 0.08 && waistDrop >= 0.12) {
    id = 'hourglass';
    confidence = waistDrop >= 0.18 ? 'high' : 'medium';
  } else if (hip > bust * 1.08) {
    id = 'pear';
    confidence = hip > bust * 1.16 ? 'high' : 'medium';
  } else if (bust > hip * 1.08) {
    id = 'inverted-triangle';
    confidence = bust > hip * 1.16 ? 'high' : 'medium';
  } else if (waist >= bust * 0.97 && waist >= hip * 0.97) {
    id = 'apple';
    confidence = 'medium';
  } else {
    id = 'rectangle';
    confidence = bustHipDelta <= 0.1 ? 'high' : 'low';
  }

  const option = SILHOUETTE_OPTIONS.find((item) => item.id === id)!;
  return {
    id,
    label: option.label,
    note: option.note,
    confidence,
    source: 'photo_scan',
    bands: { shoulder, waist, hip, coverage: 1 },
  };
}

export function estimateSilhouetteFromImageData(image: PixelImage): PhotoSilhouetteEstimate {
  const bands = extractBodyWidths(image);
  const estimated = classifyFromWidths(bands.shoulder, bands.waist, bands.hip);
  return {
    ...estimated,
    bands,
    confidence: bands.coverage >= 0.7 && estimated.confidence !== 'low'
      ? estimated.confidence
      : estimated.confidence === 'high'
        ? 'medium'
        : estimated.confidence,
  };
}
