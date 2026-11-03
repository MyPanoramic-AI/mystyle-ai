import { randomUUID } from 'node:crypto';
import { ApiError } from '../errors.js';
import type { Sql } from '../db.js';
import { getPreferences, getProfile } from '../domain/profiles.js';
import { resolvePersonaFromProfile, type StylistPersonaContext } from './context.js';
import { assertLiveAllowed } from './guards.js';
import type { StylistRuntime } from './service.js';

export type TryOnOpinionVerdict = 'flatters' | 'mixed' | 'miss';

export interface TryOnOpinionPiece {
  name: string;
  category?: string | null;
}

export interface TryOnOpinionResult {
  stylistName: string;
  voiceLabel: string;
  verdict: TryOnOpinionVerdict;
  headline: string;
  body: string;
  tips: string[];
  source: 'local' | 'live';
}

const VOICE_LABELS: Record<string, string> = {
  'warm-encouraging': 'Warm & encouraging',
  'direct-practical': 'Direct & practical',
  'witty-playful': 'Witty & playful',
  'polished-editorial': 'Polished & editorial',
  'calm-minimal': 'Calm & minimal',
};

function silhouetteNote(label: string | null, pieces: TryOnOpinionPiece[]): { score: number; line: string } {
  const joined = pieces.map((p) => `${p.name} ${p.category || ''}`).join(' ').toLowerCase();
  const id = (label || '').toLowerCase();
  if (!id) return { score: 0, line: 'Without a saved silhouette preference I am judging balance and proportion more loosely.' };
  if (id.includes('pear')) {
    if (/skinny|bodycon|tight|pencil|hip.?hug/.test(joined)) {
      return { score: -2, line: 'This clings through the hip line. On a pear-leaning silhouette it can feel heavier than you want.' };
    }
    if (/a-line|wrap|bootcut|wide.?leg|flare|skirt/.test(joined)) {
      return { score: 2, line: 'This shape softens through the hip and keeps the eye balanced — that works with a pear-leaning silhouette.' };
    }
  }
  if (id.includes('apple')) {
    if (/empire|v-neck|wrap|blazer|structured/.test(joined)) {
      return { score: 2, line: 'Open structure at the middle and a cleaner neckline help an apple-leaning silhouette look longer.' };
    }
    if (/crop|cling|bodycon/.test(joined)) {
      return { score: -2, line: 'A tight midsection can shorten the torso on an apple-leaning silhouette.' };
    }
  }
  if (id.includes('hourglass')) {
    if (/belt|wrap|fit.?flare|tailored|waisted/.test(joined)) {
      return { score: 2, line: 'A defined waist plays to an hourglass silhouette instead of hiding it.' };
    }
    if (/boxy|oversized|shapeless/.test(joined)) {
      return { score: -1, line: 'The boxy line softens your waist — fine if you want ease, weaker if you want shape.' };
    }
  }
  if (id.includes('inverted')) {
    if (/wide.?leg|a-line|full skirt|bootcut/.test(joined)) {
      return { score: 2, line: 'Volume below balances broader shoulders — a good inverted-triangle move.' };
    }
    if (/shoulder|puff|boat neck/.test(joined)) {
      return { score: -2, line: 'Extra bulk at the shoulder works against an inverted-triangle balance.' };
    }
  }
  if (id.includes('rectangle') && /belt|peplum|wrap|layer/.test(joined)) {
    return { score: 2, line: 'Texture and waist cues add shape on a straighter rectangle silhouette.' };
  }
  return { score: 0, line: `Against your ${label} preference, the cut is workable but not a standout match.` };
}

function styleAffinity(styles: string[], pieces: TryOnOpinionPiece[]): { score: number; line: string } {
  const text = pieces.map((p) => p.name).join(' ').toLowerCase();
  if (!styles.length) return { score: 0, line: 'Your aesthetic preferences are light, so I am reading the silhouette more than a style tribe.' };
  const classic = styles.some((s) => /classic|elegant|tailored|minimal/i.test(s));
  if (classic && /satin|sequin|neon|logo|distressed/.test(text)) {
    return { score: -1, line: 'The flash level sits a little loud next to your more polished aesthetics.' };
  }
  if (classic && /tailor|blazer|wool|crepe|silk|trouser/.test(text) && !/bodycon|neon|sequin/.test(text)) {
    return { score: 2, line: 'The fabric and cut sit comfortably inside your classic / polished lane.' };
  }
  return { score: 0, line: `It generally respects your ${styles.slice(0, 2).join(' & ')} direction.` };
}

