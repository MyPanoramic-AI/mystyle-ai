/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Customer-facing garment descriptions for Virtual Fitting Room —
 * fabric hand-feel and silhouette suitability before AI try-on.
 */

import type { StylingSilhouetteId, UserProfile } from '../types';
import type { Product } from '../types/shop';

export interface GarmentStylingCopy {
  fabricLabel: string | null;
  fabricFeel: string;
  silhouetteNote: string;
  overview: string;
  bullets: string[];
}

export interface GarmentCopyInput {
  name: string;
  category?: string | null;
  fabric?: string | null;
  notes?: string | null;
  pairingNotes?: string | null;
  shortDescription?: string | null;
  longDescription?: string | null;
  stylingSuggestions?: string[];
  source?: 'wardrobe' | 'shop' | 'upload' | 'garment_reference';
  profile?: UserProfile | null;
}

function haystack(input: GarmentCopyInput): string {
  return [
    input.name,
    input.category,
    input.fabric,
    input.notes,
    input.pairingNotes,
    input.shortDescription,
    input.longDescription,
    ...(input.stylingSuggestions ?? []),
  ].filter(Boolean).join(' ').toLowerCase();
}

function fabricFeelFromText(text: string, fabricLabel: string | null): string {
  if (/silk|satin|charmeuse|sheen|gloss|shiny|lame|lamé/.test(text)) {
    return 'The fabric reads soft and shiny — it catches light and drapes close to the body.';
  }
  if (/velvet|velour/.test(text)) {
    return 'A plush, soft pile with a muted sheen — rich to the touch, not glassy-shiny.';
  }
  if (/linen|chambray/.test(text)) {
    return 'Breathable and soft-structured with a matte, lived-in finish — cool against the skin.';
  }
  if (/wool|tweed|flannel|cashmere|boucle|bouclé/.test(text)) {
    return 'Warm and structured with a soft hand — more polished matte than shiny.';
  }
  if (/leather|suede|nappa|patent/.test(text)) {
    return /patent|gloss/.test(text)
      ? 'Firm and polished with a glossy surface — sharp and statement-making.'
      : 'Firm and smooth with a soft sheen — structured rather than clingy.';
  }
  if (/denim|twill|canvas|rigid cotton/.test(text)) {
    return 'Sturdy and matte with a soft break-in feel — holds shape instead of floating.';
  }
  if (/chiffon|georgette|organza|voile/.test(text)) {
    return 'Floaty and soft with a light, airy hand — movement over structure.';
  }
  if (/crepe|jersey|knit|rib|modal|viscose|rayon/.test(text)) {
    return 'Soft with easy drape and a muted finish — comfortable, not high-shine.';
  }
  if (/cotton|poplin|oxford/.test(text)) {
    return 'Clean and soft with a crisp-to-matte hand — breathable everyday polish.';
  }
  if (fabricLabel) {
    return `Fabric listed as ${fabricLabel} — expect a soft, wearable hand with a natural finish.`;
  }
  return 'Hand-feel reads soft and wearable with a natural, non-glossy finish.';
}

function silhouetteNoteFor(profile: UserProfile | null | undefined, text: string, category?: string | null): string {
  const id = profile?.personal.bodyShape as StylingSilhouetteId | undefined;
  const label = profile?.personal.bodyShapeLabel;
  const cat = (category || '').toLowerCase();
  const joined = `${text} ${cat}`;

  if (!id) {
    return 'Save a silhouette preference in your profile for sharper body-type guidance before you try this on.';
  }

  const named = label || id.replace(/-/g, ' ');

  if (id === 'pear') {
    if (/skinny|bodycon|tight|pencil|hip.?hug/.test(joined)) {
      return `On a ${named} silhouette this may emphasise the hip line — balance it with volume or structure on top.`;
    }
    if (/a-line|wrap|bootcut|wide.?leg|flare|skirt|blazer|structured/.test(joined)) {
      return `This shape softens through the hip and keeps balance — a strong match for a ${named} silhouette.`;
    }
    return `For a ${named} silhouette, pair this with a defined shoulder or open neckline so the eye stays lifted.`;
  }

  if (id === 'apple') {
    if (/empire|wrap|v-neck|open neck|flowy|soft drape|a-line/.test(joined)) {
      return `Open structure and softer drape help a ${named} silhouette look longer and easier through the middle.`;
    }
    if (/bodycon|tight mid|belted tight|cling/.test(joined)) {
      return `A close midsection can shorten the torso on a ${named} silhouette — try a softer waist or open neckline.`;
    }
    return `On a ${named} silhouette, favour pieces that skim rather than squeeze through the middle.`;
  }

  if (id === 'hourglass') {
    if (/wrap|belt|fit.?and.?flare|defined waist|tailor/.test(joined)) {
      return `A defined waist plays to a ${named} silhouette instead of hiding your shape.`;
    }
    if (/boxy|oversized|shapeless/.test(joined)) {
      return `The boxier line softens your waist — fine for ease, weaker if you want to show a ${named} curve.`;
    }
    return `This can flatter a ${named} silhouette when the waist stays readable.`;
  }

  if (id === 'inverted-triangle') {
    if (/wide.?leg|a-line|skirt|soft volume|bootcut|flare/.test(joined)) {
      return `Softer volume below helps balance broader shoulders on an ${named} silhouette.`;
    }
    if (/strong shoulder|padded|structured blazer|boat neck/.test(joined)) {
      return `Extra shoulder structure can widen the top further on an ${named} silhouette — keep lower half intentional.`;
    }
    return `For an ${named} silhouette, keep the upper half cleaner and let the lower half carry shape.`;
  }

  if (id === 'rectangle') {
    if (/belt|wrap|peplum|texture|layer|ruffle|defined waist/.test(joined)) {
      return `Waist cues and texture add shape on a straighter ${named} silhouette.`;
    }
    return `On a ${named} silhouette, a belt, wrap, or layered finish will give this more definition.`;
  }

  return `Styled with your ${named} preference in mind — check proportion once you try it on.`;
}

