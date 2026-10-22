import { ApiError } from '../errors.js';
import type { Sql } from '../db.js';
import { recordConsent } from '../privacy/consent.js';
import { readProfilePhotoSlots } from './profilePhotos.js';

const ONBOARDING = new Set(['pending', 'deferred', 'completed']);
const BUDGETS = new Set(['under-300', '300-600', '600-1000', '1000-2000', '2000-plus', 'flexible']);
const FITS = new Set(['relaxed', 'regular', 'fitted', 'no-preference']);
const EXPERIMENTS = new Set(['classic', 'balanced', 'adventurous', 'no-preference']);

function text(value: unknown, max: number, field: string): string | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string' || value.trim().length > max) throw new ApiError('invalid_profile', `${field} is not valid.`, 400);
  return value.trim();
}

function list(value: unknown, field: string, itemMax = 40): string[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.length > 20 || value.some((item) => typeof item !== 'string' || item.length > itemMax)) {
    throw new ApiError('invalid_profile', `${field} must be a short list of text values.`, 400);
  }
  return value.map((item) => item.trim()).filter(Boolean);
}

function cm(value: unknown, field: string): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 40 || value > 250) {
    throw new ApiError('invalid_measurement', `${field} must be a whole number from 40 to 250, or empty.`, 400);
  }
  return value;
}

function enumValue(value: unknown, allowed: Set<string>, field: string): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  if (typeof value !== 'string' || !allowed.has(value)) throw new ApiError('invalid_profile', `${field} is not an accepted value.`, 400);
  return value;
}

export function getProfile(db: Sql, userId: string): Record<string, unknown> {
  const profile = db.prepare('SELECT * FROM customer_profiles WHERE user_id = ?').get(userId) as Record<string, unknown> | undefined;
  if (!profile) throw new ApiError('not_found', 'Profile not found.', 404);
  const measurements = db.prepare('SELECT height_cm AS heightCm, bust_cm AS bustCm, waist_cm AS waistCm, hip_cm AS hipCm FROM profile_measurements WHERE user_id = ?').get(userId) as
    | Record<string, number | null>
    | undefined;
  return {
    displayName: profile.display_name,
    styles: JSON.parse(String(profile.style_preferences_json)),
    sizes: {
      tops: profile.tops_size,
      bottoms: profile.bottoms_size,
      dress: profile.dress_size,
      shoe: profile.shoe_size,
    },
    budgetTier: profile.budget_tier,
    favouriteColours: JSON.parse(String(profile.favourite_colours_json)),
    avoidColours: JSON.parse(String(profile.avoid_colours_json)),
    interests: JSON.parse(String(profile.fashion_interests_json)),
    fitPreference: profile.fit_preference,
    experimentation: profile.experimentation,
    country: profile.country,
    currency: profile.currency,
    ageRange: profile.age_range,
    shoppingPriorities: JSON.parse(String(profile.shopping_priorities_json ?? '[]')),
    favouriteRetailers: JSON.parse(String(profile.favourite_retailers_json ?? '[]')),
    onboardingStatus: profile.onboarding_status ?? 'pending',
    completionStatus: profile.completion_status,
    measurements: measurements ?? null,
    photos: readProfilePhotoSlots(db, userId),
  };
}

