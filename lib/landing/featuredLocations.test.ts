import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { Location } from "@/lib/api";

import {
  FEATURED_LOCATION_SLUGS,
  selectFeaturedFromPopular,
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

describe("selectFeaturedFromPopular", () => {
  it("takes rest then prefers europe for diversity", () => {
    const popular = [
      loc("croatia"),
      loc("bosnia"),
      loc("montenegro"),
      loc("serbia"),
      loc("europe"),
      loc("global"),
      loc("united-states"),
    ];
    const featured = selectFeaturedFromPopular({
      popular,
      rankingSource: "geo",
    });
    assert.deepEqual(
      featured.map((l) => l.slug),
      ["croatia", "bosnia", "montenegro", "europe"],
    );
  });

  it("fills from rest when europe and global are missing", () => {
    const popular = [
      loc("croatia"),
      loc("bosnia"),
      loc("montenegro"),
      loc("serbia"),
      loc("united-states"),
    ];
    const featured = selectFeaturedFromPopular({
      popular,
      rankingSource: "geo",
    });
    assert.deepEqual(
      featured.map((l) => l.slug),
      ["croatia", "bosnia", "montenegro", "serbia"],
    );
  });

  it("uses global when europe is absent", () => {
    const popular = [
      loc("croatia"),
      loc("bosnia"),
      loc("montenegro"),
      loc("global"),
      loc("united-states"),
    ];
    const featured = selectFeaturedFromPopular({
      popular,
      rankingSource: "geo",
    });
    assert.deepEqual(
      featured.map((l) => l.slug),
      ["croatia", "bosnia", "montenegro", "global"],
    );
  });

  it("returns empty for empty popular", () => {
    assert.deepEqual(
      selectFeaturedFromPopular({ popular: [], rankingSource: "geo" }),
      [],
    );
  });

  it("invariant: Featured ⊆ Popular and unique slugs", () => {
    const popular = [
      loc("croatia"),
      loc("bosnia"),
      loc("europe"),
      loc("global"),
    ];
    const featured = selectFeaturedFromPopular({
      popular,
      rankingSource: "geo",
    });
    for (const location of featured) {
      assert.ok(popular.includes(location));
    }
    assert.equal(
      new Set(featured.map((l) => l.slug)).size,
      featured.length,
    );
  });

  it("does not mutate the popular input", () => {
    const popular = [loc("croatia"), loc("europe"), loc("bosnia")];
    const before = popular.map((l) => l.slug);
    selectFeaturedFromPopular({ popular, rankingSource: "geo" });
    assert.deepEqual(
      popular.map((l) => l.slug),
      before,
    );
  });

  it("fallback uses legacy featured slugs intersected with popular", () => {
    const popular = [
      loc("japan", { is_popular: true }),
      loc("united-states", { is_popular: true }),
      loc("europe", { is_popular: true }),
      loc("global", { is_popular: true }),
      loc("croatia", { is_popular: true }),
    ];
    const featured = selectFeaturedFromPopular({
      popular,
      rankingSource: "fallback",
    });
    assert.deepEqual(
      featured.map((l) => l.slug),
      [...FEATURED_LOCATION_SLUGS],
    );
  });

  it("flag_off uses the same legacy featured path", () => {
    const popular = [
      loc("europe", { is_popular: true }),
      loc("japan", { is_popular: true }),
    ];
    const featured = selectFeaturedFromPopular({
      popular,
      rankingSource: "flag_off",
    });
    assert.deepEqual(
      featured.map((l) => l.slug),
      ["europe", "japan"],
    );
  });
});
