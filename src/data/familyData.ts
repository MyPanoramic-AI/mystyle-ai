/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Curated demonstration data for Family Profiles & Coordinated Family Styling.
 * Includes occasion presets, harmonised colour palettes, and coordinated outfit concepts.
 */

import {
  OccasionType,
  FormalityLevel,
  StyleDirection,
  ColorPaletteOption,
  FamilyOutfitConcept,
} from '../types/family';

export interface OccasionConfig {
  type: OccasionType;
  title: string;
  subtitle: string;
  defaultFormality: FormalityLevel;
  suggestedBudgetZar: number;
  description: string;
  imageUrl: string;
}

export const OCCASION_CONFIGS: OccasionConfig[] = [
  {
    type: 'Family Photoshoot',
    title: 'Family Photoshoot',
    subtitle: 'Golden hour portraits & fine art family memories',
    defaultFormality: 'Smart Casual',
    suggestedBudgetZar: 6500,
    description: 'Soft cohesive tones without loud logos or jarring contrasts that distract from natural expressions.',
    imageUrl: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=900&q=80',
  },
  {
    type: 'Wedding',
    title: 'Wedding Guest Celebration',
    subtitle: 'Elegant ceremony & evening reception',
    defaultFormality: 'Formal',
    suggestedBudgetZar: 12000,
    description: 'Elevated formal silhouettes tailored to ceremony dress codes while keeping children comfortable throughout.',
    imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80',
  },
  {
    type: 'Holiday',
    title: 'Holiday & Resort Getaway',
    subtitle: 'Sun-drenched coastal dinners & leisure excursions',
    defaultFormality: 'Relaxed & Comfortable' as unknown as FormalityLevel,
    suggestedBudgetZar: 8000,
    description: 'Breathable linens, fluid silks, and sun-safe cottons for effortless luxury under the African sun.',
    imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=900&q=80',
  },
  {
    type: 'Birthday Celebration',
    title: 'Milestone Birthday Party',
    subtitle: 'Vibrant celebratory gathering with friends & family',
    defaultFormality: 'Smart Casual',
    suggestedBudgetZar: 5500,
    description: 'Playful yet polished festive attire that shines in both indoor and outdoor garden environments.',
    imageUrl: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=900&q=80',
  },
  {
    type: 'Family Dinner',
    title: 'Celebratory Family Dinner',
    subtitle: 'Intimate evening dining & private celebrations',
    defaultFormality: 'Semi-Formal',
    suggestedBudgetZar: 4800,
    description: 'Refined semi-formal tailoring and sophisticated knitwear suitable for upscale restaurant settings.',
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80',
  },
  {
    type: 'Christmas Celebration',
    title: 'Festive Holiday Celebration',
    subtitle: 'Warm family tradition & celebratory luncheon',
    defaultFormality: 'Smart Casual',
    suggestedBudgetZar: 7200,
    description: 'Joyful seasonal harmony with refined festive accents that look enchanting around the family table.',
    imageUrl: 'https://images.unsplash.com/photo-1512389142860-9c449e58a543?auto=format&fit=crop&w=900&q=80',
  },
  {
    type: 'Graduation',
    title: 'Academic Graduation Ceremony',
    subtitle: 'Proud milestone achievement & commencement',
    defaultFormality: 'Semi-Formal',
    suggestedBudgetZar: 6000,
    description: 'Distinguished and respectful tailored looks worthy of memorable stage photographs.',
    imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80',
  },
  {
    type: 'Casual Weekend Outing',
    title: 'Weekend Market & Vineyard',
    subtitle: 'Relaxed artisan markets, picnics & wine estate strolls',
    defaultFormality: 'Casual',
    suggestedBudgetZar: 3500,
    description: 'Easy, movement-friendly pieces with effortless chic style for all ages.',
    imageUrl: 'https://images.unsplash.com/photo-1506152983158-b4a74a01c721?auto=format&fit=crop&w=900&q=80',
  },
];

