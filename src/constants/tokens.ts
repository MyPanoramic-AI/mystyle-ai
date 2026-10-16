/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Design Tokens for MyStyle AI
 * Editorial Luxury + Modern Mobile Aesthetic
 */

export const COLORS = {
  warmIvory: '#F6F2EC',
  softBlush: '#E5CDBE',
  mutedRose: '#9C6A61',
  deepCharcoal: '#242326',
  softGold: '#B49361',
  pureWhite: '#FFFFFF',
  
  // Tonal accents
  roseSubtle: '#F4ECE9',
  goldSubtle: '#F8F5EE',
  charcoalMuted: '#5C585E',
  charcoalLight: '#8E8A90',
  borderHairline: 'rgba(36, 35, 38, 0.08)',
} as const;

export const TYPOGRAPHY = {
  fontDisplay: "'Playfair Display', Georgia, serif",
  fontBody: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
} as const;

export const RADII = {
  sm: '0.375rem', // 6px
  md: '0.625rem', // 10px
  lg: '1rem',    // 16px
  xl: '1.25rem', // 20px
  '2xl': '1.5rem', // 24px
  full: '9999px',
} as const;

export const SHADOWS = {
  subtle: '0 1px 3px rgba(36, 35, 38, 0.04), 0 1px 2px rgba(36, 35, 38, 0.03)',
  card: '0 4px 16px -2px rgba(36, 35, 38, 0.06), 0 2px 6px -1px rgba(36, 35, 38, 0.03)',
  float: '0 12px 28px -4px rgba(36, 35, 38, 0.12), 0 4px 10px -2px rgba(36, 35, 38, 0.05)',
} as const;
