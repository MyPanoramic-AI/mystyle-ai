/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Mic, MicOff, PhoneOff, Radio, Volume2, Sparkles, ImageIcon, Loader2 } from 'lucide-react';
import type { GptLiveStatus, GptLiveTranscriptTurn } from '../../hooks/useGptLiveVoice';
import type { StylistOutfitRecommendation } from '../../types/stylist';
import type { TemporaryPhotos, UserProfile } from '../../types';
import type { PreloadedGarment } from '../../types/shop';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { ShareToFriendButton } from '../common/ShareToFriendButton';
import { imageSharePayload } from '../../services/shareToFriend';
import { OutfitRecommendationCard } from './OutfitRecommendationCard';

export interface VoiceLookVisual {
  imageUrl: string;
  title: string;
  promptUsed?: string;
}

interface StylistLiveVoicePanelProps {
  stylistName: string;
  status: GptLiveStatus;
  muted: boolean;
  error: string | null;
  elapsedSeconds: number;
  maxSessionSeconds: number | null;
  transcripts: GptLiveTranscriptTurn[];
  hearingYou?: boolean;
  promptingReply?: boolean;
  micLevel?: number;
  micSilent?: boolean;
  lookVisual?: VoiceLookVisual | null;
  lookVisualLoading?: boolean;
  lookVisualError?: string | null;
  outfitCards?: StylistOutfitRecommendation[];
  profile?: UserProfile;
  photos?: TemporaryPhotos;
  onShopNow?: (outfit: StylistOutfitRecommendation) => void;
  onSendToTryOn?: (garment: PreloadedGarment) => void;
  onNavigateToShop?: () => void;
  onMuteToggle: () => void;
  onPlayAudio: () => void;
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
  hearingYou = false,
  promptingReply = false,
  micLevel = 0,
  micSilent = false,
  lookVisual = null,
  lookVisualLoading = false,
  lookVisualError = null,
  outfitCards = [],
  profile,
  photos,
  onShopNow,
  onSendToTryOn,
  onNavigateToShop,
  onMuteToggle,
  onPlayAudio,
  onEnd,
  onBackToText,
}) => {
  const speaking = status === 'speaking';
  const listening = status === 'listening' || status === 'connected';
  const visibleTurns = transcripts.filter((t) => t.final || t.text.trim());
  const latestAssistant = [...visibleTurns].reverse().find((t) => t.role === 'assistant');
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const [imageRevealed, setImageRevealed] = useState(false);
  const [lookExpanded, setLookExpanded] = useState(false);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [visibleTurns.length, latestAssistant?.text]);

  useEffect(() => {
    setImageRevealed(false);
    setLookExpanded(false);
    if (!lookVisual?.imageUrl) return;
    const timer = window.setTimeout(() => setImageRevealed(true), 40);
    return () => window.clearTimeout(timer);
  }, [lookVisual?.imageUrl]);

  useEffect(() => {
    if (!lookExpanded) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLookExpanded(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lookExpanded]);

  const liveHint = speaking
    ? `${stylistName} is answering…`
    : promptingReply
      ? `Asking ${stylistName} to reply…`
      : hearingYou
        ? 'Hearing you… pause when you finish and she will reply.'
        : micSilent
          ? 'Desktop mic looks silent. Allow microphone for this site and prefer headphones.'
            : lookVisualLoading
            ? `${stylistName} is putting a look on your screen…`
            : hasOutfitCards
              ? 'Garment previews for her options are on screen.'
              : 'Ask for outfit options — garment previews appear here while you talk.';

  const bars = useMemo(() => Array.from({ length: 9 }, (_, i) => i), []);
  const micActivity = muted ? 0 : Math.min(1, micLevel * 8);

  const hasLook = Boolean(lookVisual?.imageUrl);
  const hasOutfitCards = outfitCards.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#1A1819] text-white animate-in fade-in duration-300 overflow-hidden">
      {/* Ambient stage — blurred fill only; never crops the main look */}
      <div className="absolute inset-0 overflow-hidden">
        {hasLook ? (
          <ImageWithFallback
            src={lookVisual!.imageUrl}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover scale-110 blur-2xl opacity-35"
            fallbackTitle=""
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 80% 60% at 50% 20%, #5C3D38 0%, #2A2426 45%, #1A1819 100%)',
            }}
          />
        )}
        <div className={`absolute inset-0 ${hasLook ? 'bg-black/55' : 'bg-gradient-to-t from-black/90 via-black/45 to-black/25'}`} />
        {!hasLook && (
          <div
            className="absolute inset-0 opacity-[0.07] pointer-events-none"
            style={{
              backgroundImage:
                'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23E5CDBE\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            }}
          />
        )}
      </div>

      {/* Top bar */}
      <header className="relative z-10 flex items-start justify-between gap-3 px-4 sm:px-6 pt-[max(1rem,env(safe-area-inset-top))] pb-3">
        <div className="min-w-0">
          <p className="font-serif text-3xl sm:text-4xl tracking-tight text-white drop-shadow-sm">
            {stylistName}
          </p>
          <p className="mt-1 text-[11px] text-white/75 flex items-center gap-1.5">
            <Radio className={`w-3 h-3 ${speaking || listening || hearingYou ? 'text-emerald-400' : 'text-[#E5CDBE]'}`} />
            <span>
              {speaking
                ? statusLabel(status, stylistName)
                : promptingReply
                  ? `Asking ${stylistName} to reply…`
                  : hearingYou
                    ? 'Hearing you…'
                    : statusLabel(status, stylistName)}
            </span>
            <span className="text-white/30">·</span>
            <span className="tabular-nums text-white/70">
              {formatSeconds(elapsedSeconds)}
              {maxSessionSeconds != null ? ` / ${formatSeconds(maxSessionSeconds)}` : ''}
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={onBackToText}
          className="text-xs font-semibold text-[#E5CDBE] hover:text-white transition-colors shrink-0 pt-2"
        >
          Back to text
        </button>
      </header>

      {/* Main stage content — look gets the tall column so full-body images are not clipped */}
      <div className="relative z-10 flex-1 min-h-0 flex flex-col lg:flex-row gap-4 px-4 sm:px-6 pb-2">
        <div className="flex-1 min-h-0 flex flex-col">
          {!hasLook && !hasOutfitCards && !lookVisualLoading && (
            <div className="mb-4 max-w-xl animate-in fade-in slide-in-from-bottom-2 duration-500">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#E5CDBE]/80 mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#B49361]" />
                Live styling
              </p>
              <p className="font-serif text-2xl sm:text-3xl text-white leading-snug">
                Talk naturally. Ask {stylistName} for outfit options — garment previews appear here.
              </p>
            </div>
          )}

          {hasOutfitCards && (
            <div className="mb-3 flex-1 min-h-0 overflow-y-auto space-y-3 pr-1 animate-in fade-in duration-500">
              <p className="inline-flex items-center gap-1.5 rounded-full bg-black/45 backdrop-blur-md border border-white/15 px-3 py-1.5 text-[11px] font-semibold text-white">
                <Sparkles className="w-3.5 h-3.5 text-[#B49361]" />
                Garment previews for her options
              </p>
              {outfitCards.map((outfit) => (
                <div key={outfit.id} className="rounded-2xl overflow-hidden">
                  <OutfitRecommendationCard
                    outfit={outfit}
                    profile={profile}
                    photos={photos}
                    onNavigateToShop={onNavigateToShop || (() => undefined)}
                    onShopNow={onShopNow}
                    onSendToTryOn={onSendToTryOn}
                  />
                </div>
              ))}
            </div>
          )}

          {(lookVisualLoading || lookVisualError) && (
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-black/45 backdrop-blur-md border border-white/15 px-3 py-1.5 text-[11px] text-white/90 w-fit">
              {lookVisualLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#E5CDBE]" />
                  Creating your look visualization…
                </>
              ) : (
                <>
                  <ImageIcon className="w-3.5 h-3.5 text-[#E5CDBE]" />
                  {lookVisualError}
                </>
              )}
            </div>
          )}

          {/* Full look frame — object-contain so portrait outfits are not cropped */}
          {hasLook && (
            <div className="relative flex-1 min-h-0 flex flex-col animate-in fade-in duration-500">
              <div className="mb-2 flex items-center gap-2 flex-wrap">
                <p className="inline-flex items-center gap-1.5 rounded-full bg-black/45 backdrop-blur-md border border-white/15 px-3 py-1.5 text-[11px] font-semibold text-white">
                  <ImageIcon className="w-3.5 h-3.5 text-[#B49361]" />
                  {lookVisual?.title || `${stylistName}'s look`}
                </p>
                {lookVisual?.imageUrl && (
                  <ShareToFriendButton
                    variant="chip"
                    className="bg-white/90 border-white/30"
                    label="Share look to a friend"
                    payload={imageSharePayload({
                      title: lookVisual.title || `${stylistName}'s look`,
                      caption: latestAssistant?.text?.slice(0, 160) || 'A look from my IStyleU stylist.',
                      imageUrl: lookVisual.imageUrl,
                    })}
                  />
                )}
              </div>
              <button
                type="button"
                onClick={() => setLookExpanded(true)}
                className="relative flex-1 min-h-[28vh] sm:min-h-[40vh] rounded-2xl border border-white/10 bg-black/30 overflow-hidden flex items-center justify-center p-2 sm:p-3 cursor-zoom-in"
                aria-label="View full look"
                title="Tap to view full picture"
              >
                <ImageWithFallback
                  src={lookVisual!.imageUrl}
                  alt={lookVisual?.title || 'Look visualization'}
                  className={`max-h-full max-w-full h-full w-auto transition-all duration-700 ease-out ${
                    imageRevealed ? 'opacity-100 scale-100' : 'opacity-0 scale-[1.02]'
                  }`}
                  imageClassName="object-contain object-center"
                  fallbackTitle={lookVisual?.title || 'Look'}
                />
                <span className="absolute bottom-2 right-2 rounded-full bg-black/55 border border-white/15 px-2.5 py-1 text-[10px] font-semibold text-white/90">
                  Full picture
                </span>
              </button>
              {latestAssistant?.text && (
                <p className="mt-3 max-w-3xl text-sm text-white/90 leading-relaxed line-clamp-3 drop-shadow">
                  <span className="font-semibold text-[#E5CDBE]">{stylistName}: </span>
                  {latestAssistant.text}
                  {!latestAssistant.final && <span className="opacity-50"> …</span>}
                </p>
              )}
            </div>
          )}

          {!hasLook && latestAssistant?.text && (
            <p className="mt-auto max-w-2xl text-sm sm:text-base text-white/90 leading-relaxed line-clamp-4 drop-shadow">
              <span className="font-semibold text-[#E5CDBE]">{stylistName}: </span>
              {latestAssistant.text}
              {!latestAssistant.final && <span className="opacity-50"> …</span>}
            </p>
          )}
        </div>

        {/* Transcript rail — shrink on mobile when a look is on screen so the full outfit stays visible */}
        <aside className={`lg:w-[22rem] shrink-0 lg:max-h-none lg:h-full rounded-2xl border border-white/12 bg-black/40 backdrop-blur-md overflow-hidden flex flex-col ${
          hasLook || hasOutfitCards ? 'max-h-[18vh] lg:max-h-none' : 'max-h-[32vh]'
        }`}>
          <div className="px-3 py-2 border-b border-white/10 text-[11px] font-semibold uppercase tracking-wider text-white/60">
            Transcript ({visibleTurns.length})
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2.5">
            {visibleTurns.length === 0 && (
              <p className="text-[11px] text-white/50">
                Spoken turns appear here while you talk with {stylistName}.
              </p>
            )}
            {visibleTurns.map((turn) => (
              <p
                key={turn.id}
                className={`text-[11px] leading-relaxed ${
                  turn.role === 'user' ? 'text-white' : 'text-white/75'
                }`}
              >
                <span className="font-semibold text-[#E5CDBE]">
                  {turn.role === 'user' ? 'You' : stylistName}:{' '}
                </span>
                {turn.text}
                {!turn.final && <span className="opacity-50"> …</span>}
              </p>
            ))}
            <div ref={transcriptEndRef} />
          </div>
        </aside>
      </div>

      {lookExpanded && lookVisual?.imageUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/92 flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-label="Full look picture"
        >
          <div className="flex items-center justify-between gap-3 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-3">
            <p className="text-sm font-semibold text-white truncate">
              {lookVisual.title || `${stylistName}'s look`}
            </p>
            <button
              type="button"
              onClick={() => setLookExpanded(false)}
              className="shrink-0 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white"
            >
              Close
            </button>
          </div>
          <div className="flex-1 min-h-0 flex items-center justify-center px-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <img
              src={lookVisual.imageUrl}
              alt={lookVisual.title || 'Full look visualization'}
              className="max-h-full max-w-full object-contain"
            />
          </div>
        </div>
      )}

      {/* Bottom controls */}
      <footer className="relative z-10 px-4 sm:px-6 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
        <div className="max-w-3xl mx-auto">
          {(listening || speaking) && (
            <div className="mb-3 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onPlayAudio();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/20 bg-white/10 text-[11px] font-semibold text-white hover:bg-white/15"
              >
                <Volume2 className="w-3.5 h-3.5 text-[#E5CDBE]" />
                Play {stylistName}&apos;s voice
              </button>
              <p className="text-[11px] text-white/70">{liveHint}</p>
            </div>
          )}

          <div className="flex items-end justify-center gap-1.5 h-10 mb-2" aria-hidden>
            {bars.map((i) => {
              const threshold = (i + 1) / bars.length;
              const active = speaking || micActivity >= threshold * 0.35;
              const height = speaking
                ? 14 + ((i * 7 + elapsedSeconds) % 18)
                : Math.max(6, Math.round(6 + micActivity * (8 + i * 3)));
              return (
                <span
                  key={i}
                  className={`w-1.5 rounded-full transition-all ${
                    active ? 'bg-[#E5CDBE]' : 'bg-white/25'
                  }`}
                  style={{ height: `${height}px` }}
                />
              );
            })}
          </div>

          {error && (
            <div className="mb-3 rounded-xl border border-white/15 bg-black/55 px-3 py-3 text-xs text-white/85 space-y-2">
              <p className="text-[#E5CDBE] font-medium">{error}</p>
              {status === 'error' && (
                <div className="flex flex-wrap gap-2">
                  <a
                    href={typeof window !== 'undefined' ? window.location.href : 'https://mystyle-ai.onrender.com'}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center px-3 py-1.5 rounded-full bg-[#9C6A61] text-white text-[11px] font-semibold"
                  >
                    Open in Chrome / Edge
                  </a>
                  <button
                    type="button"
                    onClick={onBackToText}
                    className="inline-flex items-center px-3 py-1.5 rounded-full border border-white/20 bg-white/10 text-[11px] font-semibold text-white"
                  >
                    Continue in text chat
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={onMuteToggle}
              disabled={status === 'ending' || status === 'connecting' || status === 'requesting_mic' || status === 'error'}
              className={`w-14 h-14 rounded-full flex items-center justify-center border transition-colors disabled:opacity-40 ${
                muted
                  ? 'bg-white text-[#242326] border-white'
                  : 'bg-white/10 text-white border-white/25 hover:bg-white/15'
              }`}
              aria-label={muted ? 'Unmute microphone' : 'Mute microphone'}
              title={muted ? 'Unmute' : 'Mute'}
            >
              {muted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            <button
              type="button"
              onClick={onEnd}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-[#9C6A61] hover:bg-[#875851] text-white text-sm font-medium transition-colors shadow-lg shadow-black/30"
            >
              <PhoneOff className="w-4 h-4" />
              {status === 'error' ? 'Close' : 'End conversation'}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
