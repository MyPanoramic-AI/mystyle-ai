/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Persona-aware styling commentary for a finished virtual try-on.
 * Used as the client fallback (and mirrored on the server) when live AI is off.
 */

import type { StylistPersona, StylingSilhouetteId, UserProfile } from '../types';
import {
  resolveStylistPersona,
  stylistVoiceLabel,
} from './stylistPersona';

export type TryOnOpinionVerdict = 'flatters' | 'mixed' | 'miss';

export interface TryOnOpinionPiece {
  name: string;
  category?: string | null;
}

export interface TryOnOpinionInput {
  profile?: UserProfile | null;
  pieces: TryOnOpinionPiece[];
  view?: 'front' | 'back';
  demonstration?: boolean;
}

export interface TryOnOpinion {
  stylistName: string;
  voiceLabel: string;
  verdict: TryOnOpinionVerdict;
  headline: string;
  body: string;
  tips: string[];
  source: 'local' | 'live';
}

function silhouetteNote(id: StylingSilhouetteId | undefined, pieces: TryOnOpinionPiece[]): { score: number; line: string } {
  const joined = pieces.map((p) => `${p.name} ${p.category || ''}`).join(' ').toLowerCase();
  if (!id) {
    return { score: 0, line: 'Without a saved silhouette preference I am judging balance and proportion more loosely.' };
  }
  if (id === 'pear') {
    if (/skinny|bodycon|tight|pencil|hip.?hug/.test(joined)) {
      return { score: -2, line: 'This clings through the hip line. On a pear-leaning silhouette it can feel heavier than you want.' };
    }
    if (/a-line|wrap|bootcut|wide.?leg|flare|skirt/.test(joined)) {
      return { score: 2, line: 'This shape softens through the hip and keeps the eye balanced — that works with a pear-leaning silhouette.' };
    }
  }
  if (id === 'apple') {
    if (/empire|v-neck|wrap|open jacket|blazer|structured/.test(joined)) {
      return { score: 2, line: 'Open structure at the middle and a cleaner neckline help an apple-leaning silhouette look longer.' };
    }
    if (/crop|cling|tucked.?tight|bodycon/.test(joined)) {
      return { score: -2, line: 'A tight midsection can shorten the torso on an apple-leaning silhouette.' };
    }
  }
  if (id === 'hourglass') {
    if (/belt|wrap|fit.?flare|tailored|waisted/.test(joined)) {
      return { score: 2, line: 'A defined waist plays to an hourglass silhouette instead of hiding it.' };
    }
    if (/boxy|oversized|shapeless|straight column/.test(joined)) {
      return { score: -1, line: 'The boxy line softens your waist — fine if you want ease, weaker if you want shape.' };
    }
  }
  if (id === 'inverted-triangle') {
    if (/wide.?leg|a-line|full skirt|detail.*bottom|bootcut/.test(joined)) {
      return { score: 2, line: 'Volume or interest below balances broader shoulders — a good inverted-triangle move.' };
    }
    if (/shoulder pad|puff|boat neck|heavy shoulder/.test(joined)) {
      return { score: -2, line: 'Extra bulk at the shoulder works against an inverted-triangle balance.' };
    }
  }
  if (id === 'rectangle') {
    if (/belt|peplum|wrap|layer|contrast/.test(joined)) {
      return { score: 2, line: 'Texture and waist cues add shape on a straighter rectangle silhouette.' };
    }
  }
  return { score: 0, line: `Against your ${id.replace(/-/g, ' ')} preference, the cut is workable but not a standout match.` };
}

function colourClash(profile: UserProfile | null | undefined, pieces: TryOnOpinionPiece[]): string | null {
  const avoid = profile?.colours.avoidColors ?? [];
  if (!avoid.length) return null;
  const text = pieces.map((p) => p.name).join(' ').toLowerCase();
  const hit = avoid.find((colour) => text.includes(colour.toLowerCase().split(' ')[0]!));
  if (!hit) return null;
  return `You marked ${hit} as a colour to avoid — this look leans that way.`;
}

