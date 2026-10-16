/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Central demonstration dataset for Style Discovery & Outfit Inspiration.
 * Tailored for international editorial luxury with South African seasonal context.
 */

import { FashionLook, FashionCollection, FashionCategoryType } from '../types/discover';

import heroEditorialImg from '../assets/images/hero_editorial_fashion_1791978397716.jpg';
import dateNightImg from '../assets/images/fashion_date_night_1791978397788.jpg';
import weddingGuestImg from '../assets/images/fashion_wedding_guest_1791978399342.jpg';
import workOfficeImg from '../assets/images/fashion_work_office_1791978399975.jpg';
import weekendCasualImg from '../assets/images/fashion_weekend_casual_1791978401075.jpg';
import specialGalaImg from '../assets/images/fashion_special_gala_1791978474099.jpg';
import holidayResortImg from '../assets/images/fashion_holiday_resort_1791978473683.jpg';
import occasionDinnerFriendsImg from '../assets/images/occasion_dinner_friends_1791981235791.jpg';
import occasionFamilyOutingImg from '../assets/images/occasion_family_outing_1791981234661.jpg';
import styleClassicImg from '../assets/images/style_classic_tailored_1791980329558.jpg';
import styleMinimalImg from '../assets/images/style_modern_minimal_1791980327769.jpg';
import styleTrendyImg from '../assets/images/style_trendy_bold_1791980328578.jpg';
import styleSportyImg from '../assets/images/style_sporty_active_1791980329185.jpg';

// Style category filters (in requested order)
export const STYLE_CATEGORIES: FashionCategoryType[] = [
  'All Styles',
  'Elegant',
  'Casual',
  'Professional',
  'Minimalist',
  'Trendy',
  'Romantic',
  'Sporty',
  'Evening Wear',
];

// Featured Fashion Collections (10 Collections)
export const FASHION_COLLECTIONS: FashionCollection[] = [
  {
    id: 'col-effortless-elegance',
    title: 'Effortless Elegance',
    subtitle: 'Understated Luxury',
    description: 'Sculptural tailoring, flowing silks and serene neutral tones designed to transition seamlessly.',
    imageUrl: heroEditorialImg,
    seasonBadge: 'All-Year Core',
  },
  {
    id: 'col-modern-professional',
    title: 'The Modern Professional',
    subtitle: 'Power Dressing Evolved',
    description: 'Contemporary boardroom tailoring, structured blazers and refined fluid trousers.',
    imageUrl: workOfficeImg,
    seasonBadge: 'Workwear Staples',
  },
  {
    id: 'col-summer-sa',
    title: 'Summer in South Africa',
    subtitle: 'Sun-Drenched Coastal Style',
    description: 'Breathable European and local linen, terracotta maxis, sun hats and breezy terrace looks.',
    imageUrl: holidayResortImg,
    seasonBadge: 'SA Summer · Oct–Feb',
  },
  {
    id: 'col-date-night-edit',
    title: 'Date Night Edit',
    subtitle: 'Evening Intrigue & Allure',
    description: 'Silk slip silhouettes, dramatic jewel tones and textured outerwear for twilight dining.',
    imageUrl: dateNightImg,
    seasonBadge: 'Evening Edit',
  },
  {
    id: 'col-wedding-guest',
    title: 'Wedding Guest Style',
    subtitle: 'Celebration Perfection',
    description: 'Floral brocades, square necklines, soft gold accents and lawn-friendly block heels.',
    imageUrl: weddingGuestImg,
    seasonBadge: 'Nuptials Season',
  },
  {
    id: 'col-minimalist-wardrobe',
    title: 'Minimalist Wardrobe',
    subtitle: 'Purity of Silhouette',
    description: 'Clean architectural drape, monochromatic palettes and intentional negative space.',
    imageUrl: styleMinimalImg,
    seasonBadge: 'Capsule Foundation',
  },
  {
    id: 'col-weekend-essentials',
    title: 'Weekend Essentials',
    subtitle: 'Off-Duty Sophistication',
    description: 'Cashmere crewnecks, wide-leg denim, woven totes and clean white leather court shoes.',
    imageUrl: weekendCasualImg,
    seasonBadge: 'Relaxed Weekend',
  },
  {
    id: 'col-bold-beautiful',
    title: 'Bold & Beautiful',
    subtitle: 'Expressive Confidence',
    description: 'Graphic silhouettes, textural clashes and statement color-blocking with unapologetic energy.',
    imageUrl: styleTrendyImg,
    seasonBadge: 'Statement Style',
  },
  {
    id: 'col-winter-layers',
    title: 'Winter Layers',
    subtitle: 'Rich Cold-Weather Drapes',
    description: 'Double-faced wool coats, ribbed roll-neck sweaters, and high-shine boots for crisp days.',
    imageUrl: specialGalaImg,
    seasonBadge: 'SA Winter · May–Aug',
  },
  {
    id: 'col-timeless-classics',
    title: 'Timeless Classics',
    subtitle: 'The Heritage Uniform',
    description: 'Double-breasted trench coats, pristine shirting, and equestrian-inspired leather touches.',
    imageUrl: styleClassicImg,
    seasonBadge: 'Heritage Capsule',
  },
];

