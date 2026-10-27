/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  PreferredShoeStyleId,
  ShoeHeelComfort,
  ShoeHeelOccasion,
  ShoePreferences,
} from '../types';

export const DEFAULT_SHOE_PREFERENCES: ShoePreferences = {
  heelComfort: 'no-preference',
  heelOccasion: 'no-preference',
  preferredStyles: [],
};

export const SHOE_HEEL_COMFORT_OPTIONS: {
  id: ShoeHeelComfort;
  label: string;
  hint: string;
}[] = [
  {
    id: 'cannot-wear-heels',
    label: 'No heels',
    hint: 'Flats and low soles only — heels are not an option',
  },
  {
    id: 'low-heels-only',
    label: 'Low heels only',
    hint: 'Kitten heels or a slight lift are fine; avoid high heels',
  },
  {
    id: 'block-heels-ok',
    label: 'Block heels OK',
    hint: 'Stable block or wedge heels are comfortable; stilettos less so',
  },
  {
    id: 'high-heels-ok',
    label: 'High heels OK',
    hint: 'Comfortable wearing elevated or dress heels when you want to',
  },
  {
    id: 'no-preference',
    label: 'No preference',
    hint: 'Open to suggestions across heel heights',
  },
];

export const SHOE_HEEL_OCCASION_OPTIONS: {
  id: ShoeHeelOccasion;
  label: string;
  hint: string;
}[] = [
  {
    id: 'never',
    label: 'Never',
    hint: 'Prefer not to wear heels at all',
  },
  {
    id: 'special-occasions',
    label: 'Special occasions',
    hint: 'Weddings, evenings out, formal events only',
  },
  {
    id: 'sometimes',
    label: 'Sometimes',
    hint: 'Occasionally for work or nights out',
  },
  {
    id: 'often',
    label: 'Often',
    hint: 'Happy in heels for many looks',
  },
  {
    id: 'no-preference',
    label: 'No preference',
    hint: 'No strong rule about when to wear heels',
  },
];

export const PREFERRED_SHOE_STYLE_OPTIONS: {
  id: PreferredShoeStyleId;
  label: string;
}[] = [
  { id: 'sneakers', label: 'Sneakers' },
  { id: 'flats', label: 'Flats / ballet' },
  { id: 'loafers', label: 'Loafers' },
  { id: 'boots', label: 'Boots' },
  { id: 'sandals', label: 'Sandals' },
  { id: 'block-heels', label: 'Block heels' },
  { id: 'pumps', label: 'Pumps / courts' },
  { id: 'stilettos', label: 'Stilettos' },
];

export function shoeHeelComfortLabel(value: ShoeHeelComfort): string {
  return SHOE_HEEL_COMFORT_OPTIONS.find((item) => item.id === value)?.label ?? value;
}

export function shoeHeelOccasionLabel(value: ShoeHeelOccasion): string {
  return SHOE_HEEL_OCCASION_OPTIONS.find((item) => item.id === value)?.label ?? value;
}

export function preferredShoeStyleLabel(value: PreferredShoeStyleId): string {
  return PREFERRED_SHOE_STYLE_OPTIONS.find((item) => item.id === value)?.label ?? value;
}
