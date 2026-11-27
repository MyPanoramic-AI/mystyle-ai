/**
 * Guided “How to” tour destinations, spotlights, and practice actions.
 */

import type { NavigationTab } from '../types';
import type { MembershipSubpageTab } from '../types/membership';

export type HowToDestination =
  | { kind: 'tab'; tab: NavigationTab }
  | { kind: 'discover' }
  | { kind: 'family' }
  | { kind: 'beauty' }
  | { kind: 'membership'; tab?: MembershipSubpageTab };

export type HowToPracticeKind =
  | 'acknowledge'
  | 'scroll-home-occasions'
  | 'open-discover'
  | 'prompt-stylist'
  | 'shop-shoes'
  | 'shop-bags'
  | 'wardrobe-studio'
  | 'open-beauty-hair'
  | 'open-family-members'
  | 'open-membership-plans'
  | 'open-notifications'
  | 'focus-profile-photos';

export interface HowToTask {
  id: string;
  label: string;
  detail: string;
  practice: HowToPracticeKind;
}

export interface AppHowToStep {
  id: string;
  title: string;
  summary: string;
  /** Matches data-howto-target on nav / chrome. */
  spotlight?: string;
  tasks: HowToTask[];
  destination: HowToDestination;
}

export const APP_HOW_TO_STEPS: AppHowToStep[] = [
  {
    id: 'welcome',
    title: 'Welcome — try as you go',
    summary: 'Each stop opens a real screen. Tap a practice action to try it, then check it off and continue.',
    spotlight: 'home',
    tasks: [
      {
        id: 'welcome-try',
        label: 'Start on Home',
        detail: 'Opens Home so you can see the live feed behind this card.',
        practice: 'acknowledge',
      },
    ],
    destination: { kind: 'tab', tab: 'home' },
  },
  {
    id: 'home',
    title: 'Home',
    summary: 'Your daily brief. Practice scrolling occasions and opening Discover.',
    spotlight: 'home',
    tasks: [
      {
        id: 'home-scroll',
        label: 'Scroll to occasions',
        detail: 'Jumps the page to Style for the Occasion cards.',
        practice: 'scroll-home-occasions',
      },
      {
        id: 'home-discover',
        label: 'Open Discover looks',
        detail: 'Opens editorial inspiration collections from Home.',
        practice: 'open-discover',
      },
    ],
    destination: { kind: 'tab', tab: 'home' },
  },
  {
    id: 'stylist',
    title: 'My Stylist',
    summary: 'Chat or talk with your AI stylist. Practice seeding a real prompt.',
    spotlight: 'stylist',
    tasks: [
      {
        id: 'stylist-prompt',
        label: 'Try a stylist prompt',
        detail: 'Opens My Stylist with “Outfit ideas for a smart dinner this week”.',
        practice: 'prompt-stylist',
      },
    ],
    destination: { kind: 'tab', tab: 'stylist' },
  },
  {
    id: 'fitting-room',
    title: 'Fitting Room',
    summary: 'Preview looks on your photos. Photos make this stronger — jump to Profile photos next if needed.',
    spotlight: 'try-on',
    tasks: [
      {
        id: 'fit-photos',
        label: 'Check Profile photos',
        detail: 'Opens My Profile so you can confirm portrait and full-body shots.',
        practice: 'focus-profile-photos',
      },
    ],
    destination: { kind: 'tab', tab: 'try-on' },
  },
  {
    id: 'shop',
    title: 'Shop',
    summary: 'Filter SA catalogues and save products. Practice switching categories.',
    spotlight: 'shop',
    tasks: [
      {
        id: 'shop-shoes',
        label: 'Filter Shoes',
        detail: 'Applies the Shoes category on Shop.',
        practice: 'shop-shoes',
      },
      {
        id: 'shop-bags',
        label: 'Filter Bags',
        detail: 'Switches Shop to Bags so you see category chips in action.',
        practice: 'shop-bags',
      },
    ],
    destination: { kind: 'tab', tab: 'shop' },
  },
  {
    id: 'wardrobe',
    title: 'Wardrobe',
    summary: 'Digitise owned pieces and build outfits. Practice opening the studio.',
    spotlight: 'wardrobe',
    tasks: [
      {
        id: 'wardrobe-studio',
        label: 'Open outfit studio',
        detail: 'Switches Wardrobe to the studio tab for mix-and-match.',
        practice: 'wardrobe-studio',
      },
    ],
    destination: { kind: 'tab', tab: 'wardrobe' },
  },
  {
    id: 'capsule',
    title: 'Capsule',
    summary: 'A focused wardrobe checklist. Explore the capsule list on screen, then continue.',
    spotlight: 'capsule',
    tasks: [
      {
        id: 'capsule-look',
        label: 'I have opened Capsule',
        detail: 'Mark this when you have scanned the capsule pieces on screen.',
        practice: 'acknowledge',
      },
    ],
    destination: { kind: 'tab', tab: 'capsule' },
  },
  {
    id: 'discover',
    title: 'Discover looks',
    summary: 'Editorial inspiration you can save, try on, or send to your stylist.',
    spotlight: 'home',
    tasks: [
      {
        id: 'discover-open',
        label: 'Browse Discover',
        detail: 'Opens Discover collections so you can tap a look.',
        practice: 'open-discover',
      },
    ],
    destination: { kind: 'discover' },
  },
  {
    id: 'beauty',
    title: 'Beauty Studio',
    summary: 'Hair, makeup, and nails that match your outfits.',
    spotlight: 'profile',
    tasks: [
      {
        id: 'beauty-hair',
        label: 'Open Beauty → Hair',
        detail: 'Opens Beauty Studio on the hairstyles tab.',
        practice: 'open-beauty-hair',
      },
    ],
    destination: { kind: 'beauty' },
  },
  {
    id: 'family',
    title: 'Family styling',
    summary: 'Coordinate events and manage family profiles.',
    spotlight: 'profile',
    tasks: [
      {
        id: 'family-members',
        label: 'Open Family members',
        detail: 'Opens Family styling on the members tab.',
        practice: 'open-family-members',
      },
    ],
    destination: { kind: 'family' },
  },
  {
    id: 'profile',
    title: 'My Profile',
    summary: 'Aesthetic DNA, sizes, stylist persona, and photographs.',
    spotlight: 'profile',
    tasks: [
      {
        id: 'profile-photos',
        label: 'Review photo & silhouette area',
        detail: 'Scrolls Profile to photographs and silhouette controls.',
        practice: 'focus-profile-photos',
      },
    ],
    destination: { kind: 'tab', tab: 'profile' },
  },
  {
    id: 'membership',
    title: 'Membership & credits',
    summary: 'Plan entitlement and the test credit ledger.',
    spotlight: 'credits',
    tasks: [
      {
        id: 'membership-plans',
        label: 'Explore Plans',
        detail: 'Opens the provisional Personal / Family catalogue.',
        practice: 'open-membership-plans',
      },
    ],
    destination: { kind: 'membership', tab: 'membership' },
  },
  {
    id: 'notifications',
    title: 'Notifications',
    summary: 'Push alerts and styling nudges. Practice opening the preferences screen.',
    spotlight: 'credits',
    tasks: [
      {
        id: 'notif-open',
        label: 'Open notification preferences',
        detail: 'Opens Membership → Notifications so you can toggle Push Alerts.',
        practice: 'open-notifications',
      },
    ],
    destination: { kind: 'membership', tab: 'notifications' },
  },
  {
    id: 'done',
    title: 'You are ready',
    summary: 'You have walked the main workspaces. Replay anytime from My Profile → How to use IStyleU.',
    spotlight: 'home',
    tasks: [
      {
        id: 'done-home',
        label: 'Return to Home',
        detail: 'Finishes on Home so you can start styling.',
        practice: 'acknowledge',
      },
    ],
    destination: { kind: 'tab', tab: 'home' },
  },
];

export function howToStorageKey(email: string): string {
  return `istyleu_howto_tour_v1_${email.trim().toLowerCase()}`;
}
