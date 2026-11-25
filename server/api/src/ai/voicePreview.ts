/**
 * Short spoken samples so customers can hear GPT-Live voices before choosing one.
 */

import { ApiError, logEvent } from '../errors.js';
import { GPT_LIVE_AUDIO_VOICES, type GptLiveAudioVoice, loadVoiceConfig } from './voiceConfig.js';

const PREVIEW_MODEL = 'gpt-4o-mini-tts';
const PREVIEW_TEXT = "Hi, I'm your personal stylist. Let's find a look you'll love.";
const previewCache = new Map<string, { bytes: Buffer; contentType: string; createdAt: number }>();
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

export function isGptLiveAudioVoice(value: string): value is GptLiveAudioVoice {
  return (GPT_LIVE_AUDIO_VOICES as readonly string[]).includes(value);
}

export async function createVoicePreview(opts: {
  voice: string;
  stylistName?: string | null;
  fetchImpl?: typeof fetch;
  apiKey?: string | null;
}): Promise<{ bytes: Buffer; contentType: string; voice: GptLiveAudioVoice; cached: boolean }> {
  const voice = opts.voice.trim().toLowerCase();
  if (!isGptLiveAudioVoice(voice)) {
    throw new ApiError('bad_request', 'That spoken voice is not available.', 400);
  }

  const cached = previewCache.get(voice);
  if (cached && Date.now() - cached.createdAt < CACHE_TTL_MS) {
    return { bytes: cached.bytes, contentType: cached.contentType, voice, cached: true };
  }

  const apiKey = opts.apiKey ?? loadVoiceConfig().apiKey;
  if (!apiKey) {
    throw new ApiError('voice_disabled', 'Spoken voice previews need the live stylist voice key on this server.', 503);
  }

  const name = typeof opts.stylistName === 'string' && opts.stylistName.trim()
    ? opts.stylistName.trim().slice(0, 40)
    : 'your personal stylist';
  const input = `Hi, I'm ${name}. Let's find a look you'll love.`;
  const fetchImpl = opts.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);
  try {
    const response = await fetchImpl('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: PREVIEW_MODEL,
        voice,
        input: input || PREVIEW_TEXT,
        response_format: 'mp3',
        instructions: 'Speak warmly and clearly as a personal fashion stylist.',
      }),
      signal: controller.signal,
    });
    if (response.status === 401 || response.status === 403) {
      throw new ApiError('provider_auth', 'The stylist voice preview provider did not accept the server credential.', 502);
    }
    if (response.status === 429) {
      throw new ApiError('provider_rate_limit', 'Voice previews are briefly unavailable. Try again in a moment.', 429);
    }
    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      logEvent('voice_preview_failed', { status: response.status, detail: detail.slice(0, 200) }, 'warn');
      throw new ApiError('voice_preview_failed', 'Could not play that voice preview right now.', 502);
    }
    const bytes = Buffer.from(await response.arrayBuffer());
    if (!bytes.length) {
      throw new ApiError('voice_preview_failed', 'The voice preview came back empty.', 502);
    }
    const contentType = response.headers.get('content-type') || 'audio/mpeg';
    previewCache.set(voice, { bytes, contentType, createdAt: Date.now() });
    return { bytes, contentType, voice, cached: false };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError('ai_timeout', 'The voice preview took too long.', 504);
    }
    throw new ApiError('voice_preview_failed', 'Could not play that voice preview right now.', 502);
  } finally {
    clearTimeout(timer);
  }
}
