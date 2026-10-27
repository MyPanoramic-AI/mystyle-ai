/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * South African Smart Shopping & Price Comparison Catalogue.
 * Purely illustrative demonstration dataset for frontend prototyping.
 * All prices, stock, and retailer affiliations are mock representations.
 */

import {
  Product,
  ProductCategory,
  SouthAfricanRetailer,
  ShoppingFilters,
  ShoppingSortOption,
} from '../types/shop';
import { UserProfile } from '../types';

import heroEditorialImg from '../assets/images/hero_editorial_fashion_1791978397716.jpg';
import dateNightImg from '../assets/images/fashion_date_night_1791978397788.jpg';
import weddingGuestImg from '../assets/images/fashion_wedding_guest_1791978399342.jpg';
import workOfficeImg from '../assets/images/fashion_work_office_1791978399975.jpg';
import weekendCasualImg from '../assets/images/fashion_weekend_casual_1791978401075.jpg';
import specialGalaImg from '../assets/images/fashion_special_gala_1791978474099.jpg';
import holidayResortImg from '../assets/images/fashion_holiday_resort_1791978473683.jpg';
import styleSportyImg from '../assets/images/style_sporty_active_1791980329185.jpg';
import styleClassicImg from '../assets/images/style_classic_tailored_1791980329558.jpg';
import styleMinimalImg from '../assets/images/style_modern_minimal_1791980327769.jpg';
import styleTrendyImg from '../assets/images/style_trendy_bold_1791980328578.jpg';

export interface CategoryInfo {
  name: ProductCategory;
  imageUrl: string;
  subtitle: string;
}

export const SHOP_CATEGORIES: CategoryInfo[] = [
  {
    name: 'Dresses',
    imageUrl: dateNightImg,
    subtitle: 'Slips, maxis & evening gowns',
  },
  {
    name: 'Tops & Blouses',
    imageUrl: styleMinimalImg,
    subtitle: 'Silks, shirting & knits',
  },
  {
    name: 'Jeans & Trousers',
    imageUrl: weekendCasualImg,
    subtitle: 'Tailored trousers & straight denim',
  },
  {
    name: 'Jackets & Blazers',
    imageUrl: heroEditorialImg,
    subtitle: 'Sculptural blazers & trench coats',
  },
  {
    name: 'Shoes',
    imageUrl: styleClassicImg,
    subtitle: 'Block heels, court sneakers & loafers',
  },
  {
    name: 'Bags',
    imageUrl: workOfficeImg,
    subtitle: 'Executive totes, clutches & woven bags',
  },
  {
    name: 'Jewellery & Accessories',
    imageUrl: specialGalaImg,
    subtitle: 'Brushed gold, silk scarves & sunglasses',
  },
  {
    name: 'Activewear',
    imageUrl: styleSportyImg,
    subtitle: 'Ribbed sets & studio layers',
  },
];

export const SA_RETAILERS: SouthAfricanRetailer[] = [
  'Woolworths',
  'Superbalist',
  'Zara',
  'Bash',
  'H&M',
  'Cotton On',
  'Mr Price',
  'Takealot',
];

export const POPULAR_SEARCH_PRESETS = [
  'Black evening dresses',
  'Wedding guest outfits',
  'Casual jeans',
  'White sneakers',
  'Elegant heels',
  'Professional blazers',
  'Affordable handbags',
  'Summer clothing',
];

export const DEMO_COLOURS = [
  'Black',
  'White',
  'Cream/Ivory',
  'Camel',
  'Navy',
  'Forest Green',
  'Blush',
  'Burgundy',
  'Gold',
  'Terracotta',
];

export const DEMO_SIZES = ['XS', 'S', 'M', 'L', 'XL', '32', '34', '36', '38', '40', 'One Size'];

export const DEMO_OCCASIONS = [
  'Work & Executive',
  'Date Night',
  'Wedding & Celebration',
  'Casual Weekend',
  'Resort & Holiday',
  'Cocktail & Gala',
];

export const DEMO_STYLE_CATEGORIES = [
  'Minimalist',
  'Classic Elegance',
  'Modern Professional',
  'Casual Chic',
  'Glamour & Evening',
  'Bohemian Resort',
  'Sporty Luxe',
];

