/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  StylistAgeVibeId,
  StylistAnswerLengthId,
  StylistGenderId,
  StylistPersona,
  StylistVoiceId,
  UserProfile,
} from '../types';

export const DEFAULT_STYLIST_PERSONA: StylistPersona = {
  name: 'Aria',
  gender: 'woman',
  ageVibe: 'thirties',
  voice: 'warm-encouraging',
  answerLength: 'balanced',
};

export const STYLIST_NAME_PRESETS = [
  'Aria',
  'Nova',
  'Jules',
  'Kai',
  'Elise',
  'Sam',
  'Mira',
  'Leo',
] as const;

export const STYLIST_GENDER_OPTIONS: Array<{ id: StylistGenderId; label: string; hint: string }> = [
  { id: 'woman', label: 'She / her', hint: 'Presents as a woman' },
  { id: 'man', label: 'He / him', hint: 'Presents as a man' },
  { id: 'non-binary', label: 'They / them', hint: 'Non-binary presentation' },
  { id: 'neutral', label: 'Neutral', hint: 'No gendered presentation' },
];

export const STYLIST_AGE_VIBE_OPTIONS: Array<{ id: StylistAgeVibeId; label: string; hint: string }> = [
  { id: 'mid-twenties', label: 'Mid-twenties energy', hint: 'Trend-aware, fresh, and current' },
  { id: 'thirties', label: 'Thirties professional', hint: 'Polished, confident, and practical' },
  { id: 'forties', label: 'Forties mentor', hint: 'Seasoned taste with calm authority' },
  { id: 'fifties-plus', label: 'Fifties+ sage', hint: 'Timeless, considered, and wise' },
  { id: 'ageless', label: 'Ageless classic', hint: 'No age cue — purely about style' },
];

export const STYLIST_VOICE_OPTIONS: Array<{ id: StylistVoiceId; label: string; hint: string }> = [
  {
    id: 'warm-encouraging',
    label: 'Warm & encouraging',
    hint: 'Supportive, affirming, and easy to talk to',
  },
  {
    id: 'direct-practical',
    label: 'Direct & practical',
    hint: 'Clear advice, less fluff, focused on what works',
  },
  {
    id: 'witty-playful',
    label: 'Witty & playful',
    hint: 'Light humour with stylish confidence',
  },
  {
    id: 'polished-editorial',
    label: 'Polished & editorial',
    hint: 'Magazine-style language, refined and considered',
  },
  {
    id: 'calm-minimal',
    label: 'Calm & minimal',
    hint: 'Quiet, precise, and unhurried',
  },
];

export const STYLIST_ANSWER_LENGTH_OPTIONS: Array<{ id: StylistAnswerLengthId; label: string; hint: string }> = [
  {
    id: 'short',
    label: 'Short',
    hint: 'A few tight sentences — quick answer, then stop',
  },
  {
    id: 'balanced',
    label: 'Balanced',
    hint: 'A clear reply with enough detail to act on',
  },
  {
    id: 'detailed',
    label: 'Detailed',
    hint: 'Fuller guidance with options, reasons, and next steps',
  },
];

const GENDERS = new Set<StylistGenderId>(STYLIST_GENDER_OPTIONS.map((o) => o.id));
const AGES = new Set<StylistAgeVibeId>(STYLIST_AGE_VIBE_OPTIONS.map((o) => o.id));
const VOICES = new Set<StylistVoiceId>(STYLIST_VOICE_OPTIONS.map((o) => o.id));
const LENGTHS = new Set<StylistAnswerLengthId>(STYLIST_ANSWER_LENGTH_OPTIONS.map((o) => o.id));

export function asStylistGender(value: unknown): StylistGenderId {
  return typeof value === 'string' && GENDERS.has(value as StylistGenderId)
    ? (value as StylistGenderId)
    : DEFAULT_STYLIST_PERSONA.gender;
}

export function asStylistAgeVibe(value: unknown): StylistAgeVibeId {
  return typeof value === 'string' && AGES.has(value as StylistAgeVibeId)
    ? (value as StylistAgeVibeId)
    : DEFAULT_STYLIST_PERSONA.ageVibe;
}

export function asStylistVoice(value: unknown): StylistVoiceId {
  return typeof value === 'string' && VOICES.has(value as StylistVoiceId)
    ? (value as StylistVoiceId)
    : DEFAULT_STYLIST_PERSONA.voice;
}

export function asStylistAnswerLength(value: unknown): StylistAnswerLengthId {
  return typeof value === 'string' && LENGTHS.has(value as StylistAnswerLengthId)
    ? (value as StylistAnswerLengthId)
    : DEFAULT_STYLIST_PERSONA.answerLength;
}

export function asStylistName(value: unknown): string {
  if (typeof value !== 'string') return DEFAULT_STYLIST_PERSONA.name;
  const trimmed = value.trim().replace(/\s+/g, ' ');
  if (!trimmed || trimmed.length > 40) return DEFAULT_STYLIST_PERSONA.name;
  return trimmed;
}

export function asStylistPersona(value: unknown): StylistPersona {
  const nested = (value ?? null) as Record<string, unknown> | null;
  if (!nested || typeof nested !== 'object') return { ...DEFAULT_STYLIST_PERSONA };
  return {
    name: asStylistName(nested.name),
    gender: asStylistGender(nested.gender),
    ageVibe: asStylistAgeVibe(nested.ageVibe),
    voice: asStylistVoice(nested.voice),
    answerLength: asStylistAnswerLength(nested.answerLength),
  };
}

export function resolveStylistPersona(profile?: Pick<UserProfile, 'stylistPersona'> | null): StylistPersona {
  if (!profile?.stylistPersona) return { ...DEFAULT_STYLIST_PERSONA };
  return asStylistPersona(profile.stylistPersona);
}

export function stylistGenderLabel(id: StylistGenderId): string {
  return STYLIST_GENDER_OPTIONS.find((o) => o.id === id)?.label ?? id;
}

export function stylistAgeVibeLabel(id: StylistAgeVibeId): string {
  return STYLIST_AGE_VIBE_OPTIONS.find((o) => o.id === id)?.label ?? id;
}

export function stylistVoiceLabel(id: StylistVoiceId): string {
  return STYLIST_VOICE_OPTIONS.find((o) => o.id === id)?.label ?? id;
}

export function stylistAnswerLengthLabel(id: StylistAnswerLengthId): string {
  return STYLIST_ANSWER_LENGTH_OPTIONS.find((o) => o.id === id)?.label ?? id;
}

export function stylistPersonaSummary(persona: StylistPersona): string {
  return `${persona.name} · ${stylistGenderLabel(persona.gender)} · ${stylistAgeVibeLabel(persona.ageVibe)} · ${stylistVoiceLabel(persona.voice)} · ${stylistAnswerLengthLabel(persona.answerLength)}`;
}
