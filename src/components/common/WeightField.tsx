/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  type WeightUnit,
  kgToLb,
  lbToKg,
  parseWeightKg,
} from '../../utils/measurements';

interface WeightFieldProps {
  valueKg: number | string | undefined;
  onChangeKg: (kg: number | undefined) => void;
  id?: string;
  className?: string;
}

const UNITS: { id: WeightUnit; label: string }[] = [
  { id: 'kg', label: 'kg' },
  { id: 'lb', label: 'lb' },
];

export const WeightField: React.FC<WeightFieldProps> = ({
  valueKg,
  onChangeKg,
  id = 'weight',
  className = '',
}) => {
  const [unit, setUnit] = useState<WeightUnit>('kg');
  const kg = parseWeightKg(valueKg);
  const [lbDraft, setLbDraft] = useState(kg != null ? String(kgToLb(kg)) : '');

  useEffect(() => {
    const next = parseWeightKg(valueKg);
    setLbDraft(next != null ? String(kgToLb(next)) : '');
  }, [valueKg]);

  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <label htmlFor={id} className="block text-xs font-semibold text-[#242326] uppercase tracking-wider">
          Weight
        </label>
        <div className="inline-flex rounded-lg border border-[#242326]/12 bg-white p-0.5" role="group" aria-label="Weight unit">
          {UNITS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setUnit(option.id)}
              className={`px-2.5 py-1 text-[10px] font-semibold rounded-md cursor-pointer transition-colors ${
                unit === option.id
                  ? 'bg-[#242326] text-white'
                  : 'text-[#5C585E] hover:text-[#242326]'
              }`}
              aria-pressed={unit === option.id}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {unit === 'kg' ? (
        <div className="flex items-center gap-2">
          <input
            id={id}
            type="number"
            min={30}
            max={250}
            step={1}
            value={kg ?? ''}
            onChange={(event) => {
              const raw = event.target.value;
              onChangeKg(raw ? parseInt(raw, 10) : undefined);
            }}
            placeholder="e.g. 68"
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#242326]/15 text-sm text-[#242326] focus:outline-none focus:ring-2 focus:ring-[#9C6A61]"
          />
          <span className="text-xs text-[#5C585E] shrink-0">kg</span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <input
            id={id}
            type="number"
            min={66}
            max={550}
            step={1}
            value={lbDraft}
            onChange={(event) => {
              const raw = event.target.value;
              setLbDraft(raw);
              if (!raw.trim()) {
                onChangeKg(undefined);
                return;
              }
              const lb = Number(raw);
              if (Number.isFinite(lb) && lb > 0) onChangeKg(lbToKg(lb));
            }}
            placeholder="e.g. 150"
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#242326]/15 text-sm text-[#242326] focus:outline-none focus:ring-2 focus:ring-[#9C6A61]"
          />
          <span className="text-xs text-[#5C585E] shrink-0">lb</span>
        </div>
      )}

      {kg != null && unit !== 'kg' && (
        <p className="mt-1.5 text-[11px] text-[#5C585E]">
          Saved as {kg} kg for fit recommendations
        </p>
      )}
    </div>
  );
};
