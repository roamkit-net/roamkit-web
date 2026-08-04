import type { Location } from "@/lib/api";

/** Preferred featured destinations (catalog order). Missing slugs are skipped. */
export const FEATURED_LOCATION_SLUGS = [
  "europe",
  "united-states",
  "japan",
  "global",
] as const;

export type FeaturedLocationSlug = (typeof FEATURED_LOCATION_SLUGS)[number];

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
