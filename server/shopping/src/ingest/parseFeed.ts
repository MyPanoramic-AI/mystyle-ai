import { ShoppingError } from '../errors.js';
import type { SourceProduct } from '../types.js';

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  const header = lines[0];
  if (!header) throw new ShoppingError('invalid_feed', 'The CSV feed has no header.', 400);
  const columns = splitCsvLine(header);
  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    const row: Record<string, string> = {};
    columns.forEach((column, index) => {
      row[column] = cells[index] ?? '';
    });
    return row;
  });
}

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (quoted && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === ',' && !quoted) {
      cells.push(current);
      current = '';
    } else {
      current += char ?? '';
    }
  }
  cells.push(current);
  return cells.map((cell) => cell.trim());
}

function numberOrNull(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : Number.NaN;
}

function csvRecord(row: Record<string, string>): Record<string, unknown> {
  const price = numberOrNull(row.priceCents);
  const original = numberOrNull(row.originalPriceCents);
  return {
    externalId: row.externalId,
    retailerName: row.retailerName,
    title: row.title,
    description: row.description || null,
    brand: row.brand || null,
    category: row.category || null,
    subcategory: row.subcategory || null,
    audience: row.audience || null,
    colour: row.colour || null,
    currency: row.currency || null,
    priceCents: price,
    originalPriceCents: original,
    saleStatus: row.saleStatus || null,
    availability: row.availability || null,
    verifiedAt: row.verifiedAt || null,
    purchaseUrl: row.purchaseUrl || null,
    deliveryNote: row.deliveryNote || null,
    imageUrls: row.imageUrl ? [row.imageUrl] : [],
    permissionNote: row.permissionNote || null,
    attributionNote: row.attributionNote || null,
    affiliateStatus: row.affiliateStatus || null,
    dataClass: row.dataClass,
    variants: row.sizeLabel
      ? [{
          externalVariantId: row.externalVariantId || null,
          colour: row.colour || null,
          sizeLabel: row.sizeLabel,
          sizeSystem: row.sizeSystem || null,
          priceCents: price,
          currency: row.currency || null,
          availability: row.availability || null,
          gtin: row.gtin || null,
        }]
      : [],
  };
}

export function parseFeed(format: string, content: string): unknown[] {
  if (format === 'json') {
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new ShoppingError('invalid_feed', 'The JSON feed could not be parsed.', 400);
    }
    if (!Array.isArray(parsed)) throw new ShoppingError('invalid_feed', 'The JSON feed must be an array.', 400);
    return parsed;
  }
  if (format === 'csv') return parseCsv(content).map(csvRecord);
  throw new ShoppingError('invalid_format', 'Feed format must be json or csv.', 400);
}

export function assertNoRemoteFetch(body: Record<string, unknown>): void {
  if ('url' in body || 'feedUrl' in body) {
    throw new ShoppingError('external_fetch_refused', 'The lab does not download feeds from a supplied URL.', 400);
  }
}

export type { SourceProduct };
