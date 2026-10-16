import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { ShoppingError } from './errors.js';
import { normaliseProduct, type StoredVariant } from './normalize/product.js';
import { sizeMatches } from './normalize/size.js';
import type { Freshness, Maybe, SearchQuery, SourceProduct } from './types.js';

export interface PublicVariant {
  sizeLabel: Maybe<string>;
  sizeSystem: Maybe<string>;
  normalisedSize: Maybe<string>;
  normalisationConfidence: string;
  normalisationNote: string;
  colour: Maybe<string>;
  price: Maybe<{ cents: number; currency: string }>;
  availability: Maybe<string>;
  gtin: Maybe<string>;
}

export interface PublicProduct {
  id: string;
  dataClass: 'demo' | 'licensed';
  demo: boolean;
  retailerName: string;
  title: string;
  description: Maybe<string>;
  brand: Maybe<string>;
  category: Maybe<string>;
  subcategory: Maybe<string>;
  audience: Maybe<string>;
  colour: Maybe<string>;
  price: Maybe<{ cents: number; currency: string; warning: string | null }>;
  originalPrice: Maybe<{ cents: number; currency: string }>;
  discountPercent: Maybe<number>;
  saleStatus: Maybe<string>;
  availability: Maybe<string>;
  delivery: Maybe<string>;
  purchaseUrl: Maybe<string>;
  images: Maybe<string[]>;
  freshness: Freshness;
  verifiedAt: Maybe<string>;
  affiliateStatus: Maybe<string>;
  permissionNote: Maybe<string>;
  attributionNote: Maybe<string>;
  currencyNote: string | null;
  connectorId: string;
  externalId: string;
  variants: PublicVariant[];
  gtins: string[];
}

interface ProductRow {
  id: string;
  connector_id: string;
  external_id: string;
  retailer_name: string;
  title: string;
  description: string | null;
  brand: string | null;
  category: string | null;
  subcategory: string | null;
  audience: string | null;
  colour: string | null;
  currency: string | null;
  price_cents: number | null;
  original_price_cents: number | null;
  sale_status: string | null;
  purchase_url: string | null;
  availability: string | null;
  delivery_note: string | null;
  verified_at: string | null;
  affiliate_status: string | null;
  permission_note: string | null;
  attribution_note: string | null;
  data_class: 'demo' | 'licensed';
  removed_at: string | null;
}

interface VariantRow {
  product_id: string;
  external_variant_id: string | null;
  colour: string | null;
  size_label: string | null;
  size_system: string | null;
  normalised_size: string | null;
  normalisation_confidence: string;
  normalisation_note: string;
  price_cents: number | null;
  currency: string | null;
  availability: string | null;
  gtin: string | null;
}

export interface ImportResult {
  id: string;
  status: 'completed' | 'failed';
  accepted: number;
  updated: number;
  removed: number;
  rejected: number;
  errors: { rowNumber: number | null; code: string; message: string }[];
}

function unavailable(reason: string): Maybe<never> {
  return { status: 'unavailable', reason };
}

function present<T>(value: T | null | undefined, reason: string): Maybe<T> {
  if (value === null || value === undefined || value === '') return unavailable(reason);
  return { status: 'present', value };
}

function priceRank(row: ProductRow, direction: 'price_asc' | 'price_desc'): number {
  if (row.currency !== 'ZAR' || row.price_cents === null) {
    return direction === 'price_asc' ? Number.MAX_SAFE_INTEGER : Number.MIN_SAFE_INTEGER;
  }
  return direction === 'price_asc' ? row.price_cents : -row.price_cents;
}

function freshnessOf(verifiedAt: string | null, now: number, freshMs: number): Freshness {
  if (!verifiedAt) return 'unknown';
  const parsed = Date.parse(verifiedAt);
  if (!Number.isFinite(parsed)) return 'unknown';
  return now - parsed <= freshMs ? 'fresh' : 'stale';
}

function discount(row: ProductRow): Maybe<number> {
  if (row.sale_status !== 'verified_sale' || row.price_cents === null || row.original_price_cents === null) {
    return unavailable('No verified original price and sale flag were supplied together.');
  }
  if (row.original_price_cents <= row.price_cents) {
    return unavailable('The source prices do not show a lower current price.');
  }
  return { status: 'present', value: Math.round((1 - row.price_cents / row.original_price_cents) * 100) };
}

export class Catalogue {
  constructor(
    private readonly db: DatabaseSync,
    private readonly now: () => number,
    private readonly freshMs: number,
  ) {
    this.db.exec('PRAGMA foreign_keys = ON');
    this.migrate();
  }

