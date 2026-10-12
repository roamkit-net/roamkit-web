import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { Location, Package } from "@/lib/api";

import {
  homeMetadata,
  locationMetadata,
  locationSeoDescription,
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

function pkg(partial?: Partial<Package>): Package {
  return {
    id: "pkg-1",
    title: "1 GB - 7 Days",
    operator_title: "Test",
    country_code: "HR",
    data_allowance: "1 GB",
    validity_days: 7,
    price_usd: "4.50",
    is_unlimited: false,
    plan_type: "data",
    voice_minutes: null,
    text_sms: null,
    ...partial,
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

  it("describes the destination with current package facts", () => {
    const packages = [
      pkg(),
      pkg({ id: "pkg-2", price_usd: "10.00", validity_days: 30 }),
    ];
    assert.equal(
      locationSeoDescription(location(), packages),
      "Compare 2 prepaid Croatia eSIM data plans from $4.50 with 7–30 day options. Local coverage on RoamKit.net.",
    );

    const metadata = locationMetadata(location(), packages);
    assert.equal(
      metadata.twitter?.title,
      "Croatia eSIMs — RoamKit.net",
    );
    assert.equal(metadata.twitter?.description, metadata.description);
  });
});
