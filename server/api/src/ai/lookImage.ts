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
  return /\b(generate|visuali[sz]e|show me|give me|send me|can you show|can you give|i want (to see|the picture|a picture|a photo|a look)|i just want the picture|show me what|create (an? )?(image|picture|look|photo)|render|picture of|photo of|image of|a picture|a photo|picture of me|photo of me|style my hair|change my hair|restyle( my hair)?|add accessories|with accessories|make me look|show (me )?how (it|this) (would|could) look|what (this|it|that|you) (would|are) look|what you are imagining)\b/.test(value);
}

/** True when the brief is mainly adding/swapping one finishing piece rather than a whole new outfit. */
export function isAdditiveLookEdit(text: string): boolean {
  const value = text.toLowerCase();
  if (/\b(add|adds|adding|put on|put onto|swap in|swap out|finish with|finish(?:ed)? by|and then add)\b/.test(value)) return true;
  if (/\b(?:with|wearing|in)\b.{0,20}\b(nude )?(pumps?|heels?|sandals?|flats?|loafers?|sneakers|boots?|bag|handbag|tote|hoops?|earrings?|necklace)\b/.test(value)) return true;
  if (/\bpair(?:ed)?\b.{0,24}\b(with|to)\b/.test(value)) return true;
  if (/\bchange (?:the )?(?:shoes?|footwear|heels?|pumps?|sandals?|bags?|handbag|jewell?ery|earrings?|necklace|belt|hat|jacket|blazer)\b/.test(value)) return true;
  if (/\bnude pumps?\b/.test(value)) return true;
  if (/\bon (?:her|his|the|their) feet\b/.test(value)) return true;
  return false;
}

const LOOK_COMPOSITION_RULES = [
  'OUTPUT REQUIREMENT: one complete full-body fashion photograph of a person standing head-to-toe in an outfit.',
  'FORBIDDEN: product photography, shoe-only or bag-only close-ups, floating accessories, catalogue cutouts, or redesigning the whole look into a single item.',
  'If the request only adds or swaps one piece (shoes, bag, jewellery, jacket, hair, makeup), keep every other garment, colour, and silhouette unchanged.',
  'Place additions correctly on the person: shoes laced/worn on both feet, bag held or worn, jewellery on ears/neck/wrists, jacket worn on the body.',
].join(' ');

/** Rewrite short “add X” briefs so image models cannot treat the item as the whole subject. */
export function normalizeLookBrief(input: {
  userText: string;
  modelPrompt: string | null;
  outfitContext?: string | null;
  additive: boolean;
}): string {
  const raw = (input.modelPrompt || input.userText).trim().slice(0, 700);
  const context = (input.outfitContext || '').trim().slice(0, 400);
  if (!input.additive) {
    return context ? `${raw} Base outfit to keep visible: ${context}` : raw;
  }
  const parts = [
    'Show the SAME full-body outfitted person as before.',
    'Keep the dress/top/bottom/outerwear exactly as they already appear.',
    `Only apply this finishing change: ${raw}`,
    'Example of correct result for shoes: the person still wears the same dress, now with the requested shoes clearly on their feet — not a photo of shoes alone.',
  ];
  if (context) parts.push(`Outfit that must remain visible: ${context}`);
  return parts.join(' ').slice(0, 900);
}

export function buildLookVisualPrompt(input: {
  userText: string;
  modelPrompt: string | null;
  hasReferencePhoto: boolean;
  /** Previous stylist look image is being edited (follow-up like “add nude pumps”). */
  hasPriorLook?: boolean;
  /** Prior outfit title/pieces so additive edits stay faithful even without a strong model brief. */
  outfitContext?: string | null;
}): string {
  const combined = `${input.userText} ${input.modelPrompt ?? ''} ${input.outfitContext ?? ''}`;
  const additive = isAdditiveLookEdit(combined) || Boolean(input.hasPriorLook && isAdditiveLookEdit(`${input.userText} ${input.modelPrompt ?? ''}`));
  const brief = normalizeLookBrief({
    userText: input.userText,
    modelPrompt: input.modelPrompt,
    outfitContext: input.outfitContext,
    additive: additive || Boolean(input.hasPriorLook),
  });
  const additiveHint = additive || input.hasPriorLook
    ? 'This is an additive edit of an existing look: preserve the existing outfit and only apply the requested addition or swap. Do not invent a new outfit concept.'
    : '';

  if (input.hasPriorLook) {
    return [
      'Edit the previous fashion look visualization image provided as the reference.',
      'Preserve the same person, pose, framing, garments, colours, and overall outfit unless the brief explicitly changes them.',
      'Apply ONLY the requested addition or change. The subject of the photo must remain the dressed person, never the added accessory alone.',
      LOOK_COMPOSITION_RULES,
      additiveHint,
      'Photorealistic editorial styling photo, natural lighting, South African fashion context.',
      'No logos, no retailer watermarks, no text overlays, no price tags.',
      `Styling request: ${brief}`,
    ].filter(Boolean).join(' ');
  }

  if (input.hasReferencePhoto) {
    return [
      "Edit this customer's photograph into a polished fashion look visualization.",
      'Keep the same person, face, body, and identity. Do not invent a different person.',
      'Apply the requested styling changes only (for example hair, accessories, makeup accents, shoes on the feet, or outfit finishing).',
      LOOK_COMPOSITION_RULES,
      additiveHint,
      'Photorealistic editorial styling photo, natural lighting, South African fashion context.',
      'No logos, no retailer watermarks, no text overlays, no price tags.',
      `Styling request: ${brief}`,
    ].filter(Boolean).join(' ');
  }

  return [
    'Create a photorealistic fashion look visualization for an adult customer.',
    LOOK_COMPOSITION_RULES,
    additiveHint,
    'South African fashion context, natural lighting, editorial quality.',
    'No logos, watermarks, or readable text.',
    `Styling request: ${brief}`,
  ].filter(Boolean).join(' ');
}

