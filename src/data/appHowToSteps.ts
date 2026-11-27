/**
 * Guided “How to” tour destinations and copy for signed-in users.
 */

import type { NavigationTab } from '../types';
import type { MembershipSubpageTab } from '../types/membership';

export type HowToDestination =
  | { kind: 'tab'; tab: NavigationTab }
  | { kind: 'discover' }
  | { kind: 'family' }
  | { kind: 'beauty' }
  | { kind: 'membership'; tab?: MembershipSubpageTab };

export interface AppHowToStep {
  id: string;
  title: string;
  summary: string;
  howTo: string[];
  destination: HowToDestination;
}

export const APP_HOW_TO_STEPS: AppHowToStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to your How to tour',
    summary: 'This walkthrough opens each part of IStyleU and explains how to use it. Follow the steps, or skip anytime.',
    howTo: [
      'Use Next to move through each workspace.',
      'Use Back if you want to revisit a section.',
      'Tap Skip in the top-right corner to exit and explore on your own.',
      'You can restart this tour later from My Profile.',
    ],
    destination: { kind: 'tab', tab: 'home' },
  },
  {
    id: 'home',
    title: 'Home',
    summary: 'Home is your daily styling brief — occasions, look ideas, and shortcuts into the rest of the app.',
    howTo: [
      'Scroll the home feed for occasion cards (Date Night, Work & Office, and more).',
      'Tap an occasion to open My Stylist with a ready-made prompt.',
      'Use Style My Look / Discover shortcuts to open inspiration collections.',
      'Open Family, Wardrobe, Beauty, or Membership cards when you need those workspaces.',
    ],
    destination: { kind: 'tab', tab: 'home' },
  },
  {
    id: 'stylist',
    title: 'My Stylist',
    summary: 'Your AI stylist chats (and can talk) about outfits based on your saved profile, sizes, and colours.',
    howTo: [
      'Type an occasion or question in the message box, then send.',
      'Use Talk / voice controls when live voice is available for a spoken session.',
      'Start New Chat when you want a clean conversation without earlier context.',
      'Ask for a full look, then use Fitting Room or Shop the Look from the stylist’s outfit card.',
      'Change your stylist’s name, tone, and spoken voice later under My Profile.',
    ],
    destination: { kind: 'tab', tab: 'stylist' },
  },
  {
    id: 'fitting-room',
    title: 'Fitting Room',
    summary: 'Preview garments or full looks against your private photographs before you buy or wear them.',
    howTo: [
      'Add or confirm your portrait and full-body photos under My Profile first for best results.',
      'Send a look here from Discover, Shop, Wardrobe, or the stylist outfit card.',
      'Choose the garment or look to preview, then run the try-on when generation is allowed on your account.',
      'If live AI try-on is off, you still see the Fitting Room workflow and any demonstration preview state.',
    ],
    destination: { kind: 'tab', tab: 'try-on' },
  },
  {
    id: 'shop',
    title: 'Shop',
    summary: 'Browse South African retailer catalogues, filter categories, compare rand prices, and save products.',
    howTo: [
      'Use category chips (Shoes, Bags, Jewellery, and more) to narrow results.',
      'Open a product for details, then Buy to open the retailer listing when available.',
      'Tap Try on to send an accessory or piece into the Fitting Room.',
      'When you arrive from a stylist look, Shop the Look keeps that outfit’s pieces attached.',
      'Save products you like so they stay on your account for later.',
    ],
    destination: { kind: 'tab', tab: 'shop' },
  },
  {
    id: 'wardrobe',
    title: 'Wardrobe',
    summary: 'Digitise clothes you own and build outfits from your real closet.',
    howTo: [
      'Open Wardrobe from the top or bottom navigation.',
      'Add pieces with photos, colour, category, and season tags.',
      'Use the studio / outfits tabs to mix pieces into looks.',
      'Send an assembled outfit to the Fitting Room or ask the stylist to restyle it.',
      'Check gaps and planner views when you want to see what is missing for an occasion.',
    ],
    destination: { kind: 'tab', tab: 'wardrobe' },
  },
  {
    id: 'capsule',
    title: 'Capsule',
    summary: 'Build a focused capsule wardrobe that covers seasons and occasions without endless buying.',
    howTo: [
      'Open Capsule from the navigation bar.',
      'Review suggested foundation pieces for your style profile.',
      'Mark pieces you already own so the capsule stays honest to your closet.',
      'Use the capsule as a shopping checklist for only the gaps that matter.',
    ],
    destination: { kind: 'tab', tab: 'capsule' },
  },
  {
    id: 'discover',
    title: 'Discover looks',
    summary: 'Editorial outfit inspiration you can save, try on, or take to your stylist.',
    howTo: [
      'Browse collections and open a look for the full garment breakdown.',
      'Save looks you love so they appear under your profile’s saved inspirations.',
      'Use Try this look to send it to the Fitting Room.',
      'Use Ask my stylist to continue the conversation around that outfit.',
    ],
    destination: { kind: 'discover' },
  },
  {
    id: 'beauty',
    title: 'Beauty Studio',
    summary: 'Pair hairstyles, makeup, and nails with the outfits you are planning.',
    howTo: [
      'Open Beauty Studio from Home or My Profile.',
      'Browse complete looks, hair, makeup, or nails tabs.',
      'Save beauty looks or add products to a beauty bag.',
      'Send beauty products to Shop when you want to find similar items.',
      'Ask the stylist to match beauty finishes to a specific outfit.',
    ],
    destination: { kind: 'beauty' },
  },
  {
    id: 'family',
    title: 'Family styling',
    summary: 'Coordinate outfits for shared events and manage family member profiles.',
    howTo: [
      'Open Family styling from Home or My Profile.',
      'Add member profiles with sizes and comfort notes.',
      'Use the planner for weddings, holidays, and family photos.',
      'Invite another adult by email — they accept or decline when signed in.',
      'Send family concepts to the Fitting Room when you want a visual check.',
    ],
    destination: { kind: 'family' },
  },
  {
    id: 'profile',
    title: 'My Profile',
    summary: 'Your Aesthetic DNA, sizes, colours, stylist persona, photographs, and silhouette live here.',
    howTo: [
      'Edit personal details, sizes, style preferences, and shopping priorities.',
      'Set your stylist’s name, tone, answer length, and spoken voice.',
      'Upload portrait and full-body photos for Fitting Room and silhouette scans.',
      'Run a silhouette estimate from a full-body front photo when ready.',
      'Retake the Style Quiz anytime if your taste changes.',
    ],
    destination: { kind: 'tab', tab: 'profile' },
  },
  {
    id: 'membership',
    title: 'Membership & credits',
    summary: 'See your plan entitlement, test credit balance, history, and provisional plan catalogue.',
    howTo: [
      'Open Membership from the credits pill in the header or from My Profile.',
      'Check Account plan, entitlement status, and credit balance on the hub card.',
      'Explore Plans to preview Personal or Family (billing is not live yet).',
      'Use AI Credits and Credit History to understand the server ledger.',
      'Credits are operator-managed test credits — they are not a paid balance.',
    ],
    destination: { kind: 'membership', tab: 'membership' },
  },
  {
    id: 'notifications',
    title: 'Notifications',
    summary: 'Control push alerts, email digests, and which styling nudges you want.',
    howTo: [
      'Open Notifications inside the Membership hub.',
      'Turn on Push Alerts and Allow when the browser asks for permission.',
      'Use Send test push notification to confirm delivery on this device.',
      'Toggle weather, wardrobe, family, and credit reminder categories as you prefer.',
      '“Hear more from me” increases how often tip-style alerts can arrive.',
    ],
    destination: { kind: 'membership', tab: 'notifications' },
  },
  {
    id: 'done',
    title: 'You are ready',
    summary: 'That is the full IStyleU workspace. Explore freely — every section stays on your signed-in account.',
    howTo: [
      'Start on Home or jump straight to My Stylist for today’s outfit.',
      'Keep photographs and sizes updated so Fitting Room and shopping stay accurate.',
      'Replay this How to tour anytime from My Profile → How to use IStyleU.',
    ],
    destination: { kind: 'tab', tab: 'home' },
  },
];

export function howToStorageKey(email: string): string {
  return `istyleu_howto_tour_v1_${email.trim().toLowerCase()}`;
}
