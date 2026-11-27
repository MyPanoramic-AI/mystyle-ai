/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, MousePointerClick, X } from 'lucide-react';
import { Button } from '../common/Button';
import type { AppHowToStep, HowToPracticeKind } from '../../data/appHowToSteps';

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface AppHowToTourProps {
  steps: AppHowToStep[];
  stepIndex: number;
  onStepIndexChange: (index: number) => void;
  onSkip: () => void;
  onComplete: () => void;
  onGoToStep: (step: AppHowToStep) => void;
  onPractice: (practice: HowToPracticeKind) => void;
}

function readSpotlight(target?: string): SpotlightRect | null {
  if (!target || typeof document === 'undefined') return null;
  const nodes = Array.from(document.querySelectorAll<HTMLElement>(`[data-howto-target="${target}"]`));
  const visible = nodes.find((node) => {
    const rect = node.getBoundingClientRect();
    return rect.width > 8 && rect.height > 8;
  });
  if (!visible) return null;
  const rect = visible.getBoundingClientRect();
  const pad = 8;
  return {
    top: Math.max(0, rect.top - pad),
    left: Math.max(0, rect.left - pad),
    width: rect.width + pad * 2,
    height: rect.height + pad * 2,
  };
}

export const AppHowToTour: React.FC<AppHowToTourProps> = ({
  steps,
  stepIndex,
  onStepIndexChange,
  onSkip,
  onComplete,
  onGoToStep,
  onPractice,
}) => {
  const step = steps[stepIndex];
  const total = steps.length;
  const isFirst = stepIndex <= 0;
  const isLast = stepIndex >= total - 1;
  const [doneTaskIds, setDoneTaskIds] = useState<string[]>([]);
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null);
  const [pulseTaskId, setPulseTaskId] = useState<string | null>(null);

  useEffect(() => {
    if (!step) return;
    setDoneTaskIds([]);
    setPulseTaskId(null);
    onGoToStep(step);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex, step?.id]);

  useEffect(() => {
    if (!step) return;
    const update = () => setSpotlight(readSpotlight(step.spotlight));
    const timer = window.setTimeout(update, 180);
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [step, stepIndex]);

  if (!step) return null;

  const completedCount = step.tasks.filter((task) => doneTaskIds.includes(task.id)).length;
  const allTasksDone = step.tasks.length === 0 || completedCount >= step.tasks.length;

  const runTask = (taskId: string, practice: HowToPracticeKind) => {
    onPractice(practice);
    setDoneTaskIds((prev) => (prev.includes(taskId) ? prev : [...prev, taskId]));
    setPulseTaskId(taskId);
    window.setTimeout(() => setPulseTaskId((current) => (current === taskId ? null : current)), 700);
    window.setTimeout(() => setSpotlight(readSpotlight(step.spotlight)), 220);
  };

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
    <div className="fixed inset-0 z-[80]" aria-live="polite">
      {/* Soft veil — page stays clickable so people can explore while touring */}
      <div className="absolute inset-0 bg-[#242326]/25 pointer-events-none" aria-hidden />

      {spotlight ? (
        <div
          className="pointer-events-none absolute z-[85] rounded-2xl border-2 border-[#B49361] shadow-[0_0_0_9999px_rgba(36,35,38,0.28)] motion-safe:animate-pulse"
          style={{
            top: spotlight.top,
            left: spotlight.left,
            width: spotlight.width,
            height: spotlight.height,
          }}
          aria-hidden
        />
      ) : null}

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
        aria-modal="false"
        aria-labelledby="howto-tour-title"
        className="pointer-events-auto absolute inset-x-0 bottom-0 sm:inset-x-auto sm:left-1/2 sm:bottom-6 sm:-translate-x-1/2 sm:w-full sm:max-w-lg mx-auto z-[90]"
      >
        <div className="m-3 sm:m-0 rounded-3xl bg-[#F6F2EC] border border-[#242326]/10 shadow-2xl overflow-hidden">
          <div className="px-5 pt-4 pb-2 flex items-center justify-between gap-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#866a40]">
              How to · {stepIndex + 1} of {total}
            </span>
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[10px] text-[#5C585E] whitespace-nowrap">
                {completedCount}/{step.tasks.length} tried
              </span>
              <div className="w-20 h-1.5 rounded-full bg-[#242326]/10 overflow-hidden" aria-hidden>
                <div
                  className="h-full rounded-full bg-[#9C6A61] transition-all duration-300"
                  style={{ width: `${((stepIndex + 1) / total) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="px-5 pb-5 space-y-3">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#E5CDBE]/45 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#866a40]">
              <MousePointerClick className="w-3 h-3" />
              Try it on the live screen
            </div>
            <h2 id="howto-tour-title" className="font-serif text-2xl tracking-tight text-[#242326]">
              {step.title}
            </h2>
            <p className="text-sm text-[#5C585E] leading-relaxed">{step.summary}</p>

            <ul className="space-y-2">
              {step.tasks.map((task) => {
                const done = doneTaskIds.includes(task.id);
                const pulsing = pulseTaskId === task.id;
                return (
                  <li key={task.id}>
                    <button
                      type="button"
                      onClick={() => runTask(task.id, task.practice)}
                      className={`w-full text-left rounded-2xl border px-3.5 py-3 transition-all cursor-pointer ${
                        done
                          ? 'border-emerald-400/50 bg-emerald-50/80'
                          : pulsing
                            ? 'border-[#B49361] bg-[#E5CDBE]/35 scale-[1.01]'
                            : 'border-[#242326]/10 bg-white hover:border-[#9C6A61]/40 hover:bg-[#FAF7F2]'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                            done ? 'bg-emerald-500 text-white' : 'bg-[#242326] text-white'
                          }`}
                          aria-hidden
                        >
                          {done ? <Check className="w-3.5 h-3.5" /> : <MousePointerClick className="w-3.5 h-3.5" />}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-[#242326]">{task.label}</span>
                          <span className="block mt-0.5 text-xs text-[#5C585E] leading-relaxed">{task.detail}</span>
                          <span className="mt-1.5 inline-block text-[10px] font-semibold uppercase tracking-wider text-[#9C6A61]">
                            {done ? 'Done — tap again to retry' : 'Tap to try'}
                          </span>
                        </span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="pt-1 flex items-center justify-between gap-3">
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
                {isLast ? 'Finish' : allTasksDone ? 'Next' : 'Next anyway'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
