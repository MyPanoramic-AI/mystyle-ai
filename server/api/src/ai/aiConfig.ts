export interface AiConfig {
  allowLive: boolean;
  provider: 'mock' | 'gemini';
  model: string | null;
  apiKey: string | null;
  maxBudgetUsd: number;
  maxUserBudgetUsd: number;
  maxOutputTokens: number;
  maxInputTokens: number;
  thinkingBudget: number;
  maxLiveRequests: number;
  maxInputChars: number;
  messageRateLimit: number;
  messageRateWindowMs: number;
  timeoutMs: number;
  inputUsdPerMillion: number | null;
  outputUsdPerMillion: number | null;
}

function numberOrNull(raw: string | undefined): number | null {
  if (!raw || !raw.trim()) return null;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

export function loadAiConfig(env: NodeJS.ProcessEnv = process.env): AiConfig {
  const provider = env.AI_PROVIDER === 'gemini' ? 'gemini' : 'mock';
  return {
    allowLive: env.AI_ALLOW_LIVE === 'true',
    provider,
    model: env.AI_MODEL?.trim() || null,
    apiKey: env.GEMINI_API_KEY?.trim() || null,
    maxBudgetUsd: numberOrNull(env.AI_MAX_BUDGET_USD) ?? 0,
    maxUserBudgetUsd: numberOrNull(env.AI_MAX_USER_BUDGET_USD) ?? 0,
    maxOutputTokens: numberOrNull(env.AI_MAX_OUTPUT_TOKENS) ?? 800,
    maxInputTokens: numberOrNull(env.AI_MAX_INPUT_TOKENS) ?? 4000,
    thinkingBudget: numberOrNull(env.AI_THINKING_BUDGET) ?? 0,
    maxLiveRequests: numberOrNull(env.AI_MAX_LIVE_REQUESTS) ?? 0,
    maxInputChars: numberOrNull(env.AI_MAX_INPUT_CHARS) ?? 2000,
    messageRateLimit: numberOrNull(env.AI_MESSAGE_RATE_LIMIT) ?? 30,
    messageRateWindowMs: numberOrNull(env.AI_MESSAGE_RATE_WINDOW_MS) ?? 15 * 60 * 1000,
    timeoutMs: numberOrNull(env.AI_TIMEOUT_MS) ?? 20_000,
    inputUsdPerMillion: numberOrNull(env.AI_INPUT_USD_PER_MILLION),
    outputUsdPerMillion: numberOrNull(env.AI_OUTPUT_USD_PER_MILLION),
  };
}

export function estimateLiveUsd(config: AiConfig): number | null {
  if (config.inputUsdPerMillion == null || config.outputUsdPerMillion == null) return null;
  const outputTokens = config.maxOutputTokens + Math.max(config.thinkingBudget, 0);
  return (config.maxInputTokens / 1_000_000) * config.inputUsdPerMillion + (outputTokens / 1_000_000) * config.outputUsdPerMillion;
}
