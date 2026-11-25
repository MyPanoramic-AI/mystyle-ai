/**
 * Look visualizations for live voice conversations.
 * Reuses the same image path as text chat so Aria can show outfits on screen.
 */

import { randomUUID } from 'node:crypto';
import type { Sql } from '../db.js';
import { ApiError, logEvent } from '../errors.js';
import { getProfile } from '../domain/profiles.js';
import { readProfilePhotoSlots } from '../domain/profilePhotos.js';
import { requireExternalPhotoConsentForVision } from '../domain/silhouette.js';
import { readOwnedMedia, saveMedia } from '../media/store.js';
import type { AiConfig } from './aiConfig.js';
import { resolvePersonaFromProfile } from './context.js';
import {
  buildLookVisualPrompt,
  generateLookImage,
  wantsLookVisualization,
} from './lookImage.js';
import type { ProviderImagePart } from './mockProvider.js';

function stamp(now: number): string {
  return new Date(now).toISOString();
}

/** Text + look-image spend only. Voice has its own AI_VOICE_* budgets. */
function spent(db: Sql, userId?: string): number {
  const row = userId
    ? db.prepare(
      `SELECT COALESCE(SUM(cost_usd), 0) AS spent FROM ai_usage
       WHERE user_id = ? AND request_status = 'succeeded'
         AND operation_type != 'stylist_voice_session'`,
    ).get(userId) as { spent: number }
    : db.prepare(
      `SELECT COALESCE(SUM(cost_usd), 0) AS spent FROM ai_usage
       WHERE request_status = 'succeeded'
         AND operation_type != 'stylist_voice_session'`,
    ).get() as { spent: number };
  return Number(row?.spent ?? 0);
}