  private migrate(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        connector_id TEXT NOT NULL,
        external_id TEXT NOT NULL,
        retailer_name TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        brand TEXT,
        category TEXT,
        subcategory TEXT,
        audience TEXT,
        colour TEXT,
        currency TEXT,
        price_cents INTEGER,
        original_price_cents INTEGER,
        sale_status TEXT,
        purchase_url TEXT,
        availability TEXT,
        delivery_note TEXT,
        verified_at TEXT,
        affiliate_status TEXT,
        permission_note TEXT,
        attribution_note TEXT,
        data_class TEXT NOT NULL,
        removed_at TEXT,
        UNIQUE(connector_id, external_id)
      );
      CREATE TABLE IF NOT EXISTS variants (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL,
        external_variant_id TEXT,
        colour TEXT,
        size_label TEXT,
        size_system TEXT,
        normalised_size TEXT,
        normalisation_confidence TEXT NOT NULL,
        normalisation_note TEXT NOT NULL,
        price_cents INTEGER,
        currency TEXT,
        availability TEXT,
        gtin TEXT
      );
      CREATE TABLE IF NOT EXISTS product_images (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL,
        url TEXT NOT NULL,
        permission_note TEXT
      );
      CREATE TABLE IF NOT EXISTS price_observations (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL,
        price_cents INTEGER NOT NULL,
        currency TEXT NOT NULL,
        observed_at TEXT NOT NULL,
        source_note TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS source_payloads (
        product_id TEXT PRIMARY KEY,
        payload_json TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS import_runs (
        id TEXT PRIMARY KEY,
        connector_id TEXT NOT NULL,
        format TEXT NOT NULL,
        status TEXT NOT NULL,
        started_at TEXT NOT NULL,
        finished_at TEXT,
        accepted INTEGER NOT NULL,
        updated INTEGER NOT NULL,
        removed INTEGER NOT NULL,
        rejected INTEGER NOT NULL,
        error_summary TEXT
      );
      CREATE TABLE IF NOT EXISTS import_errors (
        id TEXT PRIMARY KEY,
        run_id TEXT NOT NULL,
        row_number INTEGER,
        code TEXT NOT NULL,
        message TEXT NOT NULL
      );
    `);
  }

  countActive(): number {
    const row = this.db.prepare(`SELECT COUNT(*) AS count FROM products WHERE removed_at IS NULL`).get() as { count: number };
    return row.count;
  }

  importRecords(connectorId: string, format: string, records: unknown[], mode: 'upsert' | 'snapshot'): ImportResult {
    const prepared: { index: number; source: SourceProduct; variants: StoredVariant[] }[] = [];
    const errors: ImportResult['errors'] = [];
    records.forEach((record, index) => {
      try {
        prepared.push({ index, ...normaliseProduct(record) });
      } catch (error) {
        const shopping = error instanceof ShoppingError ? error : new ShoppingError('invalid_product', 'Invalid product record.', 400);
        errors.push({ rowNumber: index + 1, code: shopping.code, message: shopping.message });
      }
    });
    const runId = randomUUID();
    const started = new Date(this.now()).toISOString();
    let accepted = 0;
    let updated = 0;
    let removed = 0;
    this.db.exec('BEGIN');
    try {
      const seen = new Set<string>();
      for (const item of prepared) {
        const outcome = this.upsert(connectorId, item.source, item.variants);
        seen.add(item.source.externalId);
        if (outcome === 'created') accepted += 1;
        else updated += 1;
      }
      if (mode === 'snapshot' && prepared.length > 0 && errors.length === 0) {
        const existing = this.db.prepare(
          `SELECT external_id FROM products WHERE connector_id = ? AND removed_at IS NULL`,
        ).all(connectorId) as { external_id: string }[];
        for (const row of existing) {
          if (seen.has(row.external_id)) continue;
          this.db.prepare(`UPDATE products SET removed_at = ? WHERE connector_id = ? AND external_id = ?`).run(started, connectorId, row.external_id);
          removed += 1;
        }
      }
      const status = prepared.length === 0 && errors.length > 0 ? 'failed' : 'completed';
      this.db.prepare(
        `INSERT INTO import_runs (id, connector_id, format, status, started_at, finished_at, accepted, updated, removed, rejected, error_summary)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(runId, connectorId, format, status, started, started, accepted, updated, removed, errors.length, errors[0]?.message ?? null);
      for (const error of errors) {
        this.db.prepare(`INSERT INTO import_errors (id, run_id, row_number, code, message) VALUES (?, ?, ?, ?, ?)`).run(
          randomUUID(),
          runId,
          error.rowNumber,
          error.code,
          error.message,
        );
      }
      this.db.exec('COMMIT');
      return { id: runId, status, accepted, updated, removed, rejected: errors.length, errors };
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }

  recordFailedParse(connectorId: string, format: string, message: string): ImportResult {
    const runId = randomUUID();
    const started = new Date(this.now()).toISOString();
    this.db.prepare(
      `INSERT INTO import_runs (id, connector_id, format, status, started_at, finished_at, accepted, updated, removed, rejected, error_summary)
       VALUES (?, ?, ?, 'failed', ?, ?, 0, 0, 0, 1, ?)`,
    ).run(runId, connectorId, format, started, started, message);
    this.db.prepare(`INSERT INTO import_errors (id, run_id, row_number, code, message) VALUES (?, ?, NULL, 'invalid_feed', ?)`).run(
      randomUUID(),
      runId,
      message,
    );
    return { id: runId, status: 'failed', accepted: 0, updated: 0, removed: 0, rejected: 1, errors: [{ rowNumber: null, code: 'invalid_feed', message }] };
  }

  private upsert(connectorId: string, source: SourceProduct, variants: StoredVariant[]): 'created' | 'updated' {
    const existing = this.db.prepare(`SELECT id, price_cents, currency FROM products WHERE connector_id = ? AND external_id = ?`).get(
      connectorId,
      source.externalId,
    ) as { id: string; price_cents: number | null; currency: string | null } | undefined;
    const id = existing?.id ?? randomUUID();
    const verifiedAt = source.verifiedAt ?? new Date(this.now()).toISOString();
    if (!existing) {
      this.db.prepare(
        `INSERT INTO products (
          id, connector_id, external_id, retailer_name, title, description, brand, category, subcategory, audience, colour,
          currency, price_cents, original_price_cents, sale_status, purchase_url, availability, delivery_note, verified_at,
          affiliate_status, permission_note, attribution_note, data_class, removed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
      ).run(
        id, connectorId, source.externalId, source.retailerName, source.title, source.description, source.brand, source.category,
        source.subcategory, source.audience, source.colour, source.currency, source.priceCents, source.originalPriceCents,
        source.saleStatus, source.purchaseUrl, source.availability, source.deliveryNote, verifiedAt, source.affiliateStatus,
        source.permissionNote, source.attributionNote, source.dataClass,
      );
    } else {
      this.db.prepare(
        `UPDATE products SET retailer_name=?, title=?, description=?, brand=?, category=?, subcategory=?, audience=?, colour=?,
          currency=?, price_cents=?, original_price_cents=?, sale_status=?, purchase_url=?, availability=?, delivery_note=?,
          verified_at=?, affiliate_status=?, permission_note=?, attribution_note=?, data_class=?, removed_at=NULL
         WHERE id=?`,
      ).run(
        source.retailerName, source.title, source.description, source.brand, source.category, source.subcategory, source.audience,
        source.colour, source.currency, source.priceCents, source.originalPriceCents, source.saleStatus, source.purchaseUrl,
        source.availability, source.deliveryNote, verifiedAt, source.affiliateStatus, source.permissionNote, source.attributionNote,
        source.dataClass, id,
      );
      this.db.prepare(`DELETE FROM variants WHERE product_id = ?`).run(id);
      this.db.prepare(`DELETE FROM product_images WHERE product_id = ?`).run(id);
    }
    for (const variant of variants) {
      this.db.prepare(
        `INSERT INTO variants (
          id, product_id, external_variant_id, colour, size_label, size_system, normalised_size, normalisation_confidence,
          normalisation_note, price_cents, currency, availability, gtin
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        randomUUID(), id, variant.externalVariantId, variant.colour, variant.sizeLabel, variant.sizeSystem, variant.normalisedSize,
        variant.normalisationConfidence, variant.normalisationNote, variant.priceCents, variant.currency, variant.availability, variant.gtin,
      );
    }
    for (const url of source.imageUrls) {
      this.db.prepare(`INSERT INTO product_images (id, product_id, url, permission_note) VALUES (?, ?, ?, ?)`).run(
        randomUUID(), id, url, source.permissionNote,
      );
    }
    if (source.priceCents !== null && source.currency && (!existing || existing.price_cents !== source.priceCents || existing.currency !== source.currency)) {
      this.db.prepare(
        `INSERT INTO price_observations (id, product_id, price_cents, currency, observed_at, source_note) VALUES (?, ?, ?, ?, ?, ?)`,
      ).run(randomUUID(), id, source.priceCents, source.currency, verifiedAt, `${connectorId}:${source.externalId}`);
    }
    this.db.prepare(`INSERT INTO source_payloads (product_id, payload_json) VALUES (?, ?)
      ON CONFLICT(product_id) DO UPDATE SET payload_json = excluded.payload_json`).run(id, JSON.stringify(source));
    return existing ? 'updated' : 'created';
  }

  search(query: SearchQuery): { total: number; page: number; pageSize: number; notes: string[]; products: PublicProduct[] } {
    const rows = this.db.prepare(`SELECT * FROM products WHERE removed_at IS NULL`).all() as unknown as ProductRow[];
    const variants = this.variantsFor(rows.map((row) => row.id));
    const matched = rows.filter((row) => this.matchesQuery(row, variants.get(row.id) ?? [], query));
    const ranked = matched
      .map((row) => ({ row, score: this.score(row, query) }))
      .sort((left, right) => {
        if (query.sort === 'price_asc' || query.sort === 'price_desc') {
          return priceRank(left.row, query.sort) - priceRank(right.row, query.sort) || left.row.title.localeCompare(right.row.title);
        }
        return right.score - left.score || left.row.title.localeCompare(right.row.title);
      });
    const start = (query.page - 1) * query.pageSize;
    const page = ranked.slice(start, start + query.pageSize);
    return {
      total: ranked.length,
      page: query.page,
      pageSize: query.pageSize,
      notes: query.notes,
      products: page.map((item) => this.toPublic(item.row, variants.get(item.row.id) ?? [])),
    };
  }

  get(id: string): PublicProduct {
    const row = this.db.prepare(`SELECT * FROM products WHERE id = ?`).get(id) as ProductRow | undefined;
    if (!row || row.removed_at) throw new ShoppingError('not_found', 'No product with that id exists.', 404);
    return this.toPublic(row, this.variantsFor([id]).get(id) ?? []);
  }

  listActive(): PublicProduct[] {
    const rows = this.db.prepare(`SELECT * FROM products WHERE removed_at IS NULL`).all() as unknown as ProductRow[];
    const variants = this.variantsFor(rows.map((row) => row.id));
    return rows.map((row) => this.toPublic(row, variants.get(row.id) ?? []));
  }

  observations(productId: string): { priceCents: number; currency: string; observedAt: string }[] {
    return this.db.prepare(
      `SELECT price_cents AS priceCents, currency, observed_at AS observedAt FROM price_observations WHERE product_id = ? ORDER BY observed_at ASC`,
    ).all(productId) as { priceCents: number; currency: string; observedAt: string }[];
  }

  imports(): { id: string; connectorId: string; status: string; accepted: number; updated: number; removed: number; rejected: number; finishedAt: string | null; errorSummary: string | null }[] {
    return this.db.prepare(
      `SELECT id, connector_id AS connectorId, status, accepted, updated, removed, rejected, finished_at AS finishedAt, error_summary AS errorSummary
       FROM import_runs ORDER BY started_at DESC`,
    ).all() as { id: string; connectorId: string; status: string; accepted: number; updated: number; removed: number; rejected: number; finishedAt: string | null; errorSummary: string | null }[];
  }

  private variantsFor(ids: string[]): Map<string, VariantRow[]> {
    const grouped = new Map<string, VariantRow[]>();
    if (ids.length === 0) return grouped;
    const marks = ids.map(() => '?').join(',');
    const rows = this.db.prepare(`SELECT * FROM variants WHERE product_id IN (${marks})`).all(...ids) as unknown as VariantRow[];
    for (const row of rows) {
      const list = grouped.get(row.product_id) ?? [];
      list.push(row);
      grouped.set(row.product_id, list);
    }
    return grouped;
  }

  private matchesQuery(row: ProductRow, variants: VariantRow[], query: SearchQuery): boolean {
    if (query.category && row.category !== query.category && row.category !== query.clothingType) return false;
    if (query.colour && row.colour !== query.colour) return false;
    if (query.audience && row.audience && row.audience !== query.audience) return false;
    if (query.retailer && row.retailer_name.toLowerCase() !== query.retailer.toLowerCase()) return false;
    if (query.brand && (row.brand ?? '').toLowerCase() !== query.brand.toLowerCase()) return false;
    if (query.availability && row.availability !== query.availability) return false;
    if (query.saleStatus && row.sale_status !== query.saleStatus) return false;
    if (query.priceCurrency && row.currency !== query.priceCurrency) return false;
    if (query.minPriceCents !== null && (row.price_cents === null || row.price_cents < query.minPriceCents)) return false;
    if (query.maxPriceCents !== null && (row.price_cents === null || row.price_cents > query.maxPriceCents)) return false;
    if (query.size && !variants.some((variant) => sizeMatches(variant.size_label, variant.normalised_size, query.size!))) return false;
    if (query.text) {
      const haystack = `${row.title} ${row.description ?? ''} ${row.brand ?? ''} ${row.subcategory ?? ''}`.toLowerCase();
      if (!query.text.split(' ').every((token) => haystack.includes(token))) return false;
    }
    return true;
  }

  private score(row: ProductRow, query: SearchQuery): number {
    const haystack = `${row.title} ${row.description ?? ''}`.toLowerCase();
    const tokens = query.text.split(' ').filter(Boolean);
    return tokens.reduce((sum, token) => sum + (haystack.includes(token) ? 2 : 0), 0) + (query.category && row.category === query.category ? 1 : 0);
  }

  private toPublic(row: ProductRow, variants: VariantRow[]): PublicProduct {
    const fresh = freshnessOf(row.verified_at, this.now(), this.freshMs);
    const images = this.db.prepare(`SELECT url FROM product_images WHERE product_id = ?`).all(row.id) as { url: string }[];
    const currencyNote = row.currency && row.currency !== 'ZAR'
      ? 'This price is not converted to rand. International shipping and import costs are not included.'
      : null;
    const price = row.price_cents === null || !row.currency
      ? unavailable('The source did not provide a price.')
      : {
          status: 'present' as const,
          value: { cents: row.price_cents, currency: row.currency, warning: fresh === 'stale' ? 'Potentially stale.' : null },
        };
    return {
      id: row.id,
      dataClass: row.data_class,
      demo: row.data_class === 'demo',
      retailerName: row.retailer_name,
      title: row.title,
      description: present(row.description, 'The source did not provide a description.'),
      brand: present(row.brand, 'The source did not provide a brand.'),
      category: present(row.category, 'The source did not provide a category.'),
      subcategory: present(row.subcategory, 'The source did not provide a subcategory.'),
      audience: present(row.audience, 'The source did not provide an audience.'),
      colour: present(row.colour, 'The source did not provide a colour.'),
      price,
      originalPrice: row.original_price_cents === null || !row.currency
        ? unavailable('The source did not provide an original price.')
        : { status: 'present', value: { cents: row.original_price_cents, currency: row.currency } },
      discountPercent: discount(row),
      saleStatus: present(row.sale_status, 'The source did not confirm a promotion.'),
      availability: present(row.availability, 'The source did not provide availability.'),
      delivery: present(row.delivery_note, 'The source did not provide delivery information.'),
      purchaseUrl: present(row.purchase_url, 'The source did not provide a purchase URL.'),
      images: images.length ? { status: 'present', value: images.map((image) => image.url) } : unavailable('No displayable image was supplied.'),
      freshness: fresh,
      verifiedAt: present(row.verified_at, 'The source did not provide a verification time.'),
      affiliateStatus: present(row.affiliate_status, 'No affiliate relationship was supplied.'),
      permissionNote: present(row.permission_note, 'No permission note was supplied.'),
      attributionNote: present(row.attribution_note, 'No attribution requirement was supplied.'),
      currencyNote,
      connectorId: row.connector_id,
      externalId: row.external_id,
      variants: variants.map((variant) => ({
        sizeLabel: present(variant.size_label, 'No size label.'),
        sizeSystem: present(variant.size_system, 'No size system.'),
        normalisedSize: present(variant.normalised_size, 'No normalised size.'),
        normalisationConfidence: variant.normalisation_confidence,
        normalisationNote: variant.normalisation_note,
        colour: present(variant.colour, 'No variant colour.'),
        price: variant.price_cents === null || !variant.currency
          ? unavailable('No variant price.')
          : { status: 'present', value: { cents: variant.price_cents, currency: variant.currency } },
        availability: present(variant.availability, 'No variant availability.'),
        gtin: present(variant.gtin, 'No GTIN.'),
      })),
      gtins: variants.map((variant) => variant.gtin).filter((gtin): gtin is string => Boolean(gtin)),
    };
  }
}

export function openCatalogue(databasePath: string, now: () => number, freshMs: number): Catalogue {
  if (databasePath !== ':memory:') mkdirSync(path.dirname(databasePath), { recursive: true });
  return new Catalogue(new DatabaseSync(databasePath), now, freshMs);
}