export async function generateLookImage(input: {
  config: AiConfig;
  prompt: string;
  referenceImages?: ProviderImagePart[];
  fetchImpl?: typeof fetch;
  /**
   * When true (default), failed image edits may fall back to text-only generation.
   * Set false for additive follow-ups so “add nude pumps” cannot become a shoe product shot.
   */
  allowTextFallback?: boolean;
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
    const parsePayload = async (response: Response): Promise<LookImageResult> => {
      if (response.status === 401 || response.status === 403) {
        throw Object.assign(new Error('provider_auth'), { code: 'provider_auth' });
      }
      if (response.status === 429) {
        throw Object.assign(new Error('provider_rate_limit'), { code: 'provider_rate_limit' });
      }
      if (!response.ok) {
        const detail = await response.text().catch(() => '');
        logEvent('look_image_provider_error', { status: response.status, detail: detail.slice(0, 240) }, 'warn');
        throw Object.assign(new Error('look_image_failed'), {
          code: 'look_image_failed',
          status: response.status,
          detail,
        });
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
    };

    const generateWithoutRefs = async (): Promise<LookImageResult> => {
      const response = await fetchImpl('https://api.openai.com/v1/images/generations', {
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
      return parsePayload(response);
    };

    if (!refs.length) {
      return await generateWithoutRefs();
    }

    // GPT Image edits require array syntax: image[]= for one or more references.
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
      form.append('image[]', blob, `reference-${index}.${extensionFor(image.mimeType || 'image/png')}`);
    }
    try {
      const response = await fetchImpl('https://api.openai.com/v1/images/edits', {
        method: 'POST',
        headers: { authorization: `Bearer ${apiKey}` },
        body: form,
        signal: controller.signal,
      });
      return await parsePayload(response);
    } catch (error) {
      // If reference edits fail (bad form, retired model quirks), fall back to text-only generation
      // so first-look requests still return a picture. Skip that for additive edits of a prior look —
      // text-only often turns “add nude pumps” into a product shot of shoes.
      const detail = error instanceof Error && 'detail' in error
        ? String((error as { detail?: string }).detail ?? '')
        : '';
      const code = error instanceof Error && 'code' in error ? String((error as { code?: string }).code) : '';
      if (code === 'provider_auth' || code === 'provider_rate_limit') throw error;
      if (input.allowTextFallback === false) {
        logEvent('look_image_edit_no_fallback', { code, detail: detail.slice(0, 160) }, 'warn');
        throw error;
      }
      logEvent('look_image_edit_fallback', { code, detail: detail.slice(0, 160) }, 'warn');
      return await generateWithoutRefs();
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;
    const code = error instanceof Error && 'code' in error ? String((error as { code?: string }).code) : 'look_image_failed';
    if (code === 'provider_auth') throw new ApiError('look_image_failed', 'Look visualization access was denied for this API key.', 503);
    if (code === 'provider_rate_limit') throw new ApiError('ai_provider_rate_limited', 'The stylist image service is busy. Try again shortly.', 429);
    throw new ApiError('look_image_failed', 'The stylist could not generate that look image.', 502);
  } finally {
    clearTimeout(timer);
  }
}

function spentWouldExceed(_config: AiConfig): boolean {
  // Budget checks are applied by the caller with DB spend; keep provider free of DB.
  return false;
}
