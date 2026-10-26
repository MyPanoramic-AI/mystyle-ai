/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Central demonstration mock data for MyStyle AI.
 * Note: Decoupled from production services to allow smooth replacement
 * with live APIs in Phase 2.
 */

import { OccasionShortcut, FeatureCardItem, StyleInspiration, StyleCategoryItem } from '../types';

import heroEditorialImg from '../assets/images/hero_editorial_fashion_1791978397716.jpg';
import dateNightImg from '../assets/images/fashion_date_night_1791978397788.jpg';
import weddingGuestImg from '../assets/images/fashion_wedding_guest_1791978399342.jpg';
import workOfficeImg from '../assets/images/fashion_work_office_1791978399975.jpg';
import weekendCasualImg from '../assets/images/fashion_weekend_casual_1791978401075.jpg';
import specialGalaImg from '../assets/images/fashion_special_gala_1791978474099.jpg';
import holidayResortImg from '../assets/images/fashion_holiday_resort_1791978473683.jpg';

// Style category photography
import styleClassicImg from '../assets/images/style_classic_tailored_1791980329558.jpg';
import styleMinimalImg from '../assets/images/style_modern_minimal_1791980327769.jpg';
import styleTrendyImg from '../assets/images/style_trendy_bold_1791980328578.jpg';
import styleSportyImg from '../assets/images/style_sporty_active_1791980329185.jpg';

// New occasion & beauty photography
import occasionFamilyOutingImg from '../assets/images/occasion_family_outing_1791981234661.jpg';
import occasionDinnerFriendsImg from '../assets/images/occasion_dinner_friends_1791981235791.jpg';
import beautyHairstylesImg from '../assets/images/beauty_hairstyles_1791981235184.jpg';
import beautyMakeupImg from '../assets/images/beauty_makeup_1791981236922.jpg';
import beautyNailsImg from '../assets/images/beauty_nails_1791981236875.jpg';

export const HERO_DATA = {
  headline: 'What are we styling today?',
  subheadline: "From everyday outfits to unforgettable occasions. Let's create your next look.",
  ctaText: 'Style My Look',
  imageUrl: heroEditorialImg || '/images/hero.jpg',
  quickPrompts: [
    'Dinner in Camps Bay tonight',
    'Effortless boardroom tailoring',
    'Garden wedding guest dress',
  ],
};

export const OCCASION_SHORTCUTS: OccasionShortcut[] = [
  {
    id: 'date-night',
    title: 'Date Night',
    subtitle: 'Chic, intimate & effortless',
    imageUrl: dateNightImg || '/images/date_night.jpg',
    recommendedTone: 'Emerald slip dress with tailored drape',
    promptSuggestion: 'Help me style an alluring yet sophisticated date night look for an evening dinner.',
  },
  {
    id: 'wedding-guest',
    title: 'Wedding Guest',
    subtitle: 'Refined celebration elegance',
    imageUrl: weddingGuestImg || '/images/wedding_guest.jpg',
    recommendedTone: 'Champagne floral jacquard with soft gold',
    promptSuggestion: 'I need an elegant wedding guest outfit that is respectful, timeless, and photogenic.',
  },
  {
    id: 'work-office',
    title: 'Work & Office',
    subtitle: 'Smart tailoring & composure',
    imageUrl: workOfficeImg || '/images/work_office.jpg',
    recommendedTone: 'Camel monochrome with silk blouse',
    promptSuggestion: 'Curate a modern executive office look that balances authority and modern elegance.',
  },
  {
    id: 'weekend-casual',
    title: 'Weekend Casual',
    subtitle: 'Elevated off-duty comfort',
    imageUrl: weekendCasualImg || '/images/weekend_casual.jpg',
    recommendedTone: 'Cashmere knit & wide-leg relaxed denim',
    promptSuggestion: 'Recommend a polished weekend outfit for brunch and gallery walking.',
  },
  {
    id: 'special-occasion',
    title: 'Special Occasion',
    subtitle: 'High-glamour gala & black tie',
    imageUrl: specialGalaImg || '/images/special_gala.jpg',
    recommendedTone: 'Sculptural architectural black & gold gown',
    promptSuggestion: 'Style an unforgettable black-tie gala gown with understated luxury jewelry.',
  },
  {
    id: 'holiday-looks',
    title: 'Holiday Looks',
    subtitle: 'Sun-drenched getaway resort',
    imageUrl: holidayResortImg || '/images/holiday_resort.jpg',
    recommendedTone: 'Terracotta linen halter & woven straw',
    promptSuggestion: 'Create a breathable resort wardrobe capsule for a coastal summer escape.',
  },
  {
    id: 'family-outing',
    title: 'Family Outing',
    subtitle: 'Elevated relaxed togetherness',
    imageUrl: occasionFamilyOutingImg || '/images/occasion_family_outing.jpg',
    recommendedTone: 'Linen separates with breathable drape',
    promptSuggestion: 'Curate a comfortable and photogenic outfit for a family day out in the Cape Winelands.',
  },
  {
    id: 'dinner-friends',
    title: 'Dinner With Friends',
    subtitle: 'Lively cocktail evening',
    imageUrl: occasionDinnerFriendsImg || '/images/occasion_dinner_friends.jpg',
    recommendedTone: 'Contemporary cocktail midi with statement earrings',
    promptSuggestion: 'Help me pick a vibrant, chic dinner look for catch-up drinks with close friends.',
  },
];

