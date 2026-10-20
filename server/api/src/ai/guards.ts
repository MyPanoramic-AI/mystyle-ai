import { ApiError } from '../errors.js';
import type { AiConfig } from './aiConfig.js';
import { estimateLiveUsd } from './aiConfig.js';

export function assertLiveAllowed(config: AiConfig, spentUsd: number, userSpentUsd: number, liveAttempts: number): number {
  if (!config.allowLive) throw new ApiError('ai_disabled', 'Live AI is switched off.', 503);
  if (config.provider !== 'openai' && config.provider !== 'gemini') throw new ApiError('ai_disabled', 'The configured stylist is the local demonstration.', 503);
  if (!config.apiKey) throw new ApiError('ai_unconfigured', 'The live stylist has no server credential.', 503);
  if (!config.model) throw new ApiError('ai_unconfigured', 'The live stylist has no model configured.', 503);
  const estimate = estimateLiveUsd(config);
  if (estimate == null) throw new ApiError('ai_unpriced', 'Live AI stays off until a verified token price is configured.', 503);
  if (spentUsd + estimate > config.maxBudgetUsd || userSpentUsd + estimate > config.maxUserBudgetUsd) {
    throw new ApiError('budget_exceeded', 'The stylist development budget has been reached.', 429);
  }
  if (config.maxLiveRequests < 1 || liveAttempts >= config.maxLiveRequests) {
    throw new ApiError('live_request_cap', 'The live stylist has reached its configured request cap.', 429);
  }
  return estimate;
}
