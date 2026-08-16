import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { Location } from "@/lib/api";

import {
  homeMetadata,
  locationMetadata,
  noIndexMetadata,
  plansMetadata,
  rootRobots,
} from "./metadata";

function location(): Location {
  return {
    slug: "croatia",
    title: "Croatia",
    country_code: "HR",
    coverage_type: "local",
    image_url: "",
    is_popular: true,
    min_price_usd: "4.50",
    covered_country_codes: ["HR"],
    coverages: [],
  };
}

describe("SEO metadata", () => {
  it("uses production canonicals even when the app origin is staging", () => {
    assert.equal(
      homeMetadata().alternates?.canonical,
      "https://roamkit.net/",
    );
    assert.equal(
      plansMetadata().alternates?.canonical,
      "https://roamkit.net/plans",
    );
    assert.equal(
      locationMetadata(location()).alternates?.canonical,
      "https://roamkit.net/croatia-esim",
    );
  });

  it("marks private surfaces noindex,nofollow", () => {
    assert.deepEqual(noIndexMetadata.robots, {
      index: false,
      follow: false,
    });
  });

  it("uses global noindex when the dual gate is closed", () => {
    assert.deepEqual(
      rootRobots({
        SEO_INDEXING_ENABLED: "true",
        ROAMKIT_ENVIRONMENT: "staging",
        NEXT_PUBLIC_APP_URL: "https://roamkit.net",
      }),
      { index: false, follow: false },
    );
  });

  it("allows indexing only when the dual gate is open", () => {
    assert.deepEqual(
      rootRobots({
        SEO_INDEXING_ENABLED: "true",
        ROAMKIT_ENVIRONMENT: "production",
      }),
      { index: true, follow: true },
    );
  });
});