// Outfit Discovery Gallery (12+ looks with complete pieces & styling rationale)
export const FASHION_LOOKS: FashionLook[] = [
  {
    id: 'look-parisian-chic',
    title: 'Parisian Chic',
    shortDescription: 'Tailored cream single-breasted blazer over silk georgette with pleated wide-leg trousers.',
    category: 'Elegant',
    occasions: ['Executive Lunch', 'Gallery Preview', 'Afternoon Tea'],
    seasons: ['All-Season', 'Spring', 'Autumn'],
    colorPalette: ['#F6F2EC', '#E5CDBE', '#242326', '#B49361'],
    imageUrl: heroEditorialImg,
    collectionIds: ['col-effortless-elegance', 'col-timeless-classics'],
    matchAesthetics: ['Classic & Elegant', 'Modern & Minimal'],
    whyItWorks:
      'The monochrome cream palette creates an unbroken vertical line that elongates the frame. Textural contrast between the matte structured wool blazer and fluid silk keeps monochrome dressing dynamic and luxurious rather than flat.',
    pieces: [
      { id: 'p1', name: 'Oatmeal Sculptural Double-Breasted Blazer', category: 'Outerwear' },
      { id: 'p2', name: 'High-Waisted Pleated Crepe Trousers', category: 'Bottoms' },
      { id: 'p3', name: 'Fluid Silk Georgette Shell Blouse in Ivory', category: 'Tops' },
      { id: 'p4', name: 'Brushed Gold Ribbed Dome Earrings', category: 'Accessories' },
      { id: 'p5', name: 'Pointed Almond-Toe Block Heel Pumps', category: 'Footwear' },
    ],
  },
  {
    id: 'look-modern-office-muse',
    title: 'Modern Office Muse',
    shortDescription: 'Camel peak-lapel blazer paired with high-rise pressed trousers and structured leather tote.',
    category: 'Professional',
    occasions: ['Boardroom Presentation', 'Client Meeting', 'Conference Keynote'],
    seasons: ['All-Season', 'Autumn', 'Winter'],
    colorPalette: ['#C4A882', '#F6F2EC', '#242326', '#9C6A61'],
    imageUrl: workOfficeImg,
    collectionIds: ['col-modern-professional', 'col-effortless-elegance'],
    matchAesthetics: ['Smart & Professional', 'Classic & Elegant'],
    whyItWorks:
      'Sharp shoulder definition projects executive composure, while the warm camel and oatmeal color temperature feels welcoming and modern. The high-rise waistline visually balances torso and leg proportions.',
    pieces: [
      { id: 'p6', name: 'Tailored Camel Peak-Lapel Wool Blazer', category: 'Outerwear' },
      { id: 'p7', name: 'Wide-Leg Tailored Trousers in Sand', category: 'Bottoms' },
      { id: 'p8', name: 'Ivory Satin Button-Down Shirt with French Cuffs', category: 'Tops' },
      { id: 'p9', name: 'Structured Leather Work Tote with Brass Buckle', category: 'Accessories' },
      { id: 'p10', name: 'Cognac Leather Loafers with Gold Bit', category: 'Footwear' },
    ],
  },
  {
    id: 'look-effortless-weekend',
    title: 'Effortless Weekend',
    shortDescription: 'Cashmere-blend crewneck sweater with vintage straight-leg denim and minimal leather court shoes.',
    category: 'Casual',
    occasions: ['Saturday Brunch', 'Artisan Market', 'Wine Estate Walk'],
    seasons: ['All-Season', 'Spring', 'Autumn'],
    colorPalette: ['#D9C3B0', '#4A6984', '#FFFFFF', '#242326'],
    imageUrl: weekendCasualImg,
    collectionIds: ['col-weekend-essentials'],
    matchAesthetics: ['Casual & Comfortable', 'Modern & Minimal'],
    whyItWorks:
      'Pairing high-end natural cashmere with relaxed vintage-wash denim strikes the sweet spot of off-duty luxury. The slight front French tuck defines the waist without sacrificing relaxed comfort.',
    pieces: [
      { id: 'p11', name: 'Oatmeal Soft Cashmere-Blend Crewneck', category: 'Tops' },
      { id: 'p12', name: 'Raw-Hem Relaxed Straight-Leg Denim', category: 'Bottoms' },
      { id: 'p13', name: 'Pristine White Calfskin Minimalist Sneakers', category: 'Footwear' },
      { id: 'p14', name: 'Woven Slouchy Leather Shoulder Bag', category: 'Accessories' },
    ],
  },
  {
    id: 'look-evening-elegance',
    title: 'Evening Elegance',
    shortDescription: 'Forest green bias-cut silk slip dress with draped tailored black wool coat.',
    category: 'Evening Wear',
    occasions: ['Fine Dining', 'Opera & Theatre', 'Cocktail Lounge'],
    seasons: ['All-Season', 'Winter', 'Autumn'],
    colorPalette: ['#1B382B', '#242326', '#E5CDBE', '#B49361'],
    imageUrl: dateNightImg,
    collectionIds: ['col-date-night-edit', 'col-effortless-elegance'],
    matchAesthetics: ['Classic & Elegant', 'Chic & Sophisticated'],
    whyItWorks:
      'High-sheen silk bias draping responds gracefully to body movement, while an oversized tailored wool coat draped over the shoulders anchors the look with high-fashion restraint and warmth.',
    pieces: [
      { id: 'p15', name: 'Bias-Cut Silk Blend Midi Slip in Deep Forest', category: 'Dress' },
      { id: 'p16', name: 'Oversized Double-Breasted Wool Blend Coat', category: 'Outerwear' },
      { id: 'p17', name: 'Delicate Ankle-Strap Stiletto in Nude Leather', category: 'Footwear' },
      { id: 'p18', name: 'Sculptural Gold Twisted Hoop Earrings', category: 'Accessories' },
    ],
  },
  {
    id: 'look-relaxed-luxury',
    title: 'Relaxed Luxury',
    shortDescription: 'Fluid terracotta knit coordinate with wide-leg culottes and minimal leather sandals.',
    category: 'Casual',
    occasions: ['Resort Dining', 'Garden Gathering', 'Weekend Getaway'],
    seasons: ['Summer', 'Spring'],
    colorPalette: ['#9C6A61', '#E5CDBE', '#F6F2EC', '#242326'],
    imageUrl: occasionFamilyOutingImg,
    collectionIds: ['col-weekend-essentials', 'col-summer-sa'],
    matchAesthetics: ['Casual & Comfortable', 'Modern & Minimal'],
    whyItWorks:
      'Breathable, lightweight ribbed knitwear offers maximum movement while looking refined and cohesive. The earthy terracotta palette flatters warmer undertones and natural outdoor lighting.',
    pieces: [
      { id: 'p19', name: 'Ribbed Knit Sleeveless Shell Top in Terracotta', category: 'Tops' },
      { id: 'p20', name: 'Matching Wide-Leg Cropped Knit Culottes', category: 'Bottoms' },
      { id: 'p21', name: 'Tan Leather Slide Sandals', category: 'Footwear' },
      { id: 'p22', name: 'Tortoiseshell Rounded Sunglasses', category: 'Accessories' },
    ],
  },
  {
    id: 'look-classic-bw',
    title: 'Classic Black & White',
    shortDescription: 'Sculptural ivory wrap top paired with tailored fluid black palazzo trousers.',
    category: 'Minimalist',
    occasions: ['Design Exhibition', 'Evening Reception', 'Bistro Dinner'],
    seasons: ['All-Season', 'Spring', 'Autumn'],
    colorPalette: ['#242326', '#FFFFFF', '#FAF7F2', '#B49361'],
    imageUrl: styleMinimalImg,
    collectionIds: ['col-minimalist-wardrobe', 'col-timeless-classics'],
    matchAesthetics: ['Modern & Minimal', 'Classic & Elegant'],
    whyItWorks:
      'High-contrast black and white never dates. The asymmetrical architectural wrap of the top provides subtle graphic interest without relying on busy patterns or embellishments.',
    pieces: [
      { id: 'p23', name: 'Sculptural Asymmetric Wrap Top in Crisp White', category: 'Tops' },
      { id: 'p24', name: 'Fluid Obsidian Crepe Palazzo Trousers', category: 'Bottoms' },
      { id: 'p25', name: 'Square-Toe Minimalist Heeled Mules', category: 'Footwear' },
      { id: 'p26', name: 'Polished Brass Cuff Bracelet', category: 'Accessories' },
    ],
  },
  {
    id: 'look-soft-romantic',
    title: 'Soft Romantic',
    shortDescription: 'Square-neck floral jacquard midi dress with soft champagne luster and delicate ankle-tie sandals.',
    category: 'Romantic',
    occasions: ['Garden Wedding', 'High Tea', 'Engagement Party'],
    seasons: ['Spring', 'Summer'],
    colorPalette: ['#E5CDBE', '#F6F2EC', '#B49361', '#9C6A61'],
    imageUrl: weddingGuestImg,
    collectionIds: ['col-wedding-guest', 'col-effortless-elegance'],
    matchAesthetics: ['Romantic & Feminine', 'Classic & Elegant'],
    whyItWorks:
      'The structured square neckline flatters the collarbone while the gentle A-line skirt creates graceful movement across grass and outdoor estate terraces. Champagne undertones photograph luminously.',
    pieces: [
      { id: 'p27', name: 'Floral Jacquard Midi Dress in Champagne Blush', category: 'Dress' },
      { id: 'p28', name: 'Block-Heel Ankle-Strap Sandal in Soft Gold', category: 'Footwear' },
      { id: 'p29', name: 'Woven Satin Minaudière Evening Clutch', category: 'Accessories' },
      { id: 'p30', name: 'Pearl Drop Huggie Earrings', category: 'Accessories' },
    ],
  },
  {
    id: 'look-bold-statement',
    title: 'Bold Statement',
    shortDescription: 'Vibrant color-blocked tailored coordinates with sharp geometric silhouettes and modern eyewear.',
    category: 'Trendy',
    occasions: ['Fashion Event', 'Rooftop Lounge', 'Creative Pitch'],
    seasons: ['All-Season', 'Spring', 'Summer'],
    colorPalette: ['#9C6A61', '#242326', '#B49361', '#F6F2EC'],
    imageUrl: styleTrendyImg,
    collectionIds: ['col-bold-beautiful'],
    matchAesthetics: ['Trendy & Bold'],
    whyItWorks:
      'Fearless color interplay with clean lines avoids looking chaotic. Grounding the bold palette with tailored seams and structured accessories provides directional, runway-level polish.',
    pieces: [
      { id: 'p31', name: 'Saturated Structured Cropped Jacket', category: 'Outerwear' },
      { id: 'p32', name: 'High-Waist Tailored Tapered Pants', category: 'Bottoms' },
      { id: 'p33', name: 'Sculptural Chunky Statement Ring', category: 'Accessories' },
      { id: 'p34', name: 'Sharp Pointed Stiletto Booties', category: 'Footwear' },
    ],
  },
  {
    id: 'look-coastal-summer',
    title: 'Coastal Summer',
    shortDescription: 'Breathable terracotta tiered linen maxi dress with handwoven sun hat and leather slides.',
    category: 'Casual',
    occasions: ['Camps Bay Sunset', 'Beachside Brunch', 'Garden Vineyard'],
    seasons: ['Summer', 'Spring'],
    colorPalette: ['#9C6A61', '#E5CDBE', '#F6F2EC', '#4A6984'],
    imageUrl: holidayResortImg,
    collectionIds: ['col-summer-sa', 'col-weekend-essentials'],
    matchAesthetics: ['Casual & Comfortable', 'Romantic & Feminine'],
    whyItWorks:
      'Natural pre-washed linen breathes in the South African heat while resisting heavy creasing. The warm terracotta hue mirrors our coastal sunsets and provides natural radiance against sun-kissed skin.',
    pieces: [
      { id: 'p35', name: 'Tiered Halter Linen Maxi Dress in Terracotta', category: 'Dress' },
      { id: 'p36', name: 'Handcrafted Wide-Brimmed Straw Sun Hat', category: 'Accessories' },
      { id: 'p37', name: 'Natural Vachetta Leather Slides', category: 'Footwear' },
      { id: 'p38', name: 'Woven Raffia Market Shopper', category: 'Accessories' },
    ],
  },
  {
    id: 'look-winter-sophistication',
    title: 'Winter Sophistication',
    shortDescription: 'Architectural one-shoulder evening gown in heavyweight crepe with gold wrist cuff.',
    category: 'Evening Wear',
    occasions: ['Charity Gala', 'Black Tie Dinner', 'Awards Ceremony'],
    seasons: ['Winter', 'All-Season'],
    colorPalette: ['#242326', '#B49361', '#FAF7F2', '#9C6A61'],
    imageUrl: specialGalaImg,
    collectionIds: ['col-winter-layers', 'col-effortless-elegance'],
    matchAesthetics: ['Classic & Elegant', 'Modern & Minimal'],
    whyItWorks:
      'One-shoulder architecture draws the eye upward to the face and collarbone. The fluid drape of matte black crepe absorbs light for a slimming, statuesque presence.',
    pieces: [
      { id: 'p39', name: 'One-Shoulder Column Crepe Gown in Matte Black', category: 'Dress' },
      { id: 'p40', name: 'Brushed Brass Sculptural Wrist Cuff', category: 'Accessories' },
      { id: 'p41', name: 'Patent Obsidian Pointed Evening Pumps', category: 'Footwear' },
      { id: 'p42', name: 'Black Velvet Micro Clutch with Chain Strap', category: 'Accessories' },
    ],
  },
  {
    id: 'look-casual-denim-edit',
    title: 'Casual Denim Edit',
    shortDescription: 'Modern active layering with cropped bomber, high-waisted utility denim, and clean sneakers.',
    category: 'Sporty',
    occasions: ['Travel Day', 'Coffee Run', 'Casual Studio Meeting'],
    seasons: ['All-Season', 'Autumn', 'Winter'],
    colorPalette: ['#242326', '#4A6984', '#E5CDBE', '#FFFFFF'],
    imageUrl: styleSportyImg,
    collectionIds: ['col-weekend-essentials'],
    matchAesthetics: ['Casual & Comfortable', 'Sporty & Active'],
    whyItWorks:
      'Elevating sporty athleisure elements with structured tailoring textures creates an energized, polished aesthetic suitable for busy urban days.',
    pieces: [
      { id: 'p43', name: 'Matte Lightweight Technical Bomber Jacket', category: 'Outerwear' },
      { id: 'p44', name: 'High-Rise Relaxed Utility Denim', category: 'Bottoms' },
      { id: 'p45', name: 'Classic Leather Court Sneakers in Monochrome', category: 'Footwear' },
      { id: 'p46', name: 'Compact Crossbody Phone & Card Pouch', category: 'Accessories' },
    ],
  },
  {
    id: 'look-timeless-neutrals',
    title: 'Timeless Neutrals',
    shortDescription: 'Double-breasted trench layered over neutral knitwear and tailored wide-leg trousers.',
    category: 'Minimalist',
    occasions: ['City Stroll', 'Executive Commute', 'Sunday Gallery'],
    seasons: ['Autumn', 'Spring', 'Winter'],
    colorPalette: ['#D9C3B0', '#F6F2EC', '#242326', '#C4A882'],
    imageUrl: styleClassicImg,
    collectionIds: ['col-timeless-classics', 'col-minimalist-wardrobe'],
    matchAesthetics: ['Classic & Elegant', 'Modern & Minimal'],
    whyItWorks:
      'Tone-on-tone dressing across biscuit, sand, and ivory is the ultimate hallmark of quiet luxury. Layering diverse weights ensures season-transitional utility.',
    pieces: [
      { id: 'p47', name: 'Water-Resistant Cotton Gabardine Trench Coat', category: 'Outerwear' },
      { id: 'p48', name: 'Fine-Gauge Merino Wool Turtleneck in Biscuit', category: 'Tops' },
      { id: 'p49', name: 'Pleated Wool-Blend Wide Trousers', category: 'Bottoms' },
      { id: 'p50', name: 'Sleek Almond-Toe Leather Ankle Boots', category: 'Footwear' },
    ],
  },
];

