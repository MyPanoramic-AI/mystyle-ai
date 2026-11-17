import { ApiError } from '../errors.js';
import { estimateVoiceSessionUsd, voiceServiceReady, type VoiceConfig } from './voiceConfig.js';

export function assertVoiceAllowed(
  config: VoiceConfig,
  opts: {
    spentUsd: number;
    userSpentUsd: number;
    activeForUser: number;
    dailySecondsUsed: number;
  },
): number {
  if (!config.allowLive) {
    throw new ApiError('voice_disabled', 'Live voice with the stylist is switched off.', 503);
  }
  if (!voiceServiceReady(config)) {
    throw new ApiError(
      'voice_unconfigured',
      'Live voice needs OPENAI_API_KEY, AI_VOICE_ALLOW_LIVE=true, a positive duration price, and voice budgets.',
      503,
    );
  }
  if (opts.activeForUser >= config.maxActiveSessionsPerUser) {
    throw new ApiError('voice_session_active', 'You already have a live voice session. End it before starting another.', 409);
  }
  if (opts.dailySecondsUsed >= config.dailySecondsLimit) {
    throw new ApiError('voice_daily_limit', 'Today\'s voice minutes have been used. Try again tomorrow.', 429);
  }

  const reserveSeconds = Math.min(config.maxSessionSeconds, Math.max(config.dailySecondsLimit - opts.dailySecondsUsed, 15));
  const estimate = estimateVoiceSessionUsd(config, reserveSeconds);
  if (estimate == null) {
    throw new ApiError('voice_unpriced', 'Voice stays off until AI_VOICE_USD_PER_MINUTE is configured.', 503);
  }
  if (opts.spentUsd + estimate > config.maxBudgetUsd || opts.userSpentUsd + estimate > config.maxUserBudgetUsd) {
    throw new ApiError('voice_budget_exceeded', 'The voice development budget has been reached.', 429);
  }
  return estimate;
}

export function remainingSecondsAvailable(config: VoiceConfig, dailySecondsUsed: number): number {
  return Math.max(0, Math.min(config.maxSessionSeconds, config.dailySecondsLimit - dailySecondsUsed));
}
