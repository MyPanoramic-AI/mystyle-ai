export interface TryOnConfig {
  allowLive: boolean;
  maxBudgetUsd: number;
  maxAutoRetries: number;
  timeoutMs: number;
  fashnApiKey: string | null;
  fashnBaseUrl: string;
  spentUsd: number;
}

function numberOr(raw: string | undefined, fallback: number): number {
  if (!raw || !raw.trim()) return fallback;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

/** Server-only virtual try-on gates. Live FASHN stays off unless explicitly enabled. */
export function loadTryOnConfig(env: NodeJS.ProcessEnv = process.env): TryOnConfig {
  return {
    allowLive: env.TRYON_ALLOW_LIVE === 'true',
    maxBudgetUsd: numberOr(env.TRYON_MAX_BUDGET_USD, 0),
    maxAutoRetries: Math.min(1, Math.max(0, Math.floor(numberOr(env.TRYON_MAX_AUTO_RETRIES, 0)))),
    timeoutMs: numberOr(env.TRYON_PROVIDER_TIMEOUT_MS, 90_000),
    fashnApiKey: env.FASHN_API_KEY?.trim() || null,
    fashnBaseUrl: (env.FASHN_API_BASE_URL?.trim() || 'https://api.fashn.ai/v1').replace(/\/$/, ''),
    spentUsd: 0,
  };
}
