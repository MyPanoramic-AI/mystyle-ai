import type { StyleContext } from './context.js';
import type { StylistReply } from './schema.js';

export interface ProviderMessage {
  role: 'user' | 'assistant';
  text: string;
}

export interface ProviderRequest {
  system: string;
  messages: ProviderMessage[];
  context: StyleContext | null;
}

export interface ProviderUsage {
  inputTokens: number | null;
  outputTokens: number | null;
  thoughtTokens: number | null;
}

export interface TextProvider {
  readonly id: 'mock' | 'gemini';
  complete(request: ProviderRequest): Promise<{ reply: unknown; usage: ProviderUsage; model: string | null }>;
}

function reply(partial: Partial<StylistReply> & Pick<StylistReply, 'responseText' | 'recommendationType'>): StylistReply {
  return {
    specialist: 'style',
    availability: 'ready',
    source: 'mock',
    outfitTitle: null,
    outfitComponents: [],
    suggestedColours: [],
    accessories: [],
    budgetGuidance: null,
    occasion: null,
    followUpQuestions: [],
    shoppingSearchIntent: null,
    tryOnIntent: false,
    savedLookIntent: false,
    ...partial,
  };
}

function asked(history: ProviderMessage[], fragment: string): boolean {
  return history.some((message) => message.role === 'assistant' && message.text.toLowerCase().includes(fragment));
}

export class MockTextProvider implements TextProvider {
  readonly id = 'mock' as const;

