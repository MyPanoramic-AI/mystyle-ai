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

function extractTranscript(event: Record<string, unknown>): { role: 'user' | 'assistant'; text: string; final: boolean } | null {
  const type = typeof event.type === 'string' ? event.type : '';
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

export function useGptLiveVoice(options: UseGptLiveVoiceOptions) {
  const [status, setStatus] = useState<GptLiveStatus>('idle');
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [transcripts, setTranscripts] = useState<GptLiveTranscriptTurn[]>([]);
  const [limits, setLimits] = useState<GptLiveSessionLimits | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

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

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const clearTimers = useCallback(() => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    if (maxTimeoutRef.current) clearTimeout(maxTimeoutRef.current);
    if (inactivityTimeoutRef.current) clearTimeout(inactivityTimeoutRef.current);
    if (elapsedIntervalRef.current) clearInterval(elapsedIntervalRef.current);
    closeTimeoutRef.current = null;
    maxTimeoutRef.current = null;
    inactivityTimeoutRef.current = null;
    elapsedIntervalRef.current = null;
  }, []);

  const hardCleanup = useCallback(() => {
    clearTimers();
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
    setSessionId(null);
    setMuted(false);
  }, [clearTimers]);

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

    if (type === 'session.started') {
      readyRef.current = true;
      setStatus('listening');
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
    if (type.includes('output_audio') || type.includes('response.audio') || type === 'response.created') {
      setStatus('speaking');
    }
    if (type.includes('input_audio') || type === 'input_audio_buffer.speech_started') {
      setStatus('listening');
    }

    const transcript = extractTranscript(event);
    if (transcript) {
      setTranscripts((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.role === transcript.role && !last.final) {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...last,
            text: transcript.text,
            final: transcript.final,
          };
          return updated;
        }
        const turn: GptLiveTranscriptTurn = {
          id: `${transcript.role}-${Date.now()}-${prev.length}`,
          role: transcript.role,
          text: transcript.text,
          final: transcript.final,
        };
        if (transcript.final) optionsRef.current.onFinalTranscript?.(turn);
        return [...prev, turn];
      });
    }
  }, [bumpActivity, finalizeClose]);

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
    setStatus('requesting_mic');

    try {
      const connection = new RTCPeerConnection();
      peerRef.current = connection;

      if (!audioRef.current) {
        audioRef.current = new Audio();
        audioRef.current.autoplay = true;
      }
      connection.addEventListener('track', (event) => {
        if (!audioRef.current) return;
        audioRef.current.srcObject = new MediaStream([event.track]);
        void audioRef.current.play().catch(() => {
          setError('Tap to enable audio if the browser blocked playback.');
        });
      });

      const microphone = await navigator.mediaDevices.getUserMedia({ audio: true });
      micRef.current = microphone;
      for (const track of microphone.getAudioTracks()) {
        connection.addTrack(track, microphone);
      }

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
      const message = err instanceof Error ? err.message : 'Could not start the voice session.';
      setError(message);
      setStatus('error');
      optionsRef.current.onError?.(message);
      hardCleanup();
    }
  }, [finalizeClose, handleEvent, hardCleanup, status]);

  const setMicrophoneMuted = useCallback((next: boolean) => {
    setMuted(next);
    micRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = !next;
    });
  }, []);

  const toggleMute = useCallback(() => {
    setMicrophoneMuted(!muted);
  }, [muted, setMicrophoneMuted]);

  useEffect(() => () => {
    void endRef.current();
  }, []);

  return {
    status,
    muted,
    error,
    sessionId,
    transcripts,
    limits,
    elapsedSeconds,
    isActive: status === 'connecting' || status === 'connected' || status === 'listening' || status === 'speaking' || status === 'requesting_mic' || status === 'ending',
    support: supportsLiveVoice(),
    startConversation,
    endConversation: () => endConversation(),
    toggleMute,
    setMicrophoneMuted,
    clearError: () => setError(null),
  };
}
