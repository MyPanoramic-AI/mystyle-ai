/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Volume2 } from 'lucide-react';
import type { StylistAudioVoiceId, StylistPersona } from '../../types';
import {
  STYLIST_AGE_VIBE_OPTIONS,
  STYLIST_ANSWER_LENGTH_OPTIONS,
  STYLIST_GENDER_OPTIONS,
  STYLIST_NAME_PRESETS,
  STYLIST_VOICE_OPTIONS,
  resolveAudioVoiceForGender,
  stylistAudioVoicesForGender,
} from '../../data/stylistPersona';
import { AccountApiError, accountApi } from '../../services/accountApi';
import { playVoicePreviewBlob, stopVoicePreview } from '../../services/playVoicePreview';

interface StylistPersonaFieldsProps {
  value: StylistPersona;
  onChange: (next: StylistPersona) => void;
  compact?: boolean;
  /** When false, listen previews stay disabled (signed-out / demo). */
  allowVoicePreview?: boolean;
}

export const StylistPersonaFields: React.FC<StylistPersonaFieldsProps> = ({
  value,
  onChange,
  compact = false,
  allowVoicePreview = true,
}) => {
  const gap = compact ? 'space-y-5' : 'space-y-6';
  const [previewing, setPreviewing] = useState<StylistAudioVoiceId | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const audioVoiceOptions = stylistAudioVoicesForGender(value.gender);

  useEffect(() => () => {
    stopVoicePreview();
  }, []);

  useEffect(() => {
    const nextVoice = resolveAudioVoiceForGender(value.gender, value.audioVoice);
    if (nextVoice !== value.audioVoice) {
      onChange({ ...value, audioVoice: nextVoice });
    }
  }, [value.gender]); // eslint-disable-line react-hooks/exhaustive-deps -- only re-check when presentation changes

  const setGender = (gender: StylistPersona['gender']) => {
    onChange({
      ...value,
      gender,
      audioVoice: resolveAudioVoiceForGender(gender, value.audioVoice),
    });
  };

  const playPreview = async (voiceId: StylistAudioVoiceId) => {
    if (!allowVoicePreview) {
      setPreviewError('Sign in to listen to spoken stylist voices.');
      return;
    }
    setPreviewError(null);
    setPreviewing(voiceId);
    try {
      stopVoicePreview();
      const blob = await accountApi.previewStylistVoice({
        voice: voiceId,
        stylistName: value.name,
      });
      await playVoicePreviewBlob(blob, {
        voice: voiceId,
        onEnded: () => setPreviewing((current) => (current === voiceId ? null : current)),
        onError: (message) => {
          setPreviewError(message || 'Could not play that voice sample.');
          setPreviewing(null);
        },
      });
    } catch (error) {
      setPreviewError(
        error instanceof AccountApiError
          ? error.message
          : error instanceof Error && /NotAllowedError|not allowed/i.test(error.name + error.message)
            ? 'Your browser blocked the sample. Tap Listen again to play it.'
            : 'Could not play that voice sample.',
      );
      setPreviewing(null);
    }
  };

  return (
    <div className={gap}>
      <div>
        <label className="block text-xs font-semibold text-[#242326] uppercase tracking-wider mb-1.5">
          Stylist name
        </label>
        <p className="text-[11px] text-[#5C585E] mb-2 leading-relaxed">
          Pick a preset or type a custom name — this is how your stylist introduces themselves.
        </p>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {STYLIST_NAME_PRESETS.map((name) => {
            const selected = value.name === name;
            return (
              <button
                key={name}
                type="button"
                onClick={() => onChange({ ...value, name })}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                  selected
                    ? 'bg-[#9C6A61] text-white border-[#9C6A61]'
                    : 'bg-[#F6F2EC] text-[#242326] border-[#242326]/10 hover:border-[#242326]/25'
                }`}
              >
                {name}
              </button>
            );
          })}
        </div>
        <input
          type="text"
          value={value.name}
          maxLength={40}
          onChange={(e) => onChange({ ...value, name: e.target.value.slice(0, 40) })}
          placeholder="Custom name"
          className="w-full rounded-xl border border-[#242326]/10 bg-[#F6F2EC]/40 px-3 py-2.5 text-sm text-[#242326] outline-none focus:border-[#9C6A61] focus:ring-1 focus:ring-[#9C6A61]"
          aria-label="Custom stylist name"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-[#242326] uppercase tracking-wider mb-1.5">
          Gender presentation
        </label>
        <p className="text-[11px] text-[#5C585E] mb-2 leading-relaxed">
          This also filters the spoken voices you can choose below.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {STYLIST_GENDER_OPTIONS.map((option) => {
            const selected = value.gender === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setGender(option.id)}
                className={`text-left rounded-xl border px-3 py-2.5 transition-all cursor-pointer ${
                  selected
                    ? 'border-[#9C6A61] bg-[#9C6A61]/8 ring-1 ring-[#9C6A61]/20'
                    : 'border-[#242326]/10 bg-[#F6F2EC]/40 hover:border-[#242326]/25'
                }`}
              >
                <span className="block text-xs font-semibold text-[#242326]">{option.label}</span>
                <span className="block text-[11px] text-[#5C585E] mt-0.5 leading-snug">{option.hint}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-[#9C6A61]/25 bg-[#9C6A61]/5 p-3.5 sm:p-4 space-y-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#9C6A61]">
            How they talk with you
          </p>
          <p className="text-[11px] text-[#5C585E] mt-1 leading-relaxed">
            Choose a spoken voice that matches their presentation, then set tone and how long they answer.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#242326] uppercase tracking-wider mb-1.5">
            Spoken voice
          </label>
          <p className="text-[11px] text-[#5C585E] mb-2 leading-relaxed">
            {value.gender === 'woman'
              ? 'Women’s voices for this stylist. Tap Listen to hear a sample.'
              : value.gender === 'man'
                ? 'Men’s voices for this stylist. Tap Listen to hear a sample.'
                : 'All voices are available for this presentation. Tap Listen to hear a sample.'}
          </p>
          <div className="space-y-2">
            {audioVoiceOptions.map((option) => {
              const selected = value.audioVoice === option.id;
              const isPreviewing = previewing === option.id;
              return (
                <div
                  key={option.id}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 transition-all ${
                    selected
                      ? 'border-[#9C6A61] bg-white ring-1 ring-[#9C6A61]/25 shadow-xs'
                      : 'border-[#242326]/10 bg-[#F6F2EC]/60'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onChange({ ...value, audioVoice: option.id })}
                    className="min-w-0 flex-1 text-left cursor-pointer"
                  >
                    <span className="block text-xs font-semibold text-[#242326]">{option.label}</span>
                    <span className="block text-[11px] text-[#5C585E] mt-0.5 leading-snug">{option.hint}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void playPreview(option.id)}
                    disabled={previewing !== null && !isPreviewing}
                    className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer disabled:opacity-50 ${
                      isPreviewing
                        ? 'bg-[#9C6A61] text-white border-[#9C6A61]'
                        : 'bg-white text-[#9C6A61] border-[#9C6A61]/30 hover:bg-[#9C6A61]/10'
                    }`}
                    aria-label={`Listen to ${option.label}`}
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>{isPreviewing ? 'Playing…' : 'Listen'}</span>
                  </button>
                </div>
              );
            })}
          </div>
          {previewError && (
            <p className="mt-2 text-[11px] text-[#9C6A61] leading-relaxed">{previewError}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#242326] uppercase tracking-wider mb-1.5">
            Conversational tone
          </label>
          <p className="text-[11px] text-[#5C585E] mb-2 leading-relaxed">
            Choose how your stylist answers — warm, direct, witty, editorial, or calm.
          </p>
          <div className="space-y-2">
            {STYLIST_VOICE_OPTIONS.map((option) => {
              const selected = value.voice === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => onChange({ ...value, voice: option.id })}
                  className={`w-full text-left rounded-xl border px-3 py-2.5 transition-all cursor-pointer ${
                    selected
                      ? 'border-[#9C6A61] bg-white ring-1 ring-[#9C6A61]/25 shadow-xs'
                      : 'border-[#242326]/10 bg-[#F6F2EC]/60 hover:border-[#242326]/25'
                  }`}
                >
                  <span className="block text-xs font-semibold text-[#242326]">{option.label}</span>
                  <span className="block text-[11px] text-[#5C585E] mt-0.5 leading-snug">{option.hint}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#242326] uppercase tracking-wider mb-1.5">
            How long they talk
          </label>
          <p className="text-[11px] text-[#5C585E] mb-2 leading-relaxed">
            Short for quick answers, detailed for fuller guidance — applies in chat and when you talk live.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {STYLIST_ANSWER_LENGTH_OPTIONS.map((option) => {
              const selected = value.answerLength === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => onChange({ ...value, answerLength: option.id })}
                  className={`text-left rounded-xl border px-3 py-2.5 transition-all cursor-pointer ${
                    selected
                      ? 'border-[#9C6A61] bg-white ring-1 ring-[#9C6A61]/25 shadow-xs'
                      : 'border-[#242326]/10 bg-[#F6F2EC]/60 hover:border-[#242326]/25'
                  }`}
                >
                  <span className="block text-xs font-semibold text-[#242326]">{option.label}</span>
                  <span className="block text-[11px] text-[#5C585E] mt-0.5 leading-snug">{option.hint}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-[#242326] uppercase tracking-wider mb-1.5">
          Age vibe
        </label>
        <div className="space-y-2">
          {STYLIST_AGE_VIBE_OPTIONS.map((option) => {
            const selected = value.ageVibe === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onChange({ ...value, ageVibe: option.id })}
                className={`w-full text-left rounded-xl border px-3 py-2.5 transition-all cursor-pointer ${
                  selected
                    ? 'border-[#9C6A61] bg-[#9C6A61]/8 ring-1 ring-[#9C6A61]/20'
                    : 'border-[#242326]/10 bg-[#F6F2EC]/40 hover:border-[#242326]/25'
                }`}
              >
                <span className="block text-xs font-semibold text-[#242326]">{option.label}</span>
                <span className="block text-[11px] text-[#5C585E] mt-0.5 leading-snug">{option.hint}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
