import { timingSafeEqual } from 'node:crypto';
import path from 'node:path';
import express from 'express';
import { Catalogue } from '../catalogue.js';
import { shoppingDirectory } from '../config.js';
import { summarise, type RetailerConnector } from '../connectors/registry.js';
import { publicError, ShoppingError } from '../errors.js';
import { assertNoRemoteFetch, parseFeed } from '../ingest/parseFeed.js';
import { matchProduct } from '../match/engine.js';
import { isAvailability, isSaleStatus, parseSearch } from '../search/parse.js';

export interface AppDeps {
  catalogue: Catalogue;
  connectors: RetailerConnector[];
  token: string | null;
  host: string;
}

function safeEqual(leftValue: string, rightValue: string): boolean {
  const left = Buffer.from(leftValue);
  const right = Buffer.from(rightValue);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function createApp(deps: AppDeps): express.Express {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '2mb' }));
  app.use(express.text({ type: 'text/csv', limit: '2mb' }));

  app.get('/api/health', (_req, res) => {
    const connectors = deps.connectors.map(summarise);
    res.json({
      ok: true,
      bind: deps.host,
      mockConnectors: connectors.filter((connector) => connector.mode === 'mock').length,
      blockedConnectors: connectors.filter((connector) => connector.mode === 'blocked').length,
      verifiedLiveConnectors: 0,
      externalSync: false,
    });
  });

  app.get('/', (_req, res) => {
    res.sendFile(path.join(shoppingDirectory(), 'lab-ui', 'index.html'));
  });

  app.use('/api', (req, res, next) => {
    if (!deps.token) {
      res.status(503).json({ error: 'lab_token_missing', message: 'Set SHOPPING_LAB_TOKEN before using the shopping lab.' });
      return;
    }
    const header = req.header('authorization') ?? '';
    const presented = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (!safeEqual(presented, deps.token)) {
      res.status(401).json({ error: 'unauthorised', message: 'The shopping lab token was missing or incorrect.' });
      return;
    }
    next();
  });

  app.get('/api/connectors', (_req, res) => {
    const imports = deps.catalogue.imports();
    res.json({
      connectors: deps.connectors.map((connector) => {
        const summary = summarise(connector);
        const latest = imports.find((run) => run.connectorId === connector.id && run.status === 'completed');
        return {
          ...summary,
          lastSuccessfulRefresh: latest?.finishedAt ? { status: 'present', value: latest.finishedAt } : { status: 'unavailable', reason: 'No successful import has been recorded.' },
        };
      }),
    });
  });

  app.get('/api/products', (req, res) => {
    const query = parseSearch(String(req.query.q ?? ''), {
      category: textQuery(req.query.category),
      colour: textQuery(req.query.colour),
      size: textQuery(req.query.size),
      retailer: textQuery(req.query.retailer),
      brand: textQuery(req.query.brand),
      availability: isAvailability(textQuery(req.query.availability)) ? textQuery(req.query.availability) as 'in_stock' | 'out_of_stock' : null,
      saleStatus: isSaleStatus(textQuery(req.query.sale)) ? textQuery(req.query.sale) as 'verified_sale' | 'not_on_sale' : null,
      minPriceCents: centsQuery(req.query.minPrice),
      maxPriceCents: centsQuery(req.query.maxPrice),
      priceCurrency: centsQuery(req.query.minPrice) !== null || centsQuery(req.query.maxPrice) !== null ? 'ZAR' : null,
      sort: req.query.sort === 'price_asc' || req.query.sort === 'price_desc' ? req.query.sort : 'relevance',
      page: numberQuery(req.query.page) ?? 1,
      pageSize: numberQuery(req.query.pageSize) ?? 20,
    });
    res.json(deps.catalogue.search(query));
  });

  app.get('/api/products/:id', (req, res) => {
    const product = deps.catalogue.get(String(req.params.id));
    const observations = deps.catalogue.observations(product.id);
    res.json({ product, priceObservations: observations, matches: matchProduct(product, deps.catalogue.listActive()) });
  });

  app.get('/api/imports', (_req, res) => {
    res.json({ imports: deps.catalogue.imports() });
  });

  app.post('/api/imports', (req, res) => {
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new ShoppingError('invalid_import', 'Import body must be a JSON object.', 400);
    }
    const record = body as Record<string, unknown>;
    assertNoRemoteFetch(record);
    const connectorId = typeof record.connectorId === 'string' ? record.connectorId : '';
    const connector = deps.connectors.find((item) => item.id === connectorId);
    if (!connector) throw new ShoppingError('unknown_connector', 'Unknown connector.', 404);
    if (connector.mode === 'blocked' && record.source !== 'upload') {
      throw new ShoppingError('connector_blocked', connector.limitations[0] ?? 'That connector is blocked.', 409);
    }
    const format = record.format === 'csv' ? 'csv' : record.format === 'json' ? 'json' : record.format === 'connector' ? 'connector' : '';
    const mode = record.mode === 'snapshot' ? 'snapshot' : 'upsert';
    if (format === 'connector') {
      if (connector.mode === 'blocked') throw new ShoppingError('connector_blocked', connector.limitations[0] ?? 'That connector is blocked.', 409);
      res.status(201).json(deps.catalogue.importRecords(connector.id, 'connector', connector.listProducts(), mode));
      return;
    }
    if (!format) throw new ShoppingError('invalid_format', 'format must be json, csv, or connector.', 400);
    const content = typeof record.content === 'string' ? record.content : '';
    try {
      const records = parseFeed(format, content);
      res.status(201).json(deps.catalogue.importRecords(connector.id, format, records, mode));
    } catch (error) {
      if (error instanceof ShoppingError && error.code === 'invalid_feed') {
        res.status(400).json(deps.catalogue.recordFailedParse(connector.id, format, error.message));
        return;
      }
      throw error;
    }
  });

  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const body = publicError(error);
    res.status(body.status).json({ error: body.code, message: body.message });
  });
  return app;
}

function textQuery(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function numberQuery(value: unknown): number | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function centsQuery(value: unknown): number | null {
  const parsed = numberQuery(value);
  return parsed === null ? null : Math.round(parsed * 100);
}
