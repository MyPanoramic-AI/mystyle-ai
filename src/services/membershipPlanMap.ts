import type { SubscriptionPlanId } from '../types/membership';

/** Map browser catalogue tiers to server entitlement plan codes. */
export function cataloguePlanToServerCode(planId: SubscriptionPlanId): 'FREE' | 'PERSONAL' | 'FAMILY' {
  if (planId === 'signature') return 'PERSONAL';
  if (planId === 'atelier') return 'FAMILY';
  return 'FREE';
}

export function serverCodeToCataloguePlan(planCode: string | null | undefined): SubscriptionPlanId {
  const code = (planCode ?? 'FREE').toUpperCase();
  if (code === 'PERSONAL') return 'signature';
  if (code === 'FAMILY') return 'atelier';
  return 'free';
}

export function serverCodeDisplayName(planCode: string | null | undefined): string {
  const code = (planCode ?? 'FREE').toUpperCase();
  if (code === 'PERSONAL') return 'Personal';
  if (code === 'FAMILY') return 'Family';
  if (code === 'FREE') return 'Free';
  return planCode || 'Free';
}
