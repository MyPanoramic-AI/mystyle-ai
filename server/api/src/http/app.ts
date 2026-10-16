import express, { type NextFunction, type Request, type Response } from 'express';
import { ApiError, publicError } from '../errors.js';
import type { ApiConfig } from '../config.js';
import { pingDatabase } from '../config.js';
import type { Sql } from '../db.js';
import { RateLimiter } from '../auth/rateLimit.js';
import { clearSessionCookie, destroySession, findSession, readCookie, requireCsrf, sessionCookie, SESSION_COOKIE, safeEqual, type SessionRecord } from '../auth/sessions.js';
import { loginAccount, registerAccount } from '../domain/accounts.js';
import { getPreferences, getProfile, updatePreferences, updateProfile } from '../domain/profiles.js';
import { createFamilyMember, getFamilyMember, listFamily, updateFamilyMember } from '../domain/family.js';
import { createLook, createWardrobeItem, deleteSavedProduct, getLook, getWardrobeItem, listLooks, listSavedProducts, listWardrobe, saveProduct } from '../domain/collections.js';
import { assertPurpose, cleanupExpiredMedia, deleteOwnedMedia, readOwnedMedia, saveMedia } from '../media/store.js';
import { integrationBoundaries } from '../integrations.js';

export interface AppDeps {
  db: Sql;
  config: ApiConfig;
  now: () => number;
  rateLimiter: RateLimiter;
}

function securityHeaders(res: Response): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
  res.setHeader('Cache-Control', 'no-store');
}

