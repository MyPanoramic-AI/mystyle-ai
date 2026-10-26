/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  type HeightUnit,
  cmToFeetInches,
  cmToMetres,
  feetInchesToCm,
  metresToCm,
  parseHeightCm,
} from '../../utils/measurements';

interface HeightFieldProps {
  valueCm: number | string | undefined;
  onChangeCm: (cm: number | undefined) => void;
  id?: string;
  className?: string;
}

const UNITS: { id: HeightUnit; label: string }[] = [
  { id: 'cm', label: 'cm' },
  { id: 'm', label: 'm' },
  { id: 'ft', label: 'ft / in' },
];

export const HeightField: React.FC<HeightFieldProps> = ({
  valueCm,
  onChangeCm,
  id = 'height',
  className = '',
}) => {
  const [unit, setUnit] = useState<HeightUnit>('cm');
  const cm = parseHeightCm(valueCm);
  const imperial = cm != null ? cmToFeetInches(cm) : { feet: 0, inches: 0 };

  const [metresDraft, setMetresDraft] = useState(cm != null ? cmToMetres(cm) : '');
  const [feetDraft, setFeetDraft] = useState(cm != null ? String(imperial.feet) : '');
  const [inchesDraft, setInchesDraft] = useState(cm != null ? String(imperial.inches) : '');

  useEffect(() => {
    const next = parseHeightCm(valueCm);
    if (next == null) {
      setMetresDraft('');
      setFeetDraft('');
      setInchesDraft('');
      return;
    }
    setMetresDraft(cmToMetres(next));
    const { feet, inches } = cmToFeetInches(next);
    setFeetDraft(String(feet));
    setInchesDraft(String(inches));
  }, [valueCm]);

  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <label htmlFor={id} className="block text-xs font-semibold text-[#242326] uppercase tracking-wider">
          Height
        </label>
        <div className="inline-flex rounded-lg border border-[#242326]/12 bg-white p-0.5" role="group" aria-label="Height unit">
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

      {unit === 'cm' && (
        <div className="flex items-center gap-2">
          <input
            id={id}
            type="number"
            min={100}
            max={250}
            step={1}
            value={cm ?? ''}
            onChange={(event) => {
              const raw = event.target.value;
              onChangeCm(raw ? parseInt(raw, 10) : undefined);
            }}
            placeholder="e.g. 168"
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#242326]/15 text-sm text-[#242326] focus:outline-none focus:ring-2 focus:ring-[#9C6A61]"
          />
          <span className="text-xs text-[#5C585E] shrink-0">cm</span>
        </div>
      )}

      {unit === 'm' && (
        <div className="flex items-center gap-2">
          <input
            id={id}
            type="number"
            min={1}
            max={2.5}
            step={0.01}
            value={metresDraft}
            onChange={(event) => {
              const raw = event.target.value;
              setMetresDraft(raw);
              if (!raw.trim()) {
                onChangeCm(undefined);
                return;
              }
              const metres = Number(raw);
              if (Number.isFinite(metres) && metres > 0) onChangeCm(metresToCm(metres));
            }}
            placeholder="e.g. 1.68"
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#242326]/15 text-sm text-[#242326] focus:outline-none focus:ring-2 focus:ring-[#9C6A61]"
          />
          <span className="text-xs text-[#5C585E] shrink-0">m</span>
        </div>
      )}

      {unit === 'ft' && (
        <div className="flex items-center gap-2">
          <input
            id={id}
            type="number"
            min={3}
            max={8}
            step={1}
            value={feetDraft}
            onChange={(event) => {
              const raw = event.target.value;
              setFeetDraft(raw);
              const feet = Number(raw);
              const inches = Number(inchesDraft) || 0;
              if (!raw.trim() && !inchesDraft.trim()) {
                onChangeCm(undefined);
                return;
              }
              if (Number.isFinite(feet)) onChangeCm(feetInchesToCm(feet, inches));
            }}
            placeholder="5"
            className="w-20 px-3.5 py-2.5 rounded-xl bg-white border border-[#242326]/15 text-sm text-[#242326] focus:outline-none focus:ring-2 focus:ring-[#9C6A61]"
            aria-label="Feet"
          />
          <span className="text-xs text-[#5C585E]">ft</span>
          <input
            type="number"
            min={0}
            max={11}
            step={1}
            value={inchesDraft}
            onChange={(event) => {
              const raw = event.target.value;
              setInchesDraft(raw);
              const feet = Number(feetDraft) || 0;
              const inches = Number(raw);
              if (!feetDraft.trim() && !raw.trim()) {
                onChangeCm(undefined);
                return;
              }
              if (Number.isFinite(inches)) onChangeCm(feetInchesToCm(feet, inches));
            }}
            placeholder="6"
            className="w-20 px-3.5 py-2.5 rounded-xl bg-white border border-[#242326]/15 text-sm text-[#242326] focus:outline-none focus:ring-2 focus:ring-[#9C6A61]"
            aria-label="Inches"
          />
          <span className="text-xs text-[#5C585E]">in</span>
        </div>
      )}

      {cm != null && unit !== 'cm' && (
        <p className="mt-1.5 text-[11px] text-[#5C585E]">
          Saved as {cm} cm for fit recommendations
        </p>
      )}
    </div>
  );
};
