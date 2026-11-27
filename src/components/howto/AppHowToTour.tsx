/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import { Button } from '../common/Button';
import type { AppHowToStep } from '../../data/appHowToSteps';

interface AppHowToTourProps {
  steps: AppHowToStep[];
  stepIndex: number;
  onStepIndexChange: (index: number) => void;
  onSkip: () => void;
  onComplete: () => void;
  onGoToStep: (step: AppHowToStep) => void;
}

export const AppHowToTour: React.FC<AppHowToTourProps> = ({
  steps,
  stepIndex,
  onStepIndexChange,
  onSkip,
  onComplete,
  onGoToStep,
}) => {
  const step = steps[stepIndex];
  const total = steps.length;
  const isFirst = stepIndex <= 0;
  const isLast = stepIndex >= total - 1;

  useEffect(() => {
    if (!step) return;
    onGoToStep(step);
    // Only re-run when the step changes — parent supplies a stable navigate helper.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex, step?.id]);

  if (!step) return null;

  const goNext = () => {
    if (isLast) {
      onComplete();
      return;
    }
    onStepIndexChange(stepIndex + 1);
  };

  const goBack = () => {
    if (isFirst) return;
    onStepIndexChange(stepIndex - 1);
  };

  return (
    <div className="fixed inset-0 z-[80] pointer-events-none" aria-live="polite">
      <div className="absolute inset-0 bg-[#242326]/35 pointer-events-none" aria-hidden />

      <button
        type="button"
        onClick={onSkip}
        className="pointer-events-auto absolute top-3 right-3 sm:top-4 sm:right-4 z-[90] inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-xl bg-white/95 border border-[#242326]/12 text-xs font-semibold text-[#242326] shadow-md hover:bg-white cursor-pointer"
        aria-label="Skip how to tour"
      >
        <X className="w-3.5 h-3.5" />
        Skip
      </button>

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="howto-tour-title"
        className="pointer-events-auto absolute inset-x-0 bottom-0 sm:inset-x-auto sm:left-1/2 sm:bottom-8 sm:-translate-x-1/2 sm:w-full sm:max-w-lg mx-auto"
      >
        <div className="m-3 sm:m-0 rounded-3xl bg-[#F6F2EC] border border-[#242326]/10 shadow-2xl overflow-hidden">
          <div className="px-5 pt-4 pb-2 flex items-center justify-between gap-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#866a40]">
              How to · {stepIndex + 1} of {total}
            </span>
            <div className="flex-1 max-w-[9rem] h-1.5 rounded-full bg-[#242326]/10 overflow-hidden" aria-hidden>
              <div
                className="h-full rounded-full bg-[#9C6A61] transition-all duration-300"
                style={{ width: `${((stepIndex + 1) / total) * 100}%` }}
              />
            </div>
          </div>

          <div className="px-5 pb-5 space-y-3">
            <h2 id="howto-tour-title" className="font-serif text-2xl tracking-tight text-[#242326]">
              {step.title}
            </h2>
            <p className="text-sm text-[#5C585E] leading-relaxed">{step.summary}</p>
            <ol className="space-y-2">
              {step.howTo.map((line) => (
                <li key={line} className="flex gap-2.5 text-sm text-[#242326] leading-relaxed">
                  <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[#B49361] shrink-0" aria-hidden />
                  <span>{line}</span>
                </li>
              ))}
            </ol>

            <div className="pt-2 flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={goBack}
                disabled={isFirst}
                icon={<ArrowLeft className="w-3.5 h-3.5" />}
              >
                Back
              </Button>
              <Button
                type="button"
                variant="charcoal"
                size="sm"
                onClick={goNext}
                icon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                {isLast ? 'Finish' : 'Next'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
