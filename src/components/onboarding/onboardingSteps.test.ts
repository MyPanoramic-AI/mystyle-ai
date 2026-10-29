import assert from 'node:assert/strict';
import test from 'node:test';
import { ONBOARDING_STEP_COUNT, ONBOARDING_STEPS, onboardingStepLabel } from './onboardingSteps.ts';

test('onboarding progress uses one nine-step sequence including stylist persona', () => {
  assert.equal(ONBOARDING_STEP_COUNT, 9);
  assert.equal(ONBOARDING_STEPS.length, 9);
  assert.equal(onboardingStepLabel(2), 'Step 2 of 9 · Personal Details');
  assert.equal(onboardingStepLabel(3), 'Step 3 of 9 · Sizes & Fit');
  assert.equal(onboardingStepLabel(7), 'Step 7 of 9 · Your Stylist');
  assert.equal(onboardingStepLabel(8), 'Step 8 of 9 · Styling Photographs');
  assert.equal(onboardingStepLabel(2).includes('of 8'), false);
});
