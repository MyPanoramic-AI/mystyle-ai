/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Curated knowledge base and deterministic conversational engine for MyStyle AI Stylist.
 * High-fashion personal stylist persona crafted for South African fashion retail ecosystem.
 */

import {
  UserProfile,
  StylistNavigationState,
  ChatMessage,
  StylistOutfitRecommendation,
  StylistBeautyTip,
  StylistQuickAction,
} from '../types';
import { resolveStylistPersona } from './stylistPersona';

import heroEditorialImg from '../assets/images/hero_editorial_fashion_1791978397716.jpg';
import dateNightImg from '../assets/images/fashion_date_night_1791978397788.jpg';
import weddingGuestImg from '../assets/images/fashion_wedding_guest_1791978399342.jpg';
import workOfficeImg from '../assets/images/fashion_work_office_1791978399975.jpg';
import weekendCasualImg from '../assets/images/fashion_weekend_casual_1791978401075.jpg';
import specialGalaImg from '../assets/images/fashion_special_gala_1791978474099.jpg';
import holidayResortImg from '../assets/images/fashion_holiday_resort_1791978473683.jpg';
import occasionDinnerFriendsImg from '../assets/images/occasion_dinner_friends_1791981235791.jpg';
import occasionFamilyOutingImg from '../assets/images/occasion_family_outing_1791981234661.jpg';
import beautyHairstylesImg from '../assets/images/beauty_hairstyles_1791981235184.jpg';
import beautyMakeupImg from '../assets/images/beauty_makeup_1791981236922.jpg';
import beautyNailsImg from '../assets/images/beauty_nails_1791981236875.jpg';
import styleMinimalImg from '../assets/images/style_modern_minimal_1791980327769.jpg';
import styleClassicImg from '../assets/images/style_classic_tailored_1791980329558.jpg';