function categoryOverview(name: string, category?: string | null): string {
  const cat = (category || '').toLowerCase();
  if (cat.includes('shoe') || /heel|sneaker|loafer|sandal|boot/.test(name.toLowerCase())) {
    return `${name} finishes the look from the ground up — notice heel height, toe shape, and how structured the upper feels.`;
  }
  if (cat.includes('bag') || /tote|clutch|crossbody/.test(name.toLowerCase())) {
    return `${name} is a finishing accessory — scale and texture should support the outfit, not fight it.`;
  }
  if (cat.includes('dress') || cat.includes('one')) {
    return `${name} is a one-piece hero — fabric drape and waist placement matter most before you generate a try-on.`;
  }
  if (cat.includes('outer') || /jacket|blazer|coat/.test(name.toLowerCase())) {
    return `${name} layers over your base — shoulder line and fabric weight decide whether it sharpens or softens the look.`;
  }
  if (cat.includes('bottom') || /pant|trouser|jean|skirt/.test(name.toLowerCase())) {
    return `${name} sets the lower proportion — rise, width, and fabric stiffness change how the silhouette reads.`;
  }
  return `${name} is ready for a virtual fitting — check fabric feel and how it may sit on your silhouette before you generate.`;
}

export function describeTryOnGarment(input: GarmentCopyInput): GarmentStylingCopy {
  const text = haystack(input);
  const fabricLabel = input.fabric?.trim() || null;
  const fabricFeel = fabricFeelFromText(text, fabricLabel);
  const silhouetteNote = silhouetteNoteFor(input.profile, text, input.category);
  const overview = (input.shortDescription?.trim()
    || input.longDescription?.trim()
    || input.notes?.trim()
    || categoryOverview(input.name, input.category));

  const bullets: string[] = [];
  if (fabricLabel) bullets.push(`Fabric: ${fabricLabel}`);
  bullets.push(fabricFeel);
  bullets.push(silhouetteNote);
  if (input.pairingNotes?.trim()) bullets.push(input.pairingNotes.trim());
  for (const tip of input.stylingSuggestions ?? []) {
    if (tip.trim()) bullets.push(tip.trim());
  }
  if (input.source === 'shop') {
    bullets.push('Shop demonstration listing — confirm colour and fabric in person when you buy.');
  }
  if (input.source === 'upload' || input.source === 'garment_reference') {
    bullets.push('Uploaded reference — descriptions are styling guidance inferred from the piece, not a lab fabric test.');
  }

  // Dedupe while preserving order
  const seen = new Set<string>();
  const unique = bullets.filter((line) => {
    const key = line.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 6);

  return {
    fabricLabel,
    fabricFeel,
    silhouetteNote,
    overview,
    bullets: unique,
  };
}

export function describeShopProduct(product: Product, profile?: UserProfile | null): GarmentStylingCopy {
  return describeTryOnGarment({
    name: product.name,
    category: product.category,
    shortDescription: product.shortDescription,
    longDescription: product.longDescription,
    stylingSuggestions: product.stylingSuggestions,
    source: 'shop',
    profile,
  });
}
