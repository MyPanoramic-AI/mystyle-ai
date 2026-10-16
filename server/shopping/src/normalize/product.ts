import { ShoppingError } from '../errors.js';
import type { SourceProduct, SourceVariant } from '../types.js';
import { normaliseSize } from './size.js';

export interface StoredVariant {
  externalVariantId: string | null;
  colour: string | null;
  sizeLabel: string | null;
  sizeSystem: string | null;
  normalisedSize: string | null;
  normalisationConfidence: string;
  normalisationNote: string;
  priceCents: number | null;
  currency: string | null;
  availability: string | null;
  gtin: string | null;
}

export interface StoredProduct {
  source: SourceProduct;
  variants: StoredVariant[];
}

const AVAILABILITY = new Set(['in_stock', 'out_of_stock']);
const SALE = new Set(['verified_sale', 'not_on_sale']);

function optionalText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function cents(value: unknown, field: string): number | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw new ShoppingError('invalid_price', `${field} must be a non-negative integer number of cents, or empty.`, 400);
  }
  return value;
}

function variantFrom(raw: unknown, index: number): StoredVariant {
  if (!raw || typeof raw !== 'object') {
    throw new ShoppingError('invalid_variant', `Variant ${index + 1} is not an object.`, 400);
  }
  const row = raw as Record<string, unknown>;
  const availability = optionalText(row.availability);
  if (availability && !AVAILABILITY.has(availability)) {
    throw new ShoppingError('invalid_availability', 'Variant availability must be in_stock, out_of_stock, or empty.', 400);
  }
  const size = normaliseSize(optionalText(row.sizeLabel), optionalText(row.sizeSystem));
  return {
    externalVariantId: optionalText(row.externalVariantId),
    colour: optionalText(row.colour),
    sizeLabel: size.label,
    sizeSystem: size.system,
    normalisedSize: size.normalisedLabel,
    normalisationConfidence: size.confidence,
    normalisationNote: size.note,
    priceCents: cents(row.priceCents, 'variant priceCents'),
    currency: optionalText(row.currency)?.toUpperCase() ?? null,
    availability,
    gtin: optionalText(row.gtin),
  };
}

export function normaliseProduct(input: unknown): StoredProduct {
  if (!input || typeof input !== 'object') {
    throw new ShoppingError('invalid_product', 'A product record must be an object.', 400);
  }
  const row = input as Record<string, unknown>;
  const externalId = optionalText(row.externalId);
  const title = optionalText(row.title);
  const retailerName = optionalText(row.retailerName);
  if (!externalId || !title || !retailerName) {
    throw new ShoppingError('missing_identity', 'externalId, title, and retailerName are required.', 400);
  }
  const availability = optionalText(row.availability);
  if (availability && !AVAILABILITY.has(availability)) {
    throw new ShoppingError('invalid_availability', 'Availability must be in_stock, out_of_stock, or empty.', 400);
  }
  const saleStatus = optionalText(row.saleStatus);
  if (saleStatus && !SALE.has(saleStatus)) {
    throw new ShoppingError('invalid_sale', 'saleStatus must be verified_sale, not_on_sale, or empty.', 400);
  }
  const dataClass = row.dataClass === 'licensed' ? 'licensed' : row.dataClass === 'demo' ? 'demo' : null;
  if (!dataClass) {
    throw new ShoppingError('invalid_data_class', 'dataClass must be demo or licensed.', 400);
  }
  const priceCents = cents(row.priceCents, 'priceCents');
  const originalPriceCents = cents(row.originalPriceCents, 'originalPriceCents');
  const currency = optionalText(row.currency)?.toUpperCase() ?? null;
  if (priceCents !== null && !currency) {
    throw new ShoppingError('missing_currency', 'A price requires a currency code.', 400);
  }
  const variantsRaw = Array.isArray(row.variants) ? row.variants : [];
  const variants = variantsRaw.map((variant, index) => variantFrom(variant, index));
  const imageUrls = Array.isArray(row.imageUrls)
    ? row.imageUrls.filter((url): url is string => typeof url === 'string' && url.trim().length > 0).map((url) => url.trim())
    : [];
  const source: SourceProduct = {
    externalId,
    retailerName,
    title,
    description: optionalText(row.description),
    brand: optionalText(row.brand),
    category: optionalText(row.category)?.toLowerCase() ?? null,
    subcategory: optionalText(row.subcategory),
    audience: optionalText(row.audience)?.toLowerCase() ?? null,
    colour: optionalText(row.colour)?.toLowerCase() ?? null,
    currency,
    priceCents,
    originalPriceCents,
    saleStatus: saleStatus as SourceProduct['saleStatus'],
    imageUrls,
    purchaseUrl: optionalText(row.purchaseUrl),
    availability: availability as SourceProduct['availability'],
    deliveryNote: optionalText(row.deliveryNote),
    verifiedAt: optionalText(row.verifiedAt),
    affiliateStatus: row.affiliateStatus === 'approved' || row.affiliateStatus === 'none' ? row.affiliateStatus : null,
    permissionNote: optionalText(row.permissionNote),
    attributionNote: optionalText(row.attributionNote),
    variants: variants.map((variant) => ({
      externalVariantId: variant.externalVariantId,
      colour: variant.colour,
      sizeLabel: variant.sizeLabel,
      sizeSystem: variant.sizeSystem,
      priceCents: variant.priceCents,
      currency: variant.currency,
      availability: variant.availability as SourceVariant['availability'],
      gtin: variant.gtin,
    })),
    dataClass,
  };
  return { source, variants };
}