export function createApp(deps: AppDeps): express.Express {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '12mb' }));
  app.use((req, res, next) => {
    securityHeaders(res);
    const origin = req.header('origin');
    if (origin && deps.config.allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-CSRF-Token');
      res.setHeader('Vary', 'Origin');
    }
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    if (req.method !== 'GET' && req.method !== 'HEAD' && origin && !deps.config.allowedOrigins.includes(origin)) {
      next(new ApiError('forbidden_origin', 'That browser origin is not allowed.', 403));
      return;
    }
    next();
  });

  function current(req: Request): SessionRecord | null {
    return findSession(deps.db, readCookie(req.header('cookie'), SESSION_COOKIE), deps.now());
  }

  function requireUser(req: Request): SessionRecord {
    const session = current(req);
    if (!session) throw new ApiError('unauthorised', 'Sign in is required.', 401);
    if (req.method !== 'GET' && req.method !== 'HEAD') requireCsrf(req.header('x-csrf-token'), session);
    return session;
  }

  function limitAuth(req: Request): void {
    const key = `${req.socket.remoteAddress ?? 'local'}:${req.path}`;
    if (!deps.rateLimiter.consume(key)) throw new ApiError('rate_limited', 'Too many attempts. Wait and try again.', 429);
  }

  function issue(res: Response, token: string): void {
    res.setHeader('Set-Cookie', sessionCookie(token, Math.floor(deps.config.sessionMs / 1000)));
  }

  const route = (handler: (req: Request, res: Response) => void) => (req: Request, res: Response, next: NextFunction) => {
    try {
      handler(req, res);
    } catch (error) {
      next(error);
    }
  };

  app.get('/api/health', route((_req, res) => {
    try {
      pingDatabase(deps.db);
      res.json({ ok: true, bind: deps.config.host, database: 'up' });
    } catch {
      res.status(503).json({ ok: false, database: 'unavailable' });
    }
  }));

  app.post('/api/auth/register', route((req, res) => {
    limitAuth(req);
    const created = registerAccount(deps.db, req.body?.email, req.body?.password, deps.now(), deps.config.sessionMs);
    issue(res, created.token);
    res.status(201).json({ userId: created.userId, csrfToken: created.csrfToken });
  }));

  app.post('/api/auth/login', route((req, res) => {
    limitAuth(req);
    const session = loginAccount(deps.db, req.body?.email, req.body?.password, deps.now(), deps.config.sessionMs);
    issue(res, session.token);
    res.json({ userId: session.userId, csrfToken: session.csrfToken });
  }));

  app.post('/api/auth/logout', route((req, res) => {
    const session = requireUser(req);
    destroySession(deps.db, session.id);
    res.setHeader('Set-Cookie', clearSessionCookie());
    res.json({ ok: true });
  }));

  app.get('/api/auth/session', route((req, res) => {
    const session = current(req);
    if (!session) throw new ApiError('unauthorised', 'Sign in is required.', 401);
    res.json({ userId: session.userId, csrfToken: session.csrfToken, expiresAt: session.expiresAt });
  }));

  app.get('/api/profile', route((req, res) => {
    res.json(getProfile(deps.db, requireUser(req).userId));
  }));
  app.put('/api/profile', route((req, res) => {
    res.json(updateProfile(deps.db, requireUser(req).userId, req.body ?? {}, deps.now()));
  }));
  app.get('/api/preferences', route((req, res) => {
    res.json(getPreferences(deps.db, requireUser(req).userId));
  }));
  app.put('/api/preferences', route((req, res) => {
    res.json(updatePreferences(deps.db, requireUser(req).userId, req.body ?? {}, deps.now()));
  }));

  app.get('/api/family', route((req, res) => res.json({ members: listFamily(deps.db, requireUser(req).userId) })));
  app.post('/api/family', route((req, res) => {
    res.status(201).json(createFamilyMember(deps.db, requireUser(req).userId, req.body ?? {}, deps.now()));
  }));
  app.get('/api/family/:id', route((req, res) => res.json(getFamilyMember(deps.db, requireUser(req).userId, String(req.params.id)))));
  app.patch('/api/family/:id', route((req, res) => {
    res.json(updateFamilyMember(deps.db, requireUser(req).userId, String(req.params.id), req.body ?? {}, deps.now()));
  }));

  app.get('/api/wardrobe', route((req, res) => res.json({ items: listWardrobe(deps.db, requireUser(req).userId) })));
  app.post('/api/wardrobe', route((req, res) => {
    res.status(201).json(createWardrobeItem(deps.db, requireUser(req).userId, req.body ?? {}, deps.now()));
  }));
  app.get('/api/wardrobe/:id', route((req, res) => res.json(getWardrobeItem(deps.db, requireUser(req).userId, String(req.params.id)))));

  app.get('/api/looks', route((req, res) => res.json({ looks: listLooks(deps.db, requireUser(req).userId) })));
  app.post('/api/looks', route((req, res) => res.status(201).json(createLook(deps.db, requireUser(req).userId, req.body ?? {}, deps.now()))));
  app.get('/api/looks/:id', route((req, res) => res.json(getLook(deps.db, requireUser(req).userId, String(req.params.id)))));

  app.get('/api/saved-products', route((req, res) => res.json({ products: listSavedProducts(deps.db, requireUser(req).userId) })));
  app.post('/api/saved-products', route((req, res) => {
    res.status(201).json(saveProduct(deps.db, requireUser(req).userId, req.body ?? {}, deps.now()));
  }));
  app.delete('/api/saved-products/:id', route((req, res) => {
    deleteSavedProduct(deps.db, requireUser(req).userId, String(req.params.id));
    res.json({ ok: true });
  }));

  app.post('/api/media', route((req, res) => {
    const session = requireUser(req);
    const encoded = typeof req.body?.imageBase64 === 'string' ? req.body.imageBase64 : '';
    if (!/^[A-Za-z0-9+/=\r\n]+$/.test(encoded)) throw new ApiError('invalid_image', 'The image payload was not accepted.', 400);
    const saved = saveMedia({
      db: deps.db,
      mediaDir: deps.config.mediaDir,
      userId: session.userId,
      bytes: Buffer.from(encoded, 'base64'),
      purpose: assertPurpose(req.body?.purpose),
      now: deps.now(),
      maxBytes: deps.config.mediaMaxBytes,
      retentionMs: deps.config.retentionMs,
    });
    res.status(201).json(saved);
  }));
  app.get('/api/media/:id', route((req, res) => {
    const file = readOwnedMedia(deps.db, deps.config.mediaDir, requireUser(req).userId, String(req.params.id));
    res.setHeader('Content-Type', file.contentType);
    res.send(file.bytes);
  }));
  app.delete('/api/media/:id', route((req, res) => {
    deleteOwnedMedia(deps.db, deps.config.mediaDir, requireUser(req).userId, String(req.params.id), deps.now());
    res.json({ ok: true });
  }));
  app.post('/api/media/cleanup', route((req, res) => {
    requireUser(req);
    res.json({ removed: cleanupExpiredMedia(deps.db, deps.config.mediaDir, deps.now()) });
  }));

  app.get('/api/entitlements', route((req, res) => {
    const userId = requireUser(req).userId;
    const rows = deps.db.prepare(
      'SELECT id, plan_code AS planCode, status, effective_from AS effectiveFrom, effective_to AS effectiveTo FROM subscription_entitlements WHERE user_id = ?',
    ).all(userId);
    res.json({ entitlements: rows });
  }));
  app.get('/api/credits', route((req, res) => {
    const userId = requireUser(req).userId;
    const row = deps.db.prepare('SELECT COALESCE(SUM(delta), 0) AS balance FROM credit_ledger WHERE user_id = ?').get(userId) as { balance: number };
    const entries = deps.db.prepare('SELECT id, delta, reason, created_at AS createdAt FROM credit_ledger WHERE user_id = ? ORDER BY created_at').all(userId);
    res.json({ balance: Number(row.balance), entries });
  }));

  app.get('/api/integrations', route((req, res) => {
    requireUser(req);
    res.json(integrationBoundaries);
  }));

  app.get('/api/admin/audit', route((req, res) => {
    if (!deps.config.adminToken) throw new ApiError('admin_unavailable', 'The audit route is disabled.', 503);
    const presented = (req.header('authorization') ?? '').replace(/^Bearer /, '');
    if (!presented || !safeEqual(presented, deps.config.adminToken)) throw new ApiError('unauthorised', 'The audit route was not accepted.', 401);
    const events = deps.db.prepare(
      'SELECT id, event_type AS eventType, actor_user_id AS actorUserId, resource_type AS resourceType, resource_id AS resourceId, created_at AS createdAt FROM audit_events ORDER BY created_at DESC LIMIT 50',
    ).all();
    res.json({ events });
  }));

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const body = publicError(error);
    res.status(body.status).json({ code: body.code, message: body.message });
  });

  return app;
}
