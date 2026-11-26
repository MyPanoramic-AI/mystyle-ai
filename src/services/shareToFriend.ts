/**
 * Share stylist outfits, look images, and shop listings with a friend.
 * Prefers the Web Share API, then clipboard, then a manual-copy fallback.
 *
 * Important: do not await network work before navigator.share / clipboard.writeText —
 * that burns the user-gesture token and makes both APIs fail on desktop browsers.
 */

export type ShareToFriendKind = 'outfit' | 'image' | 'listing';

export interface ShareToFriendPayload {
  kind: ShareToFriendKind;
  title: string;
  text: string;
  url?: string | null;
  imageUrl?: string | null;
}

export type ShareToFriendResult =
  | { ok: true; method: 'share' | 'clipboard' }
  | { ok: false; message: string; copyText?: string };

function appUrl(): string {
  try {
    return window.location.origin || 'https://mystyle-ai.onrender.com';
  } catch {
    return 'https://mystyle-ai.onrender.com';
  }
}

function absoluteUrl(value: string | null | undefined): string | null {
  if (!value || !value.trim()) return null;
  const raw = value.trim();
  if (raw.startsWith('blob:') || raw.startsWith('data:')) return raw;
  try {
    return new URL(raw, window.location.origin).toString();
  } catch {
    return raw;
  }
}

function buildShareBody(payload: ShareToFriendPayload): { title: string; body: string; link: string; copyText: string } {
  const link = absoluteUrl(payload.url) || appUrl();
  const title = payload.title.trim() || 'IStyleU pick';
  const body = [payload.text.trim(), `Shared from IStyleU · ${link}`].filter(Boolean).join('\n\n');
  return { title, body, link, copyText: `${title}\n\n${body}` };
}

async function copyTextFallback(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to execCommand.
    }
  }

  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.left = '-9999px';
    area.style.top = '0';
    document.body.appendChild(area);
    area.focus();
    area.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}

export async function shareToFriend(payload: ShareToFriendPayload): Promise<ShareToFriendResult> {
  const { title, body, link, copyText } = buildShareBody(payload);
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  // Share text/url immediately — never await image fetch first (kills user activation).
  if (canShare) {
    const shareData: ShareData = { title, text: body, url: link };
    try {
      if (!navigator.canShare || navigator.canShare(shareData)) {
        await navigator.share(shareData);
        return { ok: true, method: 'share' };
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return { ok: false, message: 'Share cancelled.' };
      }
      // Fall through to clipboard.
    }
  }

  if (await copyTextFallback(copyText)) {
    return { ok: true, method: 'clipboard' };
  }

  return {
    ok: false,
    message: 'Could not open share or copy automatically. Copy the text below and send it to a friend.',
    copyText,
  };
}

export function outfitSharePayload(outfit: {
  title: string;
  occasion?: string;
  aesthetic?: string;
  stylistRationale?: string;
  imageUrl?: string;
  pieces?: Array<{ name: string; retailer?: string }>;
}): ShareToFriendPayload {
  const pieces = (outfit.pieces ?? [])
    .slice(0, 6)
    .map((piece) => (piece.retailer ? `• ${piece.name} (${piece.retailer})` : `• ${piece.name}`))
    .join('\n');
  const lines = [
    `Outfit idea: ${outfit.title}`,
    outfit.occasion ? `Occasion: ${outfit.occasion}` : '',
    outfit.aesthetic ? `Look: ${outfit.aesthetic}` : '',
    outfit.stylistRationale ? outfit.stylistRationale : '',
    pieces ? `Pieces:\n${pieces}` : '',
  ].filter(Boolean);
  return {
    kind: 'outfit',
    title: `${outfit.title} · IStyleU`,
    text: lines.join('\n'),
    imageUrl: outfit.imageUrl ?? null,
    url: appUrl(),
  };
}

export function listingSharePayload(piece: {
  name: string;
  retailer?: string;
  priceZar?: number;
  category?: string;
  imageUrl?: string | null;
  productId?: string;
}): ShareToFriendPayload {
  const bits = [
    `Listing: ${piece.name}`,
    piece.retailer ? `Shop: ${piece.retailer}` : '',
    piece.category ? `Category: ${piece.category}` : '',
    typeof piece.priceZar === 'number' && piece.priceZar > 0
      ? `Demo estimate: R${piece.priceZar.toLocaleString()}`
      : '',
  ].filter(Boolean);
  return {
    kind: 'listing',
    title: `${piece.name} · IStyleU`,
    text: bits.join('\n'),
    imageUrl: piece.imageUrl ?? null,
    url: appUrl(),
  };
}

export function imageSharePayload(opts: {
  title?: string;
  caption?: string;
  imageUrl: string;
}): ShareToFriendPayload {
  return {
    kind: 'image',
    title: `${opts.title?.trim() || 'Look from IStyleU'} · IStyleU`,
    text: opts.caption?.trim() || 'A look from my IStyleU stylist.',
    imageUrl: opts.imageUrl,
    url: appUrl(),
  };
}
