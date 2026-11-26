/**
 * Play a voice-preview audio blob.
 * Prefer Web Audio API so playback works even when CSP blocks blob: media elements.
 */

type PreviewHandle = {
  stop: () => void;
};

let active: PreviewHandle | null = null;
let sharedContext: AudioContext | null = null;

function getContext(): AudioContext {
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!sharedContext || sharedContext.state === 'closed') {
    sharedContext = new Ctx();
  }
  return sharedContext;
}

/** Voices that tend quieter than Cedar/Marin — keep in sync with server SOFT_VOICES. */
const SOFT_PREVIEW_VOICES = new Set([
  'coral', 'sage', 'echo', 'ash', 'verse', 'ballad', 'shimmer', 'alloy',
]);

function playbackGainForVoice(voice?: string | null): number {
  const id = (voice || '').trim().toLowerCase();
  if (id && SOFT_PREVIEW_VOICES.has(id)) return 2.15;
  return 1.45;
}

export async function playVoicePreviewBlob(
  blob: Blob,
  opts?: { onEnded?: () => void; onError?: (message: string) => void; voice?: string | null },
): Promise<void> {
  active?.stop();
  active = null;

  const bytes = await blob.arrayBuffer();
  const context = getContext();
  if (context.state === 'suspended') {
    await context.resume();
  }

  const gainValue = playbackGainForVoice(opts?.voice);

  let buffer: AudioBuffer;
  try {
    buffer = await context.decodeAudioData(bytes.slice(0));
  } catch {
    // Fallback for environments that accept HTMLAudioElement but not this decode path.
    await playWithHtmlAudio(blob, { ...opts, volume: Math.min(1, gainValue / 2.15) });
    return;
  }

  const source = context.createBufferSource();
  source.buffer = buffer;
  // Soft TTS voices need extra gain so Listen matches Cedar/Marin presence.
  const gain = context.createGain();
  gain.gain.value = gainValue;
  source.connect(gain);
  gain.connect(context.destination);
  let stopped = false;
  const stop = () => {
    if (stopped) return;
    stopped = true;
    try {
      source.stop();
    } catch {
      // already stopped
    }
    try {
      source.disconnect();
      gain.disconnect();
    } catch {
      // ignore
    }
    if (active?.stop === stop) active = null;
  };
  source.onended = () => {
    if (active?.stop === stop) active = null;
    opts?.onEnded?.();
  };
  active = { stop };
  try {
    source.start(0);
  } catch (error) {
    stop();
    opts?.onError?.(error instanceof Error ? error.message : 'Could not play that voice sample.');
    throw error;
  }
}

async function playWithHtmlAudio(
  blob: Blob,
  opts?: { onEnded?: () => void; onError?: (message: string) => void; volume?: number },
): Promise<void> {
  const typed = blob.type?.startsWith('audio/')
    ? blob
    : new Blob([await blob.arrayBuffer()], { type: 'audio/mpeg' });
  const url = URL.createObjectURL(typed);
  const audio = new Audio(url);
  audio.preload = 'auto';
  audio.volume = Math.min(1, Math.max(0.6, opts?.volume ?? 1));
  const stop = () => {
    audio.pause();
    audio.removeAttribute('src');
    URL.revokeObjectURL(url);
    if (active?.stop === stop) active = null;
  };
  audio.onended = () => {
    stop();
    opts?.onEnded?.();
  };
  audio.onerror = () => {
    stop();
    opts?.onError?.('Could not play that voice sample.');
  };
  active = { stop };
  try {
    await audio.play();
  } catch (error) {
    stop();
    throw error;
  }
}

export function stopVoicePreview(): void {
  active?.stop();
  active = null;
}
