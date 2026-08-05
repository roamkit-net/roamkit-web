import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { Location } from "@/lib/api";

import { selectFeaturedFromPopular } from "./featuredLocations";

/**
 * Golden snapshot for landing Featured selection from geo Popular.
 * Update deliberately when diversity rules change.
 */
function loc(slug: string): Location {
  return {
    slug,
    title: slug,
    country_code: "XX",
    coverage_type: "local",
    image_url: "",
    is_popular: false,
    min_price_usd: "1.00",
    covered_country_codes: [],
    coverages: [],
  };
}

const POPULAR_HR = [
  loc("croatia"),
  loc("bosnia"),
  loc("montenegro"),
  loc("serbia"),
  loc("europe"),
  loc("global"),
  loc("united-states"),
  loc("japan"),
] as const;

const EXPECTED_FEATURED_HR = [
  "croatia",
  "bosnia",
  "montenegro",
  "europe",
] as const;

describe("selectFeaturedFromPopular golden HR", () => {
  it("matches locked Featured order for geo Popular HR", () => {
    const featured = selectFeaturedFromPopular({
      popular: POPULAR_HR,
      rankingSource: "geo",
    });
    assert.deepEqual(featured.map((l) => l.slug), [...EXPECTED_FEATURED_HR]);
  });
});
