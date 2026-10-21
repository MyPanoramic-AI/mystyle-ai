import assert from 'node:assert/strict';
import test from 'node:test';
import { ONBOARDING_STEP_COUNT, ONBOARDING_STEPS, onboardingStepLabel } from './onboardingSteps.ts';

test('onboarding progress uses one eight-step sequence', () => {
  assert.equal(ONBOARDING_STEP_COUNT, 8);
  assert.equal(ONBOARDING_STEPS.length, 8);
  assert.equal(onboardingStepLabel(2), 'Step 2 of 8 · Personal Details');
  assert.equal(onboardingStepLabel(3), 'Step 3 of 8 · Sizes & Fit');
  assert.equal(onboardingStepLabel(7), 'Step 7 of 8 · Styling Photographs');
  assert.equal(onboardingStepLabel(2).includes('of 6'), false);
});
