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
  },
  required: ['responseText', 'recommendationType', 'specialist', 'availability', 'outfitTitle', 'outfitComponents', 'suggestedColours', 'accessories', 'budgetGuidance', 'occasion', 'followUpQuestions', 'shoppingSearchIntent', 'tryOnIntent', 'savedLookIntent'],
};

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
      input: request.messages.map((message) => ({ role: message.role, content: message.text })),
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
    const controller = new AbortController();
    const started = Date.now();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetchImpl(call.url, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${this.apiKey}` },
        body: JSON.stringify(call.body),
        signal: controller.signal,
      });
      if (response.status === 401 || response.status === 403) throw Object.assign(new Error('provider_auth'), { code: 'provider_auth' });
      if (response.status === 429) throw Object.assign(new Error('provider_rate_limit'), { code: 'provider_rate_limit' });
      if (!response.ok) throw new Error('provider_status');
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
    } finally {
      clearTimeout(timer);
    }
  }
}