// Curated outfit recommendation catalog
export const OUTFIT_CATALOG: Record<string, StylistOutfitRecommendation> = {
  dateNight: {
    id: 'rec-date-night',
    title: 'Midnight Emerald Drape & Silk Slip',
    aesthetic: 'Chic & Sophisticated',
    occasion: 'Intimate Dinner & Evening Drinks',
    imageUrl: dateNightImg,
    matchScore: 98,
    totalEstimatedZar: 2450,
    stylistRationale:
      'Fluid silk bias cut drapes cleanly over curves without clinging. Paired with a tailored charcoal blazer to add architectural structure for evening warmth.',
    pieces: [
      {
        name: 'Bias-Cut Silk Blend Midi Slip in Deep Forest',
        retailer: 'Country Road / Woolworths',
        priceZar: 1199,
        category: 'dress',
        inStock: true,
      },
      {
        name: 'Oversized Double-Breasted Wool Blend Blazer',
        retailer: 'Zara SA',
        priceZar: 899,
        category: 'outerwear',
        inStock: true,
      },
      {
        name: 'Delicate Ankle-Strap Stiletto in Nude Leather',
        retailer: 'Superbalist',
        priceZar: 350,
        category: 'shoes',
        inStock: true,
      },
    ],
    palette: ['#1B382B', '#242326', '#E5CDBE', '#B49361'],
    stylingTips: [
      'Leave the blazer unbuttoned and draped over your shoulders for an effortless, high-fashion silhouette.',
      'A warm amber gold necklace accentuates the delicate cowl neckline beautifully.',
    ],
  },

  weddingGuest: {
    id: 'rec-wedding-guest',
    title: 'Champagne Garden Jacquard & Gold Accents',
    aesthetic: 'Romantic & Refined',
    occasion: 'Estate Garden Wedding',
    imageUrl: weddingGuestImg,
    matchScore: 96,
    totalEstimatedZar: 2850,
    stylistRationale:
      'Soft champagne floral jacquard catches natural sunlight gracefully. Respectful neckline with an A-line hem that moves effortlessly across estate lawns.',
    pieces: [
      {
        name: 'Structured Square-Neck Jacquard Midi Dress',
        retailer: 'Poetry / Woolworths',
        priceZar: 1599,
        category: 'dress',
        inStock: true,
      },
      {
        name: 'Block-Heel Metallic Ankle Strap Sandal (Lawn Friendly)',
        retailer: 'Superbalist',
        priceZar: 650,
        category: 'shoes',
        inStock: true,
      },
      {
        name: 'Woven Satin Minaudière Evening Clutch',
        retailer: 'Foschini',
        priceZar: 600,
        category: 'accessories',
        inStock: true,
      },
    ],
    palette: ['#E5CDBE', '#F6F2EC', '#B49361', '#9C6A61'],
    stylingTips: [
      'Choose block heels over stilettos to prevent sinking into lawn grass during garden ceremonies.',
      'Complement the champagne tone with warm glowing highlighter and brushed gold drop earrings.',
    ],
  },

  workOffice: {
    id: 'rec-work-office',
    title: 'Sculptural Sand Monotone Boardroom Suit',
    aesthetic: 'Classic & Executive Tailoring',
    occasion: 'Executive Boardroom & Client Meetings',
    imageUrl: workOfficeImg,
    matchScore: 99,
    totalEstimatedZar: 2699,
    stylistRationale:
      'Monochrome sand and cream elongates your vertical line while projecting quiet confidence and impeccable polish. High-waisted wide trousers allow full workday comfort.',
    pieces: [
      {
        name: 'Tailored Camel Single-Breasted Peak Lapel Blazer',
        retailer: 'Trenery / Woolworths',
        priceZar: 1399,
        category: 'outerwear',
        inStock: true,
      },
      {
        name: 'Crepe Wide-Leg Pleated Trousers',
        retailer: 'Zara SA',
        priceZar: 799,
        category: 'bottoms',
        inStock: true,
      },
      {
        name: 'Silk Georgette Ivory Shell Blouse',
        retailer: 'Superbalist',
        priceZar: 500,
        category: 'tops',
        inStock: true,
      },
    ],
    palette: ['#F6F2EC', '#D9C3B0', '#242326', '#B49361'],
    stylingTips: [
      'Tuck the silk blouse into high-waisted pleats to highlight your natural waistline.',
      'Keep jewelry minimal — a leather-strap watch and classic brushed huggie hoops.',
    ],
  },

  weekendCasual: {
    id: 'rec-weekend-casual',
    title: 'Oatmeal Cashmere & Fluid Denim',
    aesthetic: 'Effortless Off-Duty Luxury',
    occasion: 'Saturday Brunch & Gallery Walking',
    imageUrl: weekendCasualImg,
    matchScore: 94,
    totalEstimatedZar: 1850,
    stylistRationale:
      'Luxuriously soft knitwear paired with modern wide-leg denim. Breathable, relaxed, and polished enough for spontaneous afternoon wine tasting.',
    pieces: [
      {
        name: 'Oatmeal Ribbed Crewneck Knit Jumper',
        retailer: 'Woolworths Studio.W',
        priceZar: 699,
        category: 'tops',
        inStock: true,
      },
      {
        name: 'High-Rise Straight Leg Rigid Denim in Vintage Blue',
        retailer: 'Cotton On / Superbalist',
        priceZar: 750,
        category: 'bottoms',
        inStock: true,
      },
      {
        name: 'Leather Minimalist White Court Sneakers',
        retailer: 'Superbalist',
        priceZar: 400,
        category: 'shoes',
        inStock: true,
      },
    ],
    palette: ['#D9C3B0', '#4A6984', '#FFFFFF', '#242326'],
    stylingTips: [
      'Do a relaxed french tuck with the front hem of the sweater for casual proportion balancing.',
      'Add a slouchy cognac tote bag to ground the neutrals with warmth.',
    ],
  },

  specialGala: {
    id: 'rec-special-gala',
    title: 'Architectural Obsidian Column Gown',
    aesthetic: 'High-Fashion Gala & Black-Tie',
    occasion: 'Charity Gala & Red Carpet',
    imageUrl: specialGalaImg,
    matchScore: 97,
    totalEstimatedZar: 3200,
    stylistRationale:
      'Dramatic clean lines with an asymmetric shoulder cut. Makes a striking, statuesque statement without relying on overwhelming glitter.',
    pieces: [
      {
        name: 'One-Shoulder Column Crepe Gown in Matte Black',
        retailer: 'YDE / Superbalist',
        priceZar: 1899,
        category: 'dress',
        inStock: true,
      },
      {
        name: 'Sculptural Gold Cuff Bracelet & Ear Climber',
        retailer: 'Lovisa / Woolworths',
        priceZar: 450,
        category: 'accessories',
        inStock: true,
      },
      {
        name: 'Pointed Toe D’Orsay Pumps in Patent Obsidian',
        retailer: 'Foschini',
        priceZar: 850,
        category: 'shoes',
        inStock: true,
      },
    ],
    palette: ['#242326', '#B49361', '#F6F2EC', '#9C6A61'],
    stylingTips: [
      'A sleek chignon or low bun emphasizes the dramatic one-shoulder architecture.',
      'A bold berry or classic scarlet lip provides the singular pop of color against monochrome black.',
    ],
  },

  holidayResort: {
    id: 'rec-holiday-resort',
    title: 'Terracotta Linen & Woven Raffia',
    aesthetic: 'Breezy Mediterranean Resort',
    occasion: 'Coastal Getaway & Sun-Drenched Terrace',
    imageUrl: holidayResortImg,
    matchScore: 95,
    totalEstimatedZar: 1750,
    stylistRationale:
      'Pure pre-washed linen breathes effortlessly under South African summer heat while the rich terracotta tone looks radiant in natural golden light.',
    pieces: [
      {
        name: 'Halter Tiered Maxi Dress in Earthy Terracotta',
        retailer: 'Poetry / Superbalist',
        priceZar: 950,
        category: 'dress',
        inStock: true,
      },
      {
        name: 'Handwoven Raffia Tote & Sun Visor',
        retailer: 'Woolworths',
        priceZar: 450,
        category: 'accessories',
        inStock: true,
      },
      {
        name: 'Tan Leather Slide Sandals',
        retailer: 'Tread+Miller',
        priceZar: 350,
        category: 'shoes',
        inStock: true,
      },
    ],
    palette: ['#9C6A61', '#E5CDBE', '#F6F2EC', '#4A6984'],
    stylingTips: [
      'Wear with oversized tortoiseshell sunglasses for timeless Riviera chic.',
      'Hydrated dewy skin and a sun-kissed bronzer complete the natural holiday glow.',
    ],
  },

  dinnerFriends: {
    id: 'rec-dinner-friends',
    title: 'Contemporary Midi & Sculptural Accessories',
    aesthetic: 'Modern Chic & Vibrant',
    occasion: 'Bistro Dinner & Rooftop Cocktails',
    imageUrl: occasionDinnerFriendsImg,
    matchScore: 95,
    totalEstimatedZar: 2100,
    stylistRationale:
      'Balanced balance of smart-casual elegance and evening intrigue. Expressive without feeling stiff.',
    pieces: [
      {
        name: 'Ribbed Knit Cut-Out Midi Dress in Warm Olive',
        retailer: 'Zara SA',
        priceZar: 999,
        category: 'dress',
        inStock: true,
      },
      {
        name: 'Cropped Vegan Leather Biker Jacket',
        retailer: 'Superbalist',
        priceZar: 700,
        category: 'outerwear',
        inStock: true,
      },
      {
        name: 'Strappy Mid-Block Mule in Warm Caramel',
        retailer: 'Foschini',
        priceZar: 400,
        category: 'shoes',
        inStock: true,
      },
    ],
    palette: ['#1B382B', '#E5CDBE', '#242326', '#9C6A61'],
    stylingTips: [
      'Layer a cropped leather jacket over soft knit to give an urban edge.',
      'A warm lip tint and stack of gold rings feel youthful and contemporary.',
    ],
  },
};

