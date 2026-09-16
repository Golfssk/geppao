import type { Listing } from '@/types/listing';

export type RankingContext = {
  vibes?: string[];
  location?: string;
  guests?: number;
  budget?: number;
  petFriendly?: boolean;
  partyFriendly?: boolean;
};

const overlap = (a: string[] = [], b: string[] = []) => {
  if (!a.length || !b.length) return 0;
  const A = a.map((x) => x.toLowerCase());
  return b.filter((x) => A.includes(x.toLowerCase())).length / b.length;
};

export function scoreListing(l: Listing, c: RankingContext) {
  const vibe = overlap(l.vibe, c.vibes || []);
  const location = c.location && l.location.toLowerCase().includes(c.location.toLowerCase()) ? 1 : 0;
  const capacity = c.guests
    ? l.capacity >= c.guests
      ? 1
      : Math.max(0, 1 - (c.guests - l.capacity) / Math.max(c.guests, 1))
    : 0.5;
  const value = c.budget
    ? l.price <= c.budget
      ? 1
      : Math.max(0, 1 - (l.price - c.budget) / Math.max(c.budget, 1))
    : 0.5;
  const pet = c.petFriendly ? (l.petFriendly ? 1 : 0) : 0.5;
  const party = c.partyFriendly ? (l.partyFriendly ? 1 : 0) : 0.5;

  return vibe * 0.35 + capacity * 0.2 + location * 0.15 + value * 0.15 + pet * 0.075 + party * 0.075;
}

export function rankListings(listings: Listing[], ctx: RankingContext) {
  return [...listings]
    .map((l) => ({ ...l, score: scoreListing(l, ctx) }))
    .sort((a, b) => b.score - a.score);
}
