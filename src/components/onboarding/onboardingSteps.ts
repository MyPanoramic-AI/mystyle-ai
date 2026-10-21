/**
 * The only onboarding sequence. Header progress and section labels both read this list.
 */
export const ONBOARDING_STEPS = [
  { number: 1, title: 'Welcome' },
  { number: 2, title: 'Personal Details' },
  { number: 3, title: 'Sizes & Fit' },
  { number: 4, title: 'Personal Style' },
  { number: 5, title: 'Palette & Fit' },
  { number: 6, title: 'Smart Shopping' },
  { number: 7, title: 'Styling Photographs' },
  { number: 8, title: 'Completion' },
] as const;

export const ONBOARDING_STEP_COUNT = ONBOARDING_STEPS.length;

export function onboardingStepLabel(step: number): string {
  const found = ONBOARDING_STEPS.find((item) => item.number === step);
  if (!found) throw new Error(`Onboarding step ${step} is not in the sequence.`);
  return `Step ${found.number} of ${ONBOARDING_STEP_COUNT} · ${found.title}`;
}