// Curated beauty pairing tips
export const BEAUTY_TIPS: Record<string, StylistBeautyTip> = {
  eveningGlam: {
    hairstyle: {
      title: 'Soft Hollywood Waves or Polished Low Chignon',
      description: 'Defined parted waves with a high-shine serum finish, framing cheekbones elegantly.',
      imageUrl: beautyHairstylesImg,
    },
    makeup: {
      title: 'Warm Bronze Smokey Eye with Velvet Nude Lip',
      description: 'Luminous skin base with champagne inner corner highlight and muted mauve-rose pout.',
      palette: ['#9C6A61', '#B49361', '#E5CDBE', '#242326'],
    },
    nails: {
      title: 'Deep Wine Gloss or Glazed Donut Neutral',
      colorName: 'Bordeaux Plum',
      hex: '#4A1D24',
    },
  },
  freshDaytime: {
    hairstyle: {
      title: 'Sleek Claw-Clip French Twist or Textured Ponytail',
      description: 'Effortless face-framing tendrils pulled back into a minimalist tortoiseshell clip.',
      imageUrl: beautyHairstylesImg,
    },
    makeup: {
      title: 'Dewy Clean Girl Glow with Tinted Lip Oil',
      description: 'Feathered brushed-up brows, peach blush draped across high cheeks, and gloss.',
      palette: ['#E5CDBE', '#F6F2EC', '#9C6A61', '#B49361'],
    },
    nails: {
      title: 'Milky Oat or Micro French Tip',
      colorName: 'Warm Alabaster',
      hex: '#F6F2EC',
    },
  },
};

