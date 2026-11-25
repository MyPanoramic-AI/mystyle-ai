/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import type { StylistPersona } from '../../types';
import {
  STYLIST_AGE_VIBE_OPTIONS,
  STYLIST_ANSWER_LENGTH_OPTIONS,
  STYLIST_GENDER_OPTIONS,
  STYLIST_NAME_PRESETS,
  STYLIST_VOICE_OPTIONS,
} from '../../data/stylistPersona';

interface StylistPersonaFieldsProps {
  value: StylistPersona;
  onChange: (next: StylistPersona) => void;
  compact?: boolean;
}

export const StylistPersonaFields: React.FC<StylistPersonaFieldsProps> = ({
  value,
  onChange,
  compact = false,
}) => {
  const gap = compact ? 'space-y-5' : 'space-y-6';

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

      <div className="rounded-2xl border border-[#9C6A61]/25 bg-[#9C6A61]/5 p-3.5 sm:p-4 space-y-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#9C6A61]">
            How they talk with you
          </p>
          <p className="text-[11px] text-[#5C585E] mt-1 leading-relaxed">
            These settings shape chat replies and Talk to Aria — tone, answer style, and how long they speak.
          </p>
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
          Gender presentation
        </label>
        <div className="grid grid-cols-2 gap-2">
          {STYLIST_GENDER_OPTIONS.map((option) => {
            const selected = value.gender === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onChange({ ...value, gender: option.id })}
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
