import type { Location } from "@/lib/api";

import type { PopularRankingSource } from "@/lib/popular/telemetry";

/** Preferred featured destinations (catalog order). Missing slugs are skipped. */
export const FEATURED_LOCATION_SLUGS = [
  "europe",
  "united-states",
  "japan",
  "global",
] as const;

export type FeaturedLocationSlug = (typeof FEATURED_LOCATION_SLUGS)[number];

const BROADER_FEATURED_SLUGS = ["europe", "global"] as const;

export const FEATURED_MAX = 4;

/**
 * Pick featured locations that exist in `locations`, preserving preferred order.
 * Never invents placeholders for missing slugs.
 */
export function selectFeaturedLocations(
  locations: readonly Location[],
  preferredSlugs: readonly string[] = FEATURED_LOCATION_SLUGS,
): Location[] {
  const bySlug = new Map(locations.map((location) => [location.slug, location]));
  const selected: Location[] = [];

  for (const slug of preferredSlugs) {
    const match = bySlug.get(slug);
    if (match) {
      selected.push(match);
    }
  }

  return selected;
}

export type SelectFeaturedFromPopularArgs = {
  popular: readonly Location[];
  rankingSource: PopularRankingSource;
  max?: number;
};

/**
 * Keep this helper intentionally thin.
 *
 * Ranking belongs to rankPopularLocations().
 * This helper only increases landing-page diversity.
 *
 * Featured is a curated teaser of Popular, optimized for catalog diversity
 * rather than strict ranking (e.g. Europe may appear before Serbia).
 *
 * Deterministic: never mutates input, does not re-sort, same inputs → same output.
 * Invariants: Featured ⊆ Popular; unique slugs only.
 */
export function selectFeaturedFromPopular({
  popular,
  rankingSource,
  max = FEATURED_MAX,
}: SelectFeaturedFromPopularArgs): Location[] {
  if (popular.length === 0 || max <= 0) {
    return [];
  }

  if (rankingSource === "fallback" || rankingSource === "flag_off") {
    return selectFeaturedLocations(popular, FEATURED_LOCATION_SLUGS).slice(
      0,
      max,
    );
  }

  const broaderBySlug = new Map<string, Location>();
  const rest: Location[] = [];
  const seen = new Set<string>();

  for (const location of popular) {
    if (seen.has(location.slug)) {
      continue;
    }
    seen.add(location.slug);
    if (
      (BROADER_FEATURED_SLUGS as readonly string[]).includes(location.slug)
    ) {
      broaderBySlug.set(location.slug, location);
    } else {
      rest.push(location);
    }
  }

  const selected: Location[] = [];
  const picked = new Set<string>();

  function tryAdd(location: Location | undefined): void {
    if (!location || picked.has(location.slug) || selected.length >= max) {
      return;
    }
    picked.add(location.slug);
    selected.push(location);
  }

  const restBudget = Math.max(0, max - 1);
  for (const location of rest) {
    if (selected.length >= restBudget) {
      break;
    }
    tryAdd(location);
  }

  for (const slug of BROADER_FEATURED_SLUGS) {
    if (selected.length >= max) {
      break;
    }
    tryAdd(broaderBySlug.get(slug));
  }

  // Graceful degradation: fill remaining from rest when broader is missing.
  for (const location of rest) {
    if (selected.length >= max) {
      break;
    }
    tryAdd(location);
  }

  return selected;
}
