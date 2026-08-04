import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { Location } from "@/lib/api";

import {
  POPULAR_HARD_CAP,
  rankPopularLocations,
  selectPopularLocations,
} from "./ranking";

function loc(
  partial: Partial<Location> &
    Pick<Location, "slug" | "title" | "coverage_type">,
): Location {
  return {
    country_code: "",
    image_url: "",
    is_popular: false,
    min_price_usd: "1.00",
    covered_country_codes: [],
    coverages: [],
    ...partial,
  };
}

const catalog: Location[] = [
  loc({
    slug: "united-states",
    title: "United States",
    country_code: "US",
    coverage_type: "local",
    is_popular: true,
  }),
  loc({
    slug: "japan",
    title: "Japan",
    country_code: "JP",
    coverage_type: "local",
    is_popular: true,
  }),
  loc({
    slug: "united-kingdom",
    title: "United Kingdom",
    country_code: "GB",
    coverage_type: "local",
    is_popular: true,
  }),
  loc({
    slug: "italy",
    title: "Italy",
    country_code: "IT",
    coverage_type: "local",
    is_popular: true,
  }),
  loc({
    slug: "slovenia",
    title: "Slovenia",
    country_code: "SI",
    coverage_type: "local",
    is_popular: false,
  }),
  loc({
    slug: "austria",
    title: "Austria",
    country_code: "AT",
    coverage_type: "local",
    is_popular: false,
  }),
  loc({
    slug: "germany",
    title: "Germany",
    country_code: "DE",
    coverage_type: "local",
    is_popular: true,
  }),
  loc({
    slug: "bosnia",
    title: "Bosnia",
    country_code: "BA",
    coverage_type: "local",
    is_popular: false,
  }),
  loc({
    slug: "montenegro",
    title: "Montenegro",
    country_code: "ME",
    coverage_type: "local",
    is_popular: false,
  }),
  loc({
    slug: "serbia",
    title: "Serbia",
    country_code: "RS",
    coverage_type: "local",
    is_popular: false,
  }),
  loc({
    slug: "croatia",
    title: "Croatia",
    country_code: "HR",
    coverage_type: "local",
    is_popular: false,
  }),
  loc({
    slug: "balkans",
    title: "Balkans",
    coverage_type: "regional",
    covered_country_codes: ["HR", "SI", "BA"],
    is_popular: false,
  }),
  loc({
    slug: "cee",
    title: "CEE",
    coverage_type: "regional",
    covered_country_codes: ["HR", "DE", "AT"],
    is_popular: false,
  }),
  loc({
    slug: "europe-plus",
    title: "Europe Plus",
    coverage_type: "regional",
    covered_country_codes: ["HR", "IT", "DE"],
    is_popular: true,
  }),
  loc({
    slug: "global-premium",
    title: "Global Premium",
    coverage_type: "global",
    covered_country_codes: ["HR", "US", "JP"],
    is_popular: true,
  }),
  loc({
    slug: "europe",
    title: "Europe",
    coverage_type: "regional",
    covered_country_codes: ["HR", "IT", "SI", "AT", "DE", "BA"],
    is_popular: true,
  }),
  loc({
    slug: "global",
    title: "Global",
    coverage_type: "global",
    covered_country_codes: ["HR", "US", "JP", "GB"],
    is_popular: true,
  }),
  loc({
    slug: "france",
    title: "France",
    country_code: "FR",
    coverage_type: "local",
    is_popular: true,
  }),
  loc({
    slug: "spain",
    title: "Spain",
    country_code: "ES",
    coverage_type: "local",
    is_popular: true,
  }),
  loc({
    slug: "turkey",
    title: "Turkey",
    country_code: "TR",
    coverage_type: "local",
    is_popular: true,
  }),
  loc({
    slug: "thailand",
    title: "Thailand",
    country_code: "TH",
    coverage_type: "local",
    is_popular: true,
  }),
];

