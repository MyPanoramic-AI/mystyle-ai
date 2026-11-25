/**
 * Share stylist outfits, look images, and shop listings with a friend.
 * Prefers the Web Share API (with image file when possible), then clipboard.
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
  | { ok: false; message: string };

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

async function imageFileForShare(imageUrl: string | null | undefined, filename: string): Promise<File | null> {
  const url = absoluteUrl(imageUrl);
  if (!url || url.startsWith('blob:') || url.startsWith('data:')) return null;
  try {
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) return null;
    const blob = await response.blob();
    if (!blob.type.startsWith('image/')) return null;
    const extension = blob.type.includes('png') ? 'png' : blob.type.includes('webp') ? 'webp' : 'jpg';
    return new File([blob], `${filename}.${extension}`, { type: blob.type || 'image/jpeg' });
  } catch {
    return null;
  }
}

export async function shareToFriend(payload: ShareToFriendPayload): Promise<ShareToFriendResult> {
  const link = absoluteUrl(payload.url) || appUrl();
  const title = payload.title.trim() || 'IStyleU pick';
  const body = [payload.text.trim(), `Shared from IStyleU · ${link}`].filter(Boolean).join('\n\n');
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  if (canShare) {
    const file = await imageFileForShare(payload.imageUrl, title.replace(/[^\w.-]+/g, '-').slice(0, 40) || 'istyleu');
    try {
      if (file && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title, text: body, url: link, files: [file] });
        return { ok: true, method: 'share' };
      }
      await navigator.share({ title, text: body, url: link });
      return { ok: true, method: 'share' };
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return { ok: false, message: 'Share cancelled.' };
      }
      // Fall through to clipboard.
    }
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(`${title}\n\n${body}`);
      return { ok: true, method: 'clipboard' };
    } catch {
      return { ok: false, message: 'Sharing is not available in this browser.' };
    }
  }

  return { ok: false, message: 'Sharing is not available in this browser.' };
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
