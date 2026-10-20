import type { Sql } from '../db.js';
import { listWardrobe } from './collections.js';

export interface AuthorisedWardrobeItem {
  id: string;
  name: string;
  category: string;
  colour: string | null;
  seasons: string[];
  occasions: string[];
}

export function authorisedWardrobe(db: Sql, userId: string): AuthorisedWardrobeItem[] {
  return listWardrobe(db, userId).map((item) => ({
    id: String(item.id),
    name: String(item.name),
    category: String(item.category),
    colour: typeof item.colour === 'string' ? item.colour : null,
    seasons: Array.isArray(item.seasons) ? item.seasons.filter((value): value is string => typeof value === 'string') : [],
    occasions: Array.isArray(item.occasions) ? item.occasions.filter((value): value is string => typeof value === 'string') : [],
  }));
}