describe("rankPopularLocations", () => {
  it("falls back to is_popular filter in input order when viewerCountry is null", () => {
    const result = rankPopularLocations({
      locations: catalog,
      viewerCountry: null,
    });
    assert.deepEqual(
      result.map((l) => l.slug),
      catalog.filter((l) => l.is_popular).map((l) => l.slug),
    );
  });

  it("does not mutate the input array", () => {
    const copy = [...catalog];
    const before = catalog.map((l) => l.slug);
    rankPopularLocations({ locations: catalog, viewerCountry: "HR" });
    assert.deepEqual(
      catalog.map((l) => l.slug),
      before,
    );
    assert.equal(catalog.length, copy.length);
  });

  it("keeps recommended-market order from the map (stability)", () => {
    const result = rankPopularLocations({
      locations: catalog,
      viewerCountry: "HR",
    });
    const recommendedSlugs = result
      .map((l) => l.slug)
      .filter((slug) =>
        ["bosnia", "montenegro", "serbia", "italy", "slovenia"].includes(slug),
      );
    // Soft max 3: BA, ME, RS in recommended layer
    assert.deepEqual(recommendedSlugs.slice(0, 3), [
      "bosnia",
      "montenegro",
      "serbia",
    ]);
  });

  it("excludes unknown broader slugs from the broader layer even when they cover the viewer", () => {
    const result = rankPopularLocations({
      locations: catalog,
      viewerCountry: "HR",
    });
    const slugs = result.map((l) => l.slug);
    // Soft layers: local + 3 recommended + europe/global — no regionals here
    assert.deepEqual(slugs.slice(0, 6), [
      "croatia",
      "bosnia",
      "montenegro",
      "serbia",
      "europe",
      "global",
    ]);
    assert.ok(!slugs.includes("balkans"));
    assert.ok(!slugs.includes("cee"));
    // is_popular non-allowlist packages may still appear later via curated backfill
    const curated = slugs.slice(6);
    assert.ok(
      !curated.includes("balkans") && !curated.includes("cee"),
      "non-popular regionals must not leak via curated",
    );
  });

  it("invariant: every returned location exists in the original dataset", () => {
    const result = rankPopularLocations({
      locations: catalog,
      viewerCountry: "HR",
    });
    for (const location of result) {
      assert.ok(
        catalog.includes(location),
        `unexpected synthetic location: ${location.slug}`,
      );
    }
  });

  it("backfills with curated to approach the hard cap when early layers are thin", () => {
    const thin: Location[] = [
      loc({
        slug: "croatia",
        title: "Croatia",
        country_code: "HR",
        coverage_type: "local",
      }),
      loc({
        slug: "europe",
        title: "Europe",
        coverage_type: "regional",
        covered_country_codes: ["HR"],
        is_popular: true,
      }),
      ...Array.from({ length: 15 }, (_, i) =>
        loc({
          slug: `popular-${i}`,
          title: `Popular ${i}`,
          country_code: "XX",
          coverage_type: "local",
          is_popular: true,
        }),
      ),
    ];
    const result = rankPopularLocations({
      locations: thin,
      viewerCountry: "HR",
    });
    assert.equal(result.length, POPULAR_HARD_CAP);
    assert.equal(result[0]?.slug, "croatia");
    assert.equal(result[1]?.slug, "europe");
  });

  it("dedupes when local is also is_popular", () => {
    const withPopularHr = [
      loc({
        slug: "croatia",
        title: "Croatia",
        country_code: "HR",
        coverage_type: "local",
        is_popular: true,
      }),
      loc({
        slug: "united-states",
        title: "United States",
        country_code: "US",
        coverage_type: "local",
        is_popular: true,
      }),
    ];
    const result = rankPopularLocations({
      locations: withPopularHr,
      viewerCountry: "HR",
    });
    assert.equal(result.filter((l) => l.slug === "croatia").length, 1);
  });
});

describe("selectPopularLocations", () => {
  it("uses flag_off legacy filter when geo ranking is disabled", () => {
    const { locations, ranking_source } = selectPopularLocations({
      locations: catalog,
      viewerCountry: "HR",
      geoRankingEnabled: false,
    });
    assert.equal(ranking_source, "flag_off");
    assert.deepEqual(
      locations.map((l) => l.slug),
      catalog.filter((l) => l.is_popular).map((l) => l.slug),
    );
  });

  it("uses fallback when enabled but country is null", () => {
    const { ranking_source } = selectPopularLocations({
      locations: catalog,
      viewerCountry: null,
      geoRankingEnabled: true,
    });
    assert.equal(ranking_source, "fallback");
  });

  it("uses geo when enabled and country is known", () => {
    const { ranking_source, locations } = selectPopularLocations({
      locations: catalog,
      viewerCountry: "HR",
      geoRankingEnabled: true,
    });
    assert.equal(ranking_source, "geo");
    assert.equal(locations[0]?.slug, "croatia");
  });
});
