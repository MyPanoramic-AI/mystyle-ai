import { LabError } from '../errors.js';
import { solidPng } from '../testing/png.js';
import type { MockScenario } from '../types.js';
import type { ProviderRunInput, ProviderRunResult, ProviderRuntime, TryOnProvider } from './types.js';

export class MockProvider implements TryOnProvider {
  readonly id = 'mock';
  readonly label = 'Local mock provider';
  readonly model = 'mock-tryon-1';
  readonly availability = 'ready' as const;
  readonly imagesLeaveEnvironment = false;
  readonly retentionSummary = 'Mock output stays on this machine and is never sent to a provider.';

  constructor(private readonly scenario: MockScenario = 'success') {}

  estimatedCredits(): number {
    return 0;
  }

  async run(_input: ProviderRunInput, runtime: ProviderRuntime): Promise<ProviderRunResult> {
    await runtime.sleep(5);
    switch (this.scenario) {
      case 'success':
        return {
          providerJobId: 'mock-job',
          outputBytes: solidPng(32, 48),
          actualCredits: 0,
          actualCostUsd: 0,
        };
      case 'timeout':
        throw new LabError('timeout', 'The mock provider timed out.', 504, true);
      case 'rate_limit':
        throw new LabError('rate_limit', 'The mock provider returned a rate limit.', 429, true);
      case 'provider_error':
        throw new LabError('provider_error', 'The mock provider failed during generation.', 502, false);
      case 'invalid_output':
        return {
          providerJobId: 'mock-job',
          outputBytes: Buffer.from('this is not an image'),
          actualCredits: 0,
          actualCostUsd: 0,
        };
      case 'invalid_credentials':
        throw new LabError('invalid_credentials', 'The mock provider rejected the credentials.', 401, false);
      case 'missing_key':
        throw new LabError('missing_api_key', 'The mock provider has no API key.', 400, false);
      default:
        throw new LabError('provider_error', 'Unknown mock scenario.', 500, false);
    }
  }
}
