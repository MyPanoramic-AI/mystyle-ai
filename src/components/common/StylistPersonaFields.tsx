/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import type { StylistPersona } from '../../types';
import {
  STYLIST_AGE_VIBE_OPTIONS,
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
  const gap = compact ? 'space-y-4' : 'space-y-5';

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

      <div>
        <label className="block text-xs font-semibold text-[#242326] uppercase tracking-wider mb-1.5">
          How they talk
        </label>
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
