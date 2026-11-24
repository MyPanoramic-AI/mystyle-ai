/**
 * GPT-Live voice session configuration.
 * Duration-based billing is separate from text-model token budgets.
 */

export const GPT_LIVE_MODEL = 'gpt-live-1.1';

/** Voices verified for GPT-Live audio output in OpenAI docs / Live Console. */
export const GPT_LIVE_AUDIO_VOICES = [
  'alloy',
  'ash',
  'ballad',
  'coral',
  'echo',
  'marin',
  'sage',
  'shimmer',
  'verse',
  'cedar',
] as const;

export type GptLiveAudioVoice = (typeof GPT_LIVE_AUDIO_VOICES)[number];

export interface VoiceConfig {
  allowLive: boolean;
  model: string;
  audioVoice: GptLiveAudioVoice;
  /** Delegation Responses model (reuse text stylist model when set). */
  delegationModel: string | null;
  maxSessionSeconds: number;
  maxActiveSessionsPerUser: number;
  dailySecondsLimit: number;
  inactivitySeconds: number;
  /** Estimated USD per minute of voice duration (provider duration billing). */
  usdPerMinute: number | null;
  maxBudgetUsd: number;
  maxUserBudgetUsd: number;
  apiKey: string | null;
}

function numberOrNull(raw: string | undefined): number | null {
  if (!raw || !raw.trim()) return null;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

function asAudioVoice(raw: string | undefined): GptLiveAudioVoice {
  const value = (raw ?? 'marin').trim().toLowerCase();
  return (GPT_LIVE_AUDIO_VOICES as readonly string[]).includes(value)
    ? (value as GptLiveAudioVoice)
    : 'marin';
}

export function loadVoiceConfig(env: NodeJS.ProcessEnv = process.env): VoiceConfig {
  const apiKey = env.OPENAI_API_KEY?.trim() || null;
  const allowExplicit = env.AI_VOICE_ALLOW_LIVE === 'true';
  const allowLive = allowExplicit && Boolean(apiKey);
  // Only attach Responses delegation when explicitly configured for voice.
  // Reusing the text stylist model by default can break Live session minting.
  const delegationModel = env.AI_VOICE_DELEGATION_MODEL?.trim() || null;

  return {
    allowLive,
    model: env.AI_VOICE_MODEL?.trim() || GPT_LIVE_MODEL,
    audioVoice: asAudioVoice(env.AI_VOICE_AUDIO_VOICE),
    delegationModel,
    maxSessionSeconds: numberOrNull(env.AI_VOICE_MAX_SESSION_SECONDS) ?? 300,
    maxActiveSessionsPerUser: Math.max(1, numberOrNull(env.AI_VOICE_MAX_ACTIVE_SESSIONS) ?? 1),
    dailySecondsLimit: numberOrNull(env.AI_VOICE_DAILY_SECONDS) ?? 900,
    inactivitySeconds: numberOrNull(env.AI_VOICE_INACTIVITY_SECONDS) ?? 120,
    usdPerMinute: numberOrNull(env.AI_VOICE_USD_PER_MINUTE),
    maxBudgetUsd: numberOrNull(env.AI_VOICE_MAX_BUDGET_USD) ?? 0,
    maxUserBudgetUsd: numberOrNull(env.AI_VOICE_MAX_USER_BUDGET_USD) ?? 0,
    apiKey,
  };
}

export function estimateVoiceSessionUsd(config: VoiceConfig, seconds: number): number | null {
  if (config.usdPerMinute == null) return null;
  const billed = Math.max(seconds, 15);
  return (billed / 60) * config.usdPerMinute;
}

export function voiceServiceReady(config: VoiceConfig): boolean {
  return Boolean(
    config.allowLive
    && config.apiKey
    && config.model
    && config.usdPerMinute != null
    && config.usdPerMinute > 0
    && config.maxBudgetUsd > 0
    && config.maxUserBudgetUsd > 0
    && config.maxSessionSeconds > 0
    && config.dailySecondsLimit > 0,
  );
}
