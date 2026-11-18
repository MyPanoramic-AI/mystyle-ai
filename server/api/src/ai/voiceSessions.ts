import { randomUUID } from 'node:crypto';
import type { Sql } from '../db.js';
import { ApiError, logEvent } from '../errors.js';
import { getPreferences, getProfile } from '../domain/profiles.js';
import { minimiseProfile, resolvePersonaFromProfile } from './context.js';
import { assertVoiceAllowed, remainingSecondsAvailable } from './voiceGuards.js';
import {
  estimateVoiceSessionUsd,
  GPT_LIVE_AUDIO_VOICES,
  loadVoiceConfig,
  voiceServiceReady,
  type VoiceConfig,
} from './voiceConfig.js';
import { buildVoiceDelegationInstructions, buildVoiceLiveInstructions } from './voicePrompt.js';

const GPT_LIVE_MODEL_LABEL = 'gpt-live-1';

function stamp(now: number): string {
  return new Date(now).toISOString();
}

export interface VoiceActiveSession {
  sessionId: string;
  userId: string;
  conversationId: string | null;
  startedAtMs: number;
  estimatedUsd: number;
  maxSeconds: number;
  inactivitySeconds: number;
}

/** In-memory active sessions (server process). Enforced alongside DB usage rows. */
const activeBySession = new Map<string, VoiceActiveSession>();
const activeCountByUser = new Map<string, number>();

function bumpUser(userId: string, delta: number): void {
  const next = (activeCountByUser.get(userId) ?? 0) + delta;
  if (next <= 0) activeCountByUser.delete(userId);
  else activeCountByUser.set(userId, next);
}

export function voiceSpentUsd(db: Sql, userId?: string): number {
  const row = userId
    ? db.prepare(
      `SELECT COALESCE(SUM(cost_usd), 0) AS spent FROM ai_usage
       WHERE user_id = ? AND request_status = 'succeeded' AND operation_type = 'stylist_voice_session'`,
    ).get(userId) as { spent: number }
    : db.prepare(
      `SELECT COALESCE(SUM(cost_usd), 0) AS spent FROM ai_usage
       WHERE request_status = 'succeeded' AND operation_type = 'stylist_voice_session'`,
    ).get() as { spent: number };
  return Number(row.spent) || 0;
}

export function voiceDailySeconds(db: Sql, userId: string, nowMs: number): number {
  const dayStart = new Date(nowMs);
  dayStart.setUTCHours(0, 0, 0, 0);
  const row = db.prepare(
    `SELECT COALESCE(SUM(duration_ms), 0) AS ms FROM ai_usage
     WHERE user_id = ? AND operation_type = 'stylist_voice_session'
       AND request_status IN ('succeeded', 'failed')
       AND created_at >= ?`,
  ).get(userId, dayStart.toISOString()) as { ms: number };
  return Math.floor((Number(row.ms) || 0) / 1000);
}

export function voiceAvailability(config: VoiceConfig = loadVoiceConfig()): Record<string, unknown> {
  const ready = voiceServiceReady(config);
  return {
    voiceEnabled: ready,
    model: config.model,
    audioVoice: config.audioVoice,
    supportedAudioVoices: [...GPT_LIVE_AUDIO_VOICES],
    maxSessionSeconds: config.maxSessionSeconds,
    dailySecondsLimit: config.dailySecondsLimit,
    inactivitySeconds: config.inactivitySeconds,
    label: ready ? 'Live voice ready' : 'Live voice is switched off.',
    shopping: 'not_connected',
    tryOn: 'not_connected',
    beauty: 'not_connected',
    wardrobe: 'not_connected',
  };
}

function recordVoiceUsage(
  db: Sql,
  userId: string,
  conversationId: string | null,
  draft: {
    status: 'succeeded' | 'failed' | 'blocked';
    provider: string;
    model: string | null;
    costUsd: number | null;
    costStatus: 'estimate' | 'provider' | 'unpriced';
    durationMs: number | null;
  },
  nowMs: number,
): void {
  db.prepare(
    `INSERT INTO ai_usage (id, user_id, conversation_id, operation_type, provider, model, input_tokens, output_tokens, cost_usd, cost_status, request_status, created_at, duration_ms)
     VALUES (?, ?, ?, 'stylist_voice_session', ?, ?, NULL, NULL, ?, ?, ?, ?, ?)`,
  ).run(
    randomUUID(),
    userId,
    conversationId,
    draft.provider,
    draft.model,
    draft.costUsd,
    draft.costStatus,
    draft.status,
    stamp(nowMs),
    draft.durationMs,
  );
}

function ownConversation(db: Sql, userId: string, conversationId: string | null): string | null {
  if (!conversationId) return null;
  const row = db.prepare(`SELECT id FROM ai_conversations WHERE id = ? AND user_id = ?`).get(conversationId, userId) as { id: string } | undefined;
  if (!row) throw new ApiError('not_found', 'Conversation not found.', 404);
  return row.id;
}