/**
 * Filter looks by collection
 */
export function getLooksByCollection(collectionId: string): FashionLook[] {
  return FASHION_LOOKS.filter((look) => look.collectionIds.includes(collectionId));
}

/**
 * Get personalized curated looks matching the customer's style preferences
 */
export function getCuratedLooksForProfile(userStyles?: string[]): FashionLook[] {
  if (!userStyles || userStyles.length === 0) {
    return FASHION_LOOKS.slice(0, 4);
  }

  // Find looks that match user's chosen aesthetic tags
  const matched = FASHION_LOOKS.filter((look) =>
    look.matchAesthetics.some((aesthetic) => userStyles.includes(aesthetic))
  );

  if (matched.length >= 3) {
    return matched;
  }

  // Fallback: merge matched with top editorial looks to ensure at least 4 items
  const ids = new Set(matched.map((m) => m.id));
  const fallback = FASHION_LOOKS.filter((l) => !ids.has(l.id));
  return [...matched, ...fallback].slice(0, 4);
}

/**
 * Filter looks by search term across title, category, occasions, and pieces
 */
export function searchFashionLooks(query: string, categoryFilter: FashionCategoryType): FashionLook[] {
  let list = FASHION_LOOKS;

  if (categoryFilter !== 'All Styles') {
    list = list.filter((look) => look.category === categoryFilter);
  }

  const q = query.trim().toLowerCase();
  if (!q) {
    return list;
  }

  return list.filter((look) => {
    const inTitle = look.title.toLowerCase().includes(q);
    const inCategory = look.category.toLowerCase().includes(q);
    const inOccasions = look.occasions.some((occ) => occ.toLowerCase().includes(q));
    const inPieces = look.pieces.some((p) => p.name.toLowerCase().includes(q));
    const inDesc = look.shortDescription.toLowerCase().includes(q);
    const inSeasons = look.seasons.some((s) => s.toLowerCase().includes(q));
    return inTitle || inCategory || inOccasions || inPieces || inDesc || inSeasons;
  });
}