export function updateProfile(db: Sql, userId: string, body: Record<string, unknown>, now: number): Record<string, unknown> {
  const current = db.prepare('SELECT * FROM customer_profiles WHERE user_id = ?').get(userId) as Record<string, unknown> | undefined;
  if (!current) throw new ApiError('not_found', 'Profile not found.', 404);
  const displayName = body.displayName === undefined ? current.display_name : text(body.displayName, 80, 'displayName');
  const styles = list(body.styles, 'styles') ?? JSON.parse(String(current.style_preferences_json));
  const sizes = (body.sizes ?? {}) as Record<string, unknown>;
  const tops = body.sizes === undefined ? current.tops_size : text(sizes.tops, 32, 'tops size');
  const bottoms = body.sizes === undefined ? current.bottoms_size : text(sizes.bottoms, 32, 'bottoms size');
  const dress = body.sizes === undefined ? current.dress_size : text(sizes.dress, 32, 'dress size');
  const shoe = body.sizes === undefined ? current.shoe_size : text(sizes.shoe, 32, 'shoe size');
  const budget = body.budgetTier === undefined ? current.budget_tier : enumValue(body.budgetTier, BUDGETS, 'budgetTier');
  const favourite = list(body.favouriteColours, 'favouriteColours') ?? JSON.parse(String(current.favourite_colours_json));
  const avoid = list(body.avoidColours, 'avoidColours') ?? JSON.parse(String(current.avoid_colours_json));
  const interests = list(body.interests, 'interests') ?? JSON.parse(String(current.fashion_interests_json));
  const priorities = list(body.shoppingPriorities, 'shoppingPriorities') ?? JSON.parse(String(current.shopping_priorities_json ?? '[]'));
  const retailers = list(body.favouriteRetailers, 'favouriteRetailers', 80) ?? JSON.parse(String(current.favourite_retailers_json ?? '[]'));
  const ageRange = body.ageRange === undefined ? current.age_range : text(body.ageRange, 40, 'ageRange');
  const onboarding = body.onboardingStatus === undefined ? current.onboarding_status : enumValue(body.onboardingStatus, ONBOARDING, 'onboardingStatus');
  const fit = body.fitPreference === undefined ? current.fit_preference : enumValue(body.fitPreference, FITS, 'fitPreference');
  const experiment = body.experimentation === undefined ? current.experimentation : enumValue(body.experimentation, EXPERIMENTS, 'experimentation');
  const country = body.country === undefined ? current.country : text(body.country, 80, 'country');
  const currency = body.currency === undefined ? current.currency : text(body.currency, 16, 'currency');
  const complete = Boolean(displayName) && styles.length > 0 && Boolean(tops) && Boolean(budget);
  const stamp = new Date(now).toISOString();
  db.prepare(
    `UPDATE customer_profiles SET display_name=?, style_preferences_json=?, tops_size=?, bottoms_size=?, dress_size=?, shoe_size=?,
      budget_tier=?, favourite_colours_json=?, avoid_colours_json=?, fashion_interests_json=?, fit_preference=?, experimentation=?,
      country=?, currency=?, age_range=?, shopping_priorities_json=?, favourite_retailers_json=?, onboarding_status=?, completion_status=?, updated_at=? WHERE user_id=?`,
  ).run(displayName, JSON.stringify(styles), tops, bottoms, dress, shoe, budget, JSON.stringify(favourite), JSON.stringify(avoid), JSON.stringify(interests), fit, experiment, country, currency, ageRange, JSON.stringify(priorities), JSON.stringify(retailers), onboarding ?? 'pending', complete ? 'complete' : 'incomplete', stamp, userId);
  if (body.measurements !== undefined) {
    const raw = body.measurements;
    if (raw === null) {
      db.prepare('DELETE FROM profile_measurements WHERE user_id = ?').run(userId);
    } else if (!raw || typeof raw !== 'object') {
      throw new ApiError('invalid_measurement', 'Measurements must be an object or null.', 400);
    } else {
      const values = raw as Record<string, unknown>;
      const height = cm(values.heightCm, 'heightCm');
      const bust = cm(values.bustCm, 'bustCm');
      const waist = cm(values.waistCm, 'waistCm');
      const hip = cm(values.hipCm, 'hipCm');
      db.prepare(
        `INSERT INTO profile_measurements (user_id, height_cm, bust_cm, waist_cm, hip_cm) VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(user_id) DO UPDATE SET height_cm=excluded.height_cm, bust_cm=excluded.bust_cm, waist_cm=excluded.waist_cm, hip_cm=excluded.hip_cm`,
      ).run(userId, height ?? null, bust ?? null, waist ?? null, hip ?? null);
    }
  }
  return getProfile(db, userId);
}

export function getPreferences(db: Sql, userId: string): Record<string, unknown> {
  const row = db.prepare('SELECT * FROM user_preferences WHERE user_id = ?').get(userId) as Record<string, unknown> | undefined;
  if (!row) throw new ApiError('not_found', 'Preferences not found.', 404);
  return {
    privacy: JSON.parse(String(row.privacy_json)),
    notifications: JSON.parse(String(row.notifications_json)),
    aiPersonalisationConsent: row.ai_personalisation_consent === 1,
    marketingOptIn: row.marketing_opt_in === 1,
  };
}

export function updatePreferences(db: Sql, userId: string, body: Record<string, unknown>, now: number): Record<string, unknown> {
  const current = getPreferences(db, userId);
  const privacy = body.privacy === undefined ? current.privacy : body.privacy;
  const notifications = body.notifications === undefined ? current.notifications : body.notifications;
  if (!privacy || typeof privacy !== 'object' || Array.isArray(privacy)) throw new ApiError('invalid_preferences', 'Privacy settings must be an object.', 400);
  if (!notifications || typeof notifications !== 'object' || Array.isArray(notifications)) {
    throw new ApiError('invalid_preferences', 'Notification settings must be an object.', 400);
  }
  if (body.aiPersonalisationConsent !== undefined && typeof body.aiPersonalisationConsent !== 'boolean') {
    throw new ApiError('invalid_preferences', 'AI personalisation consent must be true or false.', 400);
  }
  if (body.marketingOptIn !== undefined && typeof body.marketingOptIn !== 'boolean') {
    throw new ApiError('invalid_preferences', 'Marketing consent must be true or false.', 400);
  }
  db.prepare(
    `UPDATE user_preferences SET privacy_json=?, notifications_json=?, updated_at=? WHERE user_id=?`,
  ).run(JSON.stringify(privacy), JSON.stringify(notifications), new Date(now).toISOString(), userId);
  if (body.aiPersonalisationConsent !== undefined) {
    recordConsent(db, {
      userId,
      purpose: 'ai_personalisation',
      granted: body.aiPersonalisationConsent === true,
      captureMethod: 'settings_toggle',
      evidence: { source: 'preferences_api' },
    }, now);
  }
  if (body.marketingOptIn !== undefined) {
    recordConsent(db, {
      userId,
      purpose: 'marketing',
      granted: body.marketingOptIn === true,
      captureMethod: 'settings_toggle',
      evidence: { source: 'preferences_api' },
    }, now);
  }
  return getPreferences(db, userId);
}
