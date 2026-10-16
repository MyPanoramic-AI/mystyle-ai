/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Profile Data Service for MyStyle AI
 * Manages non-sensitive style preferences in local browser storage.
 * Decoupled behind a clean service layer ready for backend API migration in Cursor.
 * 
 * IMPORTANT: Photographs are strictly kept in temporary browser memory and are
 * never written to localStorage or public files.
 */

import { UserProfile } from '../types';

const STORAGE_KEY = 'mystyle_ai_user_profile_v1';

export const DEFAULT_USER_PROFILE: UserProfile = {
  personal: {
    firstName: 'Nandi',
    ageRange: '25–34',
    heightCm: 168,
    country: 'South Africa',
    currency: 'ZAR (R)',
  },
  sizes: {
    topsSize: 'M (SA 34)',
    bottomsSize: '32 (SA 34)',
    dressSize: 'SA 34 / UK 10',
    shoeSize: 'SA / UK 5',
    bustCm: '90',
    waistCm: '72',
    hipCm: '98',
  },
  styles: ['Modern & Minimal', 'Chic & Sophisticated', 'Classic & Elegant'],
  colours: {
    favoriteColors: ['Warm Ivory', 'Soft Camel', 'Deep Olive', 'Muted Rose', 'Midnight Black'],
    avoidColors: ['Neon Yellow', 'Bright Lime'],
    fitPreference: 'regular',
    experimentation: 'balanced',
  },
  shopping: {
    itemBudget: '600-1000',
    priorities: ['Quality and durability', 'Best value for money', 'Finding specials and discounts'],
    favoriteRetailers: ['Woolworths', 'Superbalist', 'Zara', 'Country Road'],
  },
  isOnboardingCompleted: true,
  lastUpdated: new Date().toISOString(),
};

export const profileService = {
  /**
   * Loads the current user profile from localStorage or falls back to default.
   */
  getProfile(): UserProfile {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...DEFAULT_USER_PROFILE,
          ...parsed,
          personal: { ...DEFAULT_USER_PROFILE.personal, ...(parsed.personal || {}) },
          sizes: { ...DEFAULT_USER_PROFILE.sizes, ...(parsed.sizes || {}) },
          colours: { ...DEFAULT_USER_PROFILE.colours, ...(parsed.colours || {}) },
          shopping: { ...DEFAULT_USER_PROFILE.shopping, ...(parsed.shopping || {}) },
        };
      }
    } catch (e) {
      console.warn('Failed to read profile from localStorage:', e);
    }
    return DEFAULT_USER_PROFILE;
  },

  /**
   * Saves updated non-sensitive profile preferences to localStorage.
   */
  saveProfile(profile: UserProfile): void {
    try {
      const sanitized: UserProfile = {
        ...profile,
        lastUpdated: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
    } catch (e) {
      console.warn('Failed to save profile to localStorage:', e);
    }
  },

  /**
   * Resets the profile back to defaults.
   */
  resetProfile(): UserProfile {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to remove profile from localStorage:', e);
    }
    return DEFAULT_USER_PROFILE;
  },

  /**
   * Computes a weighted profile completeness score (0-100%).
   */
  calculateCompleteness(profile: UserProfile): number {
    let score = 0;
    const totalWeights = 100;

    // Personal details (20 points)
    if (profile.personal.firstName) score += 10;
    if (profile.personal.country && profile.personal.currency) score += 5;
    if (profile.personal.ageRange || profile.personal.heightCm) score += 5;

    // Sizes (25 points)
    if (profile.sizes.topsSize && profile.sizes.topsSize !== 'Not sure') score += 7;
    if (profile.sizes.bottomsSize && profile.sizes.bottomsSize !== 'Not sure') score += 7;
    if (profile.sizes.shoeSize && profile.sizes.shoeSize !== 'Not sure') score += 6;
    if (profile.sizes.dressSize || profile.sizes.bustCm) score += 5;

    // Styles (20 points)
    if (profile.styles && profile.styles.length > 0) {
      score += Math.min(20, profile.styles.length * 7);
    }

    // Colours & Fit (15 points)
    if (profile.colours.favoriteColors && profile.colours.favoriteColors.length > 0) score += 8;
    if (profile.colours.fitPreference && profile.colours.fitPreference !== 'no-preference') score += 4;
    if (profile.colours.experimentation) score += 3;

    // Shopping (20 points)
    if (profile.shopping.itemBudget) score += 7;
    if (profile.shopping.priorities && profile.shopping.priorities.length > 0) score += 7;
    if (profile.shopping.favoriteRetailers && profile.shopping.favoriteRetailers.length > 0) score += 6;

    return Math.min(totalWeights, Math.round(score));
  },
};
