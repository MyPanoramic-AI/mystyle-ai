/**
 * Browser WebRTC client for OpenAI GPT-Live.
 * SDP offer is created here; the trusted MyStyle API mints the session.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export type GptLiveStatus =
  | 'idle'
  | 'requesting_mic'
  | 'connecting'
  | 'connected'
  | 'listening'
  | 'speaking'
  | 'ending'
  | 'error';

export interface GptLiveTranscriptTurn {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  final: boolean;
}

export interface GptLiveSessionLimits {
  maxSessionSeconds: number;
  inactivitySeconds: number;
  estimatedReserveUsd: number;
}

export interface CreateLiveSessionResponse {
  session: { id: string };
  transport: { type: 'webrtc'; sdp: string };
  limits: GptLiveSessionLimits;
  persona: { name: string; voice: string; audioVoice: string };
}

export interface UseGptLiveVoiceOptions {
  createSession: (sdp: string) => Promise<CreateLiveSessionResponse>;
  closeSession: (sessionId: string, body: {
    durationSeconds: number;
    providerUsageSeconds?: number | null;
  }) => Promise<void>;
  onFinalTranscript?: (turn: GptLiveTranscriptTurn) => void;
  onError?: (message: string) => void;
}

type BrowserSpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: {
    resultIndex: number;
    results: ArrayLike<{
      isFinal: boolean;
      0: { transcript: string };
    }>;
  }) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

const SPEECH_ENERGY_THRESHOLD = 0.012;
const REMOTE_SPEECH_ENERGY_THRESHOLD = 0.018;
const SPEECH_END_SILENCE_MS = 1400;
const ASSISTANT_DONE_SILENCE_MS = 1400;
const REPLY_NUDGE_DEBOUNCE_MS = 2800;
const REPLY_RETRY_MS = 2800;

function isEmbeddedBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /Electron/i.test(ua) || /Cursor/i.test(ua);
}

function supportsLiveVoice(): { ok: boolean; reason?: string } {
  if (typeof window === 'undefined') return { ok: false, reason: 'Voice needs a browser.' };
  if (!window.isSecureContext && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
    return { ok: false, reason: 'Live voice requires HTTPS or localhost.' };
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    return { ok: false, reason: 'This browser cannot access the microphone.' };
  }
  if (typeof RTCPeerConnection === 'undefined') {
    return { ok: false, reason: 'This browser does not support WebRTC.' };
  }
  return { ok: true };
}

async function requestMicrophone(): Promise<MediaStream> {
  const attempts: MediaStreamConstraints[] = [
    { audio: { echoCancellation: true, noiseSuppression: true } },
    { audio: true },
  ];
  let lastError: unknown;
  for (const constraints of attempts) {
    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Could not access the microphone.');
}

function friendlyVoiceError(err: unknown): string {
  if (!(err instanceof Error)) return 'Could not start the voice session.';
  const name = 'name' in err ? String((err as DOMException).name) : '';
  const raw = err.message || '';
  if (
    name === 'NotFoundError'
    || /Requested device not found/i.test(raw)
    || /no audio input/i.test(raw)
  ) {
    if (isEmbeddedBrowser()) {
      return 'This editor browser has no microphone. Open IStyleU in Chrome or Edge on a phone or laptop that has a mic.';
    }
    return 'This computer has no usable microphone. Open IStyleU on a phone or laptop with a mic, allow microphone access, then try Talk to Aria again.';
  }
  if (name === 'NotAllowedError' || /Permission denied|not allowed/i.test(raw)) {
    return 'Microphone permission was blocked. Allow the mic for this site, then try Talk to Aria again.';
  }
  if (name === 'NotReadableError') {
    return 'The microphone is busy in another app. Close other calls, then try again.';
  }
  return raw || 'Could not start the voice session.';
}

function extractTranscript(event: Record<string, unknown>): { role: 'user' | 'assistant'; text: string; final: boolean } | null {
  const type = typeof event.type === 'string' ? event.type : '';

  if (type === 'session.input_transcript.delta' || type === 'session.output_transcript.delta') {
    const delta = typeof event.delta === 'string' ? event.delta : '';
    if (!delta) return null;
    return {
      role: type === 'session.input_transcript.delta' ? 'user' : 'assistant',
      text: delta,
      final: false,
    };
  }

  const text = typeof event.transcript === 'string'
    ? event.transcript
    : typeof event.text === 'string'
      ? event.text
      : typeof (event.item as { transcript?: string } | undefined)?.transcript === 'string'
        ? (event.item as { transcript: string }).transcript
        : '';
  if (!text.trim()) return null;

  if (type.includes('input') || type.includes('user') || type.includes('transcription')) {
    const final = type.includes('completed') || type.includes('done') || type.endsWith('.final') || event.final === true;
    return { role: 'user', text: text.trim(), final };
  }
  if (type.includes('output') || type.includes('assistant') || type.includes('response.output_audio_transcript')) {
    const final = type.includes('done') || type.includes('completed') || type.endsWith('.final') || event.final === true;
    return { role: 'assistant', text: text.trim(), final };
  }
  return null;
}

function ensurePlaybackElement(): HTMLAudioElement {
  const existing = document.getElementById('istyleu-live-audio') as HTMLAudioElement | null;
  if (existing) return existing;
  const audio = document.createElement('audio');
  audio.id = 'istyleu-live-audio';
  audio.autoplay = true;
  audio.setAttribute('playsinline', 'true');
  audio.setAttribute('webkit-playsinline', 'true');
  audio.style.display = 'none';
  document.body.appendChild(audio);
  return audio;
}

function sendLiveEvent(channel: RTCDataChannel | null, event: Record<string, unknown>): void {
  if (!channel || channel.readyState !== 'open') return;
  try {
    channel.send(JSON.stringify(event));
  } catch {
    // Best-effort control-plane event.
  }
}

function rmsFromTimeDomain(data: Uint8Array): number {
  let sum = 0;
  for (let i = 0; i < data.length; i += 1) {
    const centered = (data[i]! - 128) / 128;
    sum += centered * centered;
  }
  return Math.sqrt(sum / Math.max(data.length, 1));
}

function getSpeechRecognitionCtor(): (new () => BrowserSpeechRecognition) | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => BrowserSpeechRecognition;
    webkitSpeechRecognition?: new () => BrowserSpeechRecognition;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function buildForceReplyCommentary(userText: string): string {
  const cleaned = userText.replace(/\s+/g, ' ').trim().slice(0, 320);
  if (cleaned) {
    return `The caller just said: "${cleaned}". Speak your answer out loud now with concrete styling advice. Do not stay silent.`;
  }
  return 'The caller finished speaking. Speak your answer out loud now with concrete styling advice based on what they said. If you missed their words, ask them to repeat briefly. Do not stay silent.';
}

export function useGptLiveVoice(options: UseGptLiveVoiceOptions) {
  const [status, setStatus] = useState<GptLiveStatus>('idle');
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [transcripts, setTranscripts] = useState<GptLiveTranscriptTurn[]>([]);
  const [limits, setLimits] = useState<GptLiveSessionLimits | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [hearingYou, setHearingYou] = useState(false);
  const [promptingReply, setPromptingReply] = useState(false);

  const peerRef = useRef<RTCPeerConnection | null>(null);
  const eventsRef = useRef<RTCDataChannel | null>(null);
  const micRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const startedAtRef = useRef<number>(0);
  const readyRef = useRef(false);
  const finalizedRef = useRef(false);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inactivityTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const elapsedIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const providerUsageRef = useRef<number | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const startingRef = useRef(false);
  const limitsRef = useRef<GptLiveSessionLimits | null>(null);
  const endRef = useRef<(reason?: string) => Promise<void>>(async () => undefined);
  const replyNudgeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const replyRetryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const assistantDoneTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastReplyNudgeAtRef = useRef(0);
  const awaitingUserReplyRef = useRef(false);
  const assistantSpeakingRef = useRef(false);
  const mutedRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const micAnalyserRef = useRef<AnalyserNode | null>(null);
  const remoteAnalyserRef = useRef<AnalyserNode | null>(null);
  const speechMonitorRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const localSpeechActiveRef = useRef(false);
  const hearingYouRef = useRef(false);
  const lastUserTextRef = useRef('');
  const browserSpeechTextRef = useRef('');
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const recognitionWantedRef = useRef(false);
  const forceReplyAttemptsRef = useRef(0);
  const markAssistantSpeakingRef = useRef<() => void>(() => undefined);
  const noteCallerSpeechRef = useRef<() => void>(() => undefined);

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const clearReplyNudge = useCallback(() => {
    if (replyNudgeTimeoutRef.current) clearTimeout(replyNudgeTimeoutRef.current);
    replyNudgeTimeoutRef.current = null;
  }, []);

  const clearReplyRetry = useCallback(() => {
    if (replyRetryTimeoutRef.current) clearTimeout(replyRetryTimeoutRef.current);
    replyRetryTimeoutRef.current = null;
  }, []);

  const clearAssistantDoneTimer = useCallback(() => {
    if (assistantDoneTimeoutRef.current) clearTimeout(assistantDoneTimeoutRef.current);
    assistantDoneTimeoutRef.current = null;
  }, []);

  const stopSpeechRecognition = useCallback(() => {
    recognitionWantedRef.current = false;
    const recognition = recognitionRef.current;
    recognitionRef.current = null;
    if (!recognition) return;
    recognition.onresult = null;
    recognition.onerror = null;
    recognition.onend = null;
    try { recognition.stop(); } catch { /* ignore */ }
    try { recognition.abort(); } catch { /* ignore */ }
  }, []);

  const stopSpeechMonitor = useCallback(() => {
    if (speechMonitorRef.current) clearInterval(speechMonitorRef.current);
    speechMonitorRef.current = null;
    micAnalyserRef.current = null;
    remoteAnalyserRef.current = null;
    const ctx = audioContextRef.current;
    audioContextRef.current = null;
    if (ctx) {
      void ctx.close().catch(() => undefined);
    }
    localSpeechActiveRef.current = false;
    hearingYouRef.current = false;
    setHearingYou(false);
  }, []);

  const appendUserHeardText = useCallback((fragment: string, replace = false) => {
    const clean = fragment.replace(/\s+/g, ' ').trim();
    if (!clean) return;
    if (replace) {
      lastUserTextRef.current = clean;
      return;
    }
    const prev = lastUserTextRef.current;
    if (!prev) {
      lastUserTextRef.current = clean;
      return;
    }
    if (prev.endsWith(clean) || clean.startsWith(prev)) {
      lastUserTextRef.current = clean.length >= prev.length ? clean : prev;
      return;
    }
    lastUserTextRef.current = `${prev} ${clean}`.replace(/\s+/g, ' ').trim().slice(0, 400);
  }, []);

  const sendForceReply = useCallback((isRetry = false) => {
    if (!readyRef.current || !eventsRef.current) return;
    if (assistantSpeakingRef.current) return;
    const now = Date.now();
    if (!isRetry && now - lastReplyNudgeAtRef.current < REPLY_NUDGE_DEBOUNCE_MS) return;
    if (isRetry && forceReplyAttemptsRef.current >= 2) {
      setPromptingReply(false);
      return;
    }
    lastReplyNudgeAtRef.current = now;
    forceReplyAttemptsRef.current = isRetry ? 2 : 1;
    awaitingUserReplyRef.current = false;
    hearingYouRef.current = false;
    setHearingYou(false);
    setPromptingReply(true);
    const userText = (lastUserTextRef.current || browserSpeechTextRef.current).trim();
    // commentary.append is the reliable way to make GPT-Live speak (community + Live docs).
    sendLiveEvent(eventsRef.current, {
      type: 'session.commentary.append',
      event_id: `reply_now_${now}${isRetry ? '_r' : ''}`,
      delegation_id: null,
      content: buildForceReplyCommentary(userText),
    });
    clearReplyRetry();
    if (!isRetry) {
      replyRetryTimeoutRef.current = setTimeout(() => {
        replyRetryTimeoutRef.current = null;
        if (assistantSpeakingRef.current || !readyRef.current) {
          setPromptingReply(false);
          return;
        }
        sendForceReply(true);
      }, REPLY_RETRY_MS);
    }
  }, [clearReplyRetry]);

  const scheduleReplyNudge = useCallback(() => {
    clearReplyNudge();
    awaitingUserReplyRef.current = true;
    replyNudgeTimeoutRef.current = setTimeout(() => {
      replyNudgeTimeoutRef.current = null;
      if (!awaitingUserReplyRef.current || assistantSpeakingRef.current) return;
      sendForceReply(false);
    }, SPEECH_END_SILENCE_MS);
  }, [clearReplyNudge, sendForceReply]);

  const markAssistantSpeaking = useCallback(() => {
    assistantSpeakingRef.current = true;
    awaitingUserReplyRef.current = false;
    forceReplyAttemptsRef.current = 0;
    clearReplyNudge();
    clearReplyRetry();
    clearAssistantDoneTimer();
    setHearingYou(false);
    hearingYouRef.current = false;
    localSpeechActiveRef.current = false;
    setPromptingReply(false);
    setStatus('speaking');
    void audioRef.current?.play().catch(() => undefined);
    assistantDoneTimeoutRef.current = setTimeout(() => {
      assistantDoneTimeoutRef.current = null;
      assistantSpeakingRef.current = false;
      // Fresh user turn after Aria finishes.
      lastUserTextRef.current = '';
      browserSpeechTextRef.current = '';
      setStatus((prev) => (prev === 'speaking' ? 'listening' : prev));
    }, ASSISTANT_DONE_SILENCE_MS);
  }, [clearAssistantDoneTimer, clearReplyNudge, clearReplyRetry]);

  markAssistantSpeakingRef.current = markAssistantSpeaking;

  const noteCallerSpeech = useCallback(() => {
    if (assistantSpeakingRef.current || mutedRef.current) return;
    if (!hearingYouRef.current) {
      hearingYouRef.current = true;
      setHearingYou(true);
    }
    setPromptingReply(false);
    setStatus('listening');
    scheduleReplyNudge();
  }, [scheduleReplyNudge]);

  noteCallerSpeechRef.current = noteCallerSpeech;

  const startSpeechRecognition = useCallback(() => {
    stopSpeechRecognition();
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;
    try {
      const recognition = new Ctor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-ZA';
      recognitionWantedRef.current = true;
      recognition.onresult = (event) => {
        if (assistantSpeakingRef.current || mutedRef.current) return;
        let interim = '';
        let finalChunk = '';
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const result = event.results[i];
          if (!result) continue;
          const piece = result[0]?.transcript ?? '';
          if (result.isFinal) finalChunk += piece;
          else interim += piece;
        }
        const heard = (finalChunk || interim).replace(/\s+/g, ' ').trim();
        if (!heard) return;
        browserSpeechTextRef.current = heard;
        if (finalChunk.trim()) appendUserHeardText(finalChunk, true);
        else appendUserHeardText(interim, true);
        noteCallerSpeechRef.current();
      };
      recognition.onerror = () => {
        // Permission / no-speech errors are non-fatal; Live mic may still work.
      };
      recognition.onend = () => {
        if (!recognitionWantedRef.current || mutedRef.current || finalizedRef.current) return;
        try { recognition.start(); } catch { /* ignore restart races */ }
      };
      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      recognitionRef.current = null;
      recognitionWantedRef.current = false;
    }
  }, [appendUserHeardText, stopSpeechRecognition]);

  const startSpeechMonitor = useCallback((micStream: MediaStream, remoteStream?: MediaStream | null) => {
    stopSpeechMonitor();
    if (typeof AudioContext === 'undefined' && typeof (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext === 'undefined') {
      return;
    }
    try {
      const Ctx = window.AudioContext
        ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx();
      const micSource = ctx.createMediaStreamSource(micStream);
      const micAnalyser = ctx.createAnalyser();
      micAnalyser.fftSize = 512;
      micSource.connect(micAnalyser);
      micAnalyserRef.current = micAnalyser;

      if (remoteStream && remoteStream.getAudioTracks().length > 0) {
        const remoteSource = ctx.createMediaStreamSource(remoteStream);
        const remoteAnalyser = ctx.createAnalyser();
        remoteAnalyser.fftSize = 512;
        remoteSource.connect(remoteAnalyser);
        remoteAnalyserRef.current = remoteAnalyser;
      }

      audioContextRef.current = ctx;
      void ctx.resume().catch(() => undefined);

      const micSamples = new Uint8Array(micAnalyser.fftSize);
      const remoteSamples = new Uint8Array(512);
      speechMonitorRef.current = setInterval(() => {
        const activeCtx = audioContextRef.current;
        if (activeCtx?.state === 'suspended') {
          void activeCtx.resume().catch(() => undefined);
        }
        if (!micAnalyserRef.current || mutedRef.current || !readyRef.current) return;

        if (remoteAnalyserRef.current) {
          if (remoteSamples.length !== remoteAnalyserRef.current.fftSize) {
            // length fixed at create; analyser fftSize is 512
          }
          remoteAnalyserRef.current.getByteTimeDomainData(remoteSamples);
          if (rmsFromTimeDomain(remoteSamples) >= REMOTE_SPEECH_ENERGY_THRESHOLD) {
            markAssistantSpeakingRef.current();
            localSpeechActiveRef.current = false;
            return;
          }
        }

        if (assistantSpeakingRef.current) {
          localSpeechActiveRef.current = false;
          return;
        }

        micAnalyserRef.current.getByteTimeDomainData(micSamples);
        const energy = rmsFromTimeDomain(micSamples);
        if (energy >= SPEECH_ENERGY_THRESHOLD) {
          localSpeechActiveRef.current = true;
          noteCallerSpeechRef.current();
        } else if (localSpeechActiveRef.current) {
          scheduleReplyNudge();
          localSpeechActiveRef.current = false;
        }
      }, 100);
    } catch {
      // Local energy detection is a fallback.
    }
  }, [scheduleReplyNudge, stopSpeechMonitor]);

  const attachRemoteMonitor = useCallback((stream: MediaStream) => {
    const ctx = audioContextRef.current;
    if (!ctx) {
      if (micRef.current) startSpeechMonitor(micRef.current, stream);
      return;
    }
    try {
      const remoteSource = ctx.createMediaStreamSource(stream);
      const remoteAnalyser = ctx.createAnalyser();
      remoteAnalyser.fftSize = 512;
      remoteSource.connect(remoteAnalyser);
      remoteAnalyserRef.current = remoteAnalyser;
    } catch {
      // Ignore if remote monitor cannot attach.
    }
  }, [startSpeechMonitor]);

  const clearTimers = useCallback(() => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    if (maxTimeoutRef.current) clearTimeout(maxTimeoutRef.current);
    if (inactivityTimeoutRef.current) clearTimeout(inactivityTimeoutRef.current);
    if (elapsedIntervalRef.current) clearInterval(elapsedIntervalRef.current);
    clearReplyNudge();
    clearReplyRetry();
    clearAssistantDoneTimer();
    closeTimeoutRef.current = null;
    maxTimeoutRef.current = null;
    inactivityTimeoutRef.current = null;
    elapsedIntervalRef.current = null;
  }, [clearAssistantDoneTimer, clearReplyNudge, clearReplyRetry]);

  const hardCleanup = useCallback(() => {
    clearTimers();
    stopSpeechRecognition();
    stopSpeechMonitor();
    micRef.current?.getTracks().forEach((track) => track.stop());
    micRef.current = null;
    const channel = eventsRef.current;
    eventsRef.current = null;
    try { channel?.close(); } catch { /* ignore */ }
    peerRef.current?.close();
    peerRef.current = null;
    if (audioRef.current) {
      audioRef.current.srcObject = null;
    }
    readyRef.current = false;
    startingRef.current = false;
    sessionIdRef.current = null;
    awaitingUserReplyRef.current = false;
    assistantSpeakingRef.current = false;
    lastReplyNudgeAtRef.current = 0;
    lastUserTextRef.current = '';
    browserSpeechTextRef.current = '';
    setSessionId(null);
    setMuted(false);
    mutedRef.current = false;
    setPromptingReply(false);
  }, [clearTimers, stopSpeechMonitor, stopSpeechRecognition]);

  const bumpActivity = useCallback(() => {
    const inactivity = limitsRef.current?.inactivitySeconds ?? 120;
    if (inactivityTimeoutRef.current) clearTimeout(inactivityTimeoutRef.current);
    inactivityTimeoutRef.current = setTimeout(() => {
      void endRef.current('Inactivity timeout — ending the voice session.');
    }, inactivity * 1000);
  }, []);

  const finalizeClose = useCallback(async (id: string | null, durationSeconds: number) => {
    if (finalizedRef.current) {
      hardCleanup();
      setStatus('idle');
      return;
    }
    finalizedRef.current = true;
    if (id) {
      try {
        await optionsRef.current.closeSession(id, {
          durationSeconds,
          providerUsageSeconds: providerUsageRef.current,
        });
      } catch { /* server may already have cleaned up */ }
    }
    hardCleanup();
    setStatus('idle');
  }, [hardCleanup]);

  const endConversation = useCallback(async (reason?: string) => {
    if (!sessionIdRef.current && !readyRef.current && !startingRef.current) {
      hardCleanup();
      setStatus('idle');
      return;
    }
    const id = sessionIdRef.current;
    const channel = eventsRef.current;
    setStatus('ending');
    if (reason) setError(reason);

    const durationSeconds = startedAtRef.current
      ? Math.max(0, Math.floor((Date.now() - startedAtRef.current) / 1000))
      : 0;

    if (readyRef.current && channel && channel.readyState === 'open') {
      try {
        channel.send(JSON.stringify({ type: 'session.close' }));
      } catch { /* ignore */ }
      closeTimeoutRef.current = setTimeout(() => {
        void finalizeClose(id, durationSeconds);
      }, 12_000);
      return;
    }
    await finalizeClose(id, durationSeconds);
  }, [finalizeClose, hardCleanup]);

  endRef.current = endConversation;

  const handleEvent = useCallback((raw: unknown) => {
    if (typeof raw !== 'string') return;
    let event: Record<string, unknown>;
    try {
      event = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return;
    }
    const type = typeof event.type === 'string' ? event.type : '';
    bumpActivity();

    if (type === 'error' || type === 'session.error' || type.endsWith('.failed')) {
      const detail = typeof event.message === 'string'
        ? event.message
        : typeof (event.error as { message?: string } | undefined)?.message === 'string'
          ? (event.error as { message: string }).message
          : 'The live voice session reported an error.';
      setError(detail);
      setStatus('error');
      optionsRef.current.onError?.(detail);
      return;
    }
    if (type === 'session.started') {
      readyRef.current = true;
      setStatus('listening');
      // Greeting comes from the server session.input developer seed only.
      void audioRef.current?.play().catch(() => undefined);
      startSpeechRecognition();
      return;
    }
    if (type === 'session.closed') {
      const usage = event.usage;
      if (usage && typeof usage === 'object') {
        const seconds = (usage as { duration_seconds?: number; seconds?: number }).duration_seconds
          ?? (usage as { seconds?: number }).seconds;
        if (typeof seconds === 'number') providerUsageRef.current = seconds;
      }
      const durationSeconds = startedAtRef.current
        ? Math.max(0, Math.floor((Date.now() - startedAtRef.current) / 1000))
        : 0;
      void finalizeClose(sessionIdRef.current, durationSeconds);
      return;
    }
    if (
      type === 'session.output_transcript.delta'
      || type.includes('output_audio')
      || type.includes('response.audio')
      || type === 'response.created'
    ) {
      markAssistantSpeaking();
    }
    if (
      type === 'session.input_transcript.delta'
      || type.includes('input_audio')
      || type === 'input_audio_buffer.speech_started'
    ) {
      assistantSpeakingRef.current = false;
      clearAssistantDoneTimer();
      if (type === 'session.input_transcript.delta') {
        noteCallerSpeech();
      } else {
        setStatus('listening');
      }
    }

    const transcript = extractTranscript(event);
    if (transcript) {
      if (transcript.role === 'user') {
        appendUserHeardText(transcript.text);
      }
      setTranscripts((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last && !last.final && last.role !== transcript.role) {
          const closed = { ...last, final: true };
          updated[updated.length - 1] = closed;
          optionsRef.current.onFinalTranscript?.(closed);
        }
        const open = updated[updated.length - 1];
        if (open && open.role === transcript.role && !open.final) {
          const nextText = type.endsWith('.delta')
            ? `${open.text}${transcript.text}`
            : transcript.text;
          updated[updated.length - 1] = {
            ...open,
            text: nextText,
            final: transcript.final,
          };
          if (transcript.final) {
            optionsRef.current.onFinalTranscript?.(updated[updated.length - 1]);
          }
          return updated;
        }
        const turn: GptLiveTranscriptTurn = {
          id: `${transcript.role}-${Date.now()}-${updated.length}`,
          role: transcript.role,
          text: transcript.text,
          final: transcript.final,
        };
        if (transcript.final) optionsRef.current.onFinalTranscript?.(turn);
        return [...updated, turn];
      });
    }
  }, [
    appendUserHeardText,
    bumpActivity,
    clearAssistantDoneTimer,
    finalizeClose,
    markAssistantSpeaking,
    noteCallerSpeech,
    startSpeechRecognition,
  ]);

  const startConversation = useCallback(async () => {
    if (startingRef.current || readyRef.current || status === 'connecting' || status === 'connected' || status === 'listening' || status === 'speaking') {
      return;
    }
    const support = supportsLiveVoice();
    if (!support.ok) {
      setError(support.reason ?? 'Voice is not supported.');
      setStatus('error');
      optionsRef.current.onError?.(support.reason ?? 'Voice is not supported.');
      return;
    }

    startingRef.current = true;
    finalizedRef.current = false;
    providerUsageRef.current = null;
    setError(null);
    setTranscripts([]);
    setElapsedSeconds(0);
    setHearingYou(false);
    setPromptingReply(false);
    lastUserTextRef.current = '';
    browserSpeechTextRef.current = '';
    setStatus('requesting_mic');

    try {
      const connection = new RTCPeerConnection();
      peerRef.current = connection;

      const playback = ensurePlaybackElement();
      audioRef.current = playback;
      playback.muted = false;
      playback.volume = 1;
      void playback.play().catch(() => undefined);

      connection.addEventListener('track', (event) => {
        const remoteStream = event.streams[0] ?? new MediaStream([event.track]);
        playback.srcObject = remoteStream;
        attachRemoteMonitor(remoteStream);
        void playback.play().catch(() => {
          setError('Tap “Play Aria’s voice” if you cannot hear her — the browser may have blocked audio.');
        });
      });
      connection.addEventListener('connectionstatechange', () => {
        if (connection.connectionState === 'failed') {
          setError('The live voice connection failed. Check your network and try again.');
          setStatus('error');
        }
      });

      const microphone = await requestMicrophone();
      micRef.current = microphone;
      for (const track of microphone.getAudioTracks()) {
        track.enabled = true;
        connection.addTrack(track, microphone);
      }
      startSpeechMonitor(microphone);

      setStatus('connecting');
      const events = connection.createDataChannel('oai-events');
      eventsRef.current = events;
      events.addEventListener('message', ({ data }) => handleEvent(data));
      events.addEventListener('close', () => {
        if (eventsRef.current !== events) return;
        if (!finalizedRef.current) {
          const durationSeconds = startedAtRef.current
            ? Math.max(0, Math.floor((Date.now() - startedAtRef.current) / 1000))
            : 0;
          void finalizeClose(sessionIdRef.current, durationSeconds);
        }
      });

      const offer = await connection.createOffer();
      await connection.setLocalDescription(offer);
      if (connection.iceGatheringState !== 'complete') {
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            connection.removeEventListener('icegatheringstatechange', onState);
            reject(new Error('Timed out while gathering network candidates.'));
          }, 10_000);
          function onState() {
            if (connection.iceGatheringState !== 'complete') return;
            clearTimeout(timeout);
            connection.removeEventListener('icegatheringstatechange', onState);
            resolve();
          }
          connection.addEventListener('icegatheringstatechange', onState);
          onState();
        });
      }

      const sdp = connection.localDescription?.sdp;
      if (!sdp) throw new Error('Missing local connection offer.');

      const result = await optionsRef.current.createSession(sdp);
      sessionIdRef.current = result.session.id;
      setSessionId(result.session.id);
      setLimits(result.limits);
      limitsRef.current = result.limits;
      startedAtRef.current = Date.now();

      await connection.setRemoteDescription({
        type: 'answer',
        sdp: result.transport.sdp,
      });

      setStatus('connected');
      startingRef.current = false;

      elapsedIntervalRef.current = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - startedAtRef.current) / 1000));
      }, 1000);

      maxTimeoutRef.current = setTimeout(() => {
        void endRef.current('Maximum voice session length reached.');
      }, result.limits.maxSessionSeconds * 1000);

      inactivityTimeoutRef.current = setTimeout(() => {
        void endRef.current('Inactivity timeout — ending the voice session.');
      }, result.limits.inactivitySeconds * 1000);
    } catch (err) {
      const message = friendlyVoiceError(err);
      setError(message);
      setStatus('error');
      optionsRef.current.onError?.(message);
      hardCleanup();
    }
  }, [attachRemoteMonitor, finalizeClose, handleEvent, hardCleanup, startSpeechMonitor, status]);

  const setMicrophoneMuted = useCallback((next: boolean) => {
    setMuted(next);
    mutedRef.current = next;
    micRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = !next;
    });
    if (next) {
      clearReplyNudge();
      awaitingUserReplyRef.current = false;
      localSpeechActiveRef.current = false;
      hearingYouRef.current = false;
      setHearingYou(false);
      setPromptingReply(false);
      try { recognitionRef.current?.stop(); } catch { /* ignore */ }
    } else if (readyRef.current) {
      startSpeechRecognition();
    }
  }, [clearReplyNudge, startSpeechRecognition]);

  const toggleMute = useCallback(() => {
    setMicrophoneMuted(!muted);
  }, [muted, setMicrophoneMuted]);

  useEffect(() => () => {
    void endRef.current();
  }, []);

  const playAssistantAudio = useCallback(async () => {
    const audio = audioRef.current ?? ensurePlaybackElement();
    audioRef.current = audio;
    audio.muted = false;
    audio.volume = 1;
    try {
      await audio.play();
      setError(null);
    } catch {
      setError('Tap “Play Aria’s voice” again, or allow sound for this site.');
    }
  }, []);

  return {
    status,
    muted,
    error,
    sessionId,
    transcripts,
    limits,
    elapsedSeconds,
    hearingYou,
    promptingReply,
    isActive: status === 'connecting' || status === 'connected' || status === 'listening' || status === 'speaking' || status === 'requesting_mic' || status === 'ending',
    support: supportsLiveVoice(),
    startConversation,
    endConversation: () => endConversation(),
    toggleMute,
    setMicrophoneMuted,
    playAssistantAudio,
    clearError: () => setError(null),
  };
}
