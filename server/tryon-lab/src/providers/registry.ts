import { LabError } from '../errors.js';
import { FASHN_ON_DEMAND_USD_PER_CREDIT } from '../config.js';
import type { MockScenario, Quality } from '../types.js';
import { FashnProvider, roundUsd } from './fashnProvider.js';
import { MockProvider } from './mockProvider.js';
import type { TryOnProvider } from './types.js';

export interface ProviderChoice {
  id: string;
  label: string;
  model: string;
  availability: 'ready' | 'unavailable';
  unavailableReason?: string;
  imagesLeaveEnvironment: boolean;
  retentionSummary: string;
  estimatedCostUsd: number;
  credentialsConfigured: boolean;
}

const googleReason =
  'Google Cloud documents virtual-try-on-001 as deprecated on 14 September 2026 on the Gemini Enterprise Agent Platform page. It is not offered by this lab.';

export function listProviders(fashnKeyConfigured: boolean, quality: Quality = 'standard'): ProviderChoice[] {
  const v16 = new FashnProvider('fashn-tryon-v1.6', 'FASHN Virtual Try-On v1.6', 'tryon-v1.6');
  const max = new FashnProvider('fashn-tryon-max', 'FASHN Try-On Max', 'tryon-max');
  const mock = new MockProvider();
  return [
    toChoice(mock, true, quality),
    toChoice(v16, fashnKeyConfigured, quality),
    toChoice(max, fashnKeyConfigured, quality),
    {
      id: 'google-virtual-try-on-001',
      label: 'Google virtual-try-on-001',
      model: 'virtual-try-on-001',
      availability: 'unavailable',
      unavailableReason: googleReason,
      imagesLeaveEnvironment: true,
      retentionSummary: 'Not used. No image is sent.',
      estimatedCostUsd: 0,
      credentialsConfigured: false,
    },
  ];
}

export function resolveProvider(id: string, scenario: MockScenario | null): TryOnProvider {
  if (id === 'mock') return new MockProvider(scenario ?? 'success');
  if (id === 'fashn-tryon-v1.6') return new FashnProvider(id, 'FASHN Virtual Try-On v1.6', 'tryon-v1.6');
  if (id === 'fashn-tryon-max') return new FashnProvider(id, 'FASHN Try-On Max', 'tryon-max');
  if (id === 'google-virtual-try-on-001') {
    throw new LabError(
      'provider_unavailable',
      'Google virtual-try-on-001 is deprecated for new work and is not callable from this lab.',
      400,
    );
  }
  throw new LabError('unknown_provider', `Unknown provider ${id}.`, 400);
}

function toChoice(provider: TryOnProvider, credentialsConfigured: boolean, quality: Quality): ProviderChoice {
  const credits = provider.estimatedCredits(quality);
  return {
    id: provider.id,
    label: provider.label,
    model: provider.model,
    availability: provider.availability,
    unavailableReason: provider.unavailableReason,
    imagesLeaveEnvironment: provider.imagesLeaveEnvironment,
    retentionSummary: provider.retentionSummary,
    estimatedCostUsd: roundUsd(credits * (provider.id === 'mock' ? 0 : FASHN_ON_DEMAND_USD_PER_CREDIT)),
    credentialsConfigured,
  };
}
