import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { Location } from "@/lib/api";

import {
  FEATURED_LOCATION_SLUGS,
  selectFeaturedLocations,
} from "./featuredLocations";

function loc(
  slug: string,
  overrides: Partial<Location> = {},
): Location {
  return {
    slug,
    title: slug,
    country_code: "XX",
    coverage_type: "local",
    image_url: "",
    is_popular: false,
    min_price_usd: "3.50",
    covered_country_codes: [],
    coverages: [],
    ...overrides,
  };
}

describe("selectFeaturedLocations", () => {
  it("preserves preferred order among hits", () => {
    const locations = [
      loc("japan"),
      loc("global"),
      loc("europe"),
      loc("united-states"),
    ];
    assert.deepEqual(
      selectFeaturedLocations(locations).map((l) => l.slug),
      [...FEATURED_LOCATION_SLUGS],
    );
  });

  it("skips missing slugs without placeholders", () => {
    const locations = [loc("europe"), loc("japan")];
    assert.deepEqual(
      selectFeaturedLocations(locations).map((l) => l.slug),
      ["europe", "japan"],
    );
  });

  it("keeps locations that have no min price", () => {
    const locations = [
      loc("europe", { min_price_usd: null }),
      loc("united-states"),
    ];
    const selected = selectFeaturedLocations(locations);
    assert.equal(selected.length, 2);
    assert.equal(selected[0]?.min_price_usd, null);
  });

  it("returns empty when catalog is empty", () => {
    assert.deepEqual(selectFeaturedLocations([]), []);
  });
});