// Quick starter prompts
export const STARTER_SUGGESTIONS: StylistQuickAction[] = [
  {
    id: 'act-date',
    label: '🥂 Date Night in Cape Town',
    prompt: 'Style a romantic, flattering date night outfit for an upscale dinner in Camps Bay.',
  },
  {
    id: 'act-wedding',
    label: '💍 Summer Garden Wedding',
    prompt: 'I need an elegant wedding guest outfit for an afternoon garden wedding in the Winelands.',
  },
  {
    id: 'act-boardroom',
    label: '💼 Power Workwear Under R1,200',
    prompt: 'Curate a sharp executive work outfit with SA retailers that stays under R1,200.',
  },
  {
    id: 'act-weekend',
    label: '☕ Chic Weekend Brunch',
    prompt: 'What should I wear for a relaxed Saturday brunch and boutique gallery hopping?',
  },
  {
    id: 'act-beauty',
    label: '💄 Complete Glam: Hair & Makeup',
    prompt: 'Recommend hairstyles and makeup palettes that complement my current outfit.',
  },
  {
    id: 'act-capsule',
    label: '👗 Flattering My Silhouette',
    prompt: 'What clothing silhouettes and necklines best flatter my proportions?',
  },
];

/**
 * Returns initial chat greeting based on active profile and incoming state.
 */
export function getInitialConversation(
  profile: UserProfile,
  incomingState?: StylistNavigationState
): ChatMessage[] {
  const firstName = profile.personal.firstName || 'there';
  const stylistName = resolveStylistPersona(profile).name;
  const primaryStyle = profile.styles[0] || 'Classic & Elegant';
  const sizeSummary = profile.sizes.topsSize ? `Size ${profile.sizes.topsSize}` : 'tailored fits';

  // Case 1: Arrived with an explicit prompt or occasion from Home screen
  if (incomingState?.suggestedPrompt || incomingState?.occasionTitle) {
    const topic = incomingState.occasionTitle || 'your request';
    const initialPrompt = incomingState.suggestedPrompt || `Help me style an outfit for ${topic}.`;

    // Match appropriate outfit card
    const outfitKey = findBestOutfitKey(initialPrompt);
    const outfit = OUTFIT_CATALOG[outfitKey] || OUTFIT_CATALOG.dateNight;

    return [
      {
        id: 'msg-welcome-context',
        sender: 'stylist',
        timestamp: 'Just now',
        text: `Hello ${firstName}! Delighted to style for you today.\n\nI see you're planning for **${topic}**. Factoring in your love for **${primaryStyle}** aesthetics and your **${sizeSummary}** silhouette, I’ve curated an exclusive look tailored just for you.`,
        outfitCard: outfit,
        quickActions: [
          {
            id: 'qa-swap-shoes',
            label: '👠 Recommend alternative footwear',
            prompt: 'Can you show me alternative comfortable footwear options for this look?',
          },
          {
            id: 'qa-beauty',
            label: '💄 Suggested hair & makeup',
            prompt: 'What hair and makeup look would tie this together perfectly?',
          },
          {
            id: 'qa-budget',
            label: '💰 More affordable options',
            prompt: 'Can we find similar pieces at a more budget-friendly price point under R1,000?',
          },
        ],
      },
    ];
  }

  // Case 2: Standard entry from tab bar
  return [
    {
      id: 'msg-welcome-standard',
      sender: 'stylist',
      timestamp: 'Just now',
      text: `Good day, ${firstName}! I'm ${stylistName}, your MyStyle personal fashion stylist.\n\nI'm calibrated to your style DNA: **${profile.styles.slice(0, 2).join(' & ') || 'Classic Elegance'}**, your preferred palette of **${profile.colours.favoriteColors.slice(0, 3).join(', ') || 'Warm neutrals'}**, and top SA retailers like Woolworths and Superbalist.\n\nWhat occasion or outfit challenge can we create together today?`,
      outfitCard: OUTFIT_CATALOG.workOffice,
      quickActions: STARTER_SUGGESTIONS.slice(0, 4),
    },
  ];
}

