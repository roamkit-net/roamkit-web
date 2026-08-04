import type { Location } from "@/lib/api";

import { neighborsFor } from "./neighbor-map";

/** Hard cap for geo-ranked Popular results. */
export const POPULAR_HARD_CAP = 12;

/** Soft per-layer preferences (curated fills remaining slots up to hard cap). */
export const POPULAR_SOFT = {
  local: 1,
  neighbors: 3,
  broader: 2,
} as const;

/** Only these slugs may appear in the broader layer. */
export const BROADER_SLUG_ALLOWLIST = ["europe", "global"] as const;

export type RankPopularLocationsArgs = {
  locations: readonly Location[];
  viewerCountry: string | null;
};

/**
 * Rank Popular destinations for a viewer country.
 *
 * Pure / sync / deterministic: never mutates input, no network, no async.
 * Complexity: O(n) over the catalog.
 *
 * When viewerCountry is null, returns is_popular filter in input order (legacy).
 */
export function rankPopularLocations({
  locations,
  viewerCountry,
}: RankPopularLocationsArgs): Location[] {
  if (viewerCountry == null) {
    return locations.filter((location) => location.is_popular);
  }

  const localByCountry = new Map<string, Location>();
  const bySlug = new Map<string, Location>();

  for (const location of locations) {
    bySlug.set(location.slug, location);
    if (location.coverage_type === "local" && location.country_code) {
      const code = location.country_code.toUpperCase();
      if (!localByCountry.has(code)) {
        localByCountry.set(code, location);
      }
    }
  }

  const picked = new Set<string>();
  const result: Location[] = [];

  function tryAdd(location: Location | undefined): boolean {
    if (!location || picked.has(location.slug)) {
      return false;
    }
    if (result.length >= POPULAR_HARD_CAP) {
      return false;
    }
    picked.add(location.slug);
    result.push(location);
    return true;
  }

  // 1. Local (prefer 1)
  tryAdd(localByCountry.get(viewerCountry));

  // 2. Neighbors (prefer up to 3), map order
  let neighborsTaken = 0;
  for (const code of neighborsFor(viewerCountry)) {
    if (neighborsTaken >= POPULAR_SOFT.neighbors) {
      break;
    }
    if (tryAdd(localByCountry.get(code))) {
      neighborsTaken += 1;
    }
  }

  // 3. Broader (prefer up to 2): allowlisted slugs that cover viewer
  let broaderTaken = 0;
  for (const slug of BROADER_SLUG_ALLOWLIST) {
    if (broaderTaken >= POPULAR_SOFT.broader) {
      break;
    }
    const candidate = bySlug.get(slug);
    if (
      candidate &&
      (candidate.covered_country_codes ?? []).some(
        (code) => code.toUpperCase() === viewerCountry,
      ) &&
      tryAdd(candidate)
    ) {
      broaderTaken += 1;
    }
  }

  // 4. Curated backfill: remaining is_popular in input order until hard cap
  for (const location of locations) {
    if (result.length >= POPULAR_HARD_CAP) {
      break;
    }
    if (!location.is_popular) {
      continue;
    }
    tryAdd(location);
  }

  return result;
}

/**
 * Choose Popular list: geo ranking when enabled and country known, else legacy.
 */
export function selectPopularLocations({
  locations,
  viewerCountry,
  geoRankingEnabled,
}: {
  locations: readonly Location[];
  viewerCountry: string | null;
  geoRankingEnabled: boolean;
}): {
  locations: Location[];
  ranking_source: "geo" | "fallback" | "flag_off";
} {
  if (!geoRankingEnabled) {
    return {
      locations: locations.filter((location) => location.is_popular),
      ranking_source: "flag_off",
    };
  }
  if (viewerCountry == null) {
    return {
      locations: locations.filter((location) => location.is_popular),
      ranking_source: "fallback",
    };
  }
  return {
    locations: rankPopularLocations({ locations, viewerCountry }),
    ranking_source: "geo",
  };
}
