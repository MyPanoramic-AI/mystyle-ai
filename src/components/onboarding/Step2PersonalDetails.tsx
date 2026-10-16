/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PersonalDetails } from '../../types';
import { Button } from '../common/Button';
import { ArrowLeft, ArrowRight, User } from 'lucide-react';

interface Step2PersonalDetailsProps {
  initialData: PersonalDetails;
  onContinue: (data: PersonalDetails) => void;
  onBack: () => void;
  onSkip: () => void;
}

const AGE_RANGES = ['18–24', '25–34', '35–44', '45–54', '55+', 'Prefer not to say'];
const COUNTRIES = ['South Africa', 'Namibia', 'Botswana', 'United Kingdom', 'Other'];
const CURRENCIES = ['ZAR (R)', 'USD ($)', 'EUR (€)', 'GBP (£)'];

export const Step2PersonalDetails: React.FC<Step2PersonalDetailsProps> = ({
  initialData,
  onContinue,
  onBack,
  onSkip,
}) => {
  const [firstName, setFirstName] = useState(initialData.firstName || '');
  const [ageRange, setAgeRange] = useState(initialData.ageRange || '25–34');
  const [heightCm, setHeightCm] = useState(initialData.heightCm?.toString() ?? '');
  const [country, setCountry] = useState(initialData.country || 'South Africa');
  const [currency, setCurrency] = useState(initialData.currency || 'ZAR (R)');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onContinue({
      firstName: firstName.trim(),
      ageRange,
      heightCm: heightCm ? parseInt(heightCm, 10) : undefined,
      country,
      currency,
    });
  };

  return (
    <div className="max-w-xl mx-auto py-2 sm:py-6 animate-fadeIn">
      <div className="rounded-3xl bg-white border border-[#242326]/10 shadow-sm p-6 sm:p-10">
        {/* Header */}
        <div className="mb-6">
          <span className="text-xs font-semibold tracking-wider uppercase text-[#B49361] block mb-1">
            Step 1 of 6 · Personal Details
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#242326]">
            Tell me about yourself
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-[#5C585E]">
            We'll customize size recommendations and currency for your regional stores.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* First Name */}
          <div>
            <label className="block text-xs font-semibold text-[#242326] uppercase tracking-wider mb-1.5">
              Preferred First Name *
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. Nandi, Thabo, Sarah"
                className="w-full px-4 py-3 rounded-xl bg-[#F6F2EC]/60 border border-[#242326]/15 text-sm text-[#242326] placeholder:text-[#5C585E]/60 focus:outline-none focus:ring-2 focus:ring-[#9C6A61] focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Age Range (Optional) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-[#242326] uppercase tracking-wider">
                Age Range (Optional)
              </label>
              <span className="text-[11px] text-[#5C585E]">Helps with styling aesthetics</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {AGE_RANGES.map((range) => (
                <button
                  type="button"
                  key={range}
                  onClick={() => setAgeRange(range)}
                  className={`py-2 px-2 text-xs font-medium rounded-xl border transition-all cursor-pointer text-center ${
                    ageRange === range
                      ? 'bg-[#242326] text-white border-[#242326]'
                      : 'bg-[#F6F2EC]/50 text-[#5C585E] border-[#242326]/10 hover:border-[#242326]/30'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          {/* Height in cm (Optional) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-[#242326] uppercase tracking-wider">
                Height in Centimetres (Optional)
              </label>
              <span className="text-[11px] text-[#5C585E]">For dress and trouser length</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="120"
                max="220"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                placeholder="e.g. 168"
                className="w-32 px-4 py-2.5 rounded-xl bg-[#F6F2EC]/60 border border-[#242326]/15 text-sm text-[#242326] focus:outline-none focus:ring-2 focus:ring-[#9C6A61] focus:bg-white transition-all"
              />
              <span className="text-xs text-[#5C585E]">cm</span>
            </div>
          </div>

          {/* Country & Currency */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-[#242326] uppercase tracking-wider mb-1.5">
                Country
              </label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F6F2EC]/60 border border-[#242326]/15 text-xs sm:text-sm text-[#242326] focus:outline-none focus:ring-2 focus:ring-[#9C6A61] focus:bg-white transition-all cursor-pointer"
              >
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#242326] uppercase tracking-wider mb-1.5">
                Preferred Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F6F2EC]/60 border border-[#242326]/15 text-xs sm:text-sm text-[#242326] focus:outline-none focus:ring-2 focus:ring-[#9C6A61] focus:bg-white transition-all cursor-pointer"
              >
                {CURRENCIES.map((cur) => (
                  <option key={cur} value={cur}>
                    {cur}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Controls */}
          <div className="pt-6 border-t border-[#242326]/8 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium text-[#5C585E] hover:text-[#242326] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onSkip}
                className="px-3.5 py-2 text-xs font-medium text-[#5C585E] hover:text-[#242326] transition-colors cursor-pointer"
              >
                Skip
              </button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Continue
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
