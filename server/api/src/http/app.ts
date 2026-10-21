import express, { type NextFunction, type Request, type Response } from 'express';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { ApiError, publicError } from '../errors.js';
import type { ApiConfig } from '../config.js';
import { pingDatabase } from '../config.js';
import type { Sql } from '../db.js';
import { RateLimiter } from '../auth/rateLimit.js';
import { clearSessionCookie, destroySession, findSession, readCookie, requireCsrf, sessionCookie, SESSION_COOKIE, safeEqual, type SessionRecord } from '../auth/sessions.js';
import { loginAccount, registerAccount } from '../domain/accounts.js';
import { getPreferences, getProfile, updatePreferences, updateProfile } from '../domain/profiles.js';
import { createFamilyEvent, createFamilyMember, deleteFamilyEvent, deleteFamilyMember, getFamilyEvent, getFamilyMember, listFamily, listFamilyEvents, updateFamilyEvent, updateFamilyMember } from '../domain/family.js';
import { createLook, createPlan, createWardrobeItem, deleteLook, deletePlan, deleteSavedProduct, deleteWardrobeItem, getLook, getPlan, getWardrobeItem, listLooks, listPlans, listSavedProducts, listWardrobe, saveProduct, updateLook, updatePlan, updateWardrobeItem } from '../domain/collections.js';
import { createBeautyLook, deleteBeautyLook, getBeautyLook, getBeautyPreferences, linkBeautyOutfit, listBeautyLooks, saveBeautyPreferences, unlinkBeautyOutfit, updateBeautyLook } from '../domain/beauty.js';
import { assertPurpose, cleanupExpiredMedia, deleteOwnedMedia, readOwnedMedia, saveMedia } from '../media/store.js';
import { integrationBoundaries } from '../integrations.js';
import {
  adjustCredits,
  allocateCredits,
  assignEntitlement,
  expireCredits,
  listAccountEntitlements,
  listPlans as listPublishedPlans,
  listReservations,
  prepareAuthorizedOperation,
  readCredits,
  readEntitlement,
  readUsage,
  reconcile,
  refundConsumed,
  releaseById,
  reserveCredits,
  runMonthlyAllocations,
  setBillingPolicy,
  settleOperation,
  usageTotals,
} from '../domain/membership.js';
import { loadAiConfig, type AiConfig } from '../ai/aiConfig.js';
import { createConversation, deleteConversation, listConversations, readConversation, recommendationsFor, sendMessage, stylistAvailability, usageFor } from '../ai/service.js';

export interface AppDeps {
  db: Sql;
  config: ApiConfig;
  now: () => number;
  rateLimiter: RateLimiter;
  aiConfig?: AiConfig;
  aiFetch?: typeof fetch;
}

function securityHeaders(res: Response, page: boolean): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader(
    'Content-Security-Policy',
    page
      ? "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https://images.unsplash.com; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; object-src 'none'"
      : "default-src 'none'; frame-ancestors 'none'",
  );
  if (!page) res.setHeader('Cache-Control', 'no-store');
}

