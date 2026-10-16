/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Personalization Engine for MyStyle AI
 * Maps saved user style profile preferences to deterministic, curated editorial content.
 */

import { UserProfile, ShoppingPreferences, StyleInspiration, BudgetTier } from '../types';
import { STYLE_INSPIRATIONS, HERO_DATA } from '../data/mockData';

// Image imports for hero variations
import styleClassicImg from '../assets/images/style_classic_tailored_1791980329558.jpg';
import styleMinimalImg from '../assets/images/style_modern_minimal_1791980327769.jpg';
import styleTrendyImg from '../assets/images/style_trendy_bold_1791980328578.jpg';
import styleSportyImg from '../assets/images/style_sporty_active_1791980329185.jpg';
import workOfficeImg from '../assets/images/fashion_work_office_1791978399975.jpg';
import weddingGuestImg from '../assets/images/fashion_wedding_guest_1791978399342.jpg';
import weekendCasualImg from '../assets/images/fashion_weekend_casual_1791978401075.jpg';
import dateNightImg from '../assets/images/fashion_date_night_1791978397788.jpg';

export interface PersonalizedHeroContent {
  tagline: string;
  headline: string;
  subheadline: string;
  ctaText: string;
  imageUrl: string;
  altText: string;
  quickPrompts: string[];
}

/**
 * Returns a time-of-day greeting (morning, afternoon, evening) with customer name.
 */
export function getTimeGreeting(firstName?: string): { greeting: string; hasName: boolean } {
  const hour = new Date().getHours();
  let timeStr = 'Good morning';

  if (hour >= 12 && hour < 17) {
    timeStr = 'Good afternoon';
  } else if (hour >= 17 || hour < 4) {
    timeStr = 'Good evening';
  }

  const cleanName = firstName?.trim();
  if (cleanName) {
    return { greeting: `${timeStr}, ${cleanName}.`, hasName: true };
  }
  return { greeting: `${timeStr}.`, hasName: false };
}

/**
 * Deterministically selects the most relevant editorial hero based on the user's primary saved style.
 */
export function getPersonalizedHero(styles?: string[]): PersonalizedHeroContent {
  if (!styles || styles.length === 0) {
    return {
      tagline: 'Personalised Just For You',
      headline: 'What are we styling today?',
      subheadline: "From everyday outfits to unforgettable occasions. Let's create your next look.",
      ctaText: 'Style My Look',
      imageUrl: HERO_DATA.imageUrl,
      altText: 'Tailored cream blazer editorial portrait',
      quickPrompts: HERO_DATA.quickPrompts,
    };
  }

  // Find the first matching style preference
  const primaryStyle = styles[0];

  switch (primaryStyle) {
    case 'Classic & Elegant':
      return {
        tagline: 'Classic & Elegant Collection',
        headline: 'Timeless looks, beautifully styled.',
        subheadline: 'Refined tailoring, iconic trench coats and clean cuts curated for your wardrobe.',
        ctaText: 'Style My Look',
        imageUrl: styleClassicImg || '/images/style_classic_tailored.jpg',
        altText: 'Timeless Parisian tailoring with iconic camel trench coat',
        quickPrompts: [
          'Classic trench with tailored trousers',
          'Silk shirt and pleated midi skirt',
          'Timeless dinner jacket ensemble',
        ],
      };

    case 'Casual & Comfortable':
      return {
        tagline: 'Casual & Comfortable Collection',
        headline: 'Effortless style for everyday living.',
        subheadline: 'Cashmere knits, relaxed denim and elevated off-duty layers that feel like home.',
        ctaText: 'Style My Look',
        imageUrl: weekendCasualImg || '/images/weekend_casual.jpg',
        altText: 'Relaxed cashmere knit and wide-leg denim cafe style',
        quickPrompts: [
          'Weekend brunch knit and raw denim',
          'Effortless market stroll layers',
          'Cozy travel lounge coordinate',
        ],
      };

    case 'Trendy & Bold':
      return {
        tagline: 'Trendy & Bold Collection',
        headline: 'Make every outfit a statement.',
        subheadline: 'Sculptural leather bombers, rich textures and modern runway silhouettes.',
        ctaText: 'Style My Look',
        imageUrl: styleTrendyImg || '/images/style_trendy_bold.jpg',
        altText: 'Bronze metallic bomber jacket and wide-leg trousers',
        quickPrompts: [
          'Metallic statement jacket with wide trousers',
          'High-contrast streetwear ensemble',
          'Sculptural evening cocktail silhouette',
        ],
      };

    case 'Smart & Professional':
      return {
        tagline: 'Smart & Professional Collection',
        headline: 'Confidence looks good on you.',
        subheadline: 'Sharp monochrome pant suits and crisp tailoring designed for the boardroom.',
        ctaText: 'Style My Look',
        imageUrl: workOfficeImg || '/images/work_office.jpg',
        altText: 'Monochrome tailored pantsuit in architectural atrium',
        quickPrompts: [
          'Power blazer for executive presentations',
          'Modern business smart-casual tailoring',
          'Conference keynote look in camel',
        ],
      };

    case 'Modern & Minimal':
      return {
        tagline: 'Modern & Minimal Collection',
        headline: 'Architectural lines, quiet luxury.',
        subheadline: 'Monotone cream and taupe fluid silhouettes with pure, understated presence.',
        ctaText: 'Style My Look',
        imageUrl: styleMinimalImg || '/images/style_modern_minimal.jpg',
        altText: 'Sculptural cream wrap top and fluid palazzo trousers',
        quickPrompts: [
          'Architectural monochrome neutral suit',
          'Minimalist evening slip dress',
          'Fluid gallery preview silhouette',
        ],
      };

    case 'Romantic & Feminine':
      return {
        tagline: 'Romantic & Feminine Collection',
        headline: 'Graceful silhouettes, celebratory elegance.',
        subheadline: 'Delicate floral brocades, square necklines and champagne gold accents.',
        ctaText: 'Style My Look',
        imageUrl: weddingGuestImg || '/images/wedding_guest.jpg',
        altText: 'Champagne floral jacquard midi dress in sunny garden estate',
        quickPrompts: [
          'Floral jacquard dress for vineyard wedding',
          'Romantic pastel dinner silhouette',
          'Soft golden hour celebration look',
        ],
      };

    case 'Sporty & Active':
      return {
        tagline: 'Sporty & Active Collection',
        headline: 'Elevated performance meets off-duty comfort.',
        subheadline: 'Technical ribbed active sets paired seamlessly with oversized wool outerwear.',
        ctaText: 'Style My Look',
        imageUrl: styleSportyImg || '/images/style_sporty_active.jpg',
        altText: 'Slate grey technical active set with oversized cashmere trench',
        quickPrompts: [
          'Athleisure set with wool trench wrap',
          'Weekend studio and coffee run fit',
          'Sleek mobility travel coordinates',
        ],
      };

    case 'Chic & Sophisticated':
    default:
      return {
        tagline: 'Chic & Sophisticated Collection',
        headline: 'Alluring silhouettes for evening elegance.',
        subheadline: 'Deep emerald slips, tailored overcoats and radiant bistro dinner glamour.',
        ctaText: 'Style My Look',
        imageUrl: dateNightImg || '/images/date_night.jpg',
        altText: 'Emerald satin slip dress with tailored overcoat',
        quickPrompts: [
          'Emerald slip dress with wool overcoat',
          'Cocktail bar evening glamour',
          'Candlelit dinner date night fit',
        ],
      };
  }
}