export const SHOP_PRODUCTS: Product[] = [
  // 1. Jackets & Blazers
  {
    id: 'prod-cream-sculptural-blazer',
    name: 'Sculptural Double-Breasted Wool-Blend Blazer',
    category: 'Jackets & Blazers',
    colour: 'Cream/Ivory',
    sizes: ['XS', 'S', 'M', 'L', '34', '36', '38'],
    styleCategory: 'Classic Elegance',
    imageUrl: heroEditorialImg,
    retailer: 'Woolworths',
    demoPriceZar: 1499,
    demoOriginalPriceZar: 1899,
    demoDiscountPercent: 21,
    occasionTags: ['Work & Executive', 'Date Night', 'Cocktail & Gala'],
    shortDescription: 'Tailored cream single/double-breasted blend blazer with soft peak lapels and horn buttons.',
    longDescription:
      'Engineered with light shoulder padding for commanding presence without stiffness. Made from a breathable, crease-resistant wool-viscose blend perfect for transitional South African climates.',
    stylingSuggestions: [
      'Pair with matching high-waisted pleated trousers for an unbroken monochrome line.',
      'Drape over a silk midi dress with minimalist strappy heels for an evening gala.',
    ],
    dataQualityState: 'Demo Listing',
    lastChecked: 'Today · Prototype data',
    isDemoSale: true,
    isNewArrival: false,
    curatedForAesthetics: ['Classic & Elegant', 'Modern & Minimal', 'Smart & Professional'],
    offers: [
      {
        id: 'off-1a',
        retailer: 'Woolworths',
        priceZar: 1499,
        deliveryFeeZar: 0,
        estimatedTotalZar: 1499,
        availableSizes: ['XS', 'S', 'M', 'L'],
        status: 'Lowest Demo Price',
        dataQualityState: 'Demo Listing',
        inStock: true,
        deliveryEstimate: '2-4 business days (Free over R500)',
      },
      {
        id: 'off-1b',
        retailer: 'Superbalist',
        priceZar: 1549,
        deliveryFeeZar: 65,
        estimatedTotalZar: 1614,
        availableSizes: ['S', 'M', 'L', 'XL'],
        status: 'Similar Alternative',
        dataQualityState: 'Demo Listing',
        inStock: true,
        deliveryEstimate: 'Next-day in CPT/JHB',
      },
      {
        id: 'off-1c',
        retailer: 'Zara',
        priceZar: 1799,
        deliveryFeeZar: 95,
        estimatedTotalZar: 1894,
        availableSizes: ['XS', 'S', 'M'],
        status: 'Similar Alternative',
        dataQualityState: 'Demo Listing',
        inStock: true,
        deliveryEstimate: '3-5 business days',
      },
    ],
  },
  {
    id: 'prod-camel-wool-blazer',
    name: 'Modern Camel Peak-Lapel Executive Blazer',
    category: 'Jackets & Blazers',
    colour: 'Camel',
    sizes: ['32', '34', '36', '38', '40'],
    styleCategory: 'Modern Professional',
    imageUrl: workOfficeImg,
    retailer: 'Superbalist',
    demoPriceZar: 1299,
    occasionTags: ['Work & Executive', 'Client Meeting'],
    shortDescription: 'Warm camel blazer with structured lapels, tailored waist darting, and fluid drape.',
    longDescription:
      'A core wardrobe staple designed for long boardroom days. Retains crisp lines while allowing comfortable arm movement.',
    stylingSuggestions: [
      'Contrast against an ivory silk shirt and wide-leg sand trousers.',
      'Style down on Fridays with vintage straight-leg denim and leather bit loafers.',
    ],
    dataQualityState: 'Demo Listing',
    lastChecked: 'Today · Prototype data',
    isDemoSale: false,
    isNewArrival: true,
    curatedForAesthetics: ['Smart & Professional', 'Classic & Elegant'],
    offers: [
      {
        id: 'off-2a',
        retailer: 'Superbalist',
        priceZar: 1299,
        deliveryFeeZar: 65,
        estimatedTotalZar: 1364,
        availableSizes: ['32', '34', '36', '38', '40'],
        status: 'Lowest Demo Price',
        dataQualityState: 'Demo Listing',
        inStock: true,
        deliveryEstimate: 'Next-day delivery available',
      },
      {
        id: 'off-2b',
        retailer: 'Bash',
        priceZar: 1399,
        deliveryFeeZar: 0,
        estimatedTotalZar: 1399,
        availableSizes: ['34', '36', '38'],
        status: 'Similar Alternative',
        dataQualityState: 'Demo Listing',
        inStock: true,
        deliveryEstimate: '3-5 business days',
      },
    ],
  },
  {
    id: 'prod-heritage-trench-coat',
    name: 'Water-Resistant Double-Breasted Trench Coat',
    category: 'Jackets & Blazers',
    colour: 'Camel',
    sizes: ['XS', 'S', 'M', 'L'],
    styleCategory: 'Classic Elegance',
    imageUrl: styleClassicImg,
    retailer: 'Bash',
    demoPriceZar: 1699,
    demoOriginalPriceZar: 2199,
    demoDiscountPercent: 23,
    occasionTags: ['Casual Weekend', 'Work & Executive'],
    shortDescription: 'Classic double-breasted gabardine trench with waist belt, storm flap, and horn buckles.',
    longDescription:
      'Timeless trench cut to a mid-calf length that shields against wind while flattering every silhouette with a belted waistline.',
    stylingSuggestions: [
      'Tie belt casually in the back when wearing open over casual knitwear.',
      'Button fully and cinch waist with leather ankle boots on rainy Cape Town days.',
    ],
    dataQualityState: 'Demo Listing',
    lastChecked: 'Today · Prototype data',
    isDemoSale: true,
    curatedForAesthetics: ['Classic & Elegant', 'Modern & Minimal'],
    offers: [
      {
        id: 'off-3a',
        retailer: 'Bash',
        priceZar: 1699,
        deliveryFeeZar: 0,
        estimatedTotalZar: 1699,
        availableSizes: ['XS', 'S', 'M', 'L'],
        status: 'Lowest Demo Price',
        dataQualityState: 'Demo Listing',
        inStock: true,
        deliveryEstimate: '2-4 business days',
      },
      {
        id: 'off-3b',
        retailer: 'Woolworths',
        priceZar: 1799,
        deliveryFeeZar: 0,
        estimatedTotalZar: 1799,
        availableSizes: ['S', 'M', 'L'],
        status: 'Exact Match',
        dataQualityState: 'Demo Listing',
        inStock: true,
        deliveryEstimate: '3-5 business days',
      },
    ],
  },
  {
    id: 'prod-relaxed-linen-blazer',
    name: 'Unstructured Summer Linen-Blend Blazer',
    category: 'Jackets & Blazers',
    colour: 'Cream/Ivory',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    styleCategory: 'Bohemian Resort',
    imageUrl: holidayResortImg,
    retailer: 'Cotton On',
    demoPriceZar: 699,
    occasionTags: ['Casual Weekend', 'Resort & Holiday'],
    shortDescription: 'Breezy unstructured linen blazer with patch pockets and lightweight unlined back.',
    longDescription:
      'The essential summer layer that beats the midday sun while keeping your resort look put-together.',
    stylingSuggestions: [
      'Wear over swimwear or linen shorts with leather slides for coastal lunches.',
    ],
    dataQualityState: 'Demo Listing',
    lastChecked: 'Today · Prototype data',
    offers: [
      {
        id: 'off-4a',
        retailer: 'Cotton On',
        priceZar: 699,
        deliveryFeeZar: 50,
        estimatedTotalZar: 749,
        availableSizes: ['XS', 'S', 'M', 'L', 'XL'],
        status: 'Lowest Demo Price',
        dataQualityState: 'Demo Listing',
        inStock: true,
        deliveryEstimate: '2-4 business days',
      },
      {
        id: 'off-4b',
        retailer: 'Mr Price',
        priceZar: 550,
        deliveryFeeZar: 65,
        estimatedTotalZar: 615,
        availableSizes: ['S', 'M'],
        status: 'Similar Alternative',
        dataQualityState: 'Demo Listing',
        inStock: true,
        deliveryEstimate: '3-5 business days',
      },
    ],
  },

  // 2. Dresses
  {
    id: 'prod-forest-silk-slip-dress',
    name: 'Bias-Cut Heavy Silk-Blend Midi Slip Dress',
    category: 'Dresses',
    colour: 'Forest Green',
    sizes: ['XS', 'S', 'M', 'L'],
    styleCategory: 'Glamour & Evening',
    imageUrl: dateNightImg,
    retailer: 'Zara',
    demoPriceZar: 1199,
    occasionTags: ['Date Night', 'Cocktail & Gala', 'Wedding & Celebration'],
    shortDescription: 'Lustrous bias-cut midi dress with delicate adjustable straps and gentle cowl neckline.',
    longDescription:
      'Drapes softly across natural curves without clinging. The deep jewel forest hue flatters warm and olive undertones gorgeously under candlelight.',
    stylingSuggestions: [
      'Layer a sharply tailored black wool blazer over shoulders for effortless contrast.',
      'Style with minimal gold jewellery and pointed almond heels.',
    ],
    dataQualityState: 'Demo Listing',
    lastChecked: 'Today · Prototype data',
    curatedForAesthetics: ['Classic & Elegant', 'Chic & Sophisticated'],
    offers: [
      {
        id: 'off-5a',
        retailer: 'Zara',
        priceZar: 1199,
        deliveryFeeZar: 95,
        estimatedTotalZar: 1294,
        availableSizes: ['XS', 'S', 'M'],
        status: 'Standard',
        dataQualityState: 'Demo Listing',
        inStock: true,
        deliveryEstimate: '3-5 business days',
      },
      {
        id: 'off-5b',
        retailer: 'Superbalist',
        priceZar: 999,
        deliveryFeeZar: 65,
        estimatedTotalZar: 1064,
        availableSizes: ['XS', 'S', 'M', 'L'],
        status: 'Lowest Demo Price',
        dataQualityState: 'Demo Listing',
        inStock: true,
        deliveryEstimate: 'Next-day delivery available',
      },
    ],
  },
  {
    id: 'prod-black-midi-cocktail-dress',
    name: 'Architectural Square-Neck Black Midi Dress',
    category: 'Dresses',
    colour: 'Black',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    styleCategory: 'Classic Elegance',
    imageUrl: specialGalaImg,
    retailer: 'Woolworths',
    demoPriceZar: 899,
    demoOriginalPriceZar: 1199,
    demoDiscountPercent: 25,
    occasionTags: ['Date Night', 'Cocktail & Gala', 'Work & Executive'],
    shortDescription: 'Refined stretch-crepe black dress featuring an architectural neckline and clean column silhouette.',
    longDescription:
      'The definitive Little Black Dress updated for modern proportions. High-density stretch crepe retains shape all night.',
    stylingSuggestions: [
      'Add sculpted gold drop earrings and a sleek leather clutch.',
    ],
    dataQualityState: 'Demo Listing',
    lastChecked: 'Today · Prototype data',
    isDemoSale: true,
    curatedForAesthetics: ['Modern & Minimal', 'Classic & Elegant'],
    offers: [
      {
        id: 'off-6a',
        retailer: 'Woolworths',
        priceZar: 899,
        deliveryFeeZar: 0,
        estimatedTotalZar: 899,
        availableSizes: ['XS', 'S', 'M', 'L'],
        status: 'Lowest Demo Price',
        dataQualityState: 'Demo Listing',
        inStock: true,
        deliveryEstimate: 'Free delivery',
      },
      {
        id: 'off-6b',
        retailer: 'H&M',
        priceZar: 949,
        deliveryFeeZar: 50,
        estimatedTotalZar: 999,
        availableSizes: ['S', 'M', 'L'],
        status: 'Similar Alternative',
        dataQualityState: 'Demo Listing',
        inStock: true,
        deliveryEstimate: '3-4 business days',
      },
    ],
  },
  {
    id: 'prod-floral-brocade-wedding-maxi',
    name: 'Romantic Tiered Floral Midi Gown',
    category: 'Dresses',
    colour: 'Blush',
    sizes: ['32', '34', '36', '38'],
    styleCategory: 'Classic Elegance',
    imageUrl: weddingGuestImg,
    retailer: 'Superbalist',
    demoPriceZar: 1399,
    occasionTags: ['Wedding & Celebration', 'Date Night'],
    shortDescription: 'Delicate floral georgette dress with sheer bishop sleeves and empire waist tie.',
    longDescription:
      'Engineered specifically for romantic garden nuptials and winelands celebrations. Breathable and fluid under the sun.',
    stylingSuggestions: [
      'Pair with lawn-safe block heel sandals and pearl-accented drop earrings.',
    ],
    dataQualityState: 'Demo Listing',
    lastChecked: 'Today · Prototype data',
    offers: [
      {
        id: 'off-7a',
        retailer: 'Superbalist',
        priceZar: 1399,
        deliveryFeeZar: 0,
        estimatedTotalZar: 1399,
        availableSizes: ['32', '34', '36', '38'],
        status: 'Lowest Demo Price',
        dataQualityState: 'Demo Listing',
        inStock: true,
        deliveryEstimate: '2-3 business days',
      },
      {
        id: 'off-7b',
        retailer: 'Zara',
        priceZar: 1599,
        deliveryFeeZar: 95,
        estimatedTotalZar: 1694,
        availableSizes: ['34', '36'],
        status: 'Similar Alternative',
        dataQualityState: 'Demo Listing',
        inStock: true,
        deliveryEstimate: '3-5 business days',
      },
    ],
  },
  {
    id: 'prod-ivory-linen-shirt-dress',
    name: 'Belted Pure Linen Safari Shirt Dress',
    category: 'Dresses',
    colour: 'Cream/Ivory',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    styleCategory: 'Bohemian Resort',
    imageUrl: holidayResortImg,
    retailer: 'Cotton On',
    demoPriceZar: 599,
    occasionTags: ['Casual Weekend', 'Resort & Holiday'],
    shortDescription: 'Natural pure linen button-front dress with rolled cuffs and self-fabric waist tie.',
    longDescription:
      'Woven from 100% breathable linen that softens with every wash. Designed for effortless holiday relaxation.',
    stylingSuggestions: [
      'Cinch with a woven tan leather belt and pair with oversized sunglasses.',
    ],
    dataQualityState: 'Demo Listing',
    lastChecked: 'Today · Prototype data',
    offers: [
      {
        id: 'off-8a',
        retailer: 'Cotton On',
        priceZar: 599,
        deliveryFeeZar: 50,
        estimatedTotalZar: 649,
        availableSizes: ['XS', 'S', 'M', 'L'],
        status: 'Lowest Demo Price',
        dataQualityState: 'Demo Listing',
        inStock: true,
        deliveryEstimate: '2-4 business days',
      },
      {
        id: 'off-8b',
        retailer: 'Mr Price',
        priceZar: 420,
        deliveryFeeZar: 65,
        estimatedTotalZar: 485,
        availableSizes: ['S', 'M', 'L', 'XL'],
        status: 'Similar Alternative',
        dataQualityState: 'Demo Listing',
        inStock: true,
        deliveryEstimate: '3-5 business days',
      },
    ],
  },
  {
    id: 'prod-terracotta-ribbed-knit-dress',
    name: 'Fine-Rib Sleeveless Column Knit Dress',
    category: 'Dresses',
    colour: 'Terracotta',
    sizes: ['XS', 'S', 'M', 'L'],
    styleCategory: 'Minimalist',
    imageUrl: styleMinimalImg,
    retailer: 'H&M',
    demoPriceZar: 799,
    occasionTags: ['Casual Weekend', 'Date Night', 'Resort & Holiday'],
    shortDescription: 'Flattering high-neck ribbed knit dress in warm African earth tones.',
    longDescription:
      'Vertical micro-rib knit contouring with side slit for ease of stride. Works with flat sandals or high block heels.',
    stylingSuggestions: [
      'Style with hammered gold hoop earrings and a slouchy woven shoulder bag.',
    ],
    dataQualityState: 'Demo Listing',
    lastChecked: 'Today · Prototype data',
    offers: [
      {
        id: 'off-9a',
        retailer: 'H&M',
        priceZar: 799,
        deliveryFeeZar: 50,
        estimatedTotalZar: 849,
        availableSizes: ['XS', 'S', 'M', 'L'],
        status: 'Lowest Demo Price',
        dataQualityState: 'Demo Listing',
        inStock: true,
        deliveryEstimate: '3-5 business days',
      },
    ],
  },

  // 3. Tops & Blouses
  {
    id: 'prod-fluid-silk-shell-blouse',
    name: 'Fluid Silk Georgette Shell Blouse in Ivory',
    category: 'Tops & Blouses',
    colour: 'Cream/Ivory',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    styleCategory: 'Modern Professional',
    imageUrl: styleMinimalImg,
    retailer: 'Woolworths',
    demoPriceZar: 799,
    occasionTags: ['Work & Executive', 'Date Night'],
    shortDescription: 'Double-layered ivory silk shell with subtle keyhole back button closure.',
    longDescription:
      'Non-sheer double georgette drape that tucks flawlessly into high-waisted tailoring or hangs gracefully untucked.',
    stylingSuggestions: [
      'Layer beneath an oatmeal blazer for clean tonal boardroom sophistication.',
    ],
    dataQualityState: 'Demo Listing',
    lastChecked: 'Today · Prototype data',
    offers: [
      {
        id: 'off-10a',
        retailer: 'Woolworths',
        priceZar: 799,
        deliveryFeeZar: 0,
        estimatedTotalZar: 799,
        availableSizes: ['XS', 'S', 'M', 'L'],
        status: 'Lowest Demo Price',
        dataQualityState: 'Demo Listing',
        inStock: true,
        deliveryEstimate: 'Free delivery',
      },
      {
        id: 'off-10b',
        retailer: 'Bash',
        priceZar: 849,
        deliveryFeeZar: 0,
        estimatedTotalZar: 849,
        availableSizes: ['S', 'M'],
        status: 'Similar Alternative',
        dataQualityState: 'Demo Listing',
        inStock: true,
        deliveryEstimate: '3-5 business days',
      },
    ],
  },
  {
    id: 'prod-crisp-poplin-shirt',
    name: 'Oversized Organic Cotton Poplin Button-Down',
    category: 'Tops & Blouses',
    colour: 'White',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    styleCategory: 'Classic Elegance',
    imageUrl: heroEditorialImg,
    retailer: 'Superbalist',
    demoPriceZar: 649,
    demoOriginalPriceZar: 799,
    demoDiscountPercent: 19,
    occasionTags: ['Work & Executive', 'Casual Weekend'],
    shortDescription: 'Pristine white cotton poplin with French seams and dropped shoulder silhouette.',
    longDescription:
      'The modern shirting standard. High-thread-count organic cotton creates sculptural volume that never looks sloppy.',
    stylingSuggestions: [
      'Do a casual front French tuck into vintage high-rise denim with white sneakers.',
    ],
    dataQualityState: 'Demo Listing',
    lastChecked: 'Today · Prototype data',
    isDemoSale: true,
    offers: [
      {
        id: 'off-11a',
        retailer: 'Superbalist',
        priceZar: 649,
        deliveryFeeZar: 65,
        estimatedTotalZar: 714,
        availableSizes: ['XS', 'S', 'M', 'L', 'XL'],
        status: 'Lowest Demo Price',
        dataQualityState: 'Demo Listing',
        inStock: true,
        deliveryEstimate: 'Next-day delivery',
      },
      {
        id: 'off-11b',
        retailer: 'Cotton On',
        priceZar: 699,
        deliveryFeeZar: 50,
        estimatedTotalZar: 749,
        availableSizes: ['S', 'M', 'L'],
        status: 'Similar Alternative',
        dataQualityState: 'Demo Listing',
        inStock: true,
        deliveryEstimate: '2-4 business days',
      },
    ],
  },
  {
    id: 'prod-cashmere-crewneck-knit',
    name: 'Oatmeal Soft Cashmere-Blend Crewneck',
    category: 'Tops & Blouses',
    colour: 'Camel',
    sizes: ['S', 'M', 'L'],
    styleCategory: 'Casual Chic',
    imageUrl: weekendCasualImg,
    retailer: 'Woolworths',
    demoPriceZar: 1199,
    occasionTags: ['Casual Weekend', 'Work & Executive'],
    shortDescription: 'Ultra-fine spun cashmere knit with ribbed cuffs and relaxed crew neckline.',
    longDescription:
      'Supreme hand-feel and featherlight insulation suitable for breezy coastal mornings and air-conditioned offices.',
    stylingSuggestions: [
      'Throw casually over your shoulders over a white tee or silk dress.',
    ],
    dataQualityState: 'Demo Listing',
    lastChecked: 'Today · Prototype data',
    offers: [
      {
        id: 'off-12a',
        retailer: 'Woolworths',
        priceZar: 1199,
        deliveryFeeZar: 0,
        estimatedTotalZar: 1199,
        availableSizes: ['S', 'M', 'L'],
        status: 'Lowest Demo Price',
        dataQualityState: 'Demo Listing',
        inStock: true,
        deliveryEstimate: 'Free shipping',
      },
    ],
  },
  {
    id: 'prod-black-ribbed-square-tank',
    name: 'Fitted Seamless Micro-Rib Tank in Jet Black',
    category: 'Tops & Blouses',
    colour: 'Black',
    sizes: ['XS', 'S', 'M', 'L'],
    styleCategory: 'Minimalist',
    imageUrl: styleMinimalImg,
    retailer: 'Mr Price',
    demoPriceZar: 199,
    occasionTags: ['Casual Weekend', 'Work & Executive'],
    shortDescription: 'Thick sculpting double-rib fabric that stays opaque with clean square neckline.',
    longDescription:
      'High-utility foundation basic. Hugs the torso cleanly without visible bra lines.',
    stylingSuggestions: [
      'Tuck under an open tailored blazer with wide-leg trousers.',
    ],
    dataQualityState: 'Demo Listing',
    lastChecked: 'Today · Prototype data',
    offers: [
      {
        id: 'off-13a',
        retailer: 'Mr Price',
        priceZar: 199,
        deliveryFeeZar: 65,
        estimatedTotalZar: 264,
        availableSizes: ['XS', 'S', 'M', 'L'],
        status: 'Lowest Demo Price',
        dataQualityState: 'Demo Listing',
        inStock: true,
        deliveryEstimate: '3-5 business days',
      },
      {
        id: 'off-13b',
        retailer: 'Cotton On',
        priceZar: 249,
        deliveryFeeZar: 50,
        estimatedTotalZar: 299,
        availableSizes: ['XS', 'S', 'M'],
        status: 'Similar Alternative',
        dataQualityState: 'Demo Listing',
        inStock: true,
        deliveryEstimate: '2-4 business days',
      },
    ],
  },

  // 4. Jeans & Trousers
  {
    id: 'prod-pleated-crepe-trousers',
    name: 'High-Waisted Pleated Fluid Crepe Trousers',
    category: 'Jeans & Trousers',
    colour: 'Cream/Ivory',
    sizes: ['32', '34', '36', '38', '40'],
    styleCategory: 'Classic Elegance',
    imageUrl: heroEditorialImg,
    retailer: 'Woolworths',
    demoPriceZar: 899,
    occasionTags: ['Work & Executive', 'Date Night'],
    shortDescription: 'Wide-leg flowing crepe trousers with double front pleats and deep slash pockets.',
    longDescription:
      'Impeccably tailored through the hip with a generous, graceful leg fall. Elongates the silhouette immediately.',
    stylingSuggestions: [
      'Wear with pointed pumps to showcase the clean floor-grazing hem.',
    ],
    dataQualityState: 'Demo Listing',
    lastChecked: 'Today · Prototype data',
    curatedForAesthetics: ['Classic & Elegant', 'Modern & Minimal'],
    offers: [
      {
        id: 'off-14a',
        retailer: 'Woolworths',
        priceZar: 899,
        deliveryFeeZar: 0,
        estimatedTotalZar: 899,
        availableSizes: ['32', '34', '36', '38'],
        status: 'Lowest Demo Price',
        dataQualityState: 'Demo Listing',
        inStock: true,
        deliveryEstimate: 'Free delivery',
      },
      {
        id: 'off-14b',
        retailer: 'Zara',
        priceZar: 999,
        deliveryFeeZar: 95,
        estimatedTotalZar: 1094,
        availableSizes: ['34', '36', '38'],
        status: 'Similar Alternative',
        dataQualityState: 'Demo Listing',
        inStock: true,
        deliveryEstimate: '3-5 business days',
      },
    ],
  },
  {
    id: 'prod-relaxed-straight-denim',
    name: 'Vintage-Wash Raw Hem High-Rise Straight Jeans',
    category: 'Jeans & Trousers',
    colour: 'Navy',
    sizes: ['30', '32', '34', '36', '38'],
    styleCategory: 'Casual Chic',
    imageUrl: weekendCasualImg,
    retailer: 'Superbalist',
    demoPriceZar: 749,
    demoOriginalPriceZar: 999,
    demoDiscountPercent: 25,
    occasionTags: ['Casual Weekend', 'Date Night'],
    shortDescription: '100% rigid organic cotton denim with subtle vintage whiskering and clean straight leg.',
    longDescription:
      'Molds to your shape with wear while preserving authentic denim structure. Sits at the high natural waist.',
    stylingSuggestions: [
      'Pair with crisp shirting, leather belt and white court sneakers.',
    ],
    dataQualityState: 'Demo Listing',
    lastChecked: 'Today · Prototype data',
    isDemoSale: true,
    offers: [
      {
        id: 'off-15a',
        retailer: 'Superbalist',
        priceZar: 749,
        deliveryFeeZar: 65,
        estimatedTotalZar: 814,
        availableSizes: ['30', '32', '34', '36', '38'],
        status: 'Lowest Demo Price',
        dataQualityState: 'Demo Listing',
        inStock: true,
        deliveryEstimate: 'Next-day delivery',
      },
      {
        id: 'off-15b',
        retailer: 'Cotton On',
        priceZar: 799,
        deliveryFeeZar: 50,
        estimatedTotalZar: 849,
        availableSizes: ['32', '34', '36'],
        status: 'Similar Alternative',
        dataQualityState: 'Demo Listing',
        inStock: true,
        deliveryEstimate: '2-4 business days',
      },
    ],
  },
  {
    id: 'prod-black-tailored-cigarette-pants',
    name: 'Ankle-Grazer Tailored Black Cigarette Pants',
    category: 'Jeans & Trousers',
    colour: 'Black',
    sizes: ['32', '34', '36', '38'],
    styleCategory: 'Modern Professional',
    imageUrl: workOfficeImg,
    retailer: 'Bash',
    demoPriceZar: 699,
    occasionTags: ['Work & Executive', 'Cocktail & Gala'],
    shortDescription: 'Slim tapered trousers with pressed front crease and hidden elasticated side waistband.',
    longDescription:
      'Sharp French-style tailoring that crops cleanly at the ankle bone. Perfect for showing off designer footwear.',
    stylingSuggestions: [
      'Style with sleek loafers for office duty or metallic sandals for after-dark cocktails.',
    ],
    dataQualityState: 'Demo Listing',
    lastChecked: 'Today · Prototype data',
    offers: [
      {
        id: 'off-16a',
        retailer: 'Bash',
        priceZar: 699,
        deliveryFeeZar: 0,
        estimatedTotalZar: 699,
        availableSizes: ['32', '34', '36', '38'],
        status: 'Lowest Demo Price',
        dataQualityState: 'Demo Listing',
        inStock: true,
        deliveryEstimate: '2-4 business days',
      },
    ],
  },
  {
    id: 'prod-wide-leg-linen-pants',
    name: 'Breezy Drawstring Wide-Leg Linen Trousers',
    category: 'Jeans & Trousers',
    colour: 'Camel',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    styleCategory: 'Bohemian Resort',
    imageUrl: holidayResortImg,
    retailer: 'Mr Price',
    demoPriceZar: 399,
    occasionTags: ['Casual Weekend', 'Resort & Holiday'],
    shortDescription: 'Light sand linen trousers with elasticated drawstring waist and breathable relaxed fit.',
    longDescription:
      'Comfort-driven vacation essential that transitions smoothly from seaside promenade to sundowner lounge.',
    stylingSuggestions: [
      'Pair with a swimwear bandeau and lightweight linen overshirt.',
    ],
    dataQualityState: 'Demo Listing',
    lastChecked: 'Today · Prototype data',
    offers: [
      {
        id: 'off-17a',
        retailer: 'Mr Price',
        priceZar: 399,
        deliveryFeeZar: 65,
        estimatedTotalZar: 464,
        availableSizes: ['XS', 'S', 'M', 'L', 'XL'],
        status: 'Lowest Demo Price',
        dataQualityState: 'Demo Listing',
        inStock: true,
        deliveryEstimate: '3-5 business days',
      },
      {
        id: 'off-17b',
        retailer: 'Woolworths',
        priceZar: 599,
        deliveryFeeZar: 0,
        estimatedTotalZar: 599,
        availableSizes: ['S', 'M', 'L'],
        status: 'Similar Alternative',
        dataQualityState: 'Demo Listing',
        inStock: true,
        deliveryEstimate: 'Free delivery',
      },
    ],
  },

  // 5. Shoes
  {
    id: 'prod-pointed-almond-pumps',
    name: 'Pointed Almond-Toe Block Heel Leather Pumps',
    category: 'Shoes',
    colour: 'Cream/Ivory',
    sizes: ['36', '37', '38', '39', '40', '41'],
    styleCategory: 'Classic Elegance',
    imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=800&q=80',
    retailer: 'Superbalist',
    demoPriceZar: 899,
    demoOriginalPriceZar: 1199,
    demoDiscountPercent: 25,
    occasionTags: ['Work & Executive', 'Date Night', 'Wedding & Celebration'],
    shortDescription: 'Buttery nappa leather pumps with stable 65mm architectural block heel.',
    longDescription:
      'Cushioned memory-foam insole allows all-day standing without discomfort. Refined silhouette lengthens leg lines.',
    stylingSuggestions: [
      'Complements tailored wide-leg trousers or bias-cut midi skirts perfectly.',
    ],
    dataQualityState: 'Demo Listing',
    lastChecked: 'Today · Prototype data',
    isDemoSale: true,
    offers: [
      {
        id: 'off-18a',
        retailer: 'Superbalist',
        priceZar: 899,
        deliveryFeeZar: 65,
        estimatedTotalZar: 964,
        availableSizes: ['36', '37', '38', '39', '40'],
        status: 'Lowest Demo Price',
        dataQualityState: 'Demo Listing',
        inStock: true,
        deliveryEstimate: 'Next-day delivery',
      },
      {
        id: 'off-18b',
        retailer: 'Bash',
        priceZar: 999,
        deliveryFeeZar: 0,
        estimatedTotalZar: 999,
        availableSizes: ['37', '38', '39', '40'],
        status: 'Similar Alternative',
        dataQualityState: 'Demo Listing',
        inStock: true,
        deliveryEstimate: '3-5 business days',
      },
    ],
  },
  {
    id: 'prod-white-calfskin-sneakers',
    name: 'Pristine White Calfskin Minimalist Court Sneakers',
    category: 'Shoes',
    colour: 'White',
    sizes: ['36', '37', '38', '39', '40', '41'],
    styleCategory: 'Casual Chic',
    imageUrl: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=80',
    retailer: 'Woolworths',
    demoPriceZar: 799,
    occasionTags: ['Casual Weekend', 'Work & Executive'],
    shortDescription: 'Unbranded clean white leather tennis sneakers with tonal laces and durable rubber cupsole.',
    longDescription:
      'The modern elevated sneaker that looks deliberate and tailored with blazers, trousers, and slip dresses alike.',
    stylingSuggestions: [
      'Wipe clean after each wear to maintain crisp architectural minimalism.',
    ],
    dataQualityState: 'Demo Listing',
    lastChecked: 'Today · Prototype data',
    curatedForAesthetics: ['Casual & Comfortable', 'Modern & Minimal'],
    offers: [
      {
        id: 'off-19a',
        retailer: 'Woolworths',
        priceZar: 799,
        deliveryFeeZar: 0,
        estimatedTotalZar: 799,
        availableSizes: ['36', '37', '38', '39', '40', '41'],
        status: 'Lowest Demo Price',
        dataQualityState: 'Demo Listing',
        inStock: true,
        deliveryEstimate: 'Free delivery',
      },
      {
        id: 'off-19b',
        retailer: 'Cotton On',
        priceZar: 699,
        deliveryFeeZar: 50,
        estimatedTotalZar: 749,
        availableSizes: ['37', '38', '39', '40'],
        status: 'Similar Alternative',
        dataQualityState: 'Demo Listing',
        inStock: true,
        deliveryEstimate: '2-4 business days',
      },
    ],
  },
  {
    id: 'prod-cognac-leather-loafers',
    name: 'Italian-Inspired Leather Loafers with Gold Horsebit',
    category: 'Shoes',
    colour: 'Camel',
    sizes: ['36', '37', '38', '39', '40'],
    styleCategory: 'Classic Elegance',
    imageUrl: 'https://images.unsplash.com/photo-1535043934128-cf0b28d52f95?auto=format&fit=crop&w=800&q=80',
    retailer: 'Zara',
    demoPriceZar: 1199,
    occasionTags: ['Work & Executive', 'Casual Weekend'],
    shortDescription: 'Rich cognac burnished leather slip-ons with polished brass hardware.',
    longDescription:
      'Heritage equestrian styling that adds instant timeless prestige to office trousers or raw-hem denim.',
    stylingSuggestions: [
      'Pair with exposed ribbed ankle socks and cropped pants for a trendy continental vibe.',
    ],
    dataQualityState: 'Demo Listing',
    lastChecked: 'Today · Prototype data',
    offers: [
      {
        id: 'off-20a',
        retailer: 'Zara',
        priceZar: 1199,
        deliveryFeeZar: 95,
        estimatedTotalZar: 1294,
        availableSizes: ['36', '37', '38', '39'],
        status: 'Lowest Demo Price',
        dataQualityState: 'Demo Listing',
        inStock: true,
        deliveryEstimate: '3-5 business days',
      },
      {
        id: 'off-20b',
        retailer: 'Superbalist',
        priceZar: 1249,
        deliveryFeeZar: 65,
        estimatedTotalZar: 1314,
        availableSizes: ['37', '38', '39', '40'],
        status: 'Similar Alternative',
        dataQualityState: 'Demo Listing',
        inStock: true,
        deliveryEstimate: 'Next-day delivery',
      },
    ],
  },
  {
    id: 'prod-strappy-heeled-sandals',
    name: 'Minimalist Metallic Two-Strap Stiletto Heels',
    category: 'Shoes',
    colour: 'Gold',
    sizes: ['36', '37', '38', '39', '40'],
    styleCategory: 'Glamour & Evening',
    imageUrl: 'https://images.unsplash.com/photo-1518049362265-d5b2a6467637?auto=format&fit=crop&w=800&q=80',
    retailer: 'Superbalist',
    demoPriceZar: 799,
    occasionTags: ['Cocktail & Gala', 'Date Night', 'Wedding & Celebration'],
    shortDescription: 'Barely-there metallic gold stiletto sandals with delicate ankle wrap closure.',
    longDescription:
      'The quintessential red carpet sandal that never distracts from a floor-sweeping gown or cocktail silhouette.',
    stylingSuggestions: [
      'Ensure a clean pedicure and match with champagne gold jewellery.',
    ],
    dataQualityState: 'Demo Listing',
    lastChecked: 'Today · Prototype data',
    offers: [
      {
        id: 'off-21a',
        retailer: 'Superbalist',
        priceZar: 799,
        deliveryFeeZar: 65,
        estimatedTotalZar: 864,
        availableSizes: ['36', '37', '38', '39', '40'],
        status: 'Lowest Demo Price',
        dataQualityState: 'Demo Listing',
        inStock: true,
        deliveryEstimate: 'Next-day delivery',
      },
      {
        id: 'off-21b',
        retailer: 'Bash',
        priceZar: 850,
        deliveryFeeZar: 0,
        estimatedTotalZar: 850,
        availableSizes: ['37', '38', '39'],
        status: 'Lowest Demo Price',
        dataQualityState: 'Demo Listing',
        inStock: true,
        deliveryEstimate: '3-5 business days',
      },
    ],
  },

  // 6. Bags
  {
    id: 'prod-executive-leather-tote',
    name: 'Structured Leather Work Tote with Brass Buckle',
    category: 'Bags',
    colour: 'Camel',
    sizes: ['One Size'],
    styleCategory: 'Modern Professional',
    imageUrl: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80',
    retailer: 'Woolworths',
    demoPriceZar: 1699,
    demoOriginalPriceZar: 2199,
    demoDiscountPercent: 23,
    occasionTags: ['Work & Executive', 'Client Meeting'],
    shortDescription: 'Spacious pebble-grain leather tote fitting up to 15-inch laptops with zip divider.',
    longDescription:
      'Engineered for the mobile executive. Padded interior tech sleeve and reinforced base feet that protect leather.',
    stylingSuggestions: [
      'Anchors sharp tailoring and carries everyday business essentials effortlessly.',
    ],
    dataQualityState: 'Demo Listing',
    lastChecked: 'Today · Prototype data',
    isDemoSale: true,
    curatedForAesthetics: ['Smart & Professional', 'Classic & Elegant'],
    offers: [
      {
        id: 'off-22a',
        retailer: 'Woolworths',
        priceZar: 1699,
        deliveryFeeZar: 0,
        estimatedTotalZar: 1699,
        availableSizes: ['One Size'],
        status: 'Lowest Demo Price',
        dataQualityState: 'Demo Listing',
        inStock: true,
        deliveryEstimate: 'Free delivery',
      },
      {
        id: 'off-22b',
        retailer: 'Takealot',
        priceZar: 1799,
        deliveryFeeZar: 0,
        estimatedTotalZar: 1799,
        availableSizes: ['One Size'],
        status: 'Similar Alternative',
        dataQualityState: 'Demo Listing',
        inStock: true,
        deliveryEstimate: 'Next-day delivery',
      },
    ],
  },
  {
    id: 'prod-woven-slouchy-shoulder-bag',
    name: 'Woven Slouchy Leather Shoulder Hobo Bag',
    category: 'Bags',
    colour: 'Camel',
    sizes: ['One Size'],
    styleCategory: 'Casual Chic',
    imageUrl: 'https://images.unsplash.com/photo-1590874103328-eac38a675534?auto=format&fit=crop&w=800&q=80',
    retailer: 'Superbalist',
    demoPriceZar: 899,
    occasionTags: ['Casual Weekend', 'Resort & Holiday'],
    shortDescription: 'Textured woven faux-leather shoulder bag with magnetic clasp and interior pouch.',
    longDescription:
      'Supple woven texture brings tactile interest to minimal outfits without adding unnecessary weight.',
    stylingSuggestions: [
      'Nestles naturally under the arm for weekend farmers markets and brunch dates.',
    ],
    dataQualityState: 'Demo Listing',
    lastChecked: 'Today · Prototype data',
    offers: [
      {
        id: 'off-23a',
        retailer: 'Superbalist',
        priceZar: 899,
        deliveryFeeZar: 65,
        estimatedTotalZar: 964,
        availableSizes: ['One Size'],
        status: 'Lowest Demo Price',
        dataQualityState: 'Demo Listing',
        inStock: true,
        deliveryEstimate: 'Next-day delivery',
      },
      {
        id: 'off-23b',
        retailer: 'Cotton On',
        priceZar: 599,
        deliveryFeeZar: 50,
        estimatedTotalZar: 649,
        availableSizes: ['One Size'],
        status: 'Similar Alternative',
        dataQualityState: 'Demo Listing',
        inStock: true,
        deliveryEstimate: '2-4 business days',
      },
    ],
  },
  {
    id: 'prod-pleated-metallic-clutch',
    name: 'Pleated Satin Evening Minaudière Clutch',
    category: 'Bags',
    colour: 'Gold',
    sizes: ['One Size'],
    styleCategory: 'Glamour & Evening',
    imageUrl: 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?auto=format&fit=crop&w=800&q=80',
    retailer: 'Bash',
    demoPriceZar: 549,
    occasionTags: ['Cocktail & Gala', 'Wedding & Celebration'],
    shortDescription: 'Gleaming champagne pleated clutch with optional detachable fine rope chain.',
    longDescription:
      'Fits current smartphones, lip gloss, and cardholder with secure top snap closure.',
    stylingSuggestions: [
      'Carry in hand as a sculptural jewel or wear crossbody for dancing.',
    ],
    dataQualityState: 'Demo Listing',
    lastChecked: 'Today · Prototype data',
    offers: [
      {
        id: 'off-24a',
        retailer: 'Bash',
        priceZar: 549,
        deliveryFeeZar: 0,
        estimatedTotalZar: 549,
        availableSizes: ['One Size'],
        status: 'Lowest Demo Price',
        dataQualityState: 'Demo Listing',
        inStock: true,
        deliveryEstimate: '2-4 business days',
      },
      {
        id: 'off-24b',
        retailer: 'Mr Price',
        priceZar: 320,
        deliveryFeeZar: 65,
        estimatedTotalZar: 385,
        availableSizes: ['One Size'],
        status: 'Similar Alternative',
        dataQualityState: 'Demo Listing',
        inStock: true,
        deliveryEstimate: '3-5 business days',
      },
    ],
  },
  {
    id: 'prod-minimal-crossbody-bag',
    name: 'Smooth Box Calf Crossbody Bag in Black',
    category: 'Bags',
    colour: 'Black',
    sizes: ['One Size'],
    styleCategory: 'Minimalist',
    imageUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80',
    retailer: 'Zara',
    demoPriceZar: 799,
    occasionTags: ['Casual Weekend', 'Work & Executive', 'Date Night'],
    shortDescription: 'Clean rectangular camera bag with bevelled edges and adjustable shoulder strap.',
    longDescription:
      'The quintessential daily companion. Structured silhouette resists sagging over years of wear.',
    stylingSuggestions: [
      'Worn high across the chest for a contemporary fashion-forward silhouette.',
    ],
    dataQualityState: 'Demo Listing',
    lastChecked: 'Today · Prototype data',
    offers: [
      {
        id: 'off-25a',
        retailer: 'Zara',
        priceZar: 799,
        deliveryFeeZar: 95,
        estimatedTotalZar: 894,
        availableSizes: ['One Size'],
        status: 'Lowest Demo Price',
        dataQualityState: 'Demo Listing',
        inStock: true,
        deliveryEstimate: '3-5 business days',
      },
      {
        id: 'off-25b',
        retailer: 'Takealot',
        priceZar: 849,
        deliveryFeeZar: 0,
        estimatedTotalZar: 849,
        availableSizes: ['One Size'],
        status: 'Lowest Demo Price',
        dataQualityState: 'Demo Listing',
        inStock: true,
        deliveryEstimate: 'Next-day delivery',
      },
    ],
  },

  // 7. Jewellery & Accessories
  {
    id: 'prod-gold-ribbed-dome-earrings',
    name: 'Brushed 18k Gold-Plated Ribbed Dome Earrings',
    category: 'Jewellery & Accessories',
    colour: 'Gold',
    sizes: ['One Size'],
    styleCategory: 'Classic Elegance',
    imageUrl: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80',
    retailer: 'Superbalist',
    demoPriceZar: 349,
    demoOriginalPriceZar: 499,
    demoDiscountPercent: 30,
    occasionTags: ['Work & Executive', 'Date Night', 'Cocktail & Gala'],
    shortDescription: 'Chunky hollow-formed ribbed huggie hoops with hypoallergenic surgical steel posts.',
    longDescription:
      'Ultra-lightweight despite bold presence. The ribbed texture reflects soft diffused light near the cheekbones.',
    stylingSuggestions: [
      'Wear with a slicked low bun to make a deliberate statement.',
    ],
    dataQualityState: 'Demo Listing',
    lastChecked: 'Today · Prototype data',
    isDemoSale: true,
    curatedForAesthetics: ['Classic & Elegant', 'Modern & Minimal'],
    offers: [
      {
        id: 'off-26a',
        retailer: 'Superbalist',
        priceZar: 349,
        deliveryFeeZar: 65,
        estimatedTotalZar: 414,
        availableSizes: ['One Size'],
        status: 'Lowest Demo Price',
        dataQualityState: 'Demo Listing',
        inStock: true,
        deliveryEstimate: 'Next-day delivery',
      },
      {
        id: 'off-26b',
        retailer: 'Cotton On',
        priceZar: 299,
        deliveryFeeZar: 50,
        estimatedTotalZar: 349,
        availableSizes: ['One Size'],
        status: 'Similar Alternative',
        dataQualityState: 'Demo Listing',
        inStock: true,
        deliveryEstimate: '2-4 business days',
      },
    ],
  },
  {
    id: 'prod-tortoiseshell-sunglasses',
    name: 'Bevelled Oversized Tortoiseshell Sunglasses',
    category: 'Jewellery & Accessories',
    colour: 'Camel',
    sizes: ['One Size'],
    styleCategory: 'Casual Chic',
    imageUrl: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=80',
    retailer: 'Woolworths',
    demoPriceZar: 499,
    occasionTags: ['Casual Weekend', 'Resort & Holiday'],
    shortDescription: 'UV400 category 3 polarized lenses with thick Italian cellulose acetate frames.',
    longDescription:
      'High-impact sun protection crafted for intense South African sunshine. Flattering universal feline contour.',
    stylingSuggestions: [
      'Perch atop your hair during seaside terrace lunches.',
    ],
    dataQualityState: 'Demo Listing',
    lastChecked: 'Today · Prototype data',
    offers: [
      {
        id: 'off-27a',
        retailer: 'Woolworths',
        priceZar: 499,
        deliveryFeeZar: 0,
        estimatedTotalZar: 499,
        availableSizes: ['One Size'],
        status: 'Lowest Demo Price',
        dataQualityState: 'Demo Listing',
        inStock: true,
        deliveryEstimate: 'Free delivery over R500',
      },
    ],
  },
  {
    id: 'prod-hammered-brass-link-necklace',
    name: 'Artisanal Hammered Brass Link Collar Necklace',
    category: 'Jewellery & Accessories',
    colour: 'Gold',
    sizes: ['One Size'],
    styleCategory: 'Modern Professional',
    imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80',
    retailer: 'Bash',
    demoPriceZar: 599,
    occasionTags: ['Work & Executive', 'Cocktail & Gala'],
    shortDescription: 'Textured link chain with warm brushed finish and secure T-bar toggle clasp.',
    longDescription:
      'Lays flat against the collarbone, adding tactile architectural presence over buttoned shirting or open necklines.',
    stylingSuggestions: [
      'Wear solo inside a deep V-neck blazer for quiet authority.',
    ],
    dataQualityState: 'Demo Listing',
    lastChecked: 'Today · Prototype data',
    offers: [
      {
        id: 'off-28a',
        retailer: 'Bash',
        priceZar: 599,
        deliveryFeeZar: 0,
        estimatedTotalZar: 599,
        availableSizes: ['One Size'],
        status: 'Lowest Demo Price',
        dataQualityState: 'Demo Listing',
        inStock: true,
        deliveryEstimate: '2-4 business days',
      },
    ],
  },
  {
    id: 'prod-silk-twill-scarf',
    name: 'Geometric Hand-Rolled Mulberry Silk Twill Scarf',
    category: 'Jewellery & Accessories',
    colour: 'Terracotta',
    sizes: ['One Size'],
    styleCategory: 'Classic Elegance',
    imageUrl: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?auto=format&fit=crop&w=800&q=80',
    retailer: 'Takealot',
    demoPriceZar: 449,
    occasionTags: ['Casual Weekend', 'Work & Executive'],
    shortDescription: '70x70cm mulberry silk scarf printed with warm terracotta and sage motifs.',
    longDescription:
      'Multi-wear luxury accent: wrap as a neck foulard, hair scarf, or bag handle accessory.',
    stylingSuggestions: [
      'Loop gently around the handle of a neutral work tote for a pop of artistry.',
    ],
    dataQualityState: 'Demo Listing',
    lastChecked: 'Today · Prototype data',
    offers: [
      {
        id: 'off-29a',
        retailer: 'Takealot',
        priceZar: 449,
        deliveryFeeZar: 0,
        estimatedTotalZar: 449,
        availableSizes: ['One Size'],
        status: 'Lowest Demo Price',
        dataQualityState: 'Demo Listing',
        inStock: true,
        deliveryEstimate: 'Next-day delivery',
      },
    ],
  },

  // 8. Activewear
  {
    id: 'prod-seamless-high-rise-leggings',
    name: 'Sculpt & Hold Seamless High-Rise 7/8 Leggings',
    category: 'Activewear',
    colour: 'Black',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    styleCategory: 'Sporty Luxe',
    imageUrl: styleSportyImg,
    retailer: 'Cotton On',
    demoPriceZar: 499,
    demoOriginalPriceZar: 649,
    demoDiscountPercent: 23,
    occasionTags: ['Casual Weekend'],
    shortDescription: 'Squat-proof compressive ribbed waistband with moisture-wicking four-way stretch.',
    longDescription:
      'Seamless construction prevents chafing whether doing Pilates or running Cape Town beach promenade stairs.',
    stylingSuggestions: [
      'Layer with an oversized trench coat, white court sneakers, and baseball cap.',
    ],
    dataQualityState: 'Demo Listing',
    lastChecked: 'Today · Prototype data',
    isDemoSale: true,
    curatedForAesthetics: ['Casual & Comfortable'],
    offers: [
      {
        id: 'off-30a',
        retailer: 'Cotton On',
        priceZar: 499,
        deliveryFeeZar: 50,
        estimatedTotalZar: 549,
        availableSizes: ['XS', 'S', 'M', 'L', 'XL'],
        status: 'Lowest Demo Price',
        dataQualityState: 'Demo Listing',
        inStock: true,
        deliveryEstimate: '2-4 business days',
      },
      {
        id: 'off-30b',
        retailer: 'Mr Price',
        priceZar: 280,
        deliveryFeeZar: 65,
        estimatedTotalZar: 345,
        availableSizes: ['S', 'M', 'L'],
        status: 'Similar Alternative',
        dataQualityState: 'Demo Listing',
        inStock: true,
        deliveryEstimate: '3-5 business days',
      },
    ],
  },
  {
    id: 'prod-studio-crop-bra',
    name: 'Crossover Strappy Medium-Support Studio Crop Bra',
    category: 'Activewear',
    colour: 'Forest Green',
    sizes: ['XS', 'S', 'M', 'L'],
    styleCategory: 'Sporty Luxe',
    imageUrl: styleSportyImg,
    retailer: 'Superbalist',
    demoPriceZar: 399,
    occasionTags: ['Casual Weekend'],
    shortDescription: 'Removable padded cups with breathable laser-cut back straps in rich deep forest green.',
    longDescription:
      'Flattering longline silhouette that offers light-to-medium support for yoga, walking, and studio workouts.',
    stylingSuggestions: [
      'Coordinates with high-rise black leggings and an unbuttoned poplin shirt.',
    ],
    dataQualityState: 'Demo Listing',
    lastChecked: 'Today · Prototype data',
    offers: [
      {
        id: 'off-31a',
        retailer: 'Superbalist',
        priceZar: 399,
        deliveryFeeZar: 65,
        estimatedTotalZar: 464,
        availableSizes: ['XS', 'S', 'M', 'L'],
        status: 'Lowest Demo Price',
        dataQualityState: 'Demo Listing',
        inStock: true,
        deliveryEstimate: 'Next-day delivery',
      },
    ],
  },
  {
    id: 'prod-ultralight-running-windbreaker',
    name: 'Packable Featherweight Technical Windbreaker',
    category: 'Activewear',
    colour: 'White',
    sizes: ['S', 'M', 'L', 'XL'],
    styleCategory: 'Sporty Luxe',
    imageUrl: styleSportyImg,
    retailer: 'H&M',
    demoPriceZar: 699,
    occasionTags: ['Casual Weekend'],
    shortDescription: 'Windproof ripstop jacket with concealed hood that packs into its own pocket.',
    longDescription:
      'Engineered for breezy Atlantic and Table Mountain walks. Water-repellent finish repels mist and light drizzle.',
    stylingSuggestions: [
      'Pack into tote bag for spontaneous outdoor exercise or blustery coastal strolls.',
    ],
    dataQualityState: 'Demo Listing',
    lastChecked: 'Today · Prototype data',
    offers: [
      {
        id: 'off-32a',
        retailer: 'H&M',
        priceZar: 699,
        deliveryFeeZar: 50,
        estimatedTotalZar: 749,
        availableSizes: ['S', 'M', 'L'],
        status: 'Lowest Demo Price',
        dataQualityState: 'Demo Listing',
        inStock: true,
        deliveryEstimate: '3-5 business days',
      },
      {
        id: 'off-32b',
        retailer: 'Takealot',
        priceZar: 749,
        deliveryFeeZar: 0,
        estimatedTotalZar: 749,
        availableSizes: ['M', 'L', 'XL'],
        status: 'Similar Alternative',
        dataQualityState: 'Demo Listing',
        inStock: true,
        deliveryEstimate: 'Next-day delivery',
      },
    ],
  },
];

