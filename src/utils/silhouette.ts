import type { StylingSilhouetteId } from '../types';

export const SILHOUETTE_OPTIONS: {
  id: StylingSilhouetteId;
  label: string;
  note: string;
}[] = [
  {
    id: 'hourglass',
    label: 'Hourglass',
    note: 'Defined waist with balanced bust and hip — wrap dresses and belted jackets usually flatter.',
  },
  {
    id: 'pear',
    label: 'Pear',
    note: 'Fuller through the hip relative to the bust — A-line skirts and structured shoulders balance proportion.',
  },
  {
    id: 'inverted-triangle',
    label: 'Inverted triangle',
    note: 'Broader through the shoulder/bust relative to the hip — soft volume on the lower half helps balance.',
  },
  {
    id: 'apple',
    label: 'Apple',
    note: 'Fuller through the midsection — empire waists and open necklines often elongate.',
  },
  {
    id: 'rectangle',
    label: 'Rectangle',
    note: 'Similar width through bust, waist, and hip — layering and belts create shape.',
  },
];

export function estimateSilhouetteFromCm(
  bustCm: number,
  waistCm: number,
  hipCm: number,
): { id: StylingSilhouetteId; label: string; note: string; confidence: 'high' | 'medium' | 'low' } {
  const bustHipDelta = Math.abs(bustCm - hipCm) / Math.max(bustCm, hipCm);
  const waistDrop = (Math.min(bustCm, hipCm) - waistCm) / Math.min(bustCm, hipCm);
  let id: StylingSilhouetteId;
  let confidence: 'high' | 'medium' | 'low' = 'medium';

  if (bustHipDelta <= 0.05 && waistDrop >= 0.22) {
    id = 'hourglass';
    confidence = waistDrop >= 0.28 ? 'high' : 'medium';
  } else if (hipCm > bustCm * 1.05) {
    id = 'pear';
    confidence = hipCm > bustCm * 1.12 ? 'high' : 'medium';
  } else if (bustCm > hipCm * 1.05) {
    id = 'inverted-triangle';
    confidence = bustCm > hipCm * 1.12 ? 'high' : 'medium';
  } else if (waistCm >= bustCm * 0.95 && waistCm >= hipCm * 0.95) {
    id = 'apple';
  } else {
    id = 'rectangle';
    confidence = bustHipDelta <= 0.08 ? 'high' : 'low';
  }

  const option = SILHOUETTE_OPTIONS.find((item) => item.id === id)!;
  return { id, label: option.label, note: option.note, confidence };
}
