/**
 * Wardrobe = clothes the customer already owns / bought.
 * Capsule = the basics checklist they are supposed to build toward (not automatic ownership).
 */

import type { Sql } from '../db.js';
import { listWardrobe } from '../domain/collections.js';
import { everydayCapsule } from '../domain/wardrobeBasics.js';
import { getProfile } from '../domain/profiles.js';

function pieceLabel(item: {
  name?: unknown;
  colour?: unknown;
  category?: unknown;
}): string | null {
  const name = typeof item.name === 'string' ? item.name.trim() : '';
  if (!name) return null;
  const colour = typeof item.colour === 'string' ? item.colour.trim() : '';
  const category = typeof item.category === 'string' ? item.category.trim() : '';
  return [colour, name, category ? `(${category})` : '']
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function wardrobeLabelsFor(db: Sql, userId: string): {
  wardrobePieces: string[];
  capsulePieces: string[];
} {
  try {
    const items = listWardrobe(db, userId);
    const wardrobePieces: string[] = [];
    const ownedNames = new Set<string>();

    for (const item of items) {
      const name = typeof item.name === 'string' ? item.name.trim() : '';
      if (name) ownedNames.add(name);
      const label = pieceLabel(item);
      if (!label) continue;
      // Capsule-flagged rows are starter/checklist basics — not "already bought" wardrobe.
      if (item.isCapsule === true) continue;
      wardrobePieces.push(label);
    }

    let sizes: { tops?: string | null; bottoms?: string | null; dress?: string | null; shoe?: string | null } = {};
    try {
      const profile = getProfile(db, userId) as { sizes?: Record<string, unknown> };
      const raw = profile.sizes && typeof profile.sizes === 'object' ? profile.sizes : {};
      sizes = {
        tops: typeof raw.tops === 'string' ? raw.tops : null,
        bottoms: typeof raw.bottoms === 'string' ? raw.bottoms : null,
        dress: typeof raw.dress === 'string' ? raw.dress : null,
        shoe: typeof raw.shoe === 'string' ? raw.shoe : null,
      };
    } catch {
      sizes = {};
    }

    const capsulePieces = everydayCapsule(sizes).slice(0, 12).map((piece) => {
      const base = [piece.colour, piece.name, piece.category ? `(${piece.category})` : '']
        .filter(Boolean)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      const owned = ownedNames.has(piece.name);
      return owned ? `${base} — already in wardrobe` : `${base} — capsule basic to get`;
    });

    return {
      wardrobePieces: wardrobePieces.slice(0, 16),
      capsulePieces,
    };
  } catch {
    return { wardrobePieces: [], capsulePieces: [] };
  }
}
