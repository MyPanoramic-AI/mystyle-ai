/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type NavigationTab = 'home' | 'stylist' | 'try-on' | 'shop' | 'profile';
export * from './stylist';
export * from './discover';
export * from './shop';
export * from './family';
export * from './beauty';
export * from './wardrobe';
export * from './membership';

export interface OccasionShortcut {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  recommendedTone: string;
  promptSuggestion: string;
}

export interface FeatureCardItem {
  id: string;
  title: string;
  description: string;
  badge?: string;
  targetTab?: NavigationTab;
  isUpcoming?: boolean;
  upcomingPhase?: string;
  accent: 'rose' | 'gold' | 'charcoal';
}

export interface StyleInspiration {
  id: string;
  title: string;
  aesthetic: string;
  occasion: string;
  imageUrl: string;
  palette: string[];
  keyPieces: string[];
  stylistNote: string;
}

export interface StylistLookPiece {
  name: string;
  brand?: string;
  category: string;
  color?: string;
  imageUrl: string;
}

export interface StylistLookConsultation {
  title: string;
  occasion?: string;
  base?: 'separates' | 'dress';
  pieces: StylistLookPiece[];
}

export interface StylistNavigationState {
  occasionTitle?: string;
  suggestedPrompt?: string;
  /** When set, stylist opens a fresh chat focused on this assembled wardrobe look. */
  lookConsultation?: StylistLookConsultation;
  origin?: 'hero' | 'occasion' | 'invitation' | 'tab' | 'inspiration' | 'wardrobe';
  timestamp?: number;
}

export type StylingSilhouetteId =
  | 'hourglass'
  | 'pear'
  | 'inverted-triangle'
  | 'apple'
  | 'rectangle';

export interface PersonalDetails {
  firstName: string;
  ageRange?: string;
  heightCm?: number | string;
  country: string;
  currency: string;
  /** Styling silhouette preference (hourglass, pear, …) — not a medical assessment. */
  bodyShape?: StylingSilhouetteId;
  bodyShapeLabel?: string;
  bodyShapeNote?: string;
  bodyShapeSource?: string;
}

export interface ClothingSizes {
  topsSize: string;
  bottomsSize: string;
  dressSize: string;
  shoeSize: string;
  bustCm?: string;
  waistCm?: string;
  hipCm?: string;
}

/** How comfortable someone is wearing elevated heels day to day. */
export type ShoeHeelComfort =
  | 'cannot-wear-heels'
  | 'low-heels-only'
  | 'block-heels-ok'
  | 'high-heels-ok'
  | 'no-preference';

/** When they typically choose heels, if they wear them at all. */
export type ShoeHeelOccasion =
  | 'never'
  | 'special-occasions'
  | 'sometimes'
  | 'often'
  | 'no-preference';

export type PreferredShoeStyleId =
  | 'sneakers'
  | 'flats'
  | 'loafers'
  | 'boots'
  | 'sandals'
  | 'block-heels'
  | 'pumps'
  | 'stilettos';

export interface ShoePreferences {
  heelComfort: ShoeHeelComfort;
  heelOccasion: ShoeHeelOccasion;
  preferredStyles: PreferredShoeStyleId[];
}

/** How the personal stylist presents (not the customer's gender). */
export type StylistGenderId = 'woman' | 'man' | 'non-binary' | 'neutral';

/** Perceived age / life-stage energy of the stylist persona. */
export type StylistAgeVibeId =
  | 'mid-twenties'
  | 'thirties'
  | 'forties'
  | 'fifties-plus'
  | 'ageless';

/** Conversational tone for the stylist. */
export type StylistVoiceId =
  | 'warm-encouraging'
  | 'direct-practical'
  | 'witty-playful'
  | 'polished-editorial'
  | 'calm-minimal';

export interface StylistPersona {
  name: string;
  gender: StylistGenderId;
  ageVibe: StylistAgeVibeId;
  voice: StylistVoiceId;
}

export type FitPreference = 'relaxed' | 'regular' | 'fitted' | 'no-preference';
export type ExperimentationLevel = 'classic' | 'balanced' | 'adventurous' | 'no-preference';

export interface ColourPreferences {
  favoriteColors: string[];
  avoidColors: string[];
  fitPreference: FitPreference;
  experimentation: ExperimentationLevel;
}

export type BudgetTier = 'under-300' | '300-600' | '600-1000' | '1000-2000' | '2000-plus' | 'flexible';

export interface ShoppingPreferences {
  itemBudget: BudgetTier;
  priorities: string[];
  favoriteRetailers: string[];
}

export interface UserProfile {
  personal: PersonalDetails;
  sizes: ClothingSizes;
  styles: string[];
  colours: ColourPreferences;
  shopping: ShoppingPreferences;
  shoePreferences: ShoePreferences;
  stylistPersona: StylistPersona;
  isOnboardingCompleted: boolean;
  onboardingStatus?: 'pending' | 'deferred' | 'completed';
  lastUpdated?: string;
}

export interface TemporaryPhotos {
  profilePhotoUrl?: string;
  fullBodyFrontUrl?: string;
  fullBodyBackUrl?: string;
  fullBodyAdditionalUrl?: string;
  portraitMediaId?: string;
  fullBodyFrontMediaId?: string;
  fullBodyBackMediaId?: string;
  fullBodyAdditionalMediaId?: string;
}

export interface StyleCategoryItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
}