export const FEATURE_CARDS: FeatureCardItem[] = [
  {
    id: 'virtual-try-on',
    title: 'Virtual Try-On',
    description: 'Upload your photo and preview how outfits drape before ordering.',
    targetTab: 'try-on',
    accent: 'rose',
    isUpcoming: true,
    upcomingPhase: 'Phase 2 Camera & Neural Fitting',
  },
  {
    id: 'shop-the-look',
    title: 'Shop the Look',
    description: 'Find matching garments across South African retailers with price checks.',
    targetTab: 'shop',
    accent: 'gold',
    isUpcoming: true,
    upcomingPhase: 'Phase 2 SA Retail Catalog Sync',
  },
  {
    id: 'beauty-studio',
    title: 'Beauty Studio',
    description: 'Complementary hairstyle, makeup palettes, and nail tones for every fit.',
    accent: 'rose',
    isUpcoming: true,
    upcomingPhase: 'Phase 3 Personalized Glam Engine',
  },
  {
    id: 'my-wardrobe',
    title: 'My Wardrobe',
    description: 'Digitize your closet to remix existing favorites with smart new staples.',
    accent: 'charcoal',
    isUpcoming: true,
    upcomingPhase: 'Phase 3 Closet Digitizer',
  },
];

export const STYLE_INSPIRATIONS: StyleInspiration[] = [
  {
    id: 'insp-1',
    title: 'Sculptural Sand Monotone',
    aesthetic: 'Classic & Elegant',
    occasion: 'Creative Executive',
    imageUrl: heroEditorialImg || '/images/hero.jpg',
    palette: ['#F6F2EC', '#E5CDBE', '#242326', '#B49361'],
    keyPieces: ['Oatmeal structured double-breasted blazer', 'Pleated wide-leg trousers', 'Brushed gold dome earrings'],
    stylistNote: 'Tonal dressing in cream and sand lengthens the silhouette and projects calm authority.',
  },
  {
    id: 'insp-2',
    title: 'Midnight Emerald Drape',
    aesthetic: 'Chic & Sophisticated',
    occasion: 'Fine Dining & Cocktails',
    imageUrl: dateNightImg || '/images/date_night.jpg',
    palette: ['#1B382B', '#242326', '#E5CDBE', '#B49361'],
    keyPieces: ['Silk bias-cut slip dress in deep forest', 'Charcoal tailored overcoat', 'Minimalist black strap heels'],
    stylistNote: 'Pairing high-sheen satin with heavy textured wool creates an irresistible textural contrast.',
  },
  {
    id: 'insp-3',
    title: 'Golden Hour Jacquard',
    aesthetic: 'Romantic & Feminine',
    occasion: 'Garden Nuptials',
    imageUrl: weddingGuestImg || '/images/wedding_guest.jpg',
    palette: ['#E5CDBE', '#F6F2EC', '#B49361', '#9C6A61'],
    keyPieces: ['Square neckline floral brocade midi dress', 'Soft metallic ankle-strap sandals', 'Satin minaudière'],
    stylistNote: 'Subtle metallic thread catches natural sunlight without clashing in bridal party photos.',
  },
  {
    id: 'insp-4',
    title: 'Modern Terrace Ease',
    aesthetic: 'Casual & Comfortable',
    occasion: 'Weekend Escape',
    imageUrl: weekendCasualImg || '/images/weekend_casual.jpg',
    palette: ['#D9C3B0', '#4A6984', '#9C6A61', '#FFFFFF'],
    keyPieces: ['Oatmeal crewneck cashmere knit', 'Raw-hem relaxed straight denim', 'Tan structured leather tote'],
    stylistNote: 'Premium natural textiles elevate basic casual wear into effortless, sophisticated off-duty style.',
  },
  {
    id: 'insp-5',
    title: 'Nordic Architectural Column',
    aesthetic: 'Modern & Minimal',
    occasion: 'Gallery Preview',
    imageUrl: styleMinimalImg || '/images/style_modern_minimal.jpg',
    palette: ['#F6F2EC', '#A89F91', '#242326', '#E5CDBE'],
    keyPieces: ['Sculptural cream wrap top', 'Taupe fluid palazzo trousers', 'Square-toe minimalist loafers'],
    stylistNote: 'Clean asymmetric folds create high-fashion visual intrigue without needing busy prints.',
  },
  {
    id: 'insp-6',
    title: 'Bronze Urban Statement',
    aesthetic: 'Trendy & Bold',
    occasion: 'Fashion Week Streetstyle',
    imageUrl: styleTrendyImg || '/images/style_trendy_bold.jpg',
    palette: ['#7A4B29', '#B49361', '#242326', '#000000'],
    keyPieces: ['Metallic bronze leather bomber', 'Chocolate wide-leg leather trousers', 'Chunky lug-sole loafers'],
    stylistNote: 'Balancing metallic sheen with deep earthy tones keeps high-fashion street style grounded.',
  },
  {
    id: 'insp-7',
    title: 'Tailored Camel Executive',
    aesthetic: 'Smart & Professional',
    occasion: 'Boardroom Presentation',
    imageUrl: workOfficeImg || '/images/work_office.jpg',
    palette: ['#D4B996', '#FFFFFF', '#242326', '#B49361'],
    keyPieces: ['Camel wool power suit', 'Silk cowl-neck ivory blouse', 'Structured black leather tote'],
    stylistNote: 'Monochromatic warm neutrals convey approachability and sharp executive presence.',
  },
  {
    id: 'insp-8',
    title: 'Technical Cashmere Athleisure',
    aesthetic: 'Sporty & Active',
    occasion: 'Travel & Studio Workout',
    imageUrl: styleSportyImg || '/images/style_sporty_active.jpg',
    palette: ['#4A5568', '#A0AEC0', '#8D7B68', '#FFFFFF'],
    keyPieces: ['Ribbed slate-grey performance set', 'Oversized taupe cashmere wrap coat', 'Neutral designer runners'],
    stylistNote: 'Layering structured coats over sleek technical fabrics turns gym wear into chic street attire.',
  },
];