/**
 * Helper to match query keywords to our outfit catalog
 */
function findBestOutfitKey(query: string): string {
  const q = query.toLowerCase();
  if (q.includes('date') || q.includes('dinner') || q.includes('evening') || q.includes('cocktail') || q.includes('camps bay')) {
    return 'dateNight';
  }
  if (q.includes('wedding') || q.includes('nuptials') || q.includes('jacquard') || q.includes('celebration')) {
    return 'weddingGuest';
  }
  if (q.includes('work') || q.includes('office') || q.includes('boardroom') || q.includes('suit') || q.includes('interview') || q.includes('corporate')) {
    return 'workOffice';
  }
  if (q.includes('weekend') || q.includes('casual') || q.includes('brunch') || q.includes('denim') || q.includes('relaxed')) {
    return 'weekendCasual';
  }
  if (q.includes('gala') || q.includes('black tie') || q.includes('black-tie') || q.includes('red carpet') || q.includes('ballroom')) {
    return 'specialGala';
  }
  if (q.includes('holiday') || q.includes('resort') || q.includes('beach') || q.includes('summer') || q.includes('terrace')) {
    return 'holidayResort';
  }
  if (q.includes('friend') || q.includes('drinks') || q.includes('rooftop')) {
    return 'dinnerFriends';
  }
  return 'dateNight';
}

/**
 * Generates an intelligent, deterministic stylist response with SA retail specifics,
 * profile grounding, and rich interactive cards.
 */
