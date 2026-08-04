import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { Location } from "@/lib/api";

import { rankPopularLocations } from "./ranking";

/**
 * Golden snapshot for HR geo ranking.
 * Update deliberately when neighbor-map or ranking rules change.
 */
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

/** Catalog order matches typical API title-ish popular mix for curated stability. */
const goldenCatalog: Location[] = [
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
    slug: "canada",
    title: "Canada",
    country_code: "CA",
    coverage_type: "local",
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
    slug: "germany",
    title: "Germany",
    country_code: "DE",
    coverage_type: "local",
    is_popular: true,
  }),
  loc({
    slug: "slovenia",
    title: "Slovenia",
    country_code: "SI",
    coverage_type: "local",
  }),
  loc({
    slug: "austria",
    title: "Austria",
    country_code: "AT",
    coverage_type: "local",
  }),
  loc({
    slug: "bosnia",
    title: "Bosnia",
    country_code: "BA",
    coverage_type: "local",
  }),
  loc({
    slug: "croatia",
    title: "Croatia",
    country_code: "HR",
    coverage_type: "local",
  }),
  loc({
    slug: "balkans",
    title: "Balkans",
    coverage_type: "regional",
    covered_country_codes: ["HR", "SI", "BA", "RS"],
  }),
  loc({
    slug: "europe",
    title: "Europe",
    coverage_type: "regional",
    covered_country_codes: ["HR", "IT", "SI", "AT", "DE", "FR", "ES"],
    is_popular: true,
  }),
  loc({
    slug: "global",
    title: "Global",
    coverage_type: "global",
    covered_country_codes: ["HR", "US", "JP", "GB", "CA"],
    is_popular: true,
  }),
];

const EXPECTED_HR_ORDER = [
  "croatia",
  "italy",
  "slovenia",
  "austria",
  "europe",
  "global",
  "united-states",
  "japan",
  "united-kingdom",
  "canada",
  "france",
  "spain",
] as const;

describe("rankPopularLocations golden HR", () => {
  it("matches the locked Popular order for viewerCountry=HR", () => {
    const result = rankPopularLocations({
      locations: goldenCatalog,
      viewerCountry: "HR",
    });
    assert.deepEqual(
      result.map((l) => l.slug),
      [...EXPECTED_HR_ORDER],
    );
  });
});