export function createApp(deps: AppDeps): express.Express {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '12mb' }));
  app.use((req, res, next) => {
    securityHeaders(res, !req.path.startsWith('/api'));
    const origin = req.header('origin');
    if (origin && deps.config.allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-CSRF-Token, X-Idempotency-Key');
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
    res.setHeader('Set-Cookie', sessionCookie(token, Math.floor(deps.config.sessionMs / 1000), deps.config.secureCookie));
  }

  function requireAdmin(req: Request): void {
    if (!deps.config.adminToken) throw new ApiError('admin_unavailable', 'The operator route is disabled.', 503);
    const presented = (req.header('authorization') ?? '').replace(/^Bearer /, '');
    if (!presented || !safeEqual(presented, deps.config.adminToken)) throw new ApiError('unauthorised', 'The operator route was not accepted.', 401);
  }

  function text(value: unknown): string {
    if (typeof value !== 'string' || value.trim().length === 0 || value.length > 120) {
      throw new ApiError('invalid_body', 'The request was not accepted.', 400);
    }
    return value.trim();
  }

  const route = (handler: (req: Request, res: Response) => unknown) => (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = handler(req, res);
      if (result && typeof (result as Promise<unknown>).then === 'function') {
        (result as Promise<unknown>).catch(next);
      }
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
    res.setHeader('Set-Cookie', clearSessionCookie(deps.config.secureCookie));
    res.json({ ok: true });
  }));

  app.get('/api/auth/session', route((req, res) => {
    const session = current(req);
    if (!session) throw new ApiError('unauthorised', 'Sign in is required.', 401);
    res.json({ userId: session.userId, email: session.email, csrfToken: session.csrfToken, expiresAt: session.expiresAt });
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
  app.delete('/api/family/:id', route((req, res) => {
    deleteFamilyMember(deps.db, requireUser(req).userId, String(req.params.id));
    res.json({ ok: true });
  }));

  app.get('/api/family-events', route((req, res) => res.json({ events: listFamilyEvents(deps.db, requireUser(req).userId) })));
  app.post('/api/family-events', route((req, res) => res.status(201).json(createFamilyEvent(deps.db, requireUser(req).userId, req.body ?? {}, deps.now()))));
  app.get('/api/family-events/:id', route((req, res) => res.json(getFamilyEvent(deps.db, requireUser(req).userId, String(req.params.id)))));
  app.patch('/api/family-events/:id', route((req, res) => res.json(updateFamilyEvent(deps.db, requireUser(req).userId, String(req.params.id), req.body ?? {}, deps.now()))));
  app.delete('/api/family-events/:id', route((req, res) => {
    deleteFamilyEvent(deps.db, requireUser(req).userId, String(req.params.id));
    res.json({ ok: true });
  }));

  app.get('/api/beauty-preferences', route((req, res) => res.json(getBeautyPreferences(deps.db, requireUser(req).userId))));
  app.put('/api/beauty-preferences', route((req, res) => res.json(saveBeautyPreferences(deps.db, requireUser(req).userId, req.body ?? {}, deps.now()))));
  app.get('/api/beauty-looks', route((req, res) => res.json({ looks: listBeautyLooks(deps.db, requireUser(req).userId, req.query) })));
  app.post('/api/beauty-looks', route((req, res) => res.status(201).json(createBeautyLook(deps.db, requireUser(req).userId, req.body ?? {}, deps.now()))));
  app.post('/api/beauty-looks/:id/links', route((req, res) => res.status(201).json(linkBeautyOutfit(deps.db, requireUser(req).userId, String(req.params.id), req.body ?? {}))));
  app.delete('/api/beauty-looks/:id/links/:linkId', route((req, res) => res.json(unlinkBeautyOutfit(deps.db, requireUser(req).userId, String(req.params.id), String(req.params.linkId)))));
  app.get('/api/beauty-looks/:id', route((req, res) => res.json(getBeautyLook(deps.db, requireUser(req).userId, String(req.params.id)))));
  app.patch('/api/beauty-looks/:id', route((req, res) => res.json(updateBeautyLook(deps.db, requireUser(req).userId, String(req.params.id), req.body ?? {}, deps.now()))));
  app.delete('/api/beauty-looks/:id', route((req, res) => {
    deleteBeautyLook(deps.db, requireUser(req).userId, String(req.params.id));
    res.json({ ok: true });
  }));

  app.get('/api/wardrobe', route((req, res) => res.json({ items: listWardrobe(deps.db, requireUser(req).userId) })));
  app.post('/api/wardrobe', route((req, res) => {
    res.status(201).json(createWardrobeItem(deps.db, requireUser(req).userId, req.body ?? {}, deps.now()));
  }));
  app.get('/api/wardrobe/:id', route((req, res) => res.json(getWardrobeItem(deps.db, requireUser(req).userId, String(req.params.id)))));
  app.patch('/api/wardrobe/:id', route((req, res) => {
    res.json(updateWardrobeItem(deps.db, requireUser(req).userId, String(req.params.id), req.body ?? {}, deps.now()));
  }));
  app.delete('/api/wardrobe/:id', route((req, res) => {
    deleteWardrobeItem(deps.db, requireUser(req).userId, String(req.params.id));
    res.json({ ok: true });
  }));

  app.get('/api/looks', route((req, res) => res.json({ looks: listLooks(deps.db, requireUser(req).userId) })));
  app.post('/api/looks', route((req, res) => res.status(201).json(createLook(deps.db, requireUser(req).userId, req.body ?? {}, deps.now()))));
  app.get('/api/looks/:id', route((req, res) => res.json(getLook(deps.db, requireUser(req).userId, String(req.params.id)))));
  app.patch('/api/looks/:id', route((req, res) => res.json(updateLook(deps.db, requireUser(req).userId, String(req.params.id), req.body ?? {}, deps.now()))));
  app.delete('/api/looks/:id', route((req, res) => {
    deleteLook(deps.db, requireUser(req).userId, String(req.params.id));
    res.json({ ok: true });
  }));

  app.get('/api/outfit-plans', route((req, res) => res.json({ plans: listPlans(deps.db, requireUser(req).userId) })));
  app.get('/api/outfit-plans/:id', route((req, res) => res.json(getPlan(deps.db, requireUser(req).userId, String(req.params.id)))));
  app.post('/api/outfit-plans', route((req, res) => res.status(201).json(createPlan(deps.db, requireUser(req).userId, req.body ?? {}, deps.now()))));
  app.patch('/api/outfit-plans/:id', route((req, res) => res.json(updatePlan(deps.db, requireUser(req).userId, String(req.params.id), req.body ?? {}, deps.now()))));
  app.delete('/api/outfit-plans/:id', route((req, res) => {
    deletePlan(deps.db, requireUser(req).userId, String(req.params.id));
    res.json({ ok: true });
  }));

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

  app.get('/api/plans', route((req, res) => {
    requireUser(req);
    res.json({ plans: listPublishedPlans(deps.db), paymentsEnabled: false });
  }));
  app.get('/api/entitlements', route((req, res) => {
    const userId = requireUser(req).userId;
    const current = readEntitlement(deps.db, userId, deps.now());
    const rows = deps.db.prepare(
      'SELECT id, plan_code AS planCode, status, effective_from AS effectiveFrom, effective_to AS effectiveTo, source FROM subscription_entitlements WHERE user_id = ?',
    ).all(userId);
    res.json({ entitlements: rows, current: current.entitlement, paid: false });
  }));
  app.post('/api/entitlements', route((req, res) => {
    requireUser(req);
    res.status(403).json({ code: 'paid_plan_forbidden', message: 'A customer cannot assign a plan.' });
  }));
  app.get('/api/credits', route((req, res) => {
    res.json(readCredits(deps.db, requireUser(req).userId));
  }));
  app.get('/api/credits/history', route((req, res) => {
    const credits = readCredits(deps.db, requireUser(req).userId);
    res.json({ entries: credits.entries, balance: credits.balance, unit: credits.unit });
  }));
  app.post('/api/credits/allocate', route((req, res) => {
    requireUser(req);
    res.status(403).json({ code: 'credit_grant_forbidden', message: 'A customer cannot grant credits.' });
  }));
  app.get('/api/usage/summary', route((req, res) => {
    res.json(readUsage(deps.db, requireUser(req).userId));
  }));

  app.get('/api/integrations', route((req, res) => {
    requireUser(req);
    res.json(integrationBoundaries);
  }));

  const aiConfig = deps.aiConfig ?? loadAiConfig();
  const aiLimiter = new RateLimiter(aiConfig.messageRateLimit, aiConfig.messageRateWindowMs, deps.now);
  const stylist = { db: deps.db, config: aiConfig, now: deps.now, limiter: aiLimiter, fetchImpl: deps.aiFetch };

  app.get('/api/stylist/availability', route((req, res) => {
    requireUser(req);
    res.json(stylistAvailability(aiConfig));
  }));
  app.get('/api/stylist/usage', route((req, res) => {
    res.json(usageFor(deps.db, requireUser(req).userId));
  }));
  app.get('/api/stylist/conversations', route((req, res) => {
    res.json({ conversations: listConversations(deps.db, requireUser(req).userId) });
  }));
  app.post('/api/stylist/conversations', route((req, res) => {
    res.status(201).json(createConversation(deps.db, requireUser(req).userId, deps.now()));
  }));
  app.get('/api/stylist/conversations/:id', route((req, res) => {
    res.json(readConversation(deps.db, requireUser(req).userId, String(req.params.id)));
  }));
  app.get('/api/stylist/conversations/:id/recommendations', route((req, res) => {
    res.json({ recommendations: recommendationsFor(deps.db, requireUser(req).userId, String(req.params.id)) });
  }));
  app.delete('/api/stylist/conversations/:id', route((req, res) => {
    deleteConversation(deps.db, requireUser(req).userId, String(req.params.id));
    res.status(204).end();
  }));
  app.post('/api/stylist/conversations/:id/messages', route((req, res) => {
    const userId = requireUser(req).userId;
    const text = typeof req.body?.text === 'string' ? req.body.text : '';
    return sendMessage(stylist, userId, String(req.params.id), text, req.header('x-idempotency-key') ?? null).then((message) => {
      res.status(201).json({ message });
    });
  }));

  app.get('/api/admin/accounts', route((req, res) => {
    requireAdmin(req);
    res.json({ accounts: listAccountEntitlements(deps.db) });
  }));
  app.post('/api/admin/entitlements', route((req, res) => {
    requireAdmin(req);
    res.json(assignEntitlement(deps.db, {
      userId: text(req.body?.userId),
      planCode: text(req.body?.planCode),
      status: text(req.body?.status),
      effectiveTo: typeof req.body?.effectiveTo === 'string' ? req.body.effectiveTo : null,
      actor: 'admin',
    }, deps.now()));
  }));
  app.post('/api/admin/credits/allocate', route((req, res) => {
    requireAdmin(req);
    res.json(allocateCredits(deps.db, {
      userId: text(req.body?.userId),
      amount: req.body?.amount,
      periodKey: text(req.body?.periodKey),
      idempotencyKey: text(req.body?.idempotencyKey),
      reason: text(req.body?.reason ?? 'Test allocation'),
    }, deps.now()));
  }));
  app.post('/api/admin/credits/reserve', route((req, res) => {
    requireAdmin(req);
    res.json(reserveCredits(deps.db, {
      userId: text(req.body?.userId),
      amount: req.body?.amount,
      idempotencyKey: text(req.body?.idempotencyKey),
      operationType: text(req.body?.operationType ?? 'text'),
      featureKey: text(req.body?.featureKey ?? 'account.basic'),
      provider: 'mock',
      reason: text(req.body?.reason ?? 'Test reservation'),
    }, deps.now()));
  }));
  app.post('/api/admin/credits/settle', route((req, res) => {
    requireAdmin(req);
    res.json(settleOperation(deps.db, {
      userId: text(req.body?.userId),
      operationId: text(req.body?.operationId),
      outcome: text(req.body?.outcome),
    }, deps.now()));
  }));
  app.post('/api/admin/credits/release', route((req, res) => {
    requireAdmin(req);
    res.json(releaseById(deps.db, text(req.body?.userId), text(req.body?.operationId), req.body?.confirmNotBillable === true, deps.now()));
  }));
  app.post('/api/admin/credits/adjust', route((req, res) => {
    requireAdmin(req);
    res.json(adjustCredits(deps.db, {
      userId: text(req.body?.userId),
      amount: req.body?.amount,
      idempotencyKey: text(req.body?.idempotencyKey),
      reason: text(req.body?.reason ?? 'Test adjustment'),
    }, deps.now()));
  }));
  app.post('/api/admin/credits/refund', route((req, res) => {
    requireAdmin(req);
    res.json(refundConsumed(deps.db, {
      userId: text(req.body?.userId),
      operationId: text(req.body?.operationId),
      idempotencyKey: text(req.body?.idempotencyKey),
      reason: text(req.body?.reason ?? 'Test refund'),
    }, deps.now()));
  }));
  app.post('/api/admin/credits/expire', route((req, res) => {
    requireAdmin(req);
    res.json(expireCredits(deps.db, deps.now()));
  }));
  app.get('/api/admin/credits/reservations', route((req, res) => {
    requireAdmin(req);
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    res.json({ reservations: listReservations(deps.db, status) });
  }));
  app.get('/api/admin/credits/reconcile', route((req, res) => {
    requireAdmin(req);
    res.json(reconcile(deps.db, text(req.query.userId)));
  }));
  app.get('/api/admin/usage', route((req, res) => {
    requireAdmin(req);
    res.json({ totals: usageTotals(deps.db) });
  }));
  app.post('/api/admin/billing/run', route((req, res) => {
    requireAdmin(req);
    res.json(runMonthlyAllocations(deps.db, deps.now()));
  }));
  app.post('/api/admin/billing/policy', route((req, res) => {
    requireAdmin(req);
    res.json(setBillingPolicy(deps.db, {
      rolloverPolicy: typeof req.body?.rolloverPolicy === 'string' ? req.body.rolloverPolicy : undefined,
      expiryPolicy: typeof req.body?.expiryPolicy === 'string' ? req.body.expiryPolicy : undefined,
      paidAllocationEnabled: typeof req.body?.paidAllocationEnabled === 'boolean' ? req.body.paidAllocationEnabled : undefined,
    }));
  }));
  app.post('/api/admin/credits/mock', route((req, res) => {
    requireAdmin(req);
    const userId = text(req.body?.userId);
    const idempotencyKey = text(req.body?.idempotencyKey);
    const reserved = prepareAuthorizedOperation(deps.db, {
      userId,
      featureKey: text(req.body?.featureKey ?? 'account.basic'),
      credits: req.body?.credits,
      operationType: req.body?.operationType === 'image' ? 'image' : 'text',
      provider: 'mock',
      idempotencyKey,
    }, deps.now());
    if (reserved.duplicate || !reserved.operationId) {
      res.json({ reserved, settled: null });
      return;
    }
    const settled = settleOperation(deps.db, { userId, operationId: reserved.operationId, outcome: text(req.body?.outcome) }, deps.now());
    res.json({ reserved, settled });
  }));

  app.get('/api/admin/audit', route((req, res) => {
    requireAdmin(req);
    const events = deps.db.prepare(
      'SELECT id, event_type AS eventType, actor_user_id AS actorUserId, resource_type AS resourceType, resource_id AS resourceId, created_at AS createdAt FROM audit_events ORDER BY created_at DESC LIMIT 50',
    ).all();
    res.json({ events });
  }));

  if (deps.config.staticDir && existsSync(path.join(deps.config.staticDir, 'index.html'))) {
    const directory = deps.config.staticDir;
    app.use(express.static(directory));
    app.use((req, res, next) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        next();
        return;
      }
      if (req.path.startsWith('/api')) {
        next();
        return;
      }
      res.sendFile(path.join(directory, 'index.html'));
    });
  }

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const body = publicError(error);
    res.status(body.status).json({ code: body.code, message: body.message });
  });

  return app;
}