  async complete(request: ProviderRequest): Promise<{ reply: StylistReply; usage: ProviderUsage; model: null }> {
    const latest = request.messages.filter((message) => message.role === 'user').at(-1)?.text ?? '';
    const text = latest.toLowerCase();
    const personal = request.context?.consent ? request.context : null;
    const colourNote = personal?.favouriteColours.length ? ` I kept ${personal.favouriteColours.slice(0, 2).join(' and ')} in mind.` : '';
    const avoidNote = personal?.avoidColours.length ? ` I left out ${personal.avoidColours[0]}.` : '';
    if (/try[- ]?on|photograph|photo of me/.test(text)) {
      return { model: null, usage: { inputTokens: null, outputTokens: null, thoughtTokens: null }, reply: reply({
        specialist: 'try_on',
        availability: 'not_connected',
        recommendationType: 'try_on_unavailable',
        tryOnIntent: true,
        responseText: 'Virtual try-on is not connected, so I cannot generate a photograph. I can still describe an outfit concept.',
      }) };
    }
    if (/buy|price|in stock|shop |retailer|superbalist|woolworths|link/.test(text)) {
      return { model: null, usage: { inputTokens: null, outputTokens: null, thoughtTokens: null }, reply: reply({
        specialist: 'shopping',
        availability: 'not_connected',
        recommendationType: 'shopping_unavailable',
        shoppingSearchIntent: latest.slice(0, 160),
        responseText: 'Verified retailer shopping is not connected. I have not searched a shop, and I do not have a live price or stock result.',
      }) };
    }
    if (/wardrobe|what i own|clothes i have/.test(text)) {
      return { model: null, usage: { inputTokens: null, outputTokens: null, thoughtTokens: null }, reply: reply({
        specialist: 'wardrobe',
        availability: 'not_connected',
        recommendationType: 'clarification',
        responseText: 'Your saved wardrobe is not connected to the stylist yet, so I will not pretend to know the clothes you own.',
        followUpQuestions: asked(request.messages, 'occasion') ? [] : ['Which occasion should I plan for?'],
      }) };
    }
    if (/wedding/.test(text)) {
      return { model: null, usage: { inputTokens: null, outputTokens: null, thoughtTokens: null }, reply: reply({
        recommendationType: 'style_suggestion',
        occasion: 'Wedding',
        outfitTitle: 'Garden wedding guest',
        suggestedColours: ['champagne', 'sage', 'soft gold'],
        outfitComponents: [
          { name: 'Midi dress or tailored suit in a breathable fabric', category: 'dresses', colour: 'champagne', notes: 'Choose the cut you already find comfortable.' },
          { name: 'Low or mid heel, or a polished flat', category: 'shoes', colour: 'neutral', notes: 'Skip a stiletto if you prefer comfort.' },
        ],
        accessories: ['fine gold earrings'],
        responseText: `For a wedding, a breathable midi or a tailored suit in champagne or sage reads guest-appropriate without trying to match the couple.${colourNote}${avoidNote}`,
        followUpQuestions: asked(request.messages, 'daytime') ? [] : ['Is the wedding daytime or evening?'],
        budgetGuidance: personal?.budgetTier ? `Your saved budget band is ${personal.budgetTier}. This is a concept, not a price.` : null,
      }) };
    }
    if (/work|professional|smart-casual|office/.test(text)) {
      return { model: null, usage: { inputTokens: null, outputTokens: null, thoughtTokens: null }, reply: reply({
        recommendationType: 'style_suggestion',
        occasion: 'Work',
        outfitTitle: 'Easy smart-casual',
        suggestedColours: ['navy', 'ivory', 'stone'],
        outfitComponents: [
          { name: 'Relaxed tailored trouser or dark jean', category: 'bottoms', colour: 'navy', notes: 'A straight leg keeps it polished.' },
          { name: 'Knit polo or silk-touch shirt', category: 'tops', colour: 'ivory', notes: 'Skip a stiff dress shirt if you want comfort.' },
          { name: 'Unstructured blazer', category: 'outerwear', colour: 'stone', notes: 'Optional if the office is warm.' },
        ],
        responseText: `A navy bottom with an ivory top and a soft blazer looks professional without feeling formal.${colourNote}${avoidNote}`,
      }) };
    }
    if (/navy/.test(text)) {
      return { model: null, usage: { inputTokens: null, outputTokens: null, thoughtTokens: null }, reply: reply({
        recommendationType: 'style_suggestion',
        suggestedColours: ['ivory', 'camel', 'soft white'],
        responseText: 'Navy sits well with ivory, camel, and soft white. A small gold or silver accessory is enough; you do not need a matching navy shoe.',
      }) };
    }
    if (/birthday|summer|party/.test(text)) {
      return { model: null, usage: { inputTokens: null, outputTokens: null, thoughtTokens: null }, reply: reply({
        recommendationType: 'style_suggestion',
        occasion: 'Summer party',
        outfitTitle: 'Daytime birthday',
        suggestedColours: ['sand', 'coral', 'white'],
        outfitComponents: [
          { name: 'Linen shirt or blouse', category: 'tops', colour: 'white', notes: 'Short sleeves if the day is hot.' },
          { name: 'Tailored short or flowing trouser', category: 'bottoms', colour: 'sand', notes: 'Leave room to move.' },
        ],
        responseText: 'For a summer birthday, linen and a light colour stay comfortable and still look dressed.',
      }) };
    }
    if (/r\s?1[,.]?500|budget|rands?/.test(text)) {
      return { model: null, usage: { inputTokens: null, outputTokens: null, thoughtTokens: null }, reply: reply({
        recommendationType: 'clarification',
        budgetGuidance: 'Plan one stronger piece and keep the other pieces simple. I cannot quote a shop price.',
        responseText: 'I can shape an outfit around the budget you named, but verified prices are not available yet.',
        followUpQuestions: asked(request.messages, 'occasion') ? [] : ['What is the occasion?'],
      }) };
    }
    if (/heel|comfort/.test(text)) {
      return { model: null, usage: { inputTokens: null, outputTokens: null, thoughtTokens: null }, reply: reply({
        recommendationType: 'style_suggestion',
        outfitComponents: [
          { name: 'Leather loafer or low block heel', category: 'shoes', colour: 'black', notes: 'A polished flat is a complete choice.' },
        ],
        responseText: 'You can skip high heels. A loafer or a low block keeps a smart outfit comfortable.',
      }) };
    }
    return { model: null, usage: { inputTokens: null, outputTokens: null, thoughtTokens: null }, reply: reply({
      recommendationType: 'clarification',
      responseText: 'Tell me the occasion, how formal it should feel, and whether comfort or a colour matters most. I will suggest an outfit concept, not a shop listing.',
      followUpQuestions: ['What is the occasion?'],
    }) };
  }
}
