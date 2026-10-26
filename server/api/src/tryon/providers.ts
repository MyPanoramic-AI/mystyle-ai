import { ApiError } from '../errors.js';
import { FashnProvider, fashnCredits, roundUsd } from '../../../tryon-lab/src/providers/fashnProvider.js';
import type { ProviderRunInput, ProviderRunResult, ProviderRuntime, TryOnProvider } from '../../../tryon-lab/src/providers/types.js';
import type { GarmentCategory, MockScenario, Quality } from '../../../tryon-lab/src/types.js';
import { demonstrationPng } from './png.js';
import type { TryOnConfig } from './tryonConfig.js';

export type TryOnProviderId = 'mock' | 'fashn-tryon-v1.6' | 'fashn-tryon-max';
export type { GarmentCategory, Quality, MockScenario, ProviderRunInput, ProviderRunResult };

const FASHN_USD = 0.075;

export class AccountMockProvider implements TryOnProvider {
  readonly id = 'mock';
  readonly label = 'Local demonstration provider';
  readonly model = 'mock-tryon-1';
  readonly availability = 'ready' as const;
  readonly imagesLeaveEnvironment = false;
  readonly retentionSummary = 'Demonstration output stays on this account service and is never sent to FASHN or any external AI.';

  constructor(private readonly scenario: MockScenario = 'success') {}

  estimatedCredits(): number {
    return 0;
  }

  async run(_input: ProviderRunInput, runtime: ProviderRuntime): Promise<ProviderRunResult> {
    await runtime.sleep(15);
    switch (this.scenario) {
      case 'success':
        return {
          providerJobId: 'mock-demo',
          outputBytes: demonstrationPng(),
          actualCredits: 0,
          actualCostUsd: 0,
        };
      case 'timeout':
        throw new ApiError('timeout', 'The demonstration provider timed out.', 504);
      case 'rate_limit':
        throw new ApiError('rate_limit', 'The demonstration provider returned a rate limit.', 429);
      case 'provider_error':
        throw new ApiError('provider_error', 'The demonstration provider failed during generation.', 502);
      case 'invalid_output':
        return {
          providerJobId: 'mock-demo',
          outputBytes: Buffer.from('this is not an image'),
          actualCredits: 0,
          actualCostUsd: 0,
        };
      case 'invalid_credentials':
        throw new ApiError('invalid_credentials', 'The demonstration provider rejected the credentials.', 401);
      case 'missing_key':
        throw new ApiError('missing_api_key', 'The demonstration provider has no API key.', 400);
      default:
        throw new ApiError('provider_error', 'Unknown demonstration scenario.', 500);
    }
  }
}

export function resolveAccountProvider(id: string, scenario: MockScenario | null): TryOnProvider {
  if (id === 'mock') return new AccountMockProvider(scenario ?? 'success');
  if (id === 'fashn-tryon-v1.6') return new FashnProvider(id, 'FASHN Virtual Try-On v1.6', 'tryon-v1.6');
  if (id === 'fashn-tryon-max') return new FashnProvider(id, 'FASHN Try-On Max', 'tryon-max');
  throw new ApiError('unknown_provider', 'Unknown virtual try-on provider.', 400);
}

export function listAccountProviders(config: TryOnConfig, quality: Quality = 'standard') {
  const v16 = new FashnProvider('fashn-tryon-v1.6', 'FASHN Virtual Try-On v1.6', 'tryon-v1.6');
  const max = new FashnProvider('fashn-tryon-max', 'FASHN Try-On Max', 'tryon-max');
  const mock = new AccountMockProvider();
  const keyOk = Boolean(config.fashnApiKey);
  return [
    {
      id: mock.id,
      label: mock.label,
      model: mock.model,
      availability: 'ready' as const,
      imagesLeaveEnvironment: false,
      estimatedCredits: 0,
      estimatedCostUsd: 0,
      liveCapable: false,
      credentialsConfigured: true,
      note: 'Produces a labelled demonstration image. Does not call FASHN and does not consume purchased credits.',
    },
    {
      id: v16.id,
      label: v16.label,
      model: v16.model,
      availability: config.allowLive && keyOk ? ('ready' as const) : ('unavailable' as const),
      imagesLeaveEnvironment: true,
      estimatedCredits: fashnCredits('tryon-v1.6', quality),
      estimatedCostUsd: roundUsd(fashnCredits('tryon-v1.6', quality) * FASHN_USD),
      liveCapable: true,
      credentialsConfigured: keyOk,
      note: config.allowLive
        ? 'Live FASHN v1.6 is enabled on this server when consent and budget allow.'
        : 'Live FASHN is disabled. TRYON_ALLOW_LIVE must be true and a budget must be set before a live call.',
    },
    {
      id: max.id,
      label: max.label,
      model: max.model,
      availability: config.allowLive && keyOk ? ('ready' as const) : ('unavailable' as const),
      imagesLeaveEnvironment: true,
      estimatedCredits: fashnCredits('tryon-max', quality),
      estimatedCostUsd: roundUsd(fashnCredits('tryon-max', quality) * FASHN_USD),
      liveCapable: true,
      credentialsConfigured: keyOk,
      note: config.allowLive
        ? 'Live FASHN Try-On Max is enabled on this server when consent and budget allow.'
        : 'Live FASHN is disabled by default.',
    },
  ];
}

export function estimatedProviderCredits(providerId: TryOnProviderId, quality: Quality): number {
  if (providerId === 'mock') return 0;
  if (providerId === 'fashn-tryon-v1.6') return fashnCredits('tryon-v1.6', quality);
  return fashnCredits('tryon-max', quality);
}

export function estimatedProviderUsd(providerId: TryOnProviderId, quality: Quality): number {
  return roundUsd(estimatedProviderCredits(providerId, quality) * (providerId === 'mock' ? 0 : FASHN_USD));
}

export function providerRuntime(config: TryOnConfig, fetchImpl: typeof fetch = fetch): ProviderRuntime {
  return {
    fetchImpl,
    now: () => Date.now(),
    sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    timeoutMs: config.timeoutMs,
    pollIntervalMs: 500,
    apiKey: config.fashnApiKey,
    baseUrl: config.fashnBaseUrl,
  };
}
