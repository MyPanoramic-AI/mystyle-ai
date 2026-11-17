/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { Mic, MicOff, PhoneOff, ChevronDown, ChevronUp, Radio } from 'lucide-react';
import type { GptLiveStatus, GptLiveTranscriptTurn } from '../../hooks/useGptLiveVoice';

interface StylistLiveVoicePanelProps {
  stylistName: string;
  status: GptLiveStatus;
  muted: boolean;
  error: string | null;
  elapsedSeconds: number;
  maxSessionSeconds: number | null;
  transcripts: GptLiveTranscriptTurn[];
  onMuteToggle: () => void;
  onEnd: () => void;
  onBackToText: () => void;
}

function statusLabel(status: GptLiveStatus, stylistName: string): string {
  switch (status) {
    case 'requesting_mic':
      return 'Requesting microphone…';
    case 'connecting':
      return `Connecting to ${stylistName}…`;
    case 'connected':
      return 'Connected';
    case 'listening':
      return `${stylistName} is listening`;
    case 'speaking':
      return `${stylistName} is speaking`;
    case 'ending':
      return 'Ending conversation…';
    case 'error':
      return 'Voice unavailable';
    default:
      return 'Ready';
  }
}

function formatSeconds(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export const StylistLiveVoicePanel: React.FC<StylistLiveVoicePanelProps> = ({
  stylistName,
  status,
  muted,
  error,
  elapsedSeconds,
  maxSessionSeconds,
  transcripts,
  onMuteToggle,
  onEnd,
  onBackToText,
}) => {
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const speaking = status === 'speaking';
  const listening = status === 'listening' || status === 'connected';

  const bars = useMemo(() => Array.from({ length: 7 }, (_, i) => i), []);

  return (
    <div className="border-t border-[#242326]/10 bg-gradient-to-b from-[#FAF7F2] to-[#F6F2EC] px-4 sm:px-6 py-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="min-w-0">
            <p className="font-serif text-base text-[#242326] truncate">{stylistName}</p>
            <p className="text-[11px] text-[#5C585E] flex items-center gap-1.5 mt-0.5">
              <Radio className={`w-3 h-3 ${speaking || listening ? 'text-emerald-600' : 'text-[#9C6A61]'}`} />
              {statusLabel(status, stylistName)}
              <span className="text-[#242326]/30">·</span>
              <span className="tabular-nums">
                {formatSeconds(elapsedSeconds)}
                {maxSessionSeconds != null ? ` / ${formatSeconds(maxSessionSeconds)}` : ''}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={onBackToText}
            className="text-xs font-medium text-[#9C6A61] hover:text-[#242326] transition-colors shrink-0"
          >
            Back to text
          </button>
        </div>

        {/* Waveform */}
        <div
          className="flex items-end justify-center gap-1.5 h-12 mb-4"
          aria-hidden
        >
          {bars.map((i) => (
            <span
              key={i}
              className={`w-1.5 rounded-full bg-[#9C6A61] transition-all ${
                speaking
                  ? 'animate-pulse'
                  : listening && !muted
                    ? 'opacity-70'
                    : 'opacity-30'
              }`}
              style={{
                height: speaking
                  ? `${18 + ((i * 7 + elapsedSeconds) % 22)}px`
                  : listening
                    ? `${10 + (i % 3) * 4}px`
                    : '8px',
                animationDelay: `${i * 80}ms`,
              }}
            />
          ))}
        </div>

        {error && (
          <p className="text-xs text-[#9C6A61] bg-white/80 border border-[#242326]/10 rounded-xl px-3 py-2 mb-3">
            {error}
          </p>
        )}

        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onMuteToggle}
            disabled={status === 'ending' || status === 'connecting' || status === 'requesting_mic'}
            className={`w-12 h-12 rounded-full flex items-center justify-center border transition-colors disabled:opacity-40 ${
              muted
                ? 'bg-[#242326] text-white border-[#242326]'
                : 'bg-white text-[#242326] border-[#242326]/15 hover:bg-[#FAF7F2]'
            }`}
            aria-label={muted ? 'Unmute microphone' : 'Mute microphone'}
            title={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          <button
            type="button"
            onClick={onEnd}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#9C6A61] hover:bg-[#875851] text-white text-sm font-medium transition-colors"
          >
            <PhoneOff className="w-4 h-4" />
            End conversation
          </button>
        </div>

        <div className="mt-4">
          <button
            type="button"
            onClick={() => setTranscriptOpen((v) => !v)}
            className="w-full flex items-center justify-between text-xs font-medium text-[#5C585E] hover:text-[#242326] py-1"
          >
            <span>Transcript ({transcripts.filter((t) => t.final || t.text).length})</span>
            {transcriptOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          {transcriptOpen && (
            <div className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-[#242326]/10 bg-white/90 px-3 py-2 space-y-2">
              {transcripts.length === 0 && (
                <p className="text-[11px] text-[#5C585E]">Spoken turns will appear here.</p>
              )}
              {transcripts.map((turn) => (
                <p key={turn.id} className={`text-[11px] leading-relaxed ${turn.role === 'user' ? 'text-[#242326]' : 'text-[#5C585E]'}`}>
                  <span className="font-semibold">{turn.role === 'user' ? 'You' : stylistName}: </span>
                  {turn.text}
                  {!turn.final && <span className="opacity-50"> …</span>}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