/**
 * Filter and sort helper function implementing deterministic logic
 * influences recommendations with user style profile if provided.
 */
export function filterAndSortProducts(
  products: Product[],
  filters: ShoppingFilters,
  sortOption: ShoppingSortOption,
  userProfile?: UserProfile,
  searchQuery?: string
): Product[] {
  let result = [...products];

  // 1. Text search query
  if (searchQuery && searchQuery.trim() !== '') {
    const q = searchQuery.toLowerCase().trim();
    result = result.filter((p) => {
      const matchName = p.name.toLowerCase().includes(q);
      const matchCategory = p.category.toLowerCase().includes(q);
      const matchColour = p.colour.toLowerCase().includes(q);
      const matchRetailer = p.retailer.toLowerCase().includes(q);
      const matchStyle = p.styleCategory.toLowerCase().includes(q);
      const matchOccasion = p.occasionTags.some((occ) => occ.toLowerCase().includes(q));
      const matchDesc = p.shortDescription.toLowerCase().includes(q);
      return (
        matchName ||
        matchCategory ||
        matchColour ||
        matchRetailer ||
        matchStyle ||
        matchOccasion ||
        matchDesc
      );
    });
  }

  // 2. Category filter
  if (filters.category !== 'All') {
    result = result.filter((p) => p.category === filters.category);
  }

  // 3. Retailer filters
  if (filters.retailers.length > 0) {
    result = result.filter((p) => filters.retailers.includes(p.retailer));
  }

  // 4. Size filters
  if (filters.sizes.length > 0) {
    result = result.filter((p) => p.sizes.some((s) => filters.sizes.includes(s)));
  }

  // 5. Colour filters
  if (filters.colours.length > 0) {
    result = result.filter((p) => filters.colours.includes(p.colour));
  }

  // 6. Price range
  if (filters.minPrice > 0) {
    result = result.filter((p) => p.demoPriceZar >= filters.minPrice);
  }
  if (filters.maxPrice < 3500) {
    result = result.filter((p) => p.demoPriceZar <= filters.maxPrice);
  }

  // 7. Style Category
  if (filters.styleCategory !== 'All') {
    result = result.filter((p) => p.styleCategory === filters.styleCategory);
  }

  // 8. Occasion
  if (filters.occasion !== 'All') {
    result = result.filter((p) => p.occasionTags.includes(filters.occasion));
  }

  // 9. Demo Sale
  if (filters.onlyDemoSale) {
    result = result.filter((p) => p.isDemoSale);
  }

  // 10. Sorting
  if (sortOption === 'price-low-high') {
    result.sort((a, b) => a.demoPriceZar - b.demoPriceZar);
  } else if (sortOption === 'price-high-low') {
    result.sort((a, b) => b.demoPriceZar - a.demoPriceZar);
  } else if (sortOption === 'biggest-saving') {
    result.sort((a, b) => (b.demoDiscountPercent || 0) - (a.demoDiscountPercent || 0));
  } else if (sortOption === 'newest') {
    result.sort((a, b) => (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0));
  } else {
    // 'recommended' - deterministic scoring based on user profile preferences
    result.sort((a, b) => {
      const scoreA = calculateProfileAffinity(a, userProfile);
      const scoreB = calculateProfileAffinity(b, userProfile);
      return scoreB - scoreA;
    });
  }

  return result;
}

