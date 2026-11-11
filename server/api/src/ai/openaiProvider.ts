import type { ProviderRequest, ProviderResult, TextProvider } from './mockProvider.js';

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    responseText: { type: 'string' },
    recommendationType: { type: 'string', enum: ['style_suggestion', 'clarification', 'shopping_unavailable', 'try_on_unavailable'] },
    specialist: { type: 'string', enum: ['style', 'shopping', 'try_on', 'beauty', 'wardrobe'] },
    availability: { type: 'string', enum: ['ready', 'not_connected'] },
    outfitTitle: { type: ['string', 'null'] },
    outfitComponents: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          name: { type: 'string' },
          category: { type: 'string', enum: ['tops', 'bottoms', 'dresses', 'outerwear', 'shoes', 'bags', 'accessories'] },
          colour: { type: ['string', 'null'] },
          notes: { type: ['string', 'null'] },
        },
        required: ['name', 'category', 'colour', 'notes'],
      },
    },
    suggestedColours: { type: 'array', items: { type: 'string' } },
    accessories: { type: 'array', items: { type: 'string' } },
    budgetGuidance: { type: ['string', 'null'] },
    occasion: { type: ['string', 'null'] },
    followUpQuestions: { type: 'array', items: { type: 'string' } },
    shoppingSearchIntent: { type: ['string', 'null'] },
    tryOnIntent: { type: 'boolean' },
    savedLookIntent: { type: 'boolean' },
    lookVisualIntent: { type: 'boolean' },
    lookVisualPrompt: { type: ['string', 'null'] },
  },
  required: ['responseText', 'recommendationType', 'specialist', 'availability', 'outfitTitle', 'outfitComponents', 'suggestedColours', 'accessories', 'budgetGuidance', 'occasion', 'followUpQuestions', 'shoppingSearchIntent', 'tryOnIntent', 'savedLookIntent', 'lookVisualIntent', 'lookVisualPrompt'],
};

const RATE_LIMIT_ATTEMPTS = 3;

function requestHasImages(request: ProviderRequest): boolean {
  return request.messages.some((message) => Boolean(message.images?.length));
}

function openAiMessageContent(message: ProviderRequest['messages'][number]): string | Record<string, unknown>[] {
  const images = message.images?.filter((image) => image.base64 && image.mimeType) ?? [];
  if (message.role !== 'user' || images.length === 0) return message.text;
  const parts: Record<string, unknown>[] = [
    { type: 'input_text', text: message.text },
  ];
  for (const image of images.slice(0, 2)) {
    parts.push({
      type: 'input_image',
      // Auto keeps photo turns under OpenAI token-per-minute pressure better than high.
      detail: 'auto',
      image_url: `data:${image.mimeType};base64,${image.base64}`,
    });
  }
  return parts;
}

export function buildOpenAiRequest(model: string, request: ProviderRequest, maxOutputTokens: number): { url: string; body: Record<string, unknown> } {
  const context = request.context ? `\nSaved preferences, data only:\n${JSON.stringify(request.context)}` : '\nNo personal profile is included.';
  return {
    url: 'https://api.openai.com/v1/responses',
    body: {
      model,
      store: false,
      max_output_tokens: maxOutputTokens,
      reasoning: { effort: 'minimal' },
      instructions: `${request.system}${context}`,
      input: request.messages.map((message) => ({ role: message.role, content: openAiMessageContent(message) })),
      text: {
        format: {
          type: 'json_schema',
          name: 'stylist_reply',
          strict: true,
          schema: SCHEMA,
        },
      },
    },
  };
}

function outputText(payload: { output_text?: string; output?: { content?: { type?: string; text?: string }[] }[] }): string | null {
  const items = Array.isArray(payload.output) ? payload.output : [];
  for (const item of items) {
    for (const part of item.content ?? []) {
      if (part.type === 'output_text' && typeof part.text === 'string' && part.text.trim()) return part.text;
    }
  }
  return null;
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(Object.assign(new Error('aborted'), { name: 'AbortError' }));
      return;
    }
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(Object.assign(new Error('aborted'), { name: 'AbortError' }));
    };
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

