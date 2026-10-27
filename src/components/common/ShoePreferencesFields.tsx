/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import type { PreferredShoeStyleId, ShoePreferences } from '../../types';
import {
  PREFERRED_SHOE_STYLE_OPTIONS,
  SHOE_HEEL_COMFORT_OPTIONS,
  SHOE_HEEL_OCCASION_OPTIONS,
} from '../../data/shoePreferences';

interface ShoePreferencesFieldsProps {
  value: ShoePreferences;
  onChange: (next: ShoePreferences) => void;
  compact?: boolean;
}

export const ShoePreferencesFields: React.FC<ShoePreferencesFieldsProps> = ({
  value,
  onChange,
  compact = false,
}) => {
  const hideOccasion = value.heelComfort === 'cannot-wear-heels';

  const setComfort = (heelComfort: ShoePreferences['heelComfort']) => {
    onChange({
      ...value,
      heelComfort,
      heelOccasion: heelComfort === 'cannot-wear-heels' ? 'never' : value.heelOccasion,
      preferredStyles: heelComfort === 'cannot-wear-heels'
        ? value.preferredStyles.filter((style) => style !== 'stilettos' && style !== 'pumps' && style !== 'block-heels')
        : value.preferredStyles,
    });
  };

  const toggleStyle = (style: PreferredShoeStyleId) => {
    const preferredStyles = value.preferredStyles.includes(style)
      ? value.preferredStyles.filter((item) => item !== style)
      : [...value.preferredStyles, style];
    onChange({ ...value, preferredStyles });
  };

  return (
    <div className={compact ? 'space-y-4' : 'space-y-5'}>
      <div>
        <label className="block text-xs font-semibold text-[#242326] uppercase tracking-wider mb-1.5">
          Heel comfort
        </label>
        <p className="text-[11px] text-[#5C585E] mb-2 leading-relaxed">
          Some people cannot wear high heels; others prefer them only for certain looks.
        </p>
        <div className="space-y-2">
          {SHOE_HEEL_COMFORT_OPTIONS.map((option) => {
            const selected = value.heelComfort === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setComfort(option.id)}
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

      {!hideOccasion && (
        <div>
          <label className="block text-xs font-semibold text-[#242326] uppercase tracking-wider mb-1.5">
            When you wear heels
          </label>
          <div className="flex flex-wrap gap-2">
            {SHOE_HEEL_OCCASION_OPTIONS.map((option) => {
              const selected = value.heelOccasion === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  title={option.hint}
                  onClick={() => onChange({ ...value, heelOccasion: option.id })}
                  className={`py-2 px-3 text-xs font-medium rounded-xl border transition-all cursor-pointer ${
                    selected
                      ? 'bg-[#242326] text-white border-[#242326] shadow-xs'
                      : 'bg-[#F6F2EC]/50 text-[#5C585E] border-[#242326]/10 hover:border-[#242326]/30'
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-[#242326] uppercase tracking-wider mb-1.5">
          Preferred shoe styles
        </label>
        <p className="text-[11px] text-[#5C585E] mb-2">Optional — pick the styles you reach for most.</p>
        <div className="flex flex-wrap gap-2">
          {PREFERRED_SHOE_STYLE_OPTIONS.filter((option) => {
            if (value.heelComfort === 'cannot-wear-heels') {
              return !['stilettos', 'pumps', 'block-heels'].includes(option.id);
            }
            if (value.heelComfort === 'low-heels-only') {
              return option.id !== 'stilettos';
            }
            return true;
          }).map((option) => {
            const selected = value.preferredStyles.includes(option.id);
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => toggleStyle(option.id)}
                className={`py-2 px-3 text-xs font-medium rounded-xl border transition-all cursor-pointer ${
                  selected
                    ? 'bg-[#242326] text-white border-[#242326] shadow-xs'
                    : 'bg-[#F6F2EC]/50 text-[#5C585E] border-[#242326]/10 hover:border-[#242326]/30'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
