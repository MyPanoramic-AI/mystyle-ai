import type { Availability, SaleStatus, SearchQuery } from '../types.js';

const COLOURS = ['black', 'white', 'navy', 'blue', 'red', 'green', 'brown', 'beige', 'pink', 'grey', 'gray'];
const CATEGORIES: Record<string, { category: string; clothingType: string }> = {
  dress: { category: 'dresses', clothingType: 'dress' },
  dresses: { category: 'dresses', clothingType: 'dress' },
  gown: { category: 'dresses', clothingType: 'dress' },
  sneaker: { category: 'shoes', clothingType: 'sneakers' },
  sneakers: { category: 'shoes', clothingType: 'sneakers' },
  shoe: { category: 'shoes', clothingType: 'shoes' },
  shoes: { category: 'shoes', clothingType: 'shoes' },
  shirt: { category: 'tops', clothingType: 'shirt' },
  shirts: { category: 'tops', clothingType: 'shirt' },
  jacket: { category: 'jackets', clothingType: 'jacket' },
  jackets: { category: 'jackets', clothingType: 'jacket' },
  outfit: { category: 'outfits', clothingType: 'outfit' },
  outfits: { category: 'outfits', clothingType: 'outfit' },
};

export function parseSearch(input: string, overrides: Partial<SearchQuery> = {}): SearchQuery {
  const notes: string[] = [];
  let working = input.trim();
  let maxPriceCents: number | null = null;
  let minPriceCents: number | null = null;
  let priceCurrency: string | null = null;
  const under = working.match(/\b(?:under|below)\s+(r)?\s*([0-9][0-9,]*)/i);
  if (under?.[2]) {
    maxPriceCents = Number(under[2].replaceAll(',', '')) * 100;
    if (under[1]) priceCurrency = 'ZAR';
    working = working.replace(under[0], ' ');
  }
  const over = working.match(/\b(?:over|above)\s+(r)?\s*([0-9][0-9,]*)/i);
  if (over?.[2]) {
    minPriceCents = Number(over[2].replaceAll(',', '')) * 100;
    if (over[1]) priceCurrency = 'ZAR';
    working = working.replace(over[0], ' ');
  }
  let size: string | null = null;
  const sizeMatch = working.match(/\bsize\s+([a-z0-9]+)\b/i);
  if (sizeMatch?.[1]) {
    size = sizeMatch[1];
    working = working.replace(sizeMatch[0], ' ');
  }
  let audience: string | null = null;
  if (/\b(women'?s|womens|ladies)\b/i.test(working)) audience = 'women';
  if (/\b(men'?s|mens)\b/i.test(working)) audience = 'men';
  working = working.replace(/\b(women'?s|womens|ladies|men'?s|mens)\b/gi, ' ');
  const city = working.match(/\bin\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);
  if (city?.[1]) {
    notes.push(`No source supplied store stock or delivery availability for ${city[1]}.`);
    working = working.replace(city[0], ' ');
  }
  const tokens = working
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token && !['a', 'an', 'the', 'in', 'for', 'me'].includes(token));
  let colour: string | null = null;
  let category: string | null = null;
  let clothingType: string | null = null;
  const text: string[] = [];
  for (const token of tokens) {
    if (!colour && COLOURS.includes(token)) {
      colour = token === 'gray' ? 'grey' : token;
      continue;
    }
    const mapped = CATEGORIES[token];
    if (mapped && !category) {
      category = mapped.category;
      clothingType = mapped.clothingType;
      continue;
    }
    text.push(token);
  }
  return {
    text: text.join(' '),
    category: overrides.category ?? category,
    clothingType: overrides.clothingType ?? clothingType,
    colour: overrides.colour ?? colour,
    audience: overrides.audience ?? audience,
    minPriceCents: overrides.minPriceCents ?? minPriceCents,
    maxPriceCents: overrides.maxPriceCents ?? maxPriceCents,
    priceCurrency: overrides.priceCurrency ?? priceCurrency,
    size: overrides.size ?? size,
    retailer: overrides.retailer ?? null,
    brand: overrides.brand ?? null,
    availability: overrides.availability ?? null,
    saleStatus: overrides.saleStatus ?? null,
    sort: overrides.sort ?? 'relevance',
    page: overrides.page && overrides.page > 0 ? overrides.page : 1,
    pageSize: overrides.pageSize && overrides.pageSize > 0 ? Math.min(overrides.pageSize, 50) : 20,
    notes,
  };
}

export function isAvailability(value: string | null): value is Availability {
  return value === 'in_stock' || value === 'out_of_stock';
}

export function isSaleStatus(value: string | null): value is SaleStatus {
  return value === 'verified_sale' || value === 'not_on_sale';
}