export const CURATED_PALETTES: ColorPaletteOption[] = [
  {
    id: 'palette-coastal-sage',
    name: 'Coastal Neutrals & Sage',
    colors: ['#8A9A86', '#E8E1D5', '#D2BBA0', '#FAF7F2'],
    description: 'Soft sage greens, warm oat, and cream create an airy, tranquil harmony that flatters all skin tones.',
    recommendedFor: ['Family Photoshoot', 'Wedding', 'Holiday', 'Casual Weekend Outing'],
  },
  {
    id: 'palette-navy-camel',
    name: 'Navy, Crisp White & Camel',
    colors: ['#1B2A4A', '#FFFFFF', '#C19A6B', '#D5B07B'],
    description: 'Timeless architectural refinement. Deep navy grounds the look, while white and camel add warm contrast.',
    recommendedFor: ['Wedding', 'Family Dinner', 'Graduation', 'Family Photoshoot'],
  },
  {
    id: 'palette-terracotta-rose',
    name: 'Sunset Terracotta & Warm Rose',
    colors: ['#C46851', '#D49B8E', '#EAD8C7', '#633B31'],
    description: 'Golden hour richness. Earthy terracotta and gentle dusty rose bring emotive warmth to family portraits.',
    recommendedFor: ['Family Photoshoot', 'Birthday Celebration', 'Christmas Celebration'],
  },
  {
    id: 'palette-monochrome-champagne',
    name: 'Monochrome & Champagne Silk',
    colors: ['#242326', '#E4D5B7', '#8E8B89', '#F9F7F5'],
    description: 'High-fashion editorial elegance. Charcoal and slate paired with shimmering champagne silk.',
    recommendedFor: ['Wedding', 'Family Dinner', 'Graduation'],
  },
  {
    id: 'palette-pastel-garden',
    name: 'Pastel Garden Blossom',
    colors: ['#A4C2CB', '#BBD5BE', '#E6B8BF', '#FDF8E2'],
    description: 'Gentle powder blue, soft mint, and petal rose for fresh, joyful outdoor ceremonies and gatherings.',
    recommendedFor: ['Birthday Celebration', 'Wedding', 'Casual Weekend Outing'],
  },
];

export const STYLE_DIRECTIONS: Array<{ id: StyleDirection; label: string; desc: string }> = [
  {
    id: 'Coordinated Colours',
    label: 'Coordinated Colours',
    desc: 'Each person wears distinct tones from a shared palette without matching identical garments.',
  },
  {
    id: 'Complementary Outfits',
    label: 'Complementary Outfits',
    desc: 'Contrasting tones and textures that visually balance each other in group photographs.',
  },
  {
    id: 'Elegant & Classic',
    label: 'Elegant & Classic',
    desc: 'Timeless tailored silhouettes and understated luxury that age gracefully.',
  },
  {
    id: 'Modern & Trendy',
    label: 'Modern & Trendy',
    desc: 'Contemporary cuts, fluid proportions, and clean South African designer aesthetics.',
  },
  {
    id: 'Relaxed & Comfortable',
    label: 'Relaxed & Comfortable',
    desc: 'Breathable natural fibers, flexible waistbands, and effortless daytime charm.',
  },
];

/**
 * Deterministic coordinated outfit concept generator.
 * Produces curated, realistic outfits tailored to the member's age, role, aesthetic, and selected palette.
 */
