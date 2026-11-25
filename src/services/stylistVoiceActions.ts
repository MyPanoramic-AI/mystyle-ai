/**
 * Typed application actions the live stylist may request.
 * Only actions backed by real MyStyle services should ever succeed.
 * Shopping / try-on UI actions remain not_connected until wired.
 * Wardrobe piece lists are already passed to the stylist via preference context.
 */

export type StylistVoiceActionType =
  | 'display_products'
  | 'open_product'
  | 'highlight_garment'
  | 'show_wardrobe_items'
  | 'start_try_on';

export interface StylistVoiceAction {
  type: StylistVoiceActionType;
  payload?: Record<string, unknown>;
}

export type StylistVoiceActionResult =
  | { ok: true; message: string }
  | { ok: false; availability: 'not_connected'; message: string };

const NOT_CONNECTED: Record<StylistVoiceActionType, string> = {
  display_products: 'Verified product retrieval is not connected for voice yet.',
  open_product: 'Opening product pages from voice is not connected yet.',
  highlight_garment: 'Garment highlighting from voice is not connected yet.',
  show_wardrobe_items: 'Wardrobe lookup over voice is not connected yet.',
  start_try_on: 'The Fitting Room over voice is not connected yet. Use the Fitting Room tab.',
};

/** Validate and run a voice app action. Currently all return not_connected. */
export function executeStylistVoiceAction(action: StylistVoiceAction): StylistVoiceActionResult {
  if (!action || typeof action.type !== 'string' || !(action.type in NOT_CONNECTED)) {
    return { ok: false, availability: 'not_connected', message: 'That voice action is not supported.' };
  }
  return {
    ok: false,
    availability: 'not_connected',
    message: NOT_CONNECTED[action.type],
  };
}