function voiceWrap(persona: StylistPersonaContext, verdict: TryOnOpinionVerdict, core: string, tips: string[]): { headline: string; body: string } {
  const nameLead = persona.name;
  if (persona.voice === 'direct-practical') {
    if (verdict === 'miss') return { headline: `${nameLead}: this does not suit you.`, body: core };
    if (verdict === 'flatters') return { headline: `${nameLead}: keep this.`, body: core };
    return { headline: `${nameLead}: almost — fix one thing.`, body: core };
  }
  if (persona.voice === 'witty-playful') {
    if (verdict === 'miss') return { headline: `${nameLead}: cute idea, wrong plot twist.`, body: `${core} We can do better without the heartbreak.` };
    if (verdict === 'flatters') return { headline: `${nameLead}: this one earns a slow clap.`, body: core };
    return { headline: `${nameLead}: close, but not gallery-ready.`, body: core };
  }
  if (persona.voice === 'polished-editorial') {
    if (verdict === 'miss') return { headline: `${nameLead}: the line fights the frame.`, body: core };
    if (verdict === 'flatters') return { headline: `${nameLead}: composed, considered, and flattering.`, body: core };
    return { headline: `${nameLead}: promising, with one edit.`, body: core };
  }
  if (persona.voice === 'calm-minimal') {
    if (verdict === 'miss') return { headline: `${nameLead}: not this.`, body: core };
    if (verdict === 'flatters') return { headline: `${nameLead}: this works.`, body: core };
    return { headline: `${nameLead}: nearly.`, body: tips[0] ? `${core} ${tips[0]}` : core };
  }
  if (verdict === 'miss') return { headline: `${nameLead}: I would skip this one for you.`, body: `${core} You deserve a kinder cut.` };
  if (verdict === 'flatters') return { headline: `${nameLead}: this looks lovely on you.`, body: core };
  return { headline: `${nameLead}: good bones — one tweak will lift it.`, body: core };
}

export function buildLocalTryOnOpinion(profile: Record<string, unknown> | null, pieces: TryOnOpinionPiece[], demonstration: boolean): TryOnOpinionResult {
  const persona = resolvePersonaFromProfile(profile);
  const list = pieces.length > 0 ? pieces : [{ name: 'this look' }];
  const styles = Array.isArray(profile?.styles) ? profile!.styles.filter((s): s is string => typeof s === 'string') : [];
  const silhouetteLabel = typeof profile?.bodyShapeLabel === 'string'
    ? profile.bodyShapeLabel
    : (typeof profile?.bodyShape === 'string' ? profile.bodyShape : null);
  const silhouette = silhouetteNote(silhouetteLabel, list);
  const style = styleAffinity(styles, list);
  let score = silhouette.score + style.score;
  const tips: string[] = [];
  const avoid = Array.isArray(profile?.avoidColours) ? profile!.avoidColours.filter((s): s is string => typeof s === 'string') : [];
  const text = list.map((p) => p.name).join(' ').toLowerCase();
  const colourHit = avoid.find((colour) => text.includes(colour.toLowerCase().split(/\s+/)[0]!));
  if (colourHit) {
    score -= 2;
    tips.push(`You marked ${colourHit} as a colour to avoid — this look leans that way.`);
  }
  if (score <= -2 && tips.length === 0) tips.push('Try a clearer waist cue, or swap the loudest piece for something softer in your palette.');
  if (score >= 2) tips.push('Finish with a simple accessory so the silhouette stays the hero.');
  if (demonstration) tips.push('This is a demonstration image — treat the styling advice as guidance, not a fit guarantee.');
  const verdict: TryOnOpinionVerdict = score <= -2 ? 'miss' : score >= 2 ? 'flatters' : 'mixed';
  const coreParts = [silhouette.line, style.line];
  if (verdict === 'flatters' && /hip/i.test(silhouette.line)) {
    coreParts.push('It emphasises your hip line in a flattering way rather than fighting it.');
  }
  const wrapped = voiceWrap(persona, verdict, coreParts.join(' '), tips);
  return {
    stylistName: persona.name,
    voiceLabel: VOICE_LABELS[persona.voice] ?? persona.voice,
    verdict,
    headline: wrapped.headline,
    body: wrapped.body,
    tips: tips.slice(0, 3),
    source: 'local',
  };
}

