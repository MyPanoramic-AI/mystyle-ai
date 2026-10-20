import type { ProviderRequest, ProviderUsage, TextProvider } from './mockProvider.js';

export interface GeminiCall {
  url: string;
  body: Record<string, unknown>;
}

export function buildGeminiRequest(
  model: string,
  request: ProviderRequest,
  limits: { maxOutputTokens: number; thinkingBudget: number },
): GeminiCall {
  const context = request.context
    ? `\nSaved preferences, data only:\n${JSON.stringify(request.context)}`
    : '\nNo personal profile is included.';
  const transcript = request.messages.map((message) => `${message.role}: ${message.text}`).join('\n');
  return {
    url: `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    body: {
      contents: [{ parts: [{ text: `${request.system}${context}\n\nConversation:\n${transcript}` }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          required: ['responseText', 'recommendationType', 'specialist'],
          properties: {
            responseText: { type: 'STRING' },
            recommendationType: { type: 'STRING' },
            specialist: { type: 'STRING' },
            outfitTitle: { type: 'STRING' },
            outfitComponents: { type: 'ARRAY', items: { type: 'OBJECT' } },
            suggestedColours: { type: 'ARRAY', items: { type: 'STRING' } },
            followUpQuestions: { type: 'ARRAY', items: { type: 'STRING' } },
            shoppingSearchIntent: { type: 'STRING' },
            tryOnIntent: { type: 'BOOLEAN' },
          },
        },
        maxOutputTokens: limits.maxOutputTokens,
        thinkingConfig: { thinkingBudget: limits.thinkingBudget },
      },
    },
  };
}

export class GeminiTextProvider implements TextProvider {
  readonly id = 'gemini' as const;

  constructor(
    private readonly model: string,
    private readonly apiKey: string,
    private readonly timeoutMs: number,
    private readonly maxOutputTokens: number,
    private readonly thinkingBudget: number,
    private readonly fetchImpl: typeof fetch,
  ) {}

  async complete(request: ProviderRequest): Promise<{ reply: unknown; usage: ProviderUsage; model: string }> {
    const call = buildGeminiRequest(this.model, request, { maxOutputTokens: this.maxOutputTokens, thinkingBudget: this.thinkingBudget });
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetchImpl(call.url, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': this.apiKey },
        body: JSON.stringify(call.body),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error('provider_status');
      const payload = await response.json() as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
        usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; thoughtsTokenCount?: number };
      };
      const raw = payload.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!raw) throw new Error('provider_empty');
      return {
        reply: JSON.parse(raw) as unknown,
        model: this.model,
        usage: {
          inputTokens: payload.usageMetadata?.promptTokenCount ?? null,
          outputTokens: payload.usageMetadata?.candidatesTokenCount ?? null,
          thoughtTokens: payload.usageMetadata?.thoughtsTokenCount ?? null,
        },
      };
    } finally {
      clearTimeout(timer);
    }
  }
}