/**
 * Returns three curated outfit inspiration cards matched to user's saved styles.
 */
export function getPersonalizedInspirations(styles?: string[]): StyleInspiration[] {
  if (!styles || styles.length === 0) {
    return STYLE_INSPIRATIONS.slice(0, 3);
  }

  // Filter outfits matching any of user's styles
  const matched = STYLE_INSPIRATIONS.filter((item) =>
    styles.some((s) => item.aesthetic.toLowerCase().includes(s.toLowerCase()))
  );

  // If we found matches, take up to 3
  const results = [...matched];

  // If fewer than 3, backfill with remaining distinct inspirations
  for (const item of STYLE_INSPIRATIONS) {
    if (results.length >= 3) break;
    if (!results.some((r) => r.id === item.id)) {
      results.push(item);
    }
  }

  return results.slice(0, 3);
}

/**
 * Returns customized shopping messaging based on customer's budget and priorities.
 */
export function getShoppingHeadline(shopping?: ShoppingPreferences): {
  headline: string;
  badge: string;
  budgetText: string;
} {
  const budgetMap: Record<BudgetTier, string> = {
    'under-300': 'Under R300 per item',
    '300-600': 'R300 – R600 per item',
    '600-1000': 'R600 – R1,000 per item',
    '1000-2000': 'R1,000 – R2,000 per item',
    '2000-plus': 'R2,000+ per item',
    flexible: 'Flexible budget',
  };

  const budgetText = shopping?.itemBudget ? budgetMap[shopping.itemBudget] : 'Flexible budget';

  const priorities = shopping?.priorities || [];
  const isBargain =
    priorities.includes('Finding specials and discounts') ||
    priorities.includes('Best value for money') ||
    shopping?.itemBudget === 'under-300' ||
    shopping?.itemBudget === '300-600';

  const isLuxury =
    priorities.includes('Premium brands') ||
    shopping?.itemBudget === '2000-plus';

  if (isBargain) {
    return {
      headline: "Great style doesn't have to cost a fortune.",
      badge: 'Bargain & Value Focus',
      budgetText,
    };
  }

  if (isLuxury) {
    return {
      headline: 'Discover pieces worth investing in.',
      badge: 'Luxury & Investment Focus',
      budgetText,
    };
  }

  return {
    headline: "Find pieces you'll love, at prices that work for you.",
    badge: 'Smart Curation',
    budgetText,
  };
}
