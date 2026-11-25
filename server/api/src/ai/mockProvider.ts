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
    outfitOptions: [],
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
      const photoOptions = [
        {
          title: 'Hero piece, polished-casual',
          whyItWorks: 'Keeps your uploaded garment central with soft structure.',
          components: [
            { name: 'Observed garment as hero', category: 'tops' as const, colour: null, notes: 'Keep the attached piece central.' },
            { name: 'Neutral tailored bottom', category: 'bottoms' as const, colour: 'stone', notes: 'Balances colour without competing.' },
            { name: 'Single metallic accent', category: 'accessories' as const, colour: 'gold', notes: 'One finish so the look stays intentional.' },
          ],
        },
        {
          title: 'Hero piece, sharper office edit',
          whyItWorks: 'Adds a blazer layer for meetings without losing the photo item.',
          components: [
            { name: 'Observed garment as hero', category: 'tops' as const, colour: null, notes: 'Still the focal point.' },
            { name: 'Straight navy trouser', category: 'bottoms' as const, colour: 'navy', notes: 'Clean line under the uploaded piece.' },
            { name: 'Unstructured blazer', category: 'outerwear' as const, colour: 'ivory', notes: 'Optional polish for work.' },
          ],
        },
        {
          title: 'Hero piece, weekend ease',
          whyItWorks: 'Relaxes proportion for daytime while keeping the photo item.',
          components: [
            { name: 'Observed garment as hero', category: 'tops' as const, colour: null, notes: 'Wear as-is from the photo.' },
            { name: 'Soft wide-leg or denim', category: 'bottoms' as const, colour: 'stone', notes: 'More movement for weekend.' },
            { name: 'Simple flat or trainer', category: 'shoes' as const, colour: 'white', notes: 'Keeps the finish casual.' },
          ],
        },
      ];
      return { durationMs: 0, model: null, usage: { inputTokens: null, outputTokens: null, thoughtTokens: null }, reply: reply({
        recommendationType: 'style_suggestion',
        responseText: `Looking at your photo: the piece reads clean and wearable.${colourNote}${avoidNote} Option 1 keeps it polished-casual with a neutral bottom and one metallic accent. Option 2 sharpens it with navy trousers and a soft blazer. Option 3 eases it for weekend with wider bottoms and a simple flat. Which direction fits the occasion?`,
        outfitTitle: photoOptions[0].title,
        outfitComponents: photoOptions[0].components,
        outfitOptions: photoOptions,
        suggestedColours: ['stone', 'ivory', 'navy'],
        followUpQuestions: ['Which of the three options feels closest?', 'Want shoe or accessory ideas for that look?'],
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
    if (/wardrobe|what i own|clothes i have|capsule|already own/.test(text)) {
      const wardrobe = personal?.wardrobePieces ?? [];
      const capsule = personal?.capsulePieces ?? [];
      if (!wardrobe.length) {
        const capsuleHint = capsule.length
          ? ` Your capsule checklist still lists basics to build toward (for example ${capsule[0]}), but those are not treated as owned until they are in Wardrobe.`
          : '';
        return { durationMs: 0, model: null, usage: { inputTokens: null, outputTokens: null, thoughtTokens: null }, reply: reply({
          specialist: 'wardrobe',
          availability: 'ready',
          recommendationType: 'clarification',
          responseText: `Your wardrobe is connected, but I do not see any owned pieces listed yet.${capsuleHint} Add what you already bought in Wardrobe, then ask again and I will style from what you own.`,
          followUpQuestions: ['Want three shop-oriented outfit ideas meanwhile?', 'Which occasion should we plan for once you add wardrobe pieces?'],
        }) };
      }
      const pick = (index: number) => wardrobe[index % wardrobe.length];
      const wardrobeOptions = [0, 1, 2].map((i) => {
        const anchor = pick(i);
        const second = pick(i + 1);
        const third = pick(i + 2);
        return {
          title: `Wardrobe mix ${i + 1}`,
          whyItWorks: 'Built from pieces already in your wardrobe.',
          components: [
            { name: `${anchor} (from your wardrobe)`, category: 'tops' as const, colour: null, notes: 'Owned piece.' },
            { name: `${second} (from your wardrobe)`, category: 'bottoms' as const, colour: null, notes: 'Pair with the first owned piece.' },
            { name: i === 2 && personal?.retailers?.length ? `Simple shoe from ${personal.retailers[0]}` : `${third} (from your wardrobe)`, category: 'shoes' as const, colour: null, notes: i === 2 ? 'Gap fill from a preferred shop if needed.' : 'Owned finishing piece when available.' },
          ],
        };
      });
      return { durationMs: 0, model: null, usage: { inputTokens: null, outputTokens: null, thoughtTokens: null }, reply: reply({
        specialist: 'wardrobe',
        availability: 'ready',
        recommendationType: 'style_suggestion',
        occasion: 'From your wardrobe',
        outfitTitle: wardrobeOptions[0].title,
        outfitComponents: wardrobeOptions[0].components,
        outfitOptions: wardrobeOptions,
        suggestedColours: personal?.favouriteColours?.slice(0, 3) ?? [],
        responseText: `Here are three outfits built from your wardrobe (what you already own).${colourNote} Option 1 starts with ${pick(0)}. Option 2 leans on ${pick(1)}. Option 3 centres ${pick(2)}. Capsule basics stay separate as pieces to build toward. Which mix feels right for today?`,
        followUpQuestions: ['Which option should we refine?', 'Want shoe or accessory ideas for that mix?'],
        shoppingSearchIntent: personal?.retailers?.length
          ? `wardrobe refresh finishing pieces ${personal.retailers.slice(0, 2).join(' ')}`
          : 'wardrobe finishing shoes accessories',
      }) };
    }
    if (/wedding/.test(text)) {
      const weddingOptions = [
        {
          title: 'Garden midi guest',
          whyItWorks: 'Breathable and guest-appropriate without matching the couple.',
          components: [
            { name: 'Midi dress in breathable fabric', category: 'dresses' as const, colour: 'champagne', notes: 'Choose a cut you already find comfortable.' },
            { name: 'Low or mid heel, or polished flat', category: 'shoes' as const, colour: 'neutral', notes: 'Skip a stiletto if you prefer comfort.' },
            { name: 'Fine gold earrings', category: 'accessories' as const, colour: 'soft gold', notes: 'One delicate finish.' },
          ],
        },
        {
          title: 'Tailored suit guest',
          whyItWorks: 'Polished for evening or cooler venues.',
          components: [
            { name: 'Tailored suit in light fabric', category: 'outerwear' as const, colour: 'sage', notes: 'Soft structure, not black-tie stiff.' },
            { name: 'Simple shell or blouse', category: 'tops' as const, colour: 'ivory', notes: 'Keeps the suit from feeling heavy.' },
            { name: 'Polished flat or low block', category: 'shoes' as const, colour: 'neutral', notes: 'Comfortable for standing.' },
          ],
        },
        {
          title: 'Separated elegant guest',
          whyItWorks: 'Mix-and-match pieces that still read formal enough.',
          components: [
            { name: 'Fluid blouse or wrap top', category: 'tops' as const, colour: 'champagne', notes: 'Soft drape for photos.' },
            { name: 'Wide or midi skirt', category: 'bottoms' as const, colour: 'sage', notes: 'Movement without a full gown.' },
            { name: 'Strappy flat or low heel', category: 'shoes' as const, colour: 'neutral', notes: 'Light finish for a garden setting.' },
          ],
        },
      ];
      return { durationMs: 0, model: null, usage: { inputTokens: null, outputTokens: null, thoughtTokens: null }, reply: reply({
        recommendationType: 'style_suggestion',
        occasion: 'Wedding',
        outfitTitle: weddingOptions[0].title,
        suggestedColours: ['champagne', 'sage', 'soft gold'],
        outfitComponents: weddingOptions[0].components,
        outfitOptions: weddingOptions,
        accessories: ['fine gold earrings'],
        responseText: `For a wedding, here are three guest looks.${colourNote}${avoidNote} Option 1: a champagne midi with a polished flat. Option 2: a sage tailored suit with an ivory shell. Option 3: champagne top with a sage midi skirt. Which direction feels right?`,
        followUpQuestions: asked(request.messages, 'daytime')
          ? ['Want different shoe or jewellery options for that guest look?']
          : ['Is the wedding daytime or evening?', 'Want shoe or accessory ideas next?'],
        shoppingSearchIntent: personal?.retailers?.length
          ? `wedding guest champagne sage ${personal.retailers.slice(0, 2).join(' ')}`
          : 'wedding guest champagne midi dress sage suit',
        budgetGuidance: personal?.budgetTier ? `Your saved budget band is ${personal.budgetTier}. This is a concept, not a price.` : null,
      }) };
    }
    if (/work|professional|smart-casual|office/.test(text)) {
      const workOptions = [
        {
          title: 'Easy smart-casual',
          whyItWorks: 'Professional without feeling formal.',
          components: [
            { name: 'Relaxed tailored trouser or dark jean', category: 'bottoms' as const, colour: 'navy', notes: 'Straight leg keeps it polished.' },
            { name: 'Knit polo or silk-touch shirt', category: 'tops' as const, colour: 'ivory', notes: 'Skip a stiff dress shirt if you want comfort.' },
            { name: 'Unstructured blazer', category: 'outerwear' as const, colour: 'stone', notes: 'Optional if the office is warm.' },
          ],
        },
        {
          title: 'Monochrome polish',
          whyItWorks: 'Clean lines read intentional in meetings.',
          components: [
            { name: 'Soft ivory knit', category: 'tops' as const, colour: 'ivory', notes: 'Quiet focal point.' },
            { name: 'Stone wide or straight trouser', category: 'bottoms' as const, colour: 'stone', notes: 'Same family as the top.' },
            { name: 'Leather loafer', category: 'shoes' as const, colour: 'navy', notes: 'Grounds the neutrals.' },
          ],
        },
        {
          title: 'Dress-and-layer desk look',
          whyItWorks: 'One piece base with a blazer for air-con offices.',
          components: [
            { name: 'Simple midi or shirt dress', category: 'dresses' as const, colour: 'navy', notes: 'Desk-to-dinner friendly.' },
            { name: 'Light cardigan or blazer', category: 'outerwear' as const, colour: 'ivory', notes: 'Layer when rooms run cold.' },
            { name: 'Low block or loafer', category: 'shoes' as const, colour: 'stone', notes: 'Comfort for a full day.' },
          ],
        },
      ];
      return { durationMs: 0, model: null, usage: { inputTokens: null, outputTokens: null, thoughtTokens: null }, reply: reply({
        recommendationType: 'style_suggestion',
        occasion: 'Work',
        outfitTitle: workOptions[0].title,
        suggestedColours: ['navy', 'ivory', 'stone'],
        outfitComponents: workOptions[0].components,
        outfitOptions: workOptions,
        responseText: `Here are three work looks.${colourNote}${avoidNote} Option 1: navy bottom, ivory knit, soft blazer. Option 2: ivory and stone monochrome with a loafer. Option 3: navy dress with a light layer. Which feels closest to your day? I can add shoe or accessory ideas once you pick one.${personal?.retailers?.length ? ` Tap Shop now to browse ${personal.retailers.slice(0, 2).join(' and ')}.` : ' Tap Shop now to browse matching listings.'}`,
        followUpQuestions: ['Which option feels closest?', 'Want shoe or accessory ideas for that look?'],
        shoppingSearchIntent: personal?.retailers?.length
          ? `smart casual work navy ivory ${personal.retailers.slice(0, 2).join(' ')}`
          : 'smart casual work navy ivory blazer',
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
      const partyOptions = [
        {
          title: 'Daytime linen birthday',
          whyItWorks: 'Light fabric stays comfortable and still looks dressed.',
          components: [
            { name: 'Linen shirt or blouse', category: 'tops' as const, colour: 'white', notes: 'Short sleeves if the day is hot.' },
            { name: 'Tailored short or flowing trouser', category: 'bottoms' as const, colour: 'sand', notes: 'Leave room to move.' },
            { name: 'Simple sandal', category: 'shoes' as const, colour: 'sand', notes: 'Easy for outdoor heat.' },
          ],
        },
        {
          title: 'Soft coral sundress',
          whyItWorks: 'One piece for heat with an easy party colour.',
          components: [
            { name: 'Light sundress or midi', category: 'dresses' as const, colour: 'coral', notes: 'Breathable day fabric.' },
            { name: 'Minimal flat or sandal', category: 'shoes' as const, colour: 'white', notes: 'Keeps the look airy.' },
            { name: 'Small crossbody or clutch', category: 'bags' as const, colour: 'sand', notes: 'Hands-free for mingling.' },
          ],
        },
        {
          title: 'White top, movement bottom',
          whyItWorks: 'Separates that photograph cleanly at a garden party.',
          components: [
            { name: 'Crisp white blouse', category: 'tops' as const, colour: 'white', notes: 'Fresh under sun.' },
            { name: 'Flowing sand skirt or trouser', category: 'bottoms' as const, colour: 'sand', notes: 'Movement for dancing.' },
            { name: 'Gold or shell earring', category: 'accessories' as const, colour: 'gold', notes: 'One bright accent.' },
          ],
        },
      ];
      return { durationMs: 0, model: null, usage: { inputTokens: null, outputTokens: null, thoughtTokens: null }, reply: reply({
        recommendationType: 'style_suggestion',
        occasion: 'Summer party',
        outfitTitle: partyOptions[0].title,
        suggestedColours: ['sand', 'coral', 'white'],
        outfitComponents: partyOptions[0].components,
        outfitOptions: partyOptions,
        responseText: 'For a summer birthday, here are three options. Option 1: white linen top with sand bottoms. Option 2: a soft coral sundress. Option 3: white blouse with a flowing sand skirt. Which vibe fits the party? I can suggest shoes or accessories next.',
        followUpQuestions: ['Which vibe fits the party?', 'Want shoe or accessory ideas next?'],
      }) };
    }
    if (/\b(shoes?|accessories|jewellery|jewelry|bag|belt|earrings?)\b/.test(text) && !/try[- ]?on|buy|price|in stock/.test(text)) {
      return { durationMs: 0, model: null, usage: { inputTokens: null, outputTokens: null, thoughtTokens: null }, reply: reply({
        recommendationType: 'style_suggestion',
        occasion: 'Outfit finishing',
        outfitTitle: 'Finishing pieces for your look',
        suggestedColours: ['navy', 'ivory', 'soft gold'],
        outfitComponents: [
          { name: 'Leather loafer or low block heel', category: 'shoes', colour: 'navy', notes: 'Polished without stealing focus from the outfit.' },
          { name: 'Structured mini bag or slim crossbody', category: 'bags', colour: 'ivory', notes: 'Keeps hands free and finishes the line.' },
          { name: 'Fine gold earrings or slim bracelet', category: 'accessories', colour: 'soft gold', notes: 'One metallic accent is enough.' },
        ],
        outfitOptions: [
          {
            title: 'Polished loafer finish',
            whyItWorks: 'Grounds most smart-casual outfits without a high heel.',
            components: [
              { name: 'Leather loafer', category: 'shoes', colour: 'navy', notes: 'Comfortable all-day finish.' },
              { name: 'Slim belt if the trouser needs shape', category: 'accessories', colour: 'navy', notes: 'Optional.' },
            ],
          },
          {
            title: 'Soft heel finish',
            whyItWorks: 'Lifts evening or guest looks without a stiletto.',
            components: [
              { name: 'Low block heel or elegant flat', category: 'shoes', colour: 'neutral', notes: 'Choose based on how long you will stand.' },
              { name: 'Fine gold earring', category: 'accessories', colour: 'soft gold', notes: 'Keeps the finish light.' },
            ],
          },
          {
            title: 'Bag-led finish',
            whyItWorks: 'Useful when you want a practical extra with the outfit.',
            components: [
              { name: 'Structured crossbody or mini tote', category: 'bags', colour: 'ivory', notes: 'Matches light neutrals.' },
              { name: 'Simple flat or trainer in a clean colour', category: 'shoes', colour: 'white', notes: 'If the day is more casual.' },
            ],
          },
        ],
        accessories: ['fine gold earrings', 'slim belt'],
        responseText: `Happy to finish the look.${colourNote}${avoidNote} Option 1: navy loafer with an optional slim belt. Option 2: a low block heel or elegant flat with fine gold earrings. Option 3: an ivory crossbody with a clean flat or trainer. Want jewellery, a different shoe height, or a bag tweak next?`,
        followUpQuestions: ['Want jewellery ideas too?', 'Should the shoes stay flat or go a little dressier?'],
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
