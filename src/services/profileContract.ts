import { BudgetTier, ExperimentationLevel, FitPreference, UserProfile } from '../types';

const BUDGETS = new Set<BudgetTier>(['under-300', '300-600', '600-1000', '1000-2000', '2000-plus', 'flexible']);
const FITS = new Set<FitPreference>(['relaxed', 'regular', 'fitted', 'no-preference']);
const EXPERIMENTS = new Set<ExperimentationLevel>(['classic', 'balanced', 'adventurous', 'no-preference']);

export const PROFILE_STORAGE_KEY = 'mystyle_ai_user_profile_v1';

export const NEVER_IMPORT_KEYS = [
  'mystyle_family_members_v1',
  'mystyle_saved_family_plans_v1',
  'mystyle_wardrobe_items_v1',
  'mystyle_wardrobe_outfits_v1',
  'mystyle_wardrobe_events_v1',
  'mystyle_saved_beauty_looks_v1',
  'mystyle_beauty_shopping_bag_v1',
  'mystyle_saved_looks_v1',
  'mystyle_saved_products_v1',
  'mystyle_membership',
  'mystyle_credits',
  'mystyle_credit_transactions',
  'mystyle_account_settings',
  'mystyle_privacy_settings',
  'mystyle_notification_settings',
] as const;

export interface ImportSelection {
  details: boolean;
  sizes: boolean;
  colours: boolean;
  shopping: boolean;
  measurements: boolean;
}

export interface ImportPreview {
  displayName: string;
  styles: string[];
  hasSizes: boolean;
  hasColours: boolean;
  hasShopping: boolean;
  hasMeasurements: boolean;
  blockedKeysPresent: string[];
}

export interface BrowserStore {
  getItem(key: string): string | null;
}

export function emptyAccountProfile(): UserProfile {
  return {
    personal: { firstName: '', country: 'South Africa', currency: 'ZAR (R)' },
    sizes: { topsSize: '', bottomsSize: '', dressSize: '', shoeSize: '' },
    styles: [],
    colours: { favoriteColors: [], avoidColors: [], fitPreference: 'no-preference', experimentation: 'no-preference' },
    shopping: { itemBudget: 'flexible', priorities: [], favoriteRetailers: [] },
    isOnboardingCompleted: false,
    onboardingStatus: 'pending',
  };
}

function asBudget(value: unknown): BudgetTier {
  return typeof value === 'string' && BUDGETS.has(value as BudgetTier) ? value as BudgetTier : 'flexible';
}

function asFit(value: unknown): FitPreference {
  return typeof value === 'string' && FITS.has(value as FitPreference) ? value as FitPreference : 'no-preference';
}

function asExperiment(value: unknown): ExperimentationLevel {
  return typeof value === 'string' && EXPERIMENTS.has(value as ExperimentationLevel) ? value as ExperimentationLevel : 'no-preference';
}

function textList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function measurementText(value: unknown): string {
  return typeof value === 'number' && Number.isFinite(value) ? String(value) : '';
}

export function fromApiProfile(body: Record<string, unknown>): UserProfile {
  const sizes = (body.sizes ?? {}) as Record<string, unknown>;
  const measurements = (body.measurements ?? null) as Record<string, unknown> | null;
  const status = body.onboardingStatus === 'completed' || body.onboardingStatus === 'deferred' || body.onboardingStatus === 'pending'
    ? body.onboardingStatus
    : 'pending';
  const height = measurements?.heightCm;
  return {
    personal: {
      firstName: typeof body.displayName === 'string' ? body.displayName : '',
      ageRange: typeof body.ageRange === 'string' ? body.ageRange : undefined,
      heightCm: typeof height === 'number' ? height : undefined,
      country: typeof body.country === 'string' ? body.country : 'South Africa',
      currency: typeof body.currency === 'string' ? body.currency : 'ZAR (R)',
    },
    sizes: {
      topsSize: typeof sizes.tops === 'string' ? sizes.tops : '',
      bottomsSize: typeof sizes.bottoms === 'string' ? sizes.bottoms : '',
      dressSize: typeof sizes.dress === 'string' ? sizes.dress : '',
      shoeSize: typeof sizes.shoe === 'string' ? sizes.shoe : '',
      bustCm: measurementText(measurements?.bustCm),
      waistCm: measurementText(measurements?.waistCm),
      hipCm: measurementText(measurements?.hipCm),
    },
    styles: textList(body.styles),
    colours: {
      favoriteColors: textList(body.favouriteColours),
      avoidColors: textList(body.avoidColours),
      fitPreference: asFit(body.fitPreference),
      experimentation: asExperiment(body.experimentation),
    },
    shopping: {
      itemBudget: asBudget(body.budgetTier),
      priorities: textList(body.shoppingPriorities),
      favoriteRetailers: textList(body.favouriteRetailers),
    },
    isOnboardingCompleted: status === 'completed',
    onboardingStatus: status,
  };
}

