import { ApiError, logEvent } from '../errors.js';
import type { AiConfig } from './aiConfig.js';
import type { ProviderImagePart } from './mockProvider.js';

export interface LookImageResult {
  bytes: Buffer;
  contentType: 'image/png' | 'image/jpeg' | 'image/webp';
  model: string;
  durationMs: number;
  usage: { inputTokens: number | null; outputTokens: number | null; totalTokens: number | null };
}

function extensionFor(mimeType: string): string {
  if (mimeType.includes('jpeg') || mimeType.includes('jpg')) return 'jpg';
  if (mimeType.includes('webp')) return 'webp';
  return 'png';
}

function contentTypeFromFormat(format: string | undefined): LookImageResult['contentType'] {
  if (format === 'jpeg') return 'image/jpeg';
  if (format === 'webp') return 'image/webp';
  return 'image/png';
}

export function wantsLookVisualization(text: string, modelIntent: boolean): boolean {
  if (modelIntent) return true;
  const value = text.toLowerCase();
  return /\b(generate|visuali[sz]e|show me (an? )?(image|picture|look|photo)|create (an? )?(image|picture|look)|render|picture of me|photo of me|style my hair|change my hair|restyle( my hair)?|add accessories|with accessories|make me look|show (me )?how (it|this) (would|could) look)\b/.test(value);
}

export function buildLookVisualPrompt(input: {
  userText: string;
  modelPrompt: string | null;
  hasReferencePhoto: boolean;
}): string {
  const brief = (input.modelPrompt || input.userText).trim().slice(0, 700);
  if (input.hasReferencePhoto) {
    return [
      "Edit this customer's photograph into a polished fashion look visualization.",
      'Keep the same person, face, body, and identity. Do not invent a different person.',
      'Apply the requested styling changes only (for example hair, accessories, makeup accents, or outfit finishing).',
      'Photorealistic editorial styling photo, natural lighting, South African fashion context.',
      'No logos, no retailer watermarks, no text overlays, no price tags.',
      `Styling request: ${brief}`,
    ].join(' ');
  }
  return [
    'Create a photorealistic fashion look visualization for an adult customer.',
    'Show the full styled look clearly. No logos, watermarks, or readable text.',
    'South African fashion context, natural lighting, editorial quality.',
    `Styling request: ${brief}`,
  ].join(' ');
}

export async function generateLookImage(input: {
  config: AiConfig;
  prompt: string;
  referenceImages?: ProviderImagePart[];
  fetchImpl?: typeof fetch;
}): Promise<LookImageResult> {
  const apiKey = input.config.apiKey;
  if (!input.config.lookImageAllowLive || input.config.provider !== 'openai' || !apiKey) {
    throw new ApiError('look_image_disabled', 'Look visualization is not enabled on this server.', 503);
  }
  if (spentWouldExceed(input.config)) {
    throw new ApiError('ai_budget_exhausted', 'The stylist image budget has been reached.', 429);
  }

  const fetchImpl = input.fetchImpl ?? fetch;
  const model = input.config.lookImageModel;
  const started = Date.now();
  const refs = (input.referenceImages ?? []).slice(0, 2);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), input.config.lookImageTimeoutMs);

  try {
    let response: Response;
    if (refs.length) {
      const form = new FormData();
      form.set('model', model);
      form.set('prompt', input.prompt.slice(0, 3200));
      form.set('size', '1024x1536');
      form.set('quality', input.config.lookImageQuality);
      form.set('output_format', 'png');
      form.set('input_fidelity', 'high');
      for (const [index, image] of refs.entries()) {
        const bytes = Buffer.from(image.base64, 'base64');
        const blob = new Blob([Uint8Array.from(bytes)], { type: image.mimeType || 'image/png' });
        form.append('image', blob, `reference-${index}.${extensionFor(image.mimeType || 'image/png')}`);
      }
      response = await fetchImpl('https://api.openai.com/v1/images/edits', {
        method: 'POST',
        headers: { authorization: `Bearer ${apiKey}` },
        body: form,
        signal: controller.signal,
      });
    } else {
      response = await fetchImpl('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${apiKey}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model,
          prompt: input.prompt.slice(0, 3200),
          size: '1024x1536',
          quality: input.config.lookImageQuality,
          output_format: 'png',
        }),
        signal: controller.signal,
      });
    }

    if (response.status === 401 || response.status === 403) {
      throw Object.assign(new Error('provider_auth'), { code: 'provider_auth' });
    }
    if (response.status === 429) {
      throw Object.assign(new Error('provider_rate_limit'), { code: 'provider_rate_limit' });
    }
    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      logEvent('look_image_provider_error', { status: response.status, detail: detail.slice(0, 200) }, 'warn');
      throw new ApiError('look_image_failed', 'The stylist could not generate that look image.', 502);
    }

    const payload = await response.json() as {
      data?: { b64_json?: string }[];
      output_format?: string;
      usage?: { input_tokens?: number; output_tokens?: number; total_tokens?: number };
    };
    const b64 = payload.data?.[0]?.b64_json;
    if (!b64) throw new ApiError('look_image_failed', 'The stylist image response was empty.', 502);
    return {
      bytes: Buffer.from(b64, 'base64'),
      contentType: contentTypeFromFormat(payload.output_format),
      model,
      durationMs: Date.now() - started,
      usage: {
        inputTokens: payload.usage?.input_tokens ?? null,
        outputTokens: payload.usage?.output_tokens ?? null,
        totalTokens: payload.usage?.total_tokens ?? null,
      },
    };
  } finally {
    clearTimeout(timer);
  }
}

function spentWouldExceed(_config: AiConfig): boolean {
  // Budget checks are applied by the caller with DB spend; keep provider free of DB.
  return false;
}
