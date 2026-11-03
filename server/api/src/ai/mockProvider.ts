import type { StyleContext } from './context.js';
import type { StylistReply } from './schema.js';

export interface ProviderImagePart {
  mimeType: string;
  base64: string;
}

export interface ProviderMessage {
  role: 'user' | 'assistant';
  text: string;
  /** Optional vision inputs for the latest user turn (OpenAI Responses input_image). */
  images?: ProviderImagePart[];
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
  cachedTokens?: number | null;
}

export interface ProviderResult {
  reply: unknown;
  usage: ProviderUsage;
  model: string | null;
  durationMs: number;
}

export interface TextProvider {
  readonly id: 'mock' | 'gemini' | 'openai';
  complete(request: ProviderRequest): Promise<ProviderResult>;
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
    lookVisualIntent: false,
    lookVisualPrompt: null,
    generatedMediaId: null,
    ...partial,
  };
}

function asked(history: ProviderMessage[], fragment: string): boolean {
  return history.some((message) => message.role === 'assistant' && message.text.toLowerCase().includes(fragment));
}

export class MockTextProvider implements TextProvider {
  readonly id = 'mock' as const;

  async complete(request: ProviderRequest): Promise<ProviderResult> {
    const latestMessage = request.messages.filter((message) => message.role === 'user').at(-1);
    const latest = latestMessage?.text ?? '';
    const text = latest.toLowerCase();
    const hasImage = Boolean(latestMessage?.images?.length);
    const personal = request.context?.consent ? request.context : null;
    const colourNote = personal?.favouriteColours.length ? ` I kept ${personal.favouriteColours.slice(0, 2).join(' and ')} in mind.` : '';
    const avoidNote = personal?.avoidColours.length ? ` I left out ${personal.avoidColours[0]}.` : '';
    if (/\b(generate|visuali[sz]e|show me (an? )?(image|picture|look)|create (an? )?(image|picture|look)|style my hair|change my hair|restyle|add accessories|make me look)\b/.test(text)) {
      return { durationMs: 0, model: null, usage: { inputTokens: null, outputTokens: null, thoughtTokens: null }, reply: reply({
        recommendationType: 'style_suggestion',
        lookVisualIntent: true,
        lookVisualPrompt: latest.slice(0, 700),
        responseText: hasImage
          ? `I would visualize those changes on your photo${colourNote}${avoidNote}. On the live stylist this becomes a look image; this demonstration reply stays text-only.`
          : `I would create a look visualization for that request${colourNote}${avoidNote}. Attach a photo (or save a profile portrait) on the live stylist so the image can keep your likeness.`,
        outfitTitle: 'Look visualization',
        accessories: ['statement earrings', 'structured bag'],
        followUpQuestions: ['Want a softer or bolder finish?', 'Should accessories stay minimal?'],
      }) };
    }
    if (hasImage) {
      return { durationMs: 0, model: null, usage: { inputTokens: null, outputTokens: null, thoughtTokens: null }, reply: reply({
        recommendationType: 'style_suggestion',
        responseText: `Looking at your photo: the piece reads clean and wearable, with a balanced proportion through the frame.${colourNote}${avoidNote} The overall look feels polished-casual — soft structure rather than stiff formality. Keep this item as the hero, add one refined neutral bottom, and finish with a single metallic accent so the outfit stays intentional. Tell me the occasion if you want a tighter edit.`,
        outfitTitle: 'Photo-led styling edit',
        outfitComponents: [
          { name: 'Observed garment as hero', category: 'tops', colour: null, notes: 'Keep the attached piece central; refine with proportion and accessories.' },
          { name: 'Neutral tailored bottom', category: 'bottoms', colour: 'stone', notes: 'Balances colour and keeps the focus on the uploaded piece.' },
        ],
        suggestedColours: ['stone', 'ivory', 'navy'],
        followUpQuestions: ['What occasion are you dressing for?', 'Do you want this more casual or more polished?'],
      }) };
    }
    if (/try[- ]?on|photograph|photo of me/.test(text)) {
      return { durationMs: 0, model: null, usage: { inputTokens: null, outputTokens: null, thoughtTokens: null }, reply: reply({
        specialist: 'try_on',
        availability: 'not_connected',
        recommendationType: 'try_on_unavailable',
        tryOnIntent: true,
        responseText: 'Virtual try-on is not connected, so I cannot generate a photograph. I can still describe an outfit concept.',
      }) };
    }
    if (/buy|price|in stock|shop |retailer|superbalist|woolworths|link/.test(text)) {
      return { durationMs: 0, model: null, usage: { inputTokens: null, outputTokens: null, thoughtTokens: null }, reply: reply({
        specialist: 'shopping',
        availability: 'not_connected',
        recommendationType: 'shopping_unavailable',
        shoppingSearchIntent: latest.slice(0, 160),
        responseText: 'Verified retailer shopping is not connected. I have not searched a shop, and I do not have a live price or stock result.',
      }) };
    }
    if (/wardrobe|what i own|clothes i have/.test(text)) {
      return { durationMs: 0, model: null, usage: { inputTokens: null, outputTokens: null, thoughtTokens: null }, reply: reply({
        specialist: 'wardrobe',
        availability: 'not_connected',
        recommendationType: 'clarification',
        responseText: 'Your saved wardrobe is not connected to the stylist yet, so I will not pretend to know the clothes you own.',
        followUpQuestions: asked(request.messages, 'occasion') ? [] : ['Which occasion should I plan for?'],
      }) };
    }
    if (/wedding/.test(text)) {
      return { durationMs: 0, model: null, usage: { inputTokens: null, outputTokens: null, thoughtTokens: null }, reply: reply({
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
      return { durationMs: 0, model: null, usage: { inputTokens: null, outputTokens: null, thoughtTokens: null }, reply: reply({
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
      return { durationMs: 0, model: null, usage: { inputTokens: null, outputTokens: null, thoughtTokens: null }, reply: reply({
        recommendationType: 'style_suggestion',
        suggestedColours: ['ivory', 'camel', 'soft white'],
        responseText: 'Navy sits well with ivory, camel, and soft white. A small gold or silver accessory is enough; you do not need a matching navy shoe.',
      }) };
    }
    if (/birthday|summer|party/.test(text)) {
      return { durationMs: 0, model: null, usage: { inputTokens: null, outputTokens: null, thoughtTokens: null }, reply: reply({
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
      return { durationMs: 0, model: null, usage: { inputTokens: null, outputTokens: null, thoughtTokens: null }, reply: reply({
        recommendationType: 'clarification',
        budgetGuidance: 'Plan one stronger piece and keep the other pieces simple. I cannot quote a shop price.',
        responseText: 'I can shape an outfit around the budget you named, but verified prices are not available yet.',
        followUpQuestions: asked(request.messages, 'occasion') ? [] : ['What is the occasion?'],
      }) };
    }
    if (/heel|comfort/.test(text)) {
      return { durationMs: 0, model: null, usage: { inputTokens: null, outputTokens: null, thoughtTokens: null }, reply: reply({
        recommendationType: 'style_suggestion',
        outfitComponents: [
          { name: 'Leather loafer or low block heel', category: 'shoes', colour: 'black', notes: 'A polished flat is a complete choice.' },
        ],
        responseText: 'You can skip high heels. A loafer or a low block keeps a smart outfit comfortable.',
      }) };
    }
    return { durationMs: 0, model: null, usage: { inputTokens: null, outputTokens: null, thoughtTokens: null }, reply: reply({
      recommendationType: 'clarification',
      responseText: 'Tell me the occasion, how formal it should feel, and whether comfort or a colour matters most. I will suggest an outfit concept, not a shop listing.',
      followUpQuestions: ['What is the occasion?'],
    }) };
  }
}