const OPINION_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    verdict: { type: 'string', enum: ['flatters', 'mixed', 'miss'] },
    headline: { type: 'string' },
    body: { type: 'string' },
    tips: { type: 'array', items: { type: 'string' } },
  },
  required: ['verdict', 'headline', 'body', 'tips'],
};

function outputText(payload: { output?: { content?: { type?: string; text?: string }[] }[] }): string | null {
  for (const item of payload.output ?? []) {
    for (const part of item.content ?? []) {
      if (part.type === 'output_text' && typeof part.text === 'string' && part.text.trim()) return part.text;
    }
  }
  return null;
}

function spent(db: Sql, userId?: string): number {
  const row = userId
    ? db.prepare(`SELECT COALESCE(SUM(cost_usd), 0) AS spent FROM ai_usage WHERE user_id = ? AND request_status = 'succeeded'`).get(userId) as { spent: number }
    : db.prepare(`SELECT COALESCE(SUM(cost_usd), 0) AS spent FROM ai_usage WHERE request_status = 'succeeded'`).get() as { spent: number };
  return Number(row.spent);
}

function liveAttempts(db: Sql): number {
  const row = db.prepare(`SELECT COUNT(*) AS attempts FROM ai_usage WHERE provider IN ('gemini', 'openai') AND request_status IN ('succeeded', 'failed')`).get() as { attempts: number };
  return Number(row.attempts);
}

