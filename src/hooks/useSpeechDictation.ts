/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Browser Web Speech API dictation (Chrome / Edge / Safari).
 * Transcribes as the user speaks via interim + final results.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionResultEvent {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      length: number;
      [index: number]: { transcript: string };
    };
  };
}

interface SpeechRecognitionErrorEventLike {
  error: string;
  message?: string;
}

function getSpeechRecognitionCtor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function speechDictationSupported(): boolean {
  return Boolean(getSpeechRecognitionCtor());
}

function joinTranscript(base: string, spoken: string): string {
  const left = base.trimEnd();
  const right = spoken.trim();
  if (!right) return left;
  if (!left) return right;
  const needsSpace = !/\s$/.test(left) && !/^[.,!?;:]/.test(right);
  return needsSpace ? `${left} ${right}` : `${left}${right}`;
}

export function useSpeechDictation(options: {
  onTranscript: (text: string) => void;
  /** Prefer browser locale; fall back for SA English. */
  lang?: string;
}) {
  const { onTranscript, lang } = options;
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const baseTextRef = useRef('');
  const finalsRef = useRef('');
  const wantListeningRef = useRef(false);
  const onTranscriptRef = useRef(onTranscript);
  onTranscriptRef.current = onTranscript;

  const stop = useCallback(() => {
    wantListeningRef.current = false;
    const recognition = recognitionRef.current;
    recognitionRef.current = null;
    if (recognition) {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      try {
        recognition.stop();
      } catch {
        try {
          recognition.abort();
        } catch {
          // Ignore browsers that throw when already stopped.
        }
      }
    }
    setIsListening(false);
  }, []);

  const start = useCallback((currentText: string) => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setError('Voice input is not supported in this browser. Try Chrome or Edge on desktop.');
      return;
    }

    stop();
    setError(null);
    baseTextRef.current = currentText;
    finalsRef.current = '';
    wantListeningRef.current = true;

    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang
      || (typeof navigator !== 'undefined' && navigator.language)
      || 'en-ZA';

    recognition.onresult = (event) => {
      let interim = '';
      let newlyFinal = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (!result?.[0]) continue;
        const piece = result[0].transcript;
        if (result.isFinal) newlyFinal += piece;
        else interim += piece;
      }
      if (newlyFinal) {
        finalsRef.current = joinTranscript(finalsRef.current, newlyFinal);
      }
      const spoken = joinTranscript(finalsRef.current, interim);
      onTranscriptRef.current(joinTranscript(baseTextRef.current, spoken));
    };

    recognition.onerror = (event) => {
      if (event.error === 'aborted' || event.error === 'no-speech') {
        // no-speech: keep listening until user stops; aborted: intentional stop
        if (event.error === 'aborted') return;
        return;
      }
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setError('Microphone permission was blocked. Allow mic access to dictate.');
      } else if (event.error === 'network') {
        setError('Speech recognition needs a network connection in this browser.');
      } else {
        setError('Voice input stopped. Tap the mic to try again.');
      }
      wantListeningRef.current = false;
      setIsListening(false);
    };

    recognition.onend = () => {
      // Chrome ends sessions periodically; restart while the user still wants dictation.
      if (wantListeningRef.current) {
        try {
          recognition.start();
          return;
        } catch {
          wantListeningRef.current = false;
          setIsListening(false);
          recognitionRef.current = null;
          return;
        }
      }
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setIsListening(true);
    } catch {
      setError('Could not start the microphone. Tap the mic to try again.');
      wantListeningRef.current = false;
      setIsListening(false);
      recognitionRef.current = null;
    }
  }, [lang, stop]);

  const toggle = useCallback((currentText: string) => {
    if (isListening || wantListeningRef.current) stop();
    else start(currentText);
  }, [isListening, start, stop]);

  useEffect(() => () => stop(), [stop]);

  return {
    isListening,
    isSupported: speechDictationSupported(),
    error,
    clearError: () => setError(null),
    start,
    stop,
    toggle,
  };
}
