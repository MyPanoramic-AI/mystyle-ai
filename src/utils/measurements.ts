/**
 * Canonical storage is centimetres. UI may enter cm, metres, or feet/inches.
 */

export type HeightUnit = 'cm' | 'm' | 'ft';
export type LengthUnit = 'cm' | 'in';

export function parseHeightCm(value: number | string | undefined | null): number | undefined {
  if (value == null || value === '') return undefined;
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return Math.round(n);
}

export function cmToMetres(cm: number): string {
  return (cm / 100).toFixed(2).replace(/\.?0+$/, '') || '0';
}

export function metresToCm(metres: number): number {
  return Math.round(metres * 100);
}

export function cmToFeetInches(cm: number): { feet: number; inches: number } {
  const totalInches = cm / 2.54;
  let feet = Math.floor(totalInches / 12);
  let inches = Math.round(totalInches - feet * 12);
  if (inches === 12) {
    feet += 1;
    inches = 0;
  }
  return { feet, inches };
}

export function feetInchesToCm(feet: number, inches: number): number {
  const safeFeet = Number.isFinite(feet) ? Math.max(0, feet) : 0;
  const safeInches = Number.isFinite(inches) ? Math.max(0, Math.min(11.99, inches)) : 0;
  return Math.round((safeFeet * 12 + safeInches) * 2.54);
}

export function formatHeight(cm: number | string | undefined | null, unit: HeightUnit = 'cm'): string {
  const value = parseHeightCm(cm);
  if (value == null) return 'Not specified';
  if (unit === 'm') return `${cmToMetres(value)} m`;
  if (unit === 'ft') {
    const { feet, inches } = cmToFeetInches(value);
    return `${feet}'${inches}"`;
  }
  return `${value} cm`;
}

export function cmToInches(cm: number): number {
  return Math.round((cm / 2.54) * 10) / 10;
}

export function inchesToCm(inches: number): number {
  return Math.round(inches * 2.54);
}

export function parseLengthCm(raw: string | undefined | null): number | undefined {
  if (raw == null || raw === '') return undefined;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return Math.round(n);
}

export function formatLengthDisplay(cmRaw: string | undefined | null, unit: LengthUnit): string {
  const cm = parseLengthCm(cmRaw);
  if (cm == null) return '';
  if (unit === 'in') return String(cmToInches(cm));
  return String(cm);
}
