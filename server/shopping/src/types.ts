export type DataClass = 'demo' | 'licensed';
export type ConnectorMode = 'mock' | 'blocked';
export type Availability = 'in_stock' | 'out_of_stock';
export type SaleStatus = 'verified_sale' | 'not_on_sale';
export type Freshness = 'fresh' | 'stale' | 'unknown';
export type SizeConfidence = 'reliable' | 'uncertain' | 'unavailable';

export interface UnavailableField {
  status: 'unavailable';
  reason: string;
}

export interface PresentField<T> {
  status: 'present';
  value: T;
}

export type Maybe<T> = PresentField<T> | UnavailableField;

export interface SourceVariant {
  externalVariantId: string | null;
  colour: string | null;
  sizeLabel: string | null;
  sizeSystem: string | null;
  priceCents: number | null;
  currency: string | null;
  availability: Availability | null;
  gtin: string | null;
}

export interface SourceProduct {
  externalId: string;
  retailerName: string;
  title: string;
  description: string | null;
  brand: string | null;
  category: string | null;
  subcategory: string | null;
  audience: string | null;
  colour: string | null;
  currency: string | null;
  priceCents: number | null;
  originalPriceCents: number | null;
  saleStatus: SaleStatus | null;
  imageUrls: string[];
  purchaseUrl: string | null;
  availability: Availability | null;
  deliveryNote: string | null;
  verifiedAt: string | null;
  affiliateStatus: 'none' | 'approved' | null;
  permissionNote: string | null;
  attributionNote: string | null;
  variants: SourceVariant[];
  dataClass: DataClass;
}

export interface NormalisedSize {
  label: string | null;
  system: string | null;
  normalisedLabel: string | null;
  confidence: SizeConfidence;
  note: string;
}

export interface SearchQuery {
  text: string;
  category: string | null;
  clothingType: string | null;
  colour: string | null;
  audience: string | null;
  minPriceCents: number | null;
  maxPriceCents: number | null;
  priceCurrency: string | null;
  size: string | null;
  retailer: string | null;
  brand: string | null;
  availability: Availability | null;
  saleStatus: SaleStatus | null;
  sort: 'relevance' | 'price_asc' | 'price_desc';
  page: number;
  pageSize: number;
  notes: string[];
}
