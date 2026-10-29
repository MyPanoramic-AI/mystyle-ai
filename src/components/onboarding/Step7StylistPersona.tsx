/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import type { StylistPersona } from '../../types';
import { onboardingStepLabel } from './onboardingSteps';
import { Button } from '../common/Button';
import { StylistPersonaFields } from '../common/StylistPersonaFields';
import { DEFAULT_STYLIST_PERSONA } from '../../data/stylistPersona';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface Step7StylistPersonaProps {
  initialPersona?: StylistPersona;
  onContinue: (persona: StylistPersona) => void;
  onBack: () => void;
  onSkip: () => void;
}

export const Step7StylistPersona: React.FC<Step7StylistPersonaProps> = ({
  initialPersona,
  onContinue,
  onBack,
  onSkip,
}) => {
  const [persona, setPersona] = useState<StylistPersona>(
    initialPersona ?? { ...DEFAULT_STYLIST_PERSONA },
  );

  const handleNext = () => {
    const name = persona.name.trim() || DEFAULT_STYLIST_PERSONA.name;
    onContinue({ ...persona, name });
  };

  return (
    <div className="max-w-2xl mx-auto py-2 sm:py-6 animate-fadeIn">
      <div className="rounded-3xl bg-white border border-[#242326]/10 shadow-sm p-6 sm:p-10">
        <div className="mb-6">
          <span className="text-xs font-semibold tracking-wider uppercase text-[#B49361] block mb-1">
            {onboardingStepLabel(7)}
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#242326]">
            Meet your personal stylist
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-[#5C585E]">
            Choose their name, how they present, their age vibe, and the way they talk with you.
            You can change this later in your profile.
          </p>
        </div>

        <StylistPersonaFields value={persona} onChange={setPersona} />

        <div className="mt-8 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5C585E] hover:text-[#242326] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onSkip}
              className="text-xs font-medium text-[#5C585E] hover:text-[#242326] px-3 py-2 cursor-pointer"
            >
              Skip
            </button>
            <Button variant="primary" size="md" onClick={handleNext} icon={<ArrowRight className="w-4 h-4" />}>
              Continue
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
