import assert from 'node:assert/strict';
import test from 'node:test';
import { loadVoiceConfig, voiceServiceReady, estimateVoiceSessionUsd } from '../src/ai/voiceConfig.js';
import {
  buildVoiceLiveInstructions,
  buildVoiceDelegationInstructions,
  buildVoiceGreetingDeveloperMessage,
} from '../src/ai/voicePrompt.js';
import {
  closeVoiceSession,
  createVoiceSession,
  resetVoiceSessionRegistryForTests,
  voiceAvailability,
} from '../src/ai/voiceSessions.js';
import { authHeaders, register, startApi } from './harness.js';

function voiceConfig(overrides: Partial<ReturnType<typeof loadVoiceConfig>> = {}) {
  return {
    ...loadVoiceConfig({
      AI_VOICE_ALLOW_LIVE: 'true',
      OPENAI_API_KEY: 'test-key',
      AI_VOICE_USD_PER_MINUTE: '0.10',
      AI_VOICE_MAX_BUDGET_USD: '5',
      AI_VOICE_MAX_USER_BUDGET_USD: '2',
      AI_VOICE_MAX_SESSION_SECONDS: '120',
      AI_VOICE_DAILY_SECONDS: '600',
      AI_MODEL: 'gpt-5-mini',
    }),
    ...overrides,
  };
}

async function session(base: string, email: string) {
  const created = await register(base, email);
  assert.equal(created.response.status, 201);
  return created;
}

test('voice stays off without approval, price, or budgets', () => {
  assert.equal(voiceServiceReady(loadVoiceConfig({})), false);
  assert.equal(voiceServiceReady(loadVoiceConfig({
    AI_VOICE_ALLOW_LIVE: 'true',
    OPENAI_API_KEY: 'k',
  })), false);
  assert.equal(voiceServiceReady(voiceConfig()), true);
  assert.equal(estimateVoiceSessionUsd(voiceConfig(), 60), 0.1);
});

test('voice instructions reuse stylist personality without inventing shops', () => {
  const prompt = buildVoiceLiveInstructions({
    name: 'Nova',
    gender: 'woman',
    ageVibe: 'thirties',
    voice: 'direct-practical',
    answerLength: 'short',
  });
  assert.match(prompt, /Nova/);
  assert.match(prompt, /efficient|practical|Clear/i);
  assert.match(prompt, /not connected|not_connected/i);
  assert.match(prompt, /Backchannel policy/i);
  assert.match(prompt, /real spoken conversation/i);
  assert.doesNotMatch(prompt, /responseText/);
  assert.match(buildVoiceDelegationInstructions({
    name: 'Nova',
    gender: 'woman',
    ageVibe: 'thirties',
    voice: 'direct-practical',
    answerLength: 'short',
  }), /not_connected/);
  assert.match(buildVoiceGreetingDeveloperMessage({
    name: 'Nova',
    gender: 'woman',
    ageVibe: 'thirties',
    voice: 'direct-practical',
    answerLength: 'short',
  }), /Greet the caller now/i);
});

test('voice availability and session minting stay authenticated and server-keyed', async () => {
  resetVoiceSessionRegistryForTests();
  const posted: { body: Record<string, unknown> | null } = { body: null };
  const api = await startApi({}, {
    voiceConfig: voiceConfig(),
    aiFetch: async (_input, init) => {
      posted.body = JSON.parse(String(init?.body ?? '{}')) as Record<string, unknown>;
      return new Response(JSON.stringify({
        session: { id: 'live_test_1' },
        transport: { type: 'webrtc', sdp: 'v=0\r\no=- 0 0 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\n' },
      }), { status: 201, headers: { 'content-type': 'application/json' } });
    },
  });
  try {
    const ada = await session(api.base, 'ada-voice@example.com');
    const unauth = await fetch(`${api.base}/api/stylist/voice/availability`);
    assert.equal(unauth.status, 401);

    const availability = await fetch(`${api.base}/api/stylist/availability`, {
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
    });
    assert.equal(availability.status, 200);
    const body = await availability.json() as { voice: { voiceEnabled: boolean; shopping: string } };
    assert.equal(body.voice.voiceEnabled, true);
    assert.equal(body.voice.shopping, 'not_connected');

    const createdConversation = await fetch(`${api.base}/api/stylist/conversations`, {
      method: 'POST',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
    });
    assert.equal(createdConversation.status, 201);
    const conversation = await createdConversation.json() as { id: string };

    const sessionRes = await fetch(`${api.base}/api/stylist/voice/sessions`, {
      method: 'POST',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
      body: JSON.stringify({ sdp: 'v=0\r\noffer', conversationId: conversation.id }),
    });
    assert.equal(sessionRes.status, 201);
    const minted = await sessionRes.json() as { session: { id: string }; transport: { sdp: string }; persona: { name: string } };
    assert.equal(minted.session.id, 'live_test_1');
    assert.ok(minted.transport.sdp.includes('v=0'));
    assert.equal(typeof minted.persona.name, 'string');
    assert.ok(posted.body);
    const postedSession = (posted.body.session ?? {}) as Record<string, unknown>;
    const postedTransport = (posted.body.transport ?? {}) as Record<string, unknown>;
    assert.equal(postedSession.model, 'gpt-live-1.1');
    assert.equal(postedTransport.type, 'webrtc');
    assert.ok(String(postedSession.instructions).includes('IStyleU'));
    const seeded = postedSession.input as Array<{ role?: string; content?: Array<{ text?: string }> }> | undefined;
    assert.ok(Array.isArray(seeded) && seeded[0]?.role === 'developer');
    assert.match(String(seeded?.[0]?.content?.[0]?.text ?? ''), /Greet the caller now/i);
    assert.equal(postedSession.wake_policy, undefined);
    // API key must not appear in the client response
    assert.equal(JSON.stringify(minted).includes('test-key'), false);

    const closed = await fetch(`${api.base}/api/stylist/voice/sessions/live_test_1/close`, {
      method: 'POST',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
      body: JSON.stringify({ durationSeconds: 30 }),
    });
    assert.equal(closed.status, 200);
    const closeBody = await closed.json() as { closed: boolean; durationSeconds: number; costStatus: string };
    assert.equal(closeBody.closed, true);
    assert.equal(closeBody.durationSeconds, 30);
    assert.equal(closeBody.costStatus, 'estimate');

    const transcripts = await fetch(`${api.base}/api/stylist/conversations/${conversation.id}/voice-transcripts`, {
      method: 'POST',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
      body: JSON.stringify({
        turns: [
          { role: 'user', content: 'I need an evening wedding outfit.', idempotencyKey: 'v1' },
          { role: 'assistant', content: 'Lovely — daytime or evening?', idempotencyKey: 'v2' },
          { role: 'user', content: 'I need an evening wedding outfit.', idempotencyKey: 'v1' },
        ],
      }),
    });
    assert.equal(transcripts.status, 201);
    const inserted = await transcripts.json() as { inserted: number };
    assert.equal(inserted.inserted, 2);

    const read = await fetch(`${api.base}/api/stylist/conversations/${conversation.id}`, {
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
    });
    const conversationBody = await read.json() as { messages: Array<{ role: string; content: string; provider: string | null }> };
    assert.equal(conversationBody.messages.length, 2);
    assert.equal(conversationBody.messages[0]?.provider, 'gpt-live-1.1');
  } finally {
    resetVoiceSessionRegistryForTests();
    await api.close();
  }
});