export interface CreateVoiceSessionResult {
  session: { id: string };
  transport: { type: 'webrtc'; sdp: string };
  limits: {
    maxSessionSeconds: number;
    inactivitySeconds: number;
    estimatedReserveUsd: number;
  };
  persona: { name: string; voice: string; audioVoice: string };
}

export async function createVoiceSession(opts: {
  db: Sql;
  userId: string;
  sdp: string;
  conversationId?: string | null;
  audioVoice?: string | null;
  config?: VoiceConfig;
  fetchImpl?: typeof fetch;
  now?: () => number;
}): Promise<CreateVoiceSessionResult> {
  const config = opts.config ?? loadVoiceConfig();
  const nowMs = (opts.now ?? Date.now)();
  const fetchImpl = opts.fetchImpl ?? fetch;
  const conversationId = ownConversation(opts.db, opts.userId, opts.conversationId ?? null);

  const dailySecondsUsed = voiceDailySeconds(opts.db, opts.userId, nowMs);
  const estimatedUsd = assertVoiceAllowed(config, {
    spentUsd: voiceSpentUsd(opts.db),
    userSpentUsd: voiceSpentUsd(opts.db, opts.userId),
    activeForUser: activeCountByUser.get(opts.userId) ?? 0,
    dailySecondsUsed,
  });

  const profile = getProfile(opts.db, opts.userId) as Record<string, unknown>;
  const persona = resolvePersonaFromProfile(profile);
  const consent = getPreferences(opts.db, opts.userId).aiPersonalisationConsent === true;
  const styleContext = consent ? minimiseProfile(profile, true) : null;
  const instructions = buildVoiceLiveInstructions(persona, styleContext);
  const audioVoice = (opts.audioVoice && (GPT_LIVE_AUDIO_VOICES as readonly string[]).includes(opts.audioVoice))
    ? opts.audioVoice
    : config.audioVoice;

  const maxSeconds = remainingSecondsAvailable(config, dailySecondsUsed);

  const sessionBody: Record<string, unknown> = {
    model: config.model,
    instructions,
    audio: {
      output: { voice: audioVoice },
    },
  };

  // Responses delegation for fashion reasoning; no shopping tools (not_connected).
  // Chosen over client delegation for reliable first-party voice: MyStyle still validates
  // all application actions on future client-tool hooks; shopping/try-on stay honest.
  if (config.delegationModel) {
    sessionBody.delegation = {
      type: 'responses',
      responses: {
        model: config.delegationModel,
        instructions: buildVoiceDelegationInstructions(persona),
        tool_choice: 'none',
      },
    };
  }

  if (!config.apiKey) {
    throw new ApiError('voice_unconfigured', 'OPENAI_API_KEY is not configured.', 503);
  }

  let openaiResponse: Response;
  try {
    openaiResponse = await fetchImpl('https://api.openai.com/v1/live/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session: sessionBody,
        transport: {
          type: 'webrtc',
          sdp: opts.sdp,
        },
      }),
    });
  } catch {
    throw new ApiError('voice_provider_error', 'Could not reach the voice provider.', 502);
  }

  const rawText = await openaiResponse.text();
  let payload: Record<string, unknown> = {};
  try {
    payload = rawText ? JSON.parse(rawText) as Record<string, unknown> : {};
  } catch {
    payload = {};
  }

  if (!openaiResponse.ok) {
    const status = openaiResponse.status;
    const providerError = (payload.error && typeof payload.error === 'object')
      ? payload.error as Record<string, unknown>
      : {};
    const providerCode = typeof providerError.code === 'string' ? providerError.code : null;
    const providerType = typeof providerError.type === 'string' ? providerError.type : null;
    logEvent('voice_session_create_failed', {
      status,
      providerCode,
      providerType,
      model: config.model,
    }, 'warn');

    if (status === 401 || status === 403) {
      throw new ApiError('voice_auth_failed', 'Voice model access was denied for this API key.', 503);
    }
    if (
      providerCode === 'credit_balance_exhausted'
      || providerCode === 'insufficient_quota'
      || providerType === 'insufficient_quota'
    ) {
      throw new ApiError(
        'voice_quota_exhausted',
        'OpenAI credits are exhausted for this project. Add billing credits, then try Talk to Aria again.',
        503,
      );
    }
    if (status === 429) {
      throw new ApiError('voice_provider_rate_limited', 'The voice provider is busy. Try again shortly.', 429);
    }
    recordVoiceUsage(opts.db, opts.userId, conversationId, {
      status: 'failed',
      provider: 'openai',
      model: config.model,
      costUsd: null,
      costStatus: 'unpriced',
      durationMs: null,
    }, nowMs);
    throw new ApiError('voice_provider_error', 'Live voice session creation failed.', status >= 400 && status < 600 ? status : 502);
  }

  const sessionObj = (payload.session && typeof payload.session === 'object')
    ? payload.session as Record<string, unknown>
    : {};
  const transportObj = (payload.transport && typeof payload.transport === 'object')
    ? payload.transport as Record<string, unknown>
    : {};
  const sessionId = typeof sessionObj.id === 'string' ? sessionObj.id : '';
  const answerSdp = typeof transportObj.sdp === 'string' ? transportObj.sdp : '';
  if (!sessionId || !answerSdp) {
    throw new ApiError('voice_provider_error', 'Voice provider returned an incomplete session.', 502);
  }

  activeBySession.set(sessionId, {
    sessionId,
    userId: opts.userId,
    conversationId,
    startedAtMs: nowMs,
    estimatedUsd,
    maxSeconds,
    inactivitySeconds: config.inactivitySeconds,
  });
  bumpUser(opts.userId, 1);

  return {
    session: { id: sessionId },
    transport: { type: 'webrtc', sdp: answerSdp },
    limits: {
      maxSessionSeconds: maxSeconds,
      inactivitySeconds: config.inactivitySeconds,
      estimatedReserveUsd: estimatedUsd,
    },
    persona: {
      name: persona.name,
      voice: persona.voice,
      audioVoice,
    },
  };
}

