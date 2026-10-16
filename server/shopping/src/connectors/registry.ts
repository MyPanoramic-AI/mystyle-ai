import { readFileSync } from 'node:fs';
import path from 'node:path';
import { shoppingDirectory } from '../config.js';
import type { ConnectorMode, SourceProduct } from '../types.js';

export interface ConnectorSummary {
  id: string;
  label: string;
  mode: ConnectorMode;
  limitations: string[];
  fields: Record<string, 'supplied_when_present' | 'unavailable'>;
}

export interface RetailerConnector {
  readonly id: string;
  readonly label: string;
  readonly mode: ConnectorMode;
  readonly limitations: readonly string[];
  listProducts(): SourceProduct[];
  getProduct(externalId: string): SourceProduct | null;
}

const unavailableFields = {
  products: 'unavailable',
  search: 'unavailable',
  details: 'unavailable',
  variants: 'unavailable',
  prices: 'unavailable',
  sizes: 'unavailable',
  images: 'unavailable',
  purchaseUrls: 'unavailable',
  lastRefresh: 'unavailable',
} as const;

class JsonConnector implements RetailerConnector {
  readonly mode = 'mock' as const;
  readonly limitations = [
    'DEMO fixture. Prices and stock are not retailer data.',
    'No external request is made.',
  ];

  constructor(
    readonly id: string,
    readonly label: string,
    private readonly fileName: string,
  ) {}

  listProducts(): SourceProduct[] {
    const file = path.join(shoppingDirectory(), 'data', this.fileName);
    return JSON.parse(readFileSync(file, 'utf8')) as SourceProduct[];
  }

  getProduct(externalId: string): SourceProduct | null {
    return this.listProducts().find((product) => product.externalId === externalId) ?? null;
  }
}

class BlockedConnector implements RetailerConnector {
  readonly mode = 'blocked' as const;

  constructor(
    readonly id: string,
    readonly label: string,
    readonly limitations: readonly string[],
  ) {}

  listProducts(): SourceProduct[] {
    return [];
  }

  getProduct(): SourceProduct | null {
    return null;
  }
}

export function createConnectors(): RetailerConnector[] {
  const retailers = JSON.parse(readFileSync(path.join(shoppingDirectory(), 'data', 'retailers.json'), 'utf8')) as {
    id: string;
    name: string;
    blocker: string;
  }[];
  return [
    new JsonConnector('demo-atelier', 'Demo Atelier', 'mock-catalogue.json'),
    new JsonConnector('demo-outlet', 'Demo Outlet', 'mock-outlet.json'),
    ...retailers.map((retailer) => new BlockedConnector(retailer.id, retailer.name, [retailer.blocker, 'No products are returned.'])),
  ];
}

export function summarise(connector: RetailerConnector): ConnectorSummary {
  if (connector.mode === 'blocked') {
    return {
      id: connector.id,
      label: connector.label,
      mode: connector.mode,
      limitations: [...connector.limitations],
      fields: { ...unavailableFields },
    };
  }
  return {
    id: connector.id,
    label: connector.label,
    mode: connector.mode,
    limitations: [...connector.limitations],
    fields: {
      products: 'supplied_when_present',
      search: 'supplied_when_present',
      details: 'supplied_when_present',
      variants: 'supplied_when_present',
      prices: 'supplied_when_present',
      sizes: 'supplied_when_present',
      images: 'supplied_when_present',
      purchaseUrls: 'supplied_when_present',
      lastRefresh: 'supplied_when_present',
    },
  };
}