export function generateStylistResponse(
  userInput: string,
  profile: UserProfile,
  attachment?: { name: string; url: string }
): {
  text: string;
  outfitCard?: StylistOutfitRecommendation;
  beautyTip?: StylistBeautyTip;
  quickActions?: StylistQuickAction[];
} {
  const q = userInput.toLowerCase();
  const firstName = profile.personal.firstName || 'darling';
  const budget = profile.shopping.itemBudget || '300-600';
  const favStores = profile.shopping.favoriteRetailers.length
    ? profile.shopping.favoriteRetailers.join(', ')
    : 'Woolworths, Superbalist and Zara';

  // 1. Photo attachment analysis
  if (attachment) {
    return {
      text: `I've analyzed your uploaded piece: **${attachment.name}**!\n\nThis is a remarkably versatile silhouette. Here is how I would style it for maximum elegance:\n\n1. **High-Contrast Proportion**: Pair this item with sleek, tailored fluid trousers in cream or deep charcoal to balance volume.\n2. **Textural Interest**: Introduce smooth silk or soft knitwear to create luxury contrast against this fabric.\n3. **Footwear & Polish**: Anchor with pointed square-toe mules and delicate brushed gold jewelry.\n\nHere is a complete curated ensemble that works seamlessly with your aesthetic:`,
      outfitCard: OUTFIT_CATALOG.workOffice,
      quickActions: [
        {
          id: 'qa-att-1',
          label: '👠 What shoes match best?',
          prompt: 'What shoes and handbag would best complete this look?',
        },
        {
          id: 'qa-att-2',
          label: '🛍️ Find pieces on Superbalist',
          prompt: 'Show me matching pieces currently in stock at Superbalist or Woolworths.',
        },
      ],
    };
  }

  // 2. Beauty, Hair, Makeup, Nails
  if (q.includes('hair') || q.includes('makeup') || q.includes('beauty') || q.includes('nail') || q.includes('glam') || q.includes('lipstick')) {
    const isEvening = q.includes('night') || q.includes('gala') || q.includes('dinner') || q.includes('evening');
    const beauty = isEvening ? BEAUTY_TIPS.eveningGlam : BEAUTY_TIPS.freshDaytime;

    return {
      text: `Here is the beauty direction to elevate this ensemble:\n\n• **Hair Philosophy**: Keep the silhouette balanced. If your neckline has architectural detail, wear hair swept back or in soft polished waves so the garments breathe.\n• **Complexion**: A radiant, lit-from-within glow with subtle bronzer warms your skin under South African daylight.\n• **Lip & Eye Harmony**: Pair a soft terracotta or velvet nude lip with a softly smoked eye line for timeless sophistication.`,
      beautyTip: beauty,
      quickActions: [
        {
          id: 'qa-b1',
          label: '💅 Recommend nail shades',
          prompt: 'What nail polish shades will last through the week and match both casual and evening wear?',
        },
        {
          id: 'qa-b2',
          label: '👗 Show me the matching dress',
          prompt: 'Take me back to the dress recommendation that pairs with this glam.',
        },
      ],
    };
  }

  // 3. Wedding / Garden party
  if (q.includes('wedding') || q.includes('nuptials') || q.includes('bride') || q.includes('ceremony')) {
    return {
      text: `For a wedding, the goal is photogenic elegance that honors the occasion without competing with the bridal party.\n\nFor your **${profile.sizes.dressSize || 'medium'}** dress profile, a structured A-line jacquard or bias-cut midi in warm champagne or dusty rose is breathtaking. I've curated a lawn-friendly ensemble available at **${favStores}**:`,
      outfitCard: OUTFIT_CATALOG.weddingGuest,
      quickActions: [
        {
          id: 'qa-w1',
          label: '👠 Lawn-friendly shoe choices',
          prompt: 'Can you recommend block heels that won’t sink into estate lawn grass?',
        },
        {
          id: 'qa-w2',
          label: '👛 Accessories & wrap ideas',
          prompt: 'What lightweight shawl or wrap works if it cools down after sunset?',
        },
      ],
    };
  }

  // 4. Date night / Cocktails / Romance
  if (q.includes('date') || q.includes('dinner') || q.includes('cocktail') || q.includes('romantic') || q.includes('camps bay')) {
    return {
      text: `For date night, subtle textural contrast is your greatest ally. A bias-cut satin midi in deep forest green catches ambient candlelight, while a draped tailored blazer provides just enough structure to keep it effortless.\n\nHere is your custom date night curation:`,
      outfitCard: OUTFIT_CATALOG.dateNight,
      quickActions: [
        {
          id: 'qa-d1',
          label: '💄 What makeup works best?',
          prompt: 'What makeup and hair looks best with this satin slip dress?',
        },
        {
          id: 'qa-d2',
          label: '🧥 Jacket options for cooler weather',
          prompt: 'Can you show me outerwear options to layer over this dress?',
        },
      ],
    };
  }

  // 5. Work / Office / Corporate / Professional
  if (q.includes('work') || q.includes('office') || q.includes('suit') || q.includes('interview') || q.includes('boardroom') || q.includes('meeting')) {
    return {
      text: `In contemporary professional settings, power dressing has evolved away from stiff, uncomfortable suits into fluid tailoring and luxurious tonal neutrals.\n\nThis camel and oat palette commands executive presence while remaining breathable for full day meetings:`,
      outfitCard: OUTFIT_CATALOG.workOffice,
      quickActions: [
        {
          id: 'qa-o1',
          label: '👜 Best work tote for laptop',
          prompt: 'Recommend structured leather work bags that hold a 14-inch laptop stylishly.',
        },
        {
          id: 'qa-o2',
          label: '👞 Comfortable loafers & flats',
          prompt: 'Show me stylish flat shoes or loafers for high-step office days.',
        },
      ],
    };
  }

  // 6. Weekend casual / Brunch
  if (q.includes('weekend') || q.includes('brunch') || q.includes('casual') || q.includes('denim') || q.includes('relaxed') || q.includes('market')) {
    return {
      text: `Elevated casual style is all about pairing premium fabrics with laid-back cuts. Cashmere or ribbed cotton with rigid wide-leg denim looks instantly intentional, not like an afterthought.\n\nHere is an effortless look ready for Saturday mornings:`,
      outfitCard: OUTFIT_CATALOG.weekendCasual,
      quickActions: [
        {
          id: 'qa-wk1',
          label: '👟 White sneakers guide',
          prompt: 'What are the best durable white court sneakers available in South Africa?',
        },
        {
          id: 'qa-wk2',
          label: '🕶️ Sunglasses & hat styling',
          prompt: 'What sunglasses shape will best complement my face structure?',
        },
      ],
    };
  }

  // 7. Gala / Black-Tie / Formal
  if (q.includes('gala') || q.includes('black tie') || q.includes('black-tie') || q.includes('formal') || q.includes('ballroom')) {
    return {
      text: `Black-tie events are where architectural draping outshines heavy ornamentation. An asymmetric one-shoulder column in matte obsidian creates a statuesque, timeless presence:\n\nHere is a couture-level look you can source locally:`,
      outfitCard: OUTFIT_CATALOG.specialGala,
      quickActions: [
        {
          id: 'qa-g1',
          label: '✨ Jewelry styling tips',
          prompt: 'Should I wear a necklace with a one-shoulder gown or focus on statement earrings?',
        },
        {
          id: 'qa-g2',
          label: '👠 Evening clutch & heels',
          prompt: 'Help me find matching metallic heels and a clutch under R1,000.',
        },
      ],
    };
  }

  // 8. Holiday / Resort / Summer / Beach
  if (q.includes('holiday') || q.includes('resort') || q.includes('beach') || q.includes('summer') || q.includes('vacation')) {
    return {
      text: `For a getaway, you want breathable natural fibers that pack without fuss and transition effortlessly from sun terrace to twilight dinners.\n\nHere is a breezy terracotta linen capsule:`,
      outfitCard: OUTFIT_CATALOG.holidayResort,
      quickActions: [
        {
          id: 'qa-h1',
          label: '👒 Sun hats & UV protection',
          prompt: 'Recommend packable sun hats that hold their shape in travel luggage.',
        },
        {
          id: 'qa-h2',
          label: '👡 Day-to-night sandals',
          prompt: 'What sandals work both poolside and for evening dinners?',
        },
      ],
    };
  }

  // 9. Budget / Price / Under R1000
  if (q.includes('budget') || q.includes('under') || q.includes('cheap') || q.includes('price') || q.includes('affordable') || q.includes('r800') || q.includes('r1000')) {
    return {
      text: `Smart luxury isn’t about how much you spend; it’s about silhouettes, clean seamlines, and fabric density.\n\nI’ve filtered looks for your budget preference (**${budget} ZAR** tier). On **Superbalist** and **Woolworths Studio.W**, focusing on clean lines and monochromatic styling makes an R450 garment look like an R2,500 designer piece.\n\nHere is a high-value ensemble curated for you:`,
      outfitCard: OUTFIT_CATALOG.weekendCasual,
      quickActions: [
        {
          id: 'qa-bgt1',
          label: '🏷️ Price drop alerts',
          prompt: 'How can I set up price tracking for items in my wardrobe wishlist?',
        },
        {
          id: 'qa-bgt2',
          label: '👗 High street styling secrets',
          prompt: 'What are the top 3 stylist secrets to make high street clothing look expensive?',
        },
      ],
    };
  }

  // 10. Body shape / Silhouette / Fit
  if (q.includes('silhouette') || q.includes('body') || q.includes('flatter') || q.includes('shape') || q.includes('size')) {
    return {
      text: `The golden rule of silhouette styling is the **Rule of Thirds**: avoid cutting your body in half with 50/50 proportions. Instead, aim for 1/3 on top and 2/3 on bottom (high-waisted trousers with a tucked blouse), or 2/3 on top with an elongated midi dress.\n\nGiven your **${profile.colours.fitPreference || 'regular'}** fit preference, here is a silhouette designed to elongate your frame naturally:`,
      outfitCard: OUTFIT_CATALOG.workOffice,
      quickActions: [
        {
          id: 'qa-fit1',
          label: '📏 How to measure waist & bust accurately',
          prompt: 'Can you guide me on taking accurate body measurements at home?',
        },
        {
          id: 'qa-fit2',
          label: '👗 Best dress styles for my shape',
          prompt: 'Which dress silhouettes (wrap, A-line, slip, column) work best for my body type?',
        },
      ],
    };
  }

  // Default fallback response
  return {
    text: `That is an excellent styling question, ${firstName}.\n\nWhen putting this look together, consider balancing your **${profile.styles.slice(0, 2).join(' and ') || 'tailored elegance'}** with pieces in your preferred palette of **${profile.colours.favoriteColors.slice(0, 2).join(' and ') || 'warm neutrals'}**.\n\nHere is a foundation outfit that embodies this harmony:`,
    outfitCard: OUTFIT_CATALOG.dateNight,
    quickActions: [
      {
        id: 'qa-def1',
        label: '🛍️ Shop this at Woolworths & Superbalist',
        prompt: 'Show me where to buy these items at South African retailers.',
      },
      {
        id: 'qa-def2',
        label: '👠 Footwear pairings',
        prompt: 'What shoe styles best balance this specific outfit?',
      },
      {
        id: 'qa-def3',
        label: '💄 Complete hair & beauty glam',
        prompt: 'What hairstyle and makeup complements this look?',
      },
    ],
  };
}
