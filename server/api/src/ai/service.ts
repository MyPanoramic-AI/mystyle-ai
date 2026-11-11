import { randomUUID } from 'node:crypto';
import { ApiError, logEvent } from '../errors.js';
import type { Sql } from '../db.js';
import type { RateLimiter } from '../auth/rateLimit.js';
import { getPreferences, getProfile } from '../domain/profiles.js';
import type { AiConfig } from './aiConfig.js';
import { buildStyleSystemPrompt, minimiseProfile, resolvePersonaFromProfile, type StyleContext } from './context.js';
import { GeminiTextProvider } from './geminiProvider.js';
import { OpenAiTextProvider } from './openaiProvider.js';
import { assertLiveAllowed } from './guards.js';
import { MockTextProvider, type ProviderMessage, type ProviderUsage, type TextProvider } from './mockProvider.js';
import { validateStylistReply, type StylistReply } from './schema.js';
import { beautyUnavailable, routeSpecialist, shoppingUnavailable, tryOnUnavailable, wardrobeUnavailable } from './specialists.js';
import { readOwnedMedia, saveMedia } from '../media/store.js';
import { requireExternalPhotoConsentForVision } from '../domain/silhouette.js';
import { readProfilePhotoSlots } from '../domain/profilePhotos.js';
import type { ProviderImagePart } from './mockProvider.js';
import { buildLookVisualPrompt, generateLookImage, wantsLookVisualization } from './lookImage.js';

export interface StylistRuntime {
  db: Sql;
  config: AiConfig;
  now: () => number;
  limiter: RateLimiter;
  fetchImpl?: typeof fetch;
  mediaDir?: string;
  mediaMaxBytes?: number;
  retentionMs?: number;
}

interface UsageDraft {
  status: 'succeeded' | 'failed' | 'blocked';
  provider: string;
  model: string | null;
  usage: ProviderUsage;
  costUsd: number | null;
  costStatus: 'zero' | 'estimate' | 'unpriced';
  durationMs?: number | null;
}

function stamp(now: number): string {
  return new Date(now).toISOString();
}

function liveAttempts(db: Sql): number {
  const row = db.prepare(`SELECT COUNT(*) AS attempts FROM ai_usage WHERE provider IN ('gemini', 'openai') AND request_status IN ('succeeded', 'failed')`).get() as { attempts: number };
  return Number(row.attempts);
}

let liveQueue: Promise<void> = Promise.resolve();

function withLiveLock<T>(work: () => Promise<T>): Promise<T> {
  const run = liveQueue.then(work, work);
  liveQueue = run.then(() => undefined, () => undefined);
  return run;
}

function spent(db: Sql, userId?: string): number {
  const row = userId
    ? db.prepare(`SELECT COALESCE(SUM(cost_usd), 0) AS spent FROM ai_usage WHERE user_id = ? AND request_status = 'succeeded'`).get(userId) as { spent: number }
    : db.prepare(`SELECT COALESCE(SUM(cost_usd), 0) AS spent FROM ai_usage WHERE request_status = 'succeeded'`).get() as { spent: number };
  return Number(row.spent);
}

function isLive(provider: AiConfig['provider']): boolean {
  return provider === 'openai' || provider === 'gemini';
}

function providerFor(config: AiConfig, fetchImpl: typeof fetch): TextProvider {
  if (config.provider === 'openai') return new OpenAiTextProvider(config.model ?? '', config.apiKey ?? '', config.timeoutMs, config.maxOutputTokens, fetchImpl);
  if (config.provider === 'gemini') return new GeminiTextProvider(config.model ?? '', config.apiKey ?? '', config.timeoutMs, config.maxOutputTokens, config.thinkingBudget, fetchImpl);
  return new MockTextProvider();
}