export const STYLE_CATEGORIES: StyleCategoryItem[] = [
  {
    id: 'classic-elegant',
    title: 'Classic & Elegant',
    description: 'Timeless tailoring, iconic trench coats and clean structured lines.',
    imageUrl: styleClassicImg || '/images/style_classic_tailored.jpg',
  },
  {
    id: 'modern-minimal',
    title: 'Modern & Minimal',
    description: 'Architectural cuts, refined monotone palette and quiet luxury.',
    imageUrl: styleMinimalImg || '/images/style_modern_minimal.jpg',
  },
  {
    id: 'casual-comfortable',
    title: 'Casual & Comfortable',
    description: 'Elevated knitwear, relaxed denim and effortless weekend ease.',
    imageUrl: weekendCasualImg || '/images/weekend_casual.jpg',
  },
  {
    id: 'trendy-bold',
    title: 'Trendy & Bold',
    description: 'Runway statement pieces, rich textures and confident street style.',
    imageUrl: styleTrendyImg || '/images/style_trendy_bold.jpg',
  },
  {
    id: 'smart-professional',
    title: 'Smart & Professional',
    description: 'Power dressing, contemporary blazers and executive composure.',
    imageUrl: workOfficeImg || '/images/work_office.jpg',
  },
  {
    id: 'romantic-feminine',
    title: 'Romantic & Feminine',
    description: 'Graceful silhouettes, delicate florals and celebratory jacquards.',
    imageUrl: weddingGuestImg || '/images/wedding_guest.jpg',
  },
  {
    id: 'sporty-active',
    title: 'Sporty & Active',
    description: 'Technical athleisure, sleek luxury active sets and mobility.',
    imageUrl: styleSportyImg || '/images/style_sporty_active.jpg',
  },
  {
    id: 'chic-sophisticated',
    title: 'Chic & Sophisticated',
    description: 'Alluring slip dresses, evening overcoats and polished allure.',
    imageUrl: dateNightImg || '/images/date_night.jpg',
  },
];