async function liveOpinion(
  runtime: StylistRuntime,
  userId: string,
  persona: StylistPersonaContext,
  profile: Record<string, unknown> | null,
  pieces: TryOnOpinionPiece[],
  view: string,
): Promise<TryOnOpinionResult | null> {
  if (runtime.config.provider !== 'openai' || !runtime.config.allowLive || !runtime.config.apiKey || !runtime.config.model) return null;

  const styles = Array.isArray(profile?.styles) ? profile!.styles.slice(0, 6) : [];
  const silhouette = typeof profile?.bodyShapeLabel === 'string' ? profile.bodyShapeLabel : profile?.bodyShape;
  const system = `You are ${persona.name}, a personal stylist giving a short, honest opinion on a virtual try-on result.
Speak in a ${persona.voice} voice. ${persona.gender === 'woman' ? 'Use she/her for yourself.' : persona.gender === 'man' ? 'Use he/him for yourself.' : 'Keep self-reference neutral.'}
Be specific and constructive. You may say a look does not suit them.
You may comment on silhouette balance using their saved preference only — do not invent measurements, diagnose the body, or rate attractiveness.
Do not invent retailer prices or product links.
Reply only as JSON matching the schema.`;

  const user = JSON.stringify({
    view,
    pieces,
    savedSilhouette: silhouette ?? null,
    styles,
    avoidColours: Array.isArray(profile?.avoidColours) ? profile!.avoidColours.slice(0, 8) : [],
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), runtime.config.timeoutMs);
  const started = Date.now();
  try {
    const response = await (runtime.fetchImpl ?? fetch)('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${runtime.config.apiKey}`,
      },
      body: JSON.stringify({
        model: runtime.config.model,
        store: false,
        max_output_tokens: Math.min(runtime.config.maxOutputTokens, 500),
        reasoning: { effort: 'minimal' },
        instructions: system,
        input: [{ role: 'user', content: `Give your try-on opinion for this look:\n${user}` }],
        text: {
          format: {
            type: 'json_schema',
            name: 'try_on_opinion',
            strict: true,
            schema: OPINION_SCHEMA,
          },
        },
      }),
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const payload = await response.json() as {
      output?: { content?: { type?: string; text?: string }[] }[];
      usage?: { input_tokens?: number; output_tokens?: number; input_tokens_details?: { cached_tokens?: number }; output_tokens_details?: { reasoning_tokens?: number } };
    };
    const raw = outputText(payload);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { verdict?: string; headline?: string; body?: string; tips?: unknown };
    if (parsed.verdict !== 'flatters' && parsed.verdict !== 'mixed' && parsed.verdict !== 'miss') return null;
    if (typeof parsed.headline !== 'string' || typeof parsed.body !== 'string') return null;
    const tips = Array.isArray(parsed.tips) ? parsed.tips.filter((t): t is string => typeof t === 'string').slice(0, 4) : [];

    if (
      payload.usage?.input_tokens != null
      && payload.usage?.output_tokens != null
      && runtime.config.inputUsdPerMillion != null
      && runtime.config.outputUsdPerMillion != null
    ) {
      const cached = payload.usage.input_tokens_details?.cached_tokens ?? 0;
      const fresh = Math.max(payload.usage.input_tokens - cached, 0);
      const cachedRate = runtime.config.cachedInputUsdPerMillion ?? runtime.config.inputUsdPerMillion;
      const costUsd = (fresh / 1_000_000) * runtime.config.inputUsdPerMillion
        + (cached / 1_000_000) * cachedRate
        + (payload.usage.output_tokens / 1_000_000) * runtime.config.outputUsdPerMillion;
      runtime.db.prepare(
        `INSERT INTO ai_usage (id, user_id, conversation_id, operation_type, provider, model, input_tokens, output_tokens, cost_usd, cost_status, request_status, created_at, duration_ms)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        randomUUID(),
        userId,
        null,
        'tryon_opinion',
        'openai',
        runtime.config.model,
        payload.usage.input_tokens,
        payload.usage.output_tokens,
        costUsd,
        'estimate',
        'succeeded',
        new Date(runtime.now()).toISOString(),
        Date.now() - started,
      );
    }

    return {
      stylistName: persona.name,
      voiceLabel: VOICE_LABELS[persona.voice] ?? persona.voice,
      verdict: parsed.verdict,
      headline: parsed.headline.slice(0, 160),
      body: parsed.body.slice(0, 800),
      tips,
      source: 'live',
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function tryOnOpinionForUser(
  runtime: StylistRuntime,
  userId: string,
  body: Record<string, unknown>,
): Promise<TryOnOpinionResult> {
  const piecesRaw = Array.isArray(body.pieces) ? body.pieces : [];
  const pieces: TryOnOpinionPiece[] = piecesRaw
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
    .map((item) => ({
      name: typeof item.name === 'string' ? item.name.slice(0, 80) : 'Garment',
      category: typeof item.category === 'string' ? item.category.slice(0, 40) : null,
    }))
    .slice(0, 8);
  if (pieces.length === 0) throw new ApiError('invalid_message', 'Provide at least one garment piece for an opinion.', 400);
  const view = body.view === 'back' ? 'back' : 'front';
  const demonstration = body.demonstration === true;

  let profile: Record<string, unknown> | null = null;
  try {
    const consent = getPreferences(runtime.db, userId).aiPersonalisationConsent === true;
    profile = getProfile(runtime.db, userId);
    if (!consent) {
      profile = {
        stylistPersona: profile.stylistPersona,
        stylistName: profile.stylistName,
        stylistGender: profile.stylistGender,
        stylistAgeVibe: profile.stylistAgeVibe,
        stylistVoice: profile.stylistVoice,
      };
    }
  } catch {
    profile = null;
  }

  const local = buildLocalTryOnOpinion(profile, pieces, demonstration);
  const liveReady = runtime.config.provider === 'openai'
    && runtime.config.allowLive
    && Boolean(runtime.config.apiKey)
    && Boolean(runtime.config.model)
    && runtime.config.inputUsdPerMillion != null
    && runtime.config.outputUsdPerMillion != null
    && runtime.config.maxBudgetUsd > 0
    && runtime.config.maxUserBudgetUsd > 0
    && runtime.config.maxLiveRequests > 0;

  if (!liveReady) return local;

  try {
    assertLiveAllowed(runtime.config, spent(runtime.db), spent(runtime.db, userId), liveAttempts(runtime.db));
  } catch {
    return local;
  }

  const persona = resolvePersonaFromProfile(profile);
  const live = await liveOpinion(runtime, userId, persona, profile, pieces, view);
  return live ?? local;
}