function recordUsage(
  db: Sql,
  userId: string,
  conversationId: string | null,
  operation: string,
  draft: {
    status: string;
    provider: string;
    model: string | null;
    usage: { inputTokens: number | null; outputTokens: number | null; thoughtTokens: number | null };
    costUsd: number | null;
    costStatus: string;
    durationMs?: number | null;
  },
  now: number,
): void {
  db.prepare(
    `INSERT INTO ai_usage (id, user_id, conversation_id, operation_type, provider, model, input_tokens, output_tokens, cost_usd, cost_status, request_status, created_at, duration_ms)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    randomUUID(),
    userId,
    conversationId,
    operation,
    draft.provider,
    draft.model,
    draft.usage.inputTokens,
    draft.usage.outputTokens,
    draft.costUsd,
    draft.costStatus,
    draft.status,
    stamp(now),
    draft.durationMs ?? null,
  );
  logEvent('stylist_usage', { provider: draft.provider, status: draft.status, costStatus: draft.costStatus });
}

function ownConversation(db: Sql, userId: string, conversationId: string): string {
  const row = db.prepare(`SELECT id FROM ai_conversations WHERE id = ? AND user_id = ?`).get(conversationId, userId) as { id: string } | undefined;
  if (!row?.id) throw new ApiError('not_found', 'Conversation not found.', 404);
  return row.id;
}

function loadProfileReferenceImages(db: Sql, mediaDir: string, userId: string): ProviderImagePart[] {
  try {
    const slots = readProfilePhotoSlots(db, userId);
    const ids = [slots.portraitMediaId, slots.fullBodyFrontMediaId].filter((id): id is string => Boolean(id)).slice(0, 2);
    const images: ProviderImagePart[] = [];
    for (const id of ids) {
      const ownedMedia = readOwnedMedia(db, mediaDir, userId, id);
      images.push({ mimeType: ownedMedia.contentType, base64: ownedMedia.bytes.toString('base64') });
    }
    return images;
  } catch {
    return [];
  }
}

function loadLatestLookReference(db: Sql, mediaDir: string, userId: string, conversationId: string): ProviderImagePart | null {
  try {
    const rows = db.prepare(
      `SELECT recommendation_json AS recommendationJson FROM ai_messages
       WHERE conversation_id = ? AND role = 'assistant' AND recommendation_json IS NOT NULL
       ORDER BY created_at DESC LIMIT 24`,
    ).all(conversationId) as { recommendationJson: string }[];
    for (const row of rows) {
      let parsed: { generatedMediaId?: unknown };
      try {
        parsed = JSON.parse(row.recommendationJson) as { generatedMediaId?: unknown };
      } catch {
        continue;
      }
      const mediaId = typeof parsed.generatedMediaId === 'string' ? parsed.generatedMediaId.trim() : '';
      if (!mediaId) continue;
      const ownedMedia = readOwnedMedia(db, mediaDir, userId, mediaId);
      return { mimeType: ownedMedia.contentType, base64: ownedMedia.bytes.toString('base64') };
    }
    return null;
  } catch {
    return null;
  }
}

/** Broader voice phrasing for “show me the look”. */
export function voiceWantsLookVisualization(text: string): boolean {
  if (wantsLookVisualization(text, false)) return true;
  const value = text.toLowerCase();
  return /\b(give me (a |the )?(picture|photo|image|look)|i just want the picture|what you are imagining|picture of|photo of|image of|see (the|this|that) look|visual of)\b/.test(value);
}

export async function createVoiceLookVisual(opts: {
  db: Sql;
  userId: string;
  conversationId: string;
  prompt: string;
  config: AiConfig;
  mediaDir: string;
  mediaMaxBytes: number;
  retentionMs: number;
  fetchImpl?: typeof fetch;
  now?: () => number;
}): Promise<{
  mediaId: string;
  imageUrl: string;
  title: string;
  promptUsed: string;
}> {
  const conversationId = ownConversation(opts.db, opts.userId, opts.conversationId);
  const promptText = opts.prompt.trim().slice(0, 700);
  if (promptText.length < 4) {
    throw new ApiError('bad_request', 'A styling prompt is required for the look visualization.', 400);
  }
  if (!opts.config.lookImageAllowLive || opts.config.provider !== 'openai' || !opts.config.apiKey) {
    throw new ApiError('look_image_disabled', 'Look visualization is not enabled on this server.', 503);
  }

  const lookCost = opts.config.lookImageUsd;
  if (spent(opts.db) + lookCost > opts.config.maxBudgetUsd) {
    throw new ApiError('ai_budget_exhausted', 'The stylist image budget has been reached.', 429);
  }
  if (spent(opts.db, opts.userId) + lookCost > opts.config.maxUserBudgetUsd) {
    throw new ApiError('ai_budget_exhausted', 'Your stylist image budget has been reached.', 429);
  }

  const nowMs = (opts.now ?? Date.now)();
  const priorLook = loadLatestLookReference(opts.db, opts.mediaDir, opts.userId, conversationId);
  const hasPriorLook = Boolean(priorLook);
  const references = priorLook
    ? [priorLook]
    : loadProfileReferenceImages(opts.db, opts.mediaDir, opts.userId);
  if (references.length) {
    requireExternalPhotoConsentForVision(opts.db, opts.userId);
  }

  const persona = resolvePersonaFromProfile(getProfile(opts.db, opts.userId) as Record<string, unknown>);
  const imagePrompt = buildLookVisualPrompt({
    userText: promptText,
    modelPrompt: promptText,
    hasReferencePhoto: references.length > 0,
    hasPriorLook,
  });

  try {
    const image = await generateLookImage({
      config: opts.config,
      prompt: imagePrompt,
      referenceImages: references,
      fetchImpl: opts.fetchImpl,
    });
    const saved = saveMedia({
      db: opts.db,
      mediaDir: opts.mediaDir,
      userId: opts.userId,
      bytes: image.bytes,
      purpose: 'stylist_look_result',
      now: nowMs,
      maxBytes: opts.mediaMaxBytes,
      retentionMs: opts.retentionMs,
    });
    recordUsage(opts.db, opts.userId, conversationId, 'stylist_look_image', {
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
    }, nowMs);

    const recommendation = {
      channel: 'voice',
      source: 'gpt-live-1.1',
      responseText: `Here is a look visualization for what we discussed.`,
      lookVisualIntent: true,
      generatedMediaId: saved.id,
      recommendationType: 'concept',
      availability: 'not_connected',
    };
    const messageId = randomUUID();
    const created = stamp(nowMs);
    opts.db.prepare(
      `INSERT INTO ai_messages (id, conversation_id, role, content, recommendation_json, provider, model, idempotency_key, created_at)
       VALUES (?, ?, 'assistant', ?, ?, 'openai', ?, ?, ?)`,
    ).run(
      messageId,
      conversationId,
      `Here is a look visualization for what we discussed: ${promptText.slice(0, 180)}`,
      JSON.stringify(recommendation),
      opts.config.lookImageModel,
      `voice_look_${saved.id}`,
      created,
    );
    opts.db.prepare(`UPDATE ai_conversations SET last_activity_at = ? WHERE id = ?`).run(created, conversationId);

    return {
      mediaId: saved.id,
      imageUrl: `/api/media/${saved.id}`,
      title: `${persona.name}'s look`,
      promptUsed: promptText,
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    const code = error instanceof Error && 'code' in error ? String((error as { code?: string }).code) : 'look_image_failed';
    logEvent('voice_look_image_failed', { code }, 'warn');
    recordUsage(opts.db, opts.userId, conversationId, 'stylist_look_image', {
      status: 'failed',
      provider: 'openai',
      model: opts.config.lookImageModel,
      usage: { inputTokens: null, outputTokens: null, thoughtTokens: null },
      costUsd: null,
      costStatus: 'unpriced',
    }, nowMs);
    throw new ApiError('look_image_failed', 'Could not create the look visualization right now.', 502);
  }
}