function optionalCm(value: string | undefined): number | null {
  if (!value || !value.trim()) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

export function toApiProfile(profile: UserProfile): Record<string, unknown> {
  const height = profile.personal.heightCm;
  const heightCm = typeof height === 'number' ? height : typeof height === 'string' && height.trim() ? Number(height) : null;
  return {
    displayName: profile.personal.firstName,
    ageRange: profile.personal.ageRange ?? null,
    styles: profile.styles,
    sizes: {
      tops: profile.sizes.topsSize || null,
      bottoms: profile.sizes.bottomsSize || null,
      dress: profile.sizes.dressSize || null,
      shoe: profile.sizes.shoeSize || null,
    },
    budgetTier: profile.shopping.itemBudget,
    favouriteColours: profile.colours.favoriteColors,
    avoidColours: profile.colours.avoidColors,
    interests: profile.styles,
    fitPreference: profile.colours.fitPreference,
    experimentation: profile.colours.experimentation,
    country: profile.personal.country,
    currency: profile.personal.currency,
    shoppingPriorities: profile.shopping.priorities,
    favouriteRetailers: profile.shopping.favoriteRetailers,
    onboardingStatus: profile.onboardingStatus ?? (profile.isOnboardingCompleted ? 'completed' : 'pending'),
    measurements: {
      heightCm: typeof heightCm === 'number' && Number.isInteger(heightCm) ? heightCm : null,
      bustCm: optionalCm(profile.sizes.bustCm),
      waistCm: optionalCm(profile.sizes.waistCm),
      hipCm: optionalCm(profile.sizes.hipCm),
    },
  };
}

export function profileForAccount(next: UserProfile): UserProfile {
  return fromApiProfile(toApiProfile({ ...next, onboardingStatus: next.onboardingStatus ?? 'pending' }));
}

function readStoredProfile(store: BrowserStore): UserProfile | null {
  const raw = store.getItem(PROFILE_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<UserProfile>;
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      ...emptyAccountProfile(),
      ...parsed,
      personal: { ...emptyAccountProfile().personal, ...(parsed.personal ?? {}) },
      sizes: { ...emptyAccountProfile().sizes, ...(parsed.sizes ?? {}) },
      colours: { ...emptyAccountProfile().colours, ...(parsed.colours ?? {}) },
      shopping: { ...emptyAccountProfile().shopping, ...(parsed.shopping ?? {}) },
      styles: Array.isArray(parsed.styles) ? parsed.styles : [],
    };
  } catch {
    return null;
  }
}

export function inspectBrowserStore(store: BrowserStore): ImportPreview | null {
  const blockedKeysPresent = NEVER_IMPORT_KEYS.filter((key) => store.getItem(key));
  const stored = readStoredProfile(store);
  if (!stored) return null;
  const measurements = Boolean(stored.personal.heightCm || stored.sizes.bustCm || stored.sizes.waistCm || stored.sizes.hipCm);
  return {
    displayName: stored.personal.firstName,
    styles: stored.styles,
    hasSizes: Boolean(stored.sizes.topsSize || stored.sizes.bottomsSize || stored.sizes.dressSize || stored.sizes.shoeSize),
    hasColours: stored.colours.favoriteColors.length > 0 || stored.colours.avoidColors.length > 0,
    hasShopping: stored.shopping.priorities.length > 0 || stored.shopping.favoriteRetailers.length > 0,
    hasMeasurements: measurements,
    blockedKeysPresent,
  };
}

export function buildImportProfile(current: UserProfile, store: BrowserStore, selection: ImportSelection): UserProfile {
  const stored = readStoredProfile(store);
  if (!stored) return profileForAccount(current);
  const next = profileForAccount(current);
  if (selection.details) {
    next.personal = {
      ...next.personal,
      firstName: stored.personal.firstName || next.personal.firstName,
      ageRange: stored.personal.ageRange,
      country: stored.personal.country || next.personal.country,
      currency: stored.personal.currency || next.personal.currency,
    };
    next.styles = stored.styles;
  }
  if (selection.sizes) next.sizes = { ...stored.sizes, bustCm: '', waistCm: '', hipCm: '' };
  if (selection.colours) next.colours = { ...stored.colours };
  if (selection.shopping) next.shopping = { ...stored.shopping };
  if (selection.measurements) {
    next.personal = { ...next.personal, heightCm: stored.personal.heightCm };
    next.sizes = {
      ...next.sizes,
      bustCm: stored.sizes.bustCm,
      waistCm: stored.sizes.waistCm,
      hipCm: stored.sizes.hipCm,
    };
  }
  return next;
}