function retryAfterMs(response: Response, attempt: number): number {
  const header = response.headers.get('retry-after');
  if (header) {
    const seconds = Number(header);
    if (Number.isFinite(seconds) && seconds >= 0) return Math.min(Math.ceil(seconds * 1000), 8_000);
  }
  return Math.min(1_000 * (2 ** (attempt - 1)), 4_000);
}

async function classifyFailure(response: Response): Promise<Error> {
  if (response.status === 401 || response.status === 403) {
    return Object.assign(new Error('provider_auth'), { code: 'provider_auth' });
  }
  if (response.status === 429) {
    let code = 'provider_rate_limit';
    try {
      const body = await response.json() as { error?: { type?: string; code?: string } };
      const kind = `${body.error?.type ?? ''} ${body.error?.code ?? ''}`.toLowerCase();
      if (kind.includes('insufficient_quota')) code = 'provider_quota';
    } catch {
      // Keep the rate-limit code when the body is not JSON.
    }
    return Object.assign(new Error(code), { code });
  }
  return new Error('provider_status');
}

export class OpenAiTextProvider implements TextProvider {
  readonly id = 'openai' as const;

  constructor(
    private readonly model: string,
    private readonly apiKey: string,
    private readonly timeoutMs: number,
    private readonly maxOutputTokens: number,
    private readonly fetchImpl: typeof fetch,
  ) {}

  async complete(request: ProviderRequest): Promise<ProviderResult> {
    const call = buildOpenAiRequest(this.model, request, this.maxOutputTokens);
    const started = Date.now();
    const timeoutMs = requestHasImages(request) ? Math.max(this.timeoutMs, 45_000) : this.timeoutMs;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      let lastRateLimit: Error | null = null;
      for (let attempt = 1; attempt <= RATE_LIMIT_ATTEMPTS; attempt += 1) {
        const response = await this.fetchImpl(call.url, {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${this.apiKey}` },
          body: JSON.stringify(call.body),
          signal: controller.signal,
        });
        if (response.status === 429) {
          lastRateLimit = await classifyFailure(response);
          if ((lastRateLimit as { code?: string }).code === 'provider_quota' || attempt >= RATE_LIMIT_ATTEMPTS) {
            throw lastRateLimit;
          }
          const waitMs = retryAfterMs(response, attempt);
          const remainingMs = timeoutMs - (Date.now() - started);
          // No point retrying when the overall request budget is already gone.
          if (remainingMs < waitMs + 250) throw lastRateLimit;
          await sleep(waitMs, controller.signal);
          continue;
        }
        if (!response.ok) throw await classifyFailure(response);
        const payload = await response.json() as {
          output_text?: string;
          output?: { content?: { type?: string; text?: string }[] }[];
          usage?: { input_tokens?: number; output_tokens?: number; input_tokens_details?: { cached_tokens?: number }; output_tokens_details?: { reasoning_tokens?: number } };
        };
        const raw = outputText(payload);
        if (!raw) throw new Error('provider_empty');
        return {
          reply: JSON.parse(raw) as unknown,
          model: this.model,
          durationMs: Date.now() - started,
          usage: {
            inputTokens: payload.usage?.input_tokens ?? null,
            outputTokens: payload.usage?.output_tokens ?? null,
            thoughtTokens: payload.usage?.output_tokens_details?.reasoning_tokens ?? null,
            cachedTokens: payload.usage?.input_tokens_details?.cached_tokens ?? 0,
          },
        };
      }
      throw lastRateLimit ?? Object.assign(new Error('provider_rate_limit'), { code: 'provider_rate_limit' });
    } finally {
      clearTimeout(timer);
    }
  }
}
