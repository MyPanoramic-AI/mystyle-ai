import { resolveAppEnvironment } from '../ops/environment.js';

export interface TryOnConfig {
  allowLive: boolean;
  /** Local development/test only — never on by default in staging/production. */
  allowCustomerMock: boolean;
  maxBudgetUsd: number;
  maxAutoRetries: number;
  timeoutMs: number;
  fashnApiKey: string | null;
  fashnBaseUrl: string;
  spentUsd: number;
  /** Internal membership credits charged for one live try-on (not FASHN API credits). */
  customerCreditCost: number;
  defaultLiveProviderId: 'fashn-tryon-v1.6';
}

function numberOr(raw: string | undefined, fallback: number): number {
  if (!raw || !raw.trim()) return fallback;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

function resolveCustomerMock(env: NodeJS.ProcessEnv): boolean {
  if (env.TRYON_ALLOW_CUSTOMER_MOCK === 'true') return true;
  if (env.TRYON_ALLOW_CUSTOMER_MOCK === 'false') return false;
  const appEnv = resolveAppEnvironment(env);
  return appEnv === 'development' || appEnv === 'test';
}

/** Server-only virtual try-on gates. Live FASHN stays off unless explicitly enabled. */
export function loadTryOnConfig(env: NodeJS.ProcessEnv = process.env): TryOnConfig {
  return {
    allowLive: env.TRYON_ALLOW_LIVE === 'true',
    allowCustomerMock: resolveCustomerMock(env),
    maxBudgetUsd: numberOr(env.TRYON_MAX_BUDGET_USD, 0),
    maxAutoRetries: Math.min(1, Math.max(0, Math.floor(numberOr(env.TRYON_MAX_AUTO_RETRIES, 0)))),
    timeoutMs: numberOr(env.TRYON_PROVIDER_TIMEOUT_MS, 90_000),
    fashnApiKey: env.FASHN_API_KEY?.trim() || null,
    fashnBaseUrl: (env.FASHN_API_BASE_URL?.trim() || 'https://api.fashn.ai/v1').replace(/\/$/, ''),
    spentUsd: 0,
    customerCreditCost: Math.max(0, Math.floor(numberOr(env.TRYON_CUSTOMER_CREDIT_COST, 1))),
    defaultLiveProviderId: 'fashn-tryon-v1.6',
  };
}