export function generateCoordinatedConcepts(params: {
  occasion: OccasionType;
  palette: ColorPaletteOption;
  styleDirection: StyleDirection;
  members: Array<{ id: string; name: string; relationship: string; classification: 'Adult' | 'Child' }>;
  totalBudgetZar: number;
}): FamilyOutfitConcept[] {
  const { occasion, palette, members, totalBudgetZar } = params;

  // Distribute budget proportionally: adults get ~35-40%, children get ~15-20%
  const adultCount = members.filter((m) => m.classification === 'Adult').length || 1;
  const childCount = members.filter((m) => m.classification === 'Child').length;
  const adultWeight = 1.8;
  const totalWeight = adultCount * adultWeight + childCount * 1.0;
  const unitBudget = totalBudgetZar / totalWeight;

  return members.map((member) => {
    const isAdult = member.classification === 'Adult';
    const isMaleRole = member.relationship.includes('Son') || member.relationship.includes('Partner') || member.name === 'David' || member.name === 'Liam';
    const allocatedBudget = Math.round(isAdult ? unitBudget * adultWeight : unitBudget);

    if (member.name === 'Elena' || member.relationship === 'Self' || (!isMaleRole && isAdult)) {
      // Mom / Account Holder
      return {
        id: `concept-${member.id}`,
        familyMemberId: member.id,
        familyMemberName: member.name,
        conceptTitle: occasion === 'Wedding' ? 'Pleated Silk Georgette Midi with Gold Accents' : 'Tailored Linen Wrap Dress with Woven Belt',
        imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80',
        pieces: [
          { id: `p1-${member.id}`, name: 'Silk-blend Midi Dress', category: 'Dresses', estimatedPriceZar: Math.round(allocatedBudget * 0.62) },
          { id: `p2-${member.id}`, name: 'Ankle-Strap Block Heels', category: 'Shoes', estimatedPriceZar: Math.round(allocatedBudget * 0.25) },
          { id: `p3-${member.id}`, name: 'Brushed Brass Drop Earrings', category: 'Jewellery', estimatedPriceZar: Math.round(allocatedBudget * 0.13) },
        ],
        colorPalette: [palette.colors[1] || '#FAF7F2', palette.colors[3] || '#D2BBA0'],
        stylingExplanation: `Anchor piece in ${palette.colors[1] || 'soft cream'}. Provides luminous contrast while anchoring the family group in group portraits.`,
        styleCategory: 'Modern Minimal',
        allocatedBudgetZar: allocatedBudget,
      };
    } else if (member.name === 'David' || (isMaleRole && isAdult)) {
      // Partner / Dad
      return {
        id: `concept-${member.id}`,
        familyMemberId: member.id,
        familyMemberName: member.name,
        conceptTitle: occasion === 'Wedding' ? 'Unstructured Tailored Linen Blazer & Slim Chino' : 'Crisp Linen Shirt with Sand Trousers',
        imageUrl: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=800&q=80',
        pieces: [
          { id: `p1-${member.id}`, name: 'Linen-Cotton Tailored Blazer', category: 'Jackets', estimatedPriceZar: Math.round(allocatedBudget * 0.58) },
          { id: `p2-${member.id}`, name: 'Pleated Cotton Chino Trouser', category: 'Trousers', estimatedPriceZar: Math.round(allocatedBudget * 0.28) },
          { id: `p3-${member.id}`, name: 'Leather Penny Loafers', category: 'Shoes', estimatedPriceZar: Math.round(allocatedBudget * 0.14) },
        ],
        colorPalette: [palette.colors[0] || '#1B2A4A', palette.colors[2] || '#D2BBA0'],
        stylingExplanation: `Carries the deepest grounding tone (${palette.name}) via the tailored jacket, creating balanced visual symmetry beside lighter dresses.`,
        styleCategory: 'Smart Casual',
        allocatedBudgetZar: allocatedBudget,
      };
    } else if (member.name === 'Chloe' || (!isMaleRole && !isAdult)) {
      // Daughter
      return {
        id: `concept-${member.id}`,
        familyMemberId: member.id,
        familyMemberName: member.name,
        conceptTitle: 'Tiered Flutter-Sleeve Sundress & Leather Ballet Flats',
        imageUrl: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?auto=format&fit=crop&w=800&q=80',
        pieces: [
          { id: `p1-${member.id}`, name: 'Tiered Flutter-Sleeve Dress', category: 'Dresses', estimatedPriceZar: Math.round(allocatedBudget * 0.65) },
          { id: `p2-${member.id}`, name: 'Cushioned Leather Ballet Flats', category: 'Shoes', estimatedPriceZar: Math.round(allocatedBudget * 0.25) },
          { id: `p3-${member.id}`, name: 'Ribbon Hair Bow Clip', category: 'Accessories', estimatedPriceZar: Math.round(allocatedBudget * 0.10) },
        ],
        colorPalette: [palette.colors[2] || '#E8E1D5', palette.colors[1] || '#FAF7F2'],
        stylingExplanation: `Playful pastel interpretation with tagless lining and elastic waist so Chloe stays joyful and comfortable during long photo sessions.`,
        styleCategory: 'Playful Preppy',
        allocatedBudgetZar: allocatedBudget,
      };
    } else {
      // Son / Liam
      return {
        id: `concept-${member.id}`,
        familyMemberId: member.id,
        familyMemberName: member.name,
        conceptTitle: 'Oxford Button-Down & Tapered Stretch Chinos',
        imageUrl: 'https://images.unsplash.com/photo-1503944547408-b6559a445e0f?auto=format&fit=crop&w=800&q=80',
        pieces: [
          { id: `p1-${member.id}`, name: 'Oxford Cotton Button-Down Shirt', category: 'Tops', estimatedPriceZar: Math.round(allocatedBudget * 0.52) },
          { id: `p2-${member.id}`, name: 'Tapered Stretch Chino Shorts/Pants', category: 'Bottoms', estimatedPriceZar: Math.round(allocatedBudget * 0.32) },
          { id: `p3-${member.id}`, name: 'Minimalist Leather Trainers', category: 'Shoes', estimatedPriceZar: Math.round(allocatedBudget * 0.16) },
        ],
        colorPalette: [palette.colors[3] || '#FAF7F2', palette.colors[0] || '#8A9A86'],
        stylingExplanation: `Echoes the palette's neutral base with breathable natural cotton. Matches his dad's tailored aesthetic in an age-appropriate casual cut.`,
        styleCategory: 'Modern Casual',
        allocatedBudgetZar: allocatedBudget,
      };
    }
  });
}