export function closeVoiceSession(opts: {
  db: Sql;
  userId: string;
  sessionId: string;
  durationSeconds?: number | null;
  providerUsageSeconds?: number | null;
  now?: () => number;
  config?: VoiceConfig;
}): { closed: boolean; durationSeconds: number; costUsd: number | null; costStatus: string } {
  const config = opts.config ?? loadVoiceConfig();
  const nowMs = (opts.now ?? Date.now)();
  const active = activeBySession.get(opts.sessionId);
  if (!active || active.userId !== opts.userId) {
    // Idempotent close — already cleaned up or unknown.
    return { closed: false, durationSeconds: 0, costUsd: null, costStatus: 'unpriced' };
  }

  activeBySession.delete(opts.sessionId);
  bumpUser(opts.userId, -1);

  const elapsed = Math.max(0, Math.floor((nowMs - active.startedAtMs) / 1000));
  const reported = opts.providerUsageSeconds != null && Number.isFinite(opts.providerUsageSeconds)
    ? Math.max(0, Math.floor(opts.providerUsageSeconds))
    : opts.durationSeconds != null && Number.isFinite(opts.durationSeconds)
      ? Math.max(0, Math.floor(opts.durationSeconds))
      : elapsed;
  const capped = Math.min(reported, active.maxSeconds + 30);
  const costUsd = estimateVoiceSessionUsd(config, capped);
  const costStatus = opts.providerUsageSeconds != null ? 'provider' : 'estimate';

  recordVoiceUsage(opts.db, opts.userId, active.conversationId, {
    status: 'succeeded',
    provider: 'openai',
    model: config.model,
    costUsd,
    costStatus: costUsd == null ? 'unpriced' : costStatus,
    durationMs: capped * 1000,
  }, nowMs);

  return {
    closed: true,
    durationSeconds: capped,
    costUsd,
    costStatus: costUsd == null ? 'unpriced' : costStatus,
  };
}

export function getActiveVoiceSession(sessionId: string): VoiceActiveSession | undefined {
  return activeBySession.get(sessionId);
}

/** Test helper — clear process-local session registry. */
export function resetVoiceSessionRegistryForTests(): void {
  activeBySession.clear();
  activeCountByUser.clear();
}

export function appendVoiceTranscripts(opts: {
  db: Sql;
  userId: string;
  conversationId: string;
  turns: Array<{ role: 'user' | 'assistant'; content: string; idempotencyKey?: string | null }>;
  now?: () => number;
}): { inserted: number } {
  const conversationId = ownConversation(opts.db, opts.userId, opts.conversationId);
  if (!conversationId) throw new ApiError('not_found', 'Conversation not found.', 404);
  const nowMs = (opts.now ?? Date.now)();
  let inserted = 0;
  const insert = opts.db.prepare(
    `INSERT INTO ai_messages (id, conversation_id, role, content, recommendation_json, provider, model, idempotency_key, created_at)
     VALUES (?, ?, ?, ?, ?, 'gpt-live-1', ?, ?, ?)`,
  );
  for (const turn of opts.turns.slice(0, 40)) {
    const content = typeof turn.content === 'string' ? turn.content.trim().slice(0, 4000) : '';
    if (!content || (turn.role !== 'user' && turn.role !== 'assistant')) continue;
    const key = turn.idempotencyKey?.trim() || null;
    if (key) {
      const existing = opts.db.prepare(
        `SELECT id FROM ai_messages WHERE conversation_id = ? AND idempotency_key = ?`,
      ).get(conversationId, key) as { id: string } | undefined;
      if (existing) continue;
    }
    insert.run(
      randomUUID(),
      conversationId,
      turn.role,
      content,
      JSON.stringify({ channel: 'voice', source: 'gpt-live-1' }),
      GPT_LIVE_MODEL_LABEL,
      key,
      stamp(nowMs),
    );
    inserted += 1;
  }
  if (inserted > 0) {
    opts.db.prepare(`UPDATE ai_conversations SET last_activity_at = ? WHERE id = ?`).run(stamp(nowMs), conversationId);
  }
  return { inserted };
}