function recordUsage(db: Sql, userId: string, conversationId: string | null, operation: string, draft: UsageDraft, now: number): void {
  db.prepare(
    `INSERT INTO ai_usage (id, user_id, conversation_id, operation_type, provider, model, input_tokens, output_tokens, cost_usd, cost_status, request_status, created_at, duration_ms)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(randomUUID(), userId, conversationId, operation, draft.provider, draft.model, draft.usage.inputTokens, draft.usage.outputTokens, draft.costUsd, draft.costStatus, draft.status, stamp(now), draft.durationMs ?? null);
  logEvent('stylist_usage', { provider: draft.provider, status: draft.status, costStatus: draft.costStatus });
}

function liveCost(config: AiConfig, usage: ProviderUsage): { costUsd: number; costStatus: 'estimate' } {
  if (usage.inputTokens == null || usage.outputTokens == null || config.inputUsdPerMillion == null || config.outputUsdPerMillion == null) {
    throw new ApiError('ai_unpriced', 'The provider response did not include billable usage.', 502);
  }
  if (config.provider === 'gemini') {
    if (usage.thoughtTokens == null) throw new ApiError('ai_unpriced', 'The provider response did not include billable usage.', 502);
    const costUsd = (usage.inputTokens / 1_000_000) * config.inputUsdPerMillion + ((usage.outputTokens + usage.thoughtTokens) / 1_000_000) * config.outputUsdPerMillion;
    return { costUsd, costStatus: 'estimate' };
  }
  const cached = usage.cachedTokens ?? 0;
  const fresh = Math.max(usage.inputTokens - cached, 0);
  const cachedRate = config.cachedInputUsdPerMillion ?? config.inputUsdPerMillion;
  const costUsd = (fresh / 1_000_000) * config.inputUsdPerMillion + (cached / 1_000_000) * cachedRate + (usage.outputTokens / 1_000_000) * config.outputUsdPerMillion;
  return { costUsd, costStatus: 'estimate' };
}

function safeFallback(): StylistReply {
  return {
    responseText: 'I could not turn that into a reliable outfit suggestion. I have not searched a shop and I do not have a price or a product link.',
    recommendationType: 'clarification',
    specialist: 'style',
    availability: 'ready',
    source: 'mock',
    outfitTitle: null,
    outfitComponents: [],
    suggestedColours: [],
    accessories: [],
    budgetGuidance: null,
    occasion: null,
    followUpQuestions: ['What is the occasion, and how formal should it feel?'],
    shoppingSearchIntent: null,
    tryOnIntent: false,
    savedLookIntent: false,
    lookVisualIntent: false,
    lookVisualPrompt: null,
    generatedMediaId: null,
  };
}

async function produce(
  runtime: StylistRuntime,
  text: string,
  history: ProviderMessage[],
  context: StyleContext | null,
  userId: string,
  conversationId: string,
  images: ProviderImagePart[] = [],
): Promise<{ reply: StylistReply; draft: UsageDraft }> {
  const specialist = images.length ? 'style' : routeSpecialist(text);
  if (specialist === 'shopping') return { reply: shoppingUnavailable(text), draft: { status: 'succeeded', provider: 'none', model: null, usage: { inputTokens: null, outputTokens: null, thoughtTokens: null }, costUsd: 0, costStatus: 'zero' } };
  if (specialist === 'try_on') return { reply: tryOnUnavailable(), draft: { status: 'succeeded', provider: 'none', model: null, usage: { inputTokens: null, outputTokens: null, thoughtTokens: null }, costUsd: 0, costStatus: 'zero' } };
  if (specialist === 'beauty') return { reply: beautyUnavailable(), draft: { status: 'succeeded', provider: 'none', model: null, usage: { inputTokens: null, outputTokens: null, thoughtTokens: null }, costUsd: 0, costStatus: 'zero' } };
  if (specialist === 'wardrobe') return { reply: wardrobeUnavailable(), draft: { status: 'succeeded', provider: 'none', model: null, usage: { inputTokens: null, outputTokens: null, thoughtTokens: null }, costUsd: 0, costStatus: 'zero' } };
  const provider = providerFor(runtime.config, runtime.fetchImpl ?? fetch);
  if (isLive(runtime.config.provider)) assertLiveAllowed(runtime.config, spent(runtime.db), spent(runtime.db, userId), liveAttempts(runtime.db));
  try {
    let profileRecord: Record<string, unknown> | null = null;
    try {
      profileRecord = getProfile(runtime.db, userId);
    } catch {
      profileRecord = null;
    }
    const system = buildStyleSystemPrompt(resolvePersonaFromProfile(profileRecord));
    const userTurn: ProviderMessage = images.length
      ? { role: 'user', text, images }
      : { role: 'user', text };
    const completed = await provider.complete({ system, messages: [...history, userTurn], context });
    const validated = validateStylistReply(completed.reply, runtime.config.provider === 'mock' ? 'mock' : 'live');
    if (!validated) {
      return { reply: safeFallback(), draft: { status: 'failed', provider: provider.id, model: completed.model, usage: completed.usage, costUsd: null, costStatus: 'unpriced' } };
    }
    if (isLive(runtime.config.provider)) {
      const priced = liveCost(runtime.config, completed.usage);
      return { reply: validated, draft: { status: 'succeeded', provider: provider.id, model: completed.model, usage: completed.usage, durationMs: completed.durationMs, ...priced } };
    }
    return { reply: { ...validated, source: 'mock' }, draft: { status: 'succeeded', provider: 'mock', model: null, usage: completed.usage, costUsd: 0, costStatus: 'zero' } };
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.code === 'ai_unpriced') {
        recordUsage(runtime.db, userId, conversationId, 'stylist_message', { status: 'failed', provider: provider.id, model: runtime.config.model, usage: { inputTokens: null, outputTokens: null, thoughtTokens: null }, costUsd: null, costStatus: 'unpriced' }, runtime.now());
      }
      throw error;
    }
    const aborted = error instanceof Error && error.name === 'AbortError';
    const code = error instanceof Error && 'code' in error ? String((error as { code?: string }).code) : '';
    recordUsage(runtime.db, userId, conversationId, 'stylist_message', { status: 'failed', provider: provider.id, model: runtime.config.model, usage: { inputTokens: null, outputTokens: null, thoughtTokens: null }, costUsd: null, costStatus: 'unpriced' }, runtime.now());
    if (code === 'provider_auth') throw new ApiError('ai_provider_auth', 'The stylist provider did not accept the server credential.', 502);
    if (code === 'provider_quota') throw new ApiError('ai_provider_quota', 'The stylist provider has no remaining quota. Try again later.', 429);
    if (code === 'provider_rate_limit') throw new ApiError('ai_provider_rate_limited', 'The stylist is busy with your photograph. Send it again in a moment.', 429);
    throw new ApiError(aborted ? 'ai_timeout' : 'ai_provider_error', aborted ? 'The stylist took too long to reply.' : 'The stylist could not complete that reply.', aborted ? 504 : 502);
  }
}

function contextFor(db: Sql, userId: string): StyleContext | null {
  const consent = getPreferences(db, userId).aiPersonalisationConsent === true;
  if (!consent) return null;
  return minimiseProfile(getProfile(db, userId), true);
}

export function stylistAvailability(config: AiConfig): Record<string, unknown> {
  const liveReady = isLive(config.provider) && config.allowLive && config.maxLiveRequests > 0 && Boolean(config.apiKey) && Boolean(config.model) && config.inputUsdPerMillion != null && config.outputUsdPerMillion != null && config.maxBudgetUsd > 0 && config.maxUserBudgetUsd > 0;
  const lookImageReady = config.lookImageAllowLive && config.provider === 'openai' && Boolean(config.apiKey) && liveReady;
  return {
    provider: config.provider,
    liveEnabled: liveReady,
    acceptingMessages: config.provider === 'mock' || liveReady,
    label: config.provider === 'mock' ? 'Demonstration stylist. This is not a live model.' : liveReady ? 'Live stylist' : 'Live AI is switched off.',
    shopping: 'not_connected',
    tryOn: 'not_connected',
    beauty: 'not_connected',
    wardrobe: 'not_connected',
    lookImage: lookImageReady ? 'ready' : 'not_connected',
  };
}

function loadProfileReferenceImages(runtime: StylistRuntime, userId: string): ProviderImagePart[] {
  if (!runtime.mediaDir) return [];
  try {
    const slots = readProfilePhotoSlots(runtime.db, userId);
    const ids = [slots.portraitMediaId, slots.fullBodyFrontMediaId].filter((id): id is string => Boolean(id)).slice(0, 2);
    const images: ProviderImagePart[] = [];
    for (const id of ids) {
      const ownedMedia = readOwnedMedia(runtime.db, runtime.mediaDir, userId, id);
      images.push({ mimeType: ownedMedia.contentType, base64: ownedMedia.bytes.toString('base64') });
    }
    return images;
  } catch {
    return [];
  }
}

async function maybeAttachLookImage(
  runtime: StylistRuntime,
  userId: string,
  conversationId: string,
  userText: string,
  reply: StylistReply,
  attachmentImages: ProviderImagePart[],
): Promise<StylistReply> {
  if (!wantsLookVisualization(userText, reply.lookVisualIntent)) return reply;
  if (!runtime.config.lookImageAllowLive || runtime.config.provider !== 'openai' || !runtime.config.apiKey) {
    return reply;
  }
  if (!runtime.mediaDir || runtime.mediaMaxBytes == null || runtime.retentionMs == null) return reply;

  const lookCost = runtime.config.lookImageUsd;
  if (spent(runtime.db) + lookCost > runtime.config.maxBudgetUsd) return reply;
  if (spent(runtime.db, userId) + lookCost > runtime.config.maxUserBudgetUsd) return reply;

  let references = attachmentImages.slice(0, 2);
  if (!references.length) references = loadProfileReferenceImages(runtime, userId);

  try {
    if (references.length) requireExternalPhotoConsentForVision(runtime.db, userId);
    const prompt = buildLookVisualPrompt({
      userText,
      modelPrompt: reply.lookVisualPrompt,
      hasReferencePhoto: references.length > 0,
    });
    const image = await generateLookImage({
      config: runtime.config,
      prompt,
      referenceImages: references,
      fetchImpl: runtime.fetchImpl,
    });
    const saved = saveMedia({
      db: runtime.db,
      mediaDir: runtime.mediaDir,
      userId,
      bytes: image.bytes,
      purpose: 'stylist_look_result',
      now: runtime.now(),
      maxBytes: runtime.mediaMaxBytes,
      retentionMs: runtime.retentionMs,
    });
    recordUsage(runtime.db, userId, conversationId, 'stylist_look_image', {
      status: 'succeeded',
      provider: 'openai',
      model: image.model,
      usage: {
        inputTokens: image.usage.inputTokens,
        outputTokens: image.usage.outputTokens,
        thoughtTokens: null,
      },
      costUsd: lookCost,
      costStatus: 'estimate',
      durationMs: image.durationMs,
    }, runtime.now());
    return {
      ...reply,
      lookVisualIntent: true,
      generatedMediaId: saved.id,
    };
  } catch (error) {
    const code = error instanceof ApiError ? error.code : error instanceof Error && 'code' in error ? String((error as { code?: string }).code) : 'look_image_failed';
    logEvent('look_image_attach_failed', { code }, 'warn');
    recordUsage(runtime.db, userId, conversationId, 'stylist_look_image', {
      status: 'failed',
      provider: 'openai',
      model: runtime.config.lookImageModel,
      usage: { inputTokens: null, outputTokens: null, thoughtTokens: null },
      costUsd: null,
      costStatus: 'unpriced',
    }, runtime.now());
    return reply;
  }
}

export function createConversation(db: Sql, userId: string, now: number): Record<string, unknown> {
  const id = randomUUID();
  const created = stamp(now);
  db.prepare('INSERT INTO ai_conversations (id, user_id, title, created_at, last_activity_at) VALUES (?, ?, ?, ?, ?)').run(id, userId, 'New styling session', created, created);
  return { id, title: 'New styling session', createdAt: created, lastActivityAt: created };
}

export function listConversations(db: Sql, userId: string): Record<string, unknown>[] {
  return db.prepare(
    'SELECT id, title, created_at AS createdAt, last_activity_at AS lastActivityAt FROM ai_conversations WHERE user_id = ? ORDER BY last_activity_at DESC',
  ).all(userId) as Record<string, unknown>[];
}

function owned(db: Sql, userId: string, conversationId: string): void {
  const row = db.prepare('SELECT id FROM ai_conversations WHERE id = ? AND user_id = ?').get(conversationId, userId);
  if (!row) throw new ApiError('not_found', 'Conversation not found.', 404);
}

export function readConversation(db: Sql, userId: string, conversationId: string): Record<string, unknown> {
  owned(db, userId, conversationId);
  const conversation = db.prepare('SELECT id, title, created_at AS createdAt, last_activity_at AS lastActivityAt FROM ai_conversations WHERE id = ?').get(conversationId) as Record<string, unknown>;
  const messages = (db.prepare(
    `SELECT id, role, content, recommendation_json AS recommendationJson, provider, model, created_at AS createdAt,
            attachment_media_ids_json AS attachmentMediaIdsJson
     FROM ai_messages WHERE conversation_id = ? ORDER BY created_at, id`,
  ).all(conversationId) as Record<string, unknown>[]).map((message) => {
    let attachmentMediaIds: string[] = [];
    if (typeof message.attachmentMediaIdsJson === 'string' && message.attachmentMediaIdsJson.trim()) {
      try {
        const parsed = JSON.parse(message.attachmentMediaIdsJson) as unknown;
        if (Array.isArray(parsed)) {
          attachmentMediaIds = parsed.filter((id): id is string => typeof id === 'string');
        }
      } catch {
        attachmentMediaIds = [];
      }
    }
    return {
      id: message.id,
      role: message.role,
      content: message.content,
      recommendation: message.recommendationJson ? JSON.parse(String(message.recommendationJson)) : null,
      provider: message.provider,
      model: message.model,
      createdAt: message.createdAt,
      attachmentMediaIds,
    };
  });
  return { ...conversation, messages };
}

export function recommendationsFor(db: Sql, userId: string, conversationId: string): Record<string, unknown>[] {
  const conversation = readConversation(db, userId, conversationId);
  return (conversation.messages as { recommendation: unknown }[]).filter((message) => message.recommendation);
}

export function deleteConversation(db: Sql, userId: string, conversationId: string): void {
  owned(db, userId, conversationId);
  db.prepare('DELETE FROM ai_conversations WHERE id = ? AND user_id = ?').run(conversationId, userId);
}

export function usageFor(db: Sql, userId: string): Record<string, unknown> {
  const rows = db.prepare(
    'SELECT operation_type AS operationType, provider, model, input_tokens AS inputTokens, output_tokens AS outputTokens, cost_usd AS costUsd, cost_status AS costStatus, request_status AS requestStatus, duration_ms AS durationMs, created_at AS createdAt FROM ai_usage WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
  ).all(userId);
  return { spentUsd: spent(db, userId), entries: rows };
}

function resolveAttachmentImages(
  runtime: StylistRuntime,
  userId: string,
  mediaIds: string[],
): { mediaIds: string[]; images: ProviderImagePart[] } {
  const unique = [...new Set(mediaIds.map((id) => id.trim()).filter(Boolean))].slice(0, 2);
  if (!unique.length) return { mediaIds: [], images: [] };
  if (!runtime.mediaDir) {
    throw new ApiError('media_unavailable', 'Photograph storage is not configured on this server.', 503);
  }
  requireExternalPhotoConsentForVision(runtime.db, userId);
  const images: ProviderImagePart[] = [];
  for (const id of unique) {
    const ownedMedia = readOwnedMedia(runtime.db, runtime.mediaDir, userId, id);
    images.push({
      mimeType: ownedMedia.contentType,
      base64: ownedMedia.bytes.toString('base64'),
    });
  }
  return { mediaIds: unique, images };
}

export async function sendMessage(
  runtime: StylistRuntime,
  userId: string,
  conversationId: string,
  text: string,
  idempotencyKey: string | null,
  mediaIds: string[] = [],
): Promise<Record<string, unknown>> {
  owned(runtime.db, userId, conversationId);
  const attachments = resolveAttachmentImages(runtime, userId, mediaIds);
  const content = text.trim()
    || (attachments.images.length
      ? 'I attached a photo — tell me how this look reads on me and how to style it.'
      : '');
  if (!content || content.length > runtime.config.maxInputChars) throw new ApiError('invalid_message', 'The message must be between 1 and the configured length limit.', 400);
  const modelContent = attachments.images.length
    ? [
      content,
      '',
      'You can see my attached photograph. Open with a specific description of what I am wearing / how I look in this photo (colours, cut, formality, proportion), then give styling advice. Do not ignore the image.',
    ].join('\n').slice(0, runtime.config.maxInputChars)
    : content;
  if (idempotencyKey && !/^[A-Za-z0-9_-]{8,80}$/.test(idempotencyKey)) throw new ApiError('invalid_message', 'The idempotency key is not valid.', 400);
  if (idempotencyKey) {
    const existing = runtime.db.prepare(
      'SELECT id, content, recommendation_json AS recommendationJson, provider, model, created_at AS createdAt FROM ai_messages WHERE conversation_id = ? AND idempotency_key = ? AND role = ?',
    ).get(conversationId, idempotencyKey, 'assistant') as Record<string, unknown> | undefined;
    if (existing) {
      return { id: existing.id, role: 'assistant', content: existing.content, recommendation: existing.recommendationJson ? JSON.parse(String(existing.recommendationJson)) : null, provider: existing.provider, model: existing.model, createdAt: existing.createdAt, duplicate: true };
    }
  }
  if (!runtime.limiter.consume(`stylist:${userId}`)) throw new ApiError('rate_limited', 'Too many stylist messages. Wait and try again.', 429);
  // Attached photos must stay on the style/vision path — never divert to shopping/try-on stubs.
  const specialist = attachments.images.length ? 'style' : routeSpecialist(content);
  const deliver = async () => {
    if (specialist === 'style' && isLive(runtime.config.provider)) {
      try {
        assertLiveAllowed(runtime.config, spent(runtime.db), spent(runtime.db, userId), liveAttempts(runtime.db));
      } catch (error) {
        if (error instanceof ApiError) recordUsage(runtime.db, userId, conversationId, 'stylist_message', { status: 'blocked', provider: runtime.config.provider, model: runtime.config.model, usage: { inputTokens: null, outputTokens: null, thoughtTokens: null }, costUsd: null, costStatus: 'unpriced' }, runtime.now());
        throw error;
      }
    }
    const history = (runtime.db.prepare('SELECT role, content FROM ai_messages WHERE conversation_id = ? ORDER BY created_at, id').all(conversationId) as { role: 'user' | 'assistant'; content: string }[])
      .slice(-8)
      .map((message) => ({ role: message.role, text: message.content }));
    const created = stamp(runtime.now());
    const userMessageId = randomUUID();
    const attachmentJson = attachments.mediaIds.length ? JSON.stringify(attachments.mediaIds) : null;
    runtime.db.prepare(
      `INSERT INTO ai_messages (id, conversation_id, role, content, recommendation_json, provider, model, idempotency_key, created_at, attachment_media_ids_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(userMessageId, conversationId, 'user', content, null, null, null, null, created, attachmentJson);
    try {
      const context = contextFor(runtime.db, userId);
      const produced = await produce(runtime, modelContent, history, context, userId, conversationId, attachments.images);
      const reply = produced.draft.status === 'succeeded'
        ? await maybeAttachLookImage(runtime, userId, conversationId, content, produced.reply, attachments.images)
        : produced.reply;
      const assistantId = randomUUID();
      const answered = stamp(runtime.now());
      runtime.db.prepare(
        `INSERT INTO ai_messages (id, conversation_id, role, content, recommendation_json, provider, model, idempotency_key, created_at, attachment_media_ids_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
      ).run(
        assistantId, conversationId, 'assistant', reply.responseText, JSON.stringify(reply), produced.draft.provider, produced.draft.model, idempotencyKey, answered,
      );
      if (produced.draft.status === 'succeeded' || produced.draft.status === 'failed') {
        recordUsage(runtime.db, userId, conversationId, 'stylist_message', produced.draft, runtime.now());
      }
      const title = content.slice(0, 60);
      runtime.db.prepare(`UPDATE ai_conversations SET last_activity_at = ?, title = CASE WHEN title = 'New styling session' THEN ? ELSE title END WHERE id = ?`).run(answered, title, conversationId);
      return { id: assistantId, role: 'assistant', content: reply.responseText, recommendation: reply, provider: produced.draft.provider, model: produced.draft.model, createdAt: answered, duplicate: false };
    } catch (error) {
      runtime.db.prepare('DELETE FROM ai_messages WHERE id = ? AND conversation_id = ? AND role = ?').run(userMessageId, conversationId, 'user');
      throw error;
    }
  };
  if (specialist === 'style' && isLive(runtime.config.provider)) return withLiveLock(deliver);
  return deliver();
}