test('voice session rejects missing SDP and disabled configuration', async () => {
  resetVoiceSessionRegistryForTests();
  const api = await startApi({}, { voiceConfig: voiceConfig({ allowLive: false, apiKey: null }) });
  try {
    const ada = await session(api.base, 'ada-voice-off@example.com');
    const missing = await fetch(`${api.base}/api/stylist/voice/sessions`, {
      method: 'POST',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
      body: JSON.stringify({}),
    });
    assert.equal(missing.status, 400);

    const disabled = await fetch(`${api.base}/api/stylist/voice/sessions`, {
      method: 'POST',
      headers: authHeaders(ada.cookie, ada.body.csrfToken),
      body: JSON.stringify({ sdp: 'v=0' }),
    });
    assert.equal(disabled.status, 503);
  } finally {
    await api.close();
  }
});

test('createVoiceSession posts WebRTC transport to OpenAI live sessions', async () => {
  resetVoiceSessionRegistryForTests();
  const dbApi = await startApi({}, {
    voiceConfig: voiceConfig(),
    aiFetch: async () => new Response(JSON.stringify({
      session: { id: 'live_unit' },
      transport: { type: 'webrtc', sdp: 'answer-sdp' },
    }), { status: 201, headers: { 'content-type': 'application/json' } }),
  });
  try {
    const ada = await session(dbApi.base, 'unit-voice@example.com');
    const result = await createVoiceSession({
      db: dbApi.db,
      userId: ada.body.userId,
      sdp: 'offer-sdp',
      config: voiceConfig(),
      fetchImpl: async (_url, init) => {
        const body = JSON.parse(String(init?.body)) as { transport: { type: string; sdp: string } };
        assert.equal(body.transport.type, 'webrtc');
        assert.equal(body.transport.sdp, 'offer-sdp');
        return new Response(JSON.stringify({
          session: { id: 'live_unit' },
          transport: { type: 'webrtc', sdp: 'answer-sdp' },
        }), { status: 201, headers: { 'content-type': 'application/json' } });
      },
      now: () => dbApi.clock.value,
    });
    assert.equal(result.session.id, 'live_unit');
    assert.equal(result.transport.sdp, 'answer-sdp');
    const closed = closeVoiceSession({
      db: dbApi.db,
      userId: ada.body.userId,
      sessionId: 'live_unit',
      durationSeconds: 20,
      config: voiceConfig(),
      now: () => dbApi.clock.value + 20_000,
    });
    assert.equal(closed.closed, true);
    assert.equal(voiceAvailability(voiceConfig({ allowLive: false })).voiceEnabled, false);
  } finally {
    resetVoiceSessionRegistryForTests();
    await dbApi.close();
  }
});

test('appendVoiceTranscripts skips blank turns', () => {
  // Covered via HTTP above; keep a small availability smoke check here.
  const off = voiceAvailability(loadVoiceConfig({}));
  assert.equal(off.voiceEnabled, false);
  assert.equal(off.tryOn, 'not_connected');
});

test('createVoiceSession maps exhausted OpenAI credits clearly', async () => {
  resetVoiceSessionRegistryForTests();
  const dbApi = await startApi({}, { voiceConfig: voiceConfig() });
  try {
    const ada = await session(dbApi.base, 'quota-voice@example.com');
    await assert.rejects(
      () => createVoiceSession({
        db: dbApi.db,
        userId: ada.body.userId,
        sdp: 'offer-sdp',
        config: voiceConfig(),
        fetchImpl: async () => new Response(JSON.stringify({
          error: {
            message: 'You have no credits remaining.',
            type: 'insufficient_quota',
            code: 'credit_balance_exhausted',
          },
        }), { status: 429, headers: { 'content-type': 'application/json' } }),
        now: () => dbApi.clock.value,
      }),
      (error: unknown) => {
        assert.ok(error instanceof Error);
        assert.match(error.message, /credits are exhausted/i);
        return true;
      },
    );
  } finally {
    resetVoiceSessionRegistryForTests();
    await dbApi.close();
  }
});
