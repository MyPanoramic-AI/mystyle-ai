import type { NormalisedSize } from '../types.js';

const ALPHA = new Set(['xxs', 'xs', 's', 'm', 'l', 'xl', 'xxl', 'xxxl']);

export function normaliseSize(label: string | null, system: string | null): NormalisedSize {
  if (!label || !label.trim()) {
    return {
      label: null,
      system: null,
      normalisedLabel: null,
      confidence: 'unavailable',
      note: 'The source did not provide a size label.',
    };
  }
  const clean = label.trim();
  const systemKey = (system ?? '').trim().toLowerCase();
  if (ALPHA.has(clean.toLowerCase()) && (!systemKey || systemKey === 'alpha')) {
    return {
      label: clean,
      system: 'alpha',
      normalisedLabel: clean.toUpperCase(),
      confidence: 'reliable',
      note: 'Alpha label preserved. It is not converted to a numeric SA or UK size.',
    };
  }
  if (systemKey === 'sa' || systemKey === 'sa_numeric') {
    return {
      label: clean,
      system: 'sa_numeric',
      normalisedLabel: `SA ${clean}`,
      confidence: 'reliable',
      note: 'SA label preserved. No UK conversion is applied.',
    };
  }
  if (systemKey === 'uk' || systemKey === 'uk_numeric') {
    return {
      label: clean,
      system: 'uk_numeric',
      normalisedLabel: `UK ${clean}`,
      confidence: 'reliable',
      note: 'UK label preserved. No SA conversion is applied.',
    };
  }
  if (systemKey.startsWith('shoe_')) {
    return {
      label: clean,
      system: systemKey,
      normalisedLabel: `${systemKey.toUpperCase()} ${clean}`,
      confidence: 'uncertain',
      note: 'Shoe label preserved in the stated system. Cross-system shoe conversion is not treated as reliable.',
    };
  }
  return {
    label: clean,
    system: systemKey || null,
    normalisedLabel: clean,
    confidence: 'uncertain',
    note: 'Retailer size label preserved. Equivalence to another retailer is not established.',
  };
}

export function sizeMatches(label: string | null, normalised: string | null, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return false;
  for (const value of [label, normalised]) {
    if (!value) continue;
    const tokens = value.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
    if (tokens.includes(needle) || value.trim().toLowerCase() === needle) return true;
  }
  return false;
}