function styleAffinity(profile: UserProfile | null | undefined, pieces: TryOnOpinionPiece[]): { score: number; line: string } {
  const styles = profile?.styles ?? [];
  const text = pieces.map((p) => p.name).join(' ').toLowerCase();
  if (!styles.length) return { score: 0, line: 'Your aesthetic preferences are light, so I am reading the silhouette more than a style tribe.' };
  const classic = styles.some((s) => /classic|elegant|tailored|minimal/i.test(s));
  const bold = styles.some((s) => /bold|street|edgy|glam/i.test(s));
  if (classic && /satin|sequin|neon|logo|distressed/.test(text)) {
    return { score: -1, line: 'The flash level sits a little loud next to your more polished aesthetics.' };
  }
  if (classic && /tailor|blazer|wool|crepe|silk|trouser/.test(text) && !/bodycon|neon|sequin/.test(text)) {
    return { score: 2, line: 'The fabric and cut sit comfortably inside your classic / polished lane.' };
  }
  if (bold && /plain|basic tee|simple/.test(text)) {
    return { score: -1, line: 'It is safe — almost too quiet for the bolder aesthetics you favour.' };
  }
  return { score: 0, line: `It generally respects your ${styles.slice(0, 2).join(' & ')} direction.` };
}

function shoeComfortNote(profile: UserProfile | null | undefined, pieces: TryOnOpinionPiece[]): string | null {
  const shoes = pieces.find((p) => /shoe|heel|boot|sneaker|loafer|sandal/i.test(`${p.name} ${p.category || ''}`));
  if (!shoes) return null;
  const comfort = profile?.shoePreferences?.heelComfort;
  if (comfort === 'cannot-wear-heels' && /heel|stiletto|pump/i.test(shoes.name)) {
    return 'Those heels clash with your comfort rule — swap to a flat or block before you commit.';
  }
  if (comfort === 'low-heels-only' && /stiletto|high heel/i.test(shoes.name)) {
    return 'That heel height is above what you said you can wear day to day.';
  }
  return null;
}

function voiceWrap(persona: StylistPersona, verdict: TryOnOpinionVerdict, core: string, tips: string[]): { headline: string; body: string } {
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
  // warm-encouraging
  if (verdict === 'miss') return { headline: `${nameLead}: I would skip this one for you.`, body: `${core} You deserve a kinder cut.` };
  if (verdict === 'flatters') return { headline: `${nameLead}: this looks lovely on you.`, body: core };
  return { headline: `${nameLead}: good bones — one tweak will lift it.`, body: core };
}

export function buildLocalTryOnOpinion(input: TryOnOpinionInput): TryOnOpinion {
  const persona = resolveStylistPersona(input.profile ?? undefined);
  const pieces = input.pieces.length > 0 ? input.pieces : [{ name: 'this look' }];
  const silhouette = silhouetteNote(input.profile?.personal.bodyShape, pieces);
  const style = styleAffinity(input.profile, pieces);
  const clash = colourClash(input.profile, pieces);
  const shoe = shoeComfortNote(input.profile, pieces);

  let score = silhouette.score + style.score;
  if (clash) score -= 2;
  if (shoe) score -= 2;
  if (input.view === 'back') score += 0;

  const verdict: TryOnOpinionVerdict = score <= -2 ? 'miss' : score >= 2 ? 'flatters' : 'mixed';
  const tips: string[] = [];
  if (clash) tips.push(clash);
  if (shoe) tips.push(shoe);
  if (verdict !== 'flatters') {
    tips.push('Try a clearer waist cue, or swap the loudest piece for something softer in your palette.');
  } else {
    tips.push('Finish with a simple accessory so the silhouette stays the hero.');
  }
  if (input.demonstration) {
    tips.push('This is a demonstration image — treat the styling advice as guidance, not a fit guarantee.');
  }

  const coreParts = [silhouette.line, style.line];
  if (verdict === 'flatters' && /hip/i.test(silhouette.line)) {
    coreParts.push('It emphasises your hip line in a flattering way rather than fighting it.');
  }
  const core = coreParts.filter(Boolean).join(' ');
  const wrapped = voiceWrap(persona, verdict, core, tips);

  return {
    stylistName: persona.name,
    voiceLabel: stylistVoiceLabel(persona.voice),
    verdict,
    headline: wrapped.headline,
    body: wrapped.body,
    tips: tips.slice(0, 3),
    source: 'local',
  };
}