function calculateProfileAffinity(product: Product, profile?: UserProfile): number {
  if (!profile || !profile.styles || profile.styles.length === 0) {
    // Default baseline affinity (sale items & classics slightly prioritized)
    return (product.isDemoSale ? 3 : 0) + (product.isNewArrival ? 2 : 0);
  }

  let score = 0;

  // Match preferred aesthetics
  const primaryAesthetics = profile.styles || [];
  if (
    product.curatedForAesthetics &&
    product.curatedForAesthetics.some((a: string) => primaryAesthetics.includes(a))
  ) {
    score += 15;
  }
  if (primaryAesthetics.some((a: string) => a.toLowerCase().includes(product.styleCategory.toLowerCase()))) {
    score += 10;
  }

  // Match sizes
  const sizes = profile.sizes;
  if (sizes) {
    if (product.category === 'Shoes' && sizes.shoeSize && product.sizes.includes(sizes.shoeSize)) {
      score += 8;
    } else if (
      (product.category === 'Tops & Blouses' || product.category === 'Jackets & Blazers') &&
      sizes.topsSize &&
      product.sizes.includes(sizes.topsSize)
    ) {
      score += 8;
    } else if (
      product.category === 'Jeans & Trousers' &&
      sizes.bottomsSize &&
      product.sizes.includes(sizes.bottomsSize)
    ) {
      score += 8;
    } else if (product.category === 'Dresses' && sizes.dressSize && product.sizes.includes(sizes.dressSize)) {
      score += 8;
    }
  }

  // Match favourite colours
  const favColours = profile.colours?.favoriteColors || [];
  if (favColours.some((c: string) => product.colour.toLowerCase().includes(c.toLowerCase()))) {
    score += 6;
  }

  // Match preferred retailers
  const favRetailers = profile.shopping?.favoriteRetailers || [];
  if (favRetailers.some((r: string) => r.toLowerCase().includes(product.retailer.toLowerCase()))) {
    score += 5;
  }

  // Sales bonus
  if (product.isDemoSale) score += 2;

  return score;
}
