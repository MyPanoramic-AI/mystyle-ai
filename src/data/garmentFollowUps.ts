/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * After a garment photo reply, offer the same four completion paths for everyone.
 */

import type { StylistQuickAction } from '../types';
import type { ProductCategory } from '../types/shop';

export type GarmentFollowUpId = 'shoes' | 'hair-makeup' | 'accessories' | 'bag';

export interface GarmentFollowUpDefinition {
  id: GarmentFollowUpId;
  label: string;
  /** Stylist chat prompt when the action stays in conversation. */
  prompt: string;
  /** Shop browse target when the action opens catalogue search. */
  shop?: {
    category: ProductCategory | 'All';
    search: string;
    title: string;
  };
  /** Open Beauty Studio instead of Shop. */
  openBeauty?: boolean;
}

export const GARMENT_FOLLOW_UPS: GarmentFollowUpDefinition[] = [
  {
    id: 'shoes',
    label: 'Shoes',
    prompt: 'Suggest shoes that complete this garment perfectly, and why they work with the colour and silhouette.',
    shop: {
      category: 'Shoes',
      search: 'shoes to wear with this look',
      title: 'Shoes for your garment',
    },
  },
  {
    id: 'hair-makeup',
    label: 'Hair & makeup',
    prompt: 'Suggest hair and makeup that flatter this garment — keep the finish wearable for South Africa.',
    openBeauty: true,
  },
  {
    id: 'accessories',
    label: 'Accessories',
    prompt: 'Suggest jewellery and small accessories that finish this garment without competing with it.',
    shop: {
      category: 'Jewellery & Accessories',
      search: 'accessories jewellery for this look',
      title: 'Accessories for your garment',
    },
  },
  {
    id: 'bag',
    label: 'Bag',
    prompt: 'Suggest a bag that balances this garment — size, structure, and colour.',
    shop: {
      category: 'Bags',
      search: 'handbag clutch for this look',
      title: 'Bags for your garment',
    },
  },
];

export function garmentFollowUpActions(messageId: string): StylistQuickAction[] {
  return GARMENT_FOLLOW_UPS.map((item) => ({
    id: `${messageId}-${item.id}`,
    label: item.label,
    prompt: item.prompt,
    variant: 'secondary',
    followUpId: item.id,
  }));
}

export function inferGarmentLabel(name?: string | null): string {
  const raw = (name || '').trim();
  if (!raw) return 'your garment';
  const lower = raw.toLowerCase();
  if (lower.includes('dress')) return 'your dress';
  if (lower.includes('shirt') || lower.includes('blouse') || lower.includes('top')) return 'your top';
  if (lower.includes('pant') || lower.includes('trouser') || lower.includes('jean')) return 'your trousers';
  if (lower.includes('skirt')) return 'your skirt';
  if (lower.includes('jacket') || lower.includes('blazer') || lower.includes('coat')) return 'your jacket';
  return 'your garment';
}

export function shopSearchForFollowUp(followUpId: GarmentFollowUpId, garmentLabel: string): string {
  switch (followUpId) {
    case 'shoes':
      return `shoes for ${garmentLabel}`;
    case 'accessories':
      return `jewellery accessories for ${garmentLabel}`;
    case 'bag':
      return `bag for ${garmentLabel}`;
    default:
      return garmentLabel;
  }
}