export const BEAUTY_INSPIRATIONS = [
  {
    id: 'beauty-hair',
    title: 'Hairstyles',
    subtitle: 'Sculpted updos, loose waves & effortless textures',
    imageUrl: beautyHairstylesImg || '/images/beauty_hairstyles.jpg',
    tagline: 'Complements your outfit neckline',
  },
  {
    id: 'beauty-makeup',
    title: 'Makeup Looks',
    subtitle: 'Dewy skin, soft muted rose lips & natural brows',
    imageUrl: beautyMakeupImg || '/images/beauty_makeup.jpg',
    tagline: 'Harmonizes with your colour palette',
  },
  {
    id: 'beauty-nails',
    title: 'Nails & Beauty',
    subtitle: 'Glazed nude almond manicures & fine detailing',
    imageUrl: beautyNailsImg || '/images/beauty_nails.jpg',
    tagline: 'The understated luxury finishing touch',
  },
];

export const SHOPPING_CATEGORIES = [
  { id: 'dresses', name: 'Dresses & Gowns', subtitle: 'Slip dresses, wrap midis & gala gowns' },
  { id: 'tops', name: 'Tops & Blouses', subtitle: 'Tailored shirts, silk blouses & knitwear' },
  { id: 'trousers', name: 'Trousers & Jeans', subtitle: 'Wide-leg trousers, relaxed denim & tailoring' },
  { id: 'shoes', name: 'Shoes & Footwear', subtitle: 'Minimalist heels, leather loafers & runners' },
  { id: 'bags', name: 'Bags & Accessories', subtitle: 'Structured totes, clutches & fine jewelry' },
];

export const SOUTH_AFRICAN_RETAILERS = [
  'Woolworths',
  'Superbalist',
  'Mr Price',
  'Bash',
  'Cotton On',
  'H&M',
  'Zara',
  'Takealot',
  'Country Road',
  'Poetry',
  'PnP Clothing',
  'Pep',
  'Ackermans',
  'Jet',
  'Exact',
  'Foschini',
  'Truworths',
  'Edgars',
  'Identity',
  'Miladys',
  'Queenspark',
  'Markham',
  'The Fix',
  'YDE',
  'Factorie',
  'Old Khaki',
  'Cape Union Mart',
  'Sportscene',
  'Totalsports',
  'Fabiani',
  'Trenery',
  'Sheet Street',
  'Shein',
  'Other',
];

export const SWATCH_COLORS = [
  { name: 'Warm Ivory', hex: '#F6F2EC', border: true },
  { name: 'Soft Blush', hex: '#E5CDBE', border: false },
  { name: 'Muted Rose', hex: '#9C6A61', border: false },
  { name: 'Camel / Tan', hex: '#C49A6C', border: false },
  { name: 'Deep Olive', hex: '#4B5320', border: false },
  { name: 'Navy Blue', hex: '#1B263B', border: false },
  { name: 'Forest Emerald', hex: '#1B382B', border: false },
  { name: 'Burgundy Wine', hex: '#5E1914', border: false },
  { name: 'Rich Chocolate', hex: '#3E2723', border: false },
  { name: 'Charcoal Grey', hex: '#242326', border: false },
  { name: 'Pure White', hex: '#FFFFFF', border: true },
  { name: 'Soft Gold', hex: '#B49361', border: false },
];

export const AVOID_COLORS_LIST = [
  'Neon Yellow',
  'Bright Orange',
  'Hot Pink',
  'Lime Green',
  'Electric Blue',
  'Mustard Yellow',
  'None',
];

export const SIZE_OPTIONS = {
  tops: ['XS (SA 30)', 'S (SA 32)', 'M (SA 34)', 'L (SA 36)', 'XL (SA 38)', 'XXL (SA 40)', 'Not sure'],
  bottoms: ['28 (SA 32)', '30 (SA 32/34)', '32 (SA 34)', '34 (SA 36)', '36 (SA 38)', '38 (SA 40)', '40 (SA 42)', 'Not sure'],
  dresses: ['SA 30 / UK 6', 'SA 32 / UK 8', 'SA 34 / UK 10', 'SA 36 / UK 12', 'SA 38 / UK 14', 'SA 40 / UK 16', 'Not sure'],
  shoes: ['SA/UK 3', 'SA/UK 4', 'SA/UK 5', 'SA/UK 6', 'SA/UK 7', 'SA/UK 8', 'SA/UK 9', 'Not sure'],
};

export const DEMO_USER_PROFILE = {
  name: 'Nandi',
  location: 'Cape Town, South Africa',
  stylePersona: 'Chic Minimalist & Contemporary Tailoring',
  bodyShape: 'Balanced Hourglass',
  favoriteColors: ['Warm Ivory', 'Deep Olive', 'Muted Rose', 'Soft Camel'],
  budgetTier: 'Smart Premium',
  retailersInterest: ['Woolworths Studio', 'Superbalist Editorial', 'Zara', 'Country Road'],
};
