import type { PublicProduct } from '../catalogue.js';

export interface ProductMatch {
  productId: string;
  kind: 'exact' | 'similar' | 'alternative_colour' | 'budget_alternative' | 'comparable';
  confidence: 'identifier' | 'textual' | 'category';
  reasons: string[];
  priceDifferenceCents: number | null;
}

function tokens(title: string): Set<string> {
  return new Set(title.toLowerCase().split(/[^a-z0-9]+/).filter((token) => token.length > 2));
}

function overlap(left: Set<string>, right: Set<string>): number {
  let count = 0;
  for (const token of left) if (right.has(token)) count += 1;
  return count;
}

function priceGap(left: PublicProduct, right: PublicProduct): number | null {
  if (left.price.status !== 'present' || right.price.status !== 'present') return null;
  if (left.price.value.currency !== right.price.value.currency) return null;
  return right.price.value.cents - left.price.value.cents;
}

export function matchProduct(target: PublicProduct, catalogue: PublicProduct[]): ProductMatch[] {
  const targetTokens = tokens(target.title);
  const matches: ProductMatch[] = [];
  for (const other of catalogue) {
    if (other.id === target.id) continue;
    const sharedGtin = target.gtins.find((gtin) => other.gtins.includes(gtin));
    if (sharedGtin) {
      matches.push({
        productId: other.id,
        kind: 'exact',
        confidence: 'identifier',
        reasons: [`Shared GTIN ${sharedGtin}.`],
        priceDifferenceCents: priceGap(target, other),
      });
      continue;
    }
    const sameCategory = target.category.status === 'present' && other.category.status === 'present' && target.category.value === other.category.value;
    const sameColour = target.colour.status === 'present' && other.colour.status === 'present' && target.colour.value === other.colour.value;
    const sameBrand = target.brand.status === 'present' && other.brand.status === 'present' && target.brand.value === other.brand.value;
    const shared = overlap(targetTokens, tokens(other.title));
    if (sameCategory && sameColour && shared >= 2) {
      matches.push({
        productId: other.id,
        kind: 'similar',
        confidence: 'textual',
        reasons: ['Same category and colour with overlapping title words. Textual resemblance is not an identity match.'],
        priceDifferenceCents: priceGap(target, other),
      });
      continue;
    }
    if (sameBrand && sameCategory && target.colour.status === 'present' && other.colour.status === 'present' && target.colour.value !== other.colour.value) {
      matches.push({
        productId: other.id,
        kind: 'alternative_colour',
        confidence: 'category',
        reasons: ['Same brand and category with a different stated colour. Not the same item.'],
        priceDifferenceCents: priceGap(target, other),
      });
      continue;
    }
    const cheaper = target.price.status === 'present' && other.price.status === 'present'
      && other.price.value.currency === target.price.value.currency
      && other.price.value.cents < target.price.value.cents;
    if (sameCategory && cheaper) {
      matches.push({
        productId: other.id,
        kind: 'budget_alternative',
        confidence: 'category',
        reasons: ['Same category and a lower advertised price in the same currency. Not the same item.'],
        priceDifferenceCents: priceGap(target, other),
      });
      continue;
    }
    if (sameCategory) {
      matches.push({
        productId: other.id,
        kind: 'comparable',
        confidence: 'category',
        reasons: ['Same category only. Not the same item.'],
        priceDifferenceCents: priceGap(target, other),
      });
    }
  }
  return matches;
}
