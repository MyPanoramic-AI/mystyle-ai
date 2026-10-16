import { LabError, redact } from '../errors.js';
import { FASHN_ON_DEMAND_USD_PER_CREDIT } from '../config.js';
import type { GarmentCategory, ImageFormat, Quality } from '../types.js';
import { inspectImage } from '../validation/images.js';
import type { ProviderRunInput, ProviderRunResult, ProviderRuntime, TryOnProvider } from './types.js';

const ALLOWED_OUTPUT_HOSTS = new Set(['cdn.fashn.ai', 'media.fashn.ai']);

export type FashnModel = 'tryon-v1.6' | 'tryon-max';

export function fashnCredits(model: FashnModel, quality: Quality): number {
  if (model === 'tryon-v1.6') return 1;
  if (quality === 'draft') return 1;
  if (quality === 'high') return 3;
  return 2;
}

export function buildFashnBody(model: FashnModel, input: ProviderRunInput): Record<string, unknown> {
  const person = dataUri(input.personFormat, input.person);
  const garment = dataUri(input.garmentFormat, input.garment);
  if (model === 'tryon-v1.6') {
    return {
      model_name: 'tryon-v1.6',
      inputs: {
        model_image: person,
        garment_image: garment,
        category: fashnCategory(input.category),
        mode: v16Mode(input.quality),
        num_samples: 1,
        output_format: 'png',
        return_base64: true,
      },
    };
  }
  return {
    model_name: 'tryon-max',
    inputs: {
      model_image: person,
      product_image: garment,
      generation_mode: maxMode(input.quality),
      resolution: '1k',
      num_images: 1,
      output_format: 'png',
      return_base64: true,
    },
  };
}

export class FashnProvider implements TryOnProvider {
  readonly availability = 'ready' as const;
  readonly imagesLeaveEnvironment = true;
  readonly retentionSummary =
    'Images are sent to FASHN as data URIs. FASHN documents that base64 inputs are deleted when processing finishes, with a one-day cleanup backstop. Request records are not deleted automatically. Base64 outputs stay available for 60 minutes. There is no deletion API.';

  constructor(
    readonly id: string,
    readonly label: string,
    readonly model: FashnModel,
  ) {}

  estimatedCredits(quality: Quality): number {
    return fashnCredits(this.model, quality);
  }

  async run(input: ProviderRunInput, runtime: ProviderRuntime): Promise<ProviderRunResult> {
    if (!runtime.apiKey) {
      throw new LabError('missing_api_key', 'FASHN_API_KEY is not configured on the server.', 400, false);
    }
    const started = runtime.now();
    const body = buildFashnBody(this.model, input);
    const created = await this.request(runtime, '/run', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    const providerJobId = stringField(created.json, 'id');
    if (!providerJobId) {
      throw new LabError('provider_error', 'FASHN did not return a prediction id.', 502, false);
    }
    while (runtime.now() - started < runtime.timeoutMs) {
      const status = await this.request(runtime, `/status/${encodeURIComponent(providerJobId)}`, { method: 'GET' });
      const state = stringField(status.json, 'status');
      if (state === 'completed') {
        const output = await readOutput(status.json, runtime);
        const credits = status.credits;
        return {
          providerJobId,
          outputBytes: output,
          actualCredits: credits,
          actualCostUsd: credits === null ? null : roundUsd(credits * FASHN_ON_DEMAND_USD_PER_CREDIT),
        };
      }
      if (state === 'failed') {
        throw new LabError('provider_error', fashnFailure(status.json, runtime.apiKey), 502, false);
      }
      await runtime.sleep(runtime.pollIntervalMs);
    }
    throw new LabError('timeout', 'FASHN did not finish before the lab timeout.', 504, true);
  }

  private async request(
    runtime: ProviderRuntime,
    pathname: string,
    init: RequestInit,
  ): Promise<{ json: Record<string, unknown>; credits: number | null }> {
    const response = await runtime.fetchImpl(`${runtime.baseUrl}${pathname}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${runtime.apiKey}`,
        'Content-Type': 'application/json',
      },
      redirect: 'manual',
    });
    const text = await response.text();
    const creditsRaw = response.headers.get('x-fashn-credits-used');
    const credits = creditsRaw !== null && Number.isFinite(Number(creditsRaw)) ? Number(creditsRaw) : null;
    if (response.status === 429) {
      throw new LabError('rate_limit', 'FASHN rate limited the request.', 429, true);
    }
    if (response.status === 401 || response.status === 403) {
      throw new LabError('invalid_credentials', 'FASHN rejected the API credential.', 401, false);
    }
    if (!response.ok) {
      throw new LabError(
        'provider_error',
        redact(text, [runtime.apiKey ?? '']).slice(0, 180) || 'FASHN request failed.',
        502,
        false,
      );
    }
    return { json: text ? (JSON.parse(text) as Record<string, unknown>) : {}, credits };
  }
}

function dataUri(format: ImageFormat, bytes: Buffer): string {
  const mime = format === 'jpeg' ? 'image/jpeg' : format === 'png' ? 'image/png' : 'image/webp';
  return `data:${mime};base64,${bytes.toString('base64')}`;
}

function fashnCategory(category: GarmentCategory): 'tops' | 'bottoms' | 'one-pieces' | 'auto' {
  if (category === 'outerwear') return 'tops';
  return category;
}

function v16Mode(quality: Quality): 'performance' | 'balanced' | 'quality' {
  if (quality === 'draft') return 'performance';
  if (quality === 'high') return 'quality';
  return 'balanced';
}

function maxMode(quality: Quality): 'fast' | 'balanced' | 'quality' {
  if (quality === 'draft') return 'fast';
  if (quality === 'high') return 'quality';
  return 'balanced';
}

function stringField(value: Record<string, unknown>, key: string): string | null {
  const found = value[key];
  return typeof found === 'string' ? found : null;
}

function fashnFailure(status: Record<string, unknown>, apiKey: string): string {
  const error = status.error;
  const message =
    error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
      ? error.message
      : 'FASHN reported a failed generation.';
  return redact(message, [apiKey]);
}

async function readOutput(status: Record<string, unknown>, runtime: ProviderRuntime): Promise<Buffer> {
  const output = status.output;
  const first = Array.isArray(output) ? output[0] : null;
  if (typeof first !== 'string') {
    throw new LabError('invalid_output', 'FASHN completed without an image payload.', 502, false);
  }
  if (first.startsWith('data:')) {
    const encoded = /^data:[^;,]+;base64,([a-z0-9+/=\r\n]+)$/i.exec(first)?.[1];
    if (!encoded) throw new LabError('invalid_output', 'FASHN returned an unreadable data URI.', 502, false);
    return Buffer.from(encoded.replace(/\s/g, ''), 'base64');
  }
  let url: URL;
  try {
    url = new URL(first);
  } catch {
    throw new LabError('invalid_output', 'FASHN returned an output reference that is not a URL.', 502, false);
  }
  if (url.protocol !== 'https:' || !ALLOWED_OUTPUT_HOSTS.has(url.hostname)) {
    throw new LabError('invalid_output', 'FASHN returned an output host this lab will not download.', 502, false);
  }
  const response = await runtime.fetchImpl(url, { redirect: 'manual' });
  if (!response.ok) {
    throw new LabError('invalid_output', 'The FASHN output could not be downloaded.', 502, false);
  }
  return Buffer.from(await response.arrayBuffer());
}

export function assertOutputImage(bytes: Buffer): void {
  inspectImage(bytes);
}

export function roundUsd(value: number): number {
  return Math.round(value * 10000) / 10000;
}
