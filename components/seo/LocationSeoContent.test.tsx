import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import type { Location, Package } from "@/lib/api";

import { LocationSeoContent } from "./LocationSeoContent";

function location(partial?: Partial<Location>): Location {
  return {
    slug: "croatia",
    title: "Croatia",
    country_code: "HR",
    coverage_type: "local",
    image_url: "",
    is_popular: true,
    min_price_usd: "4.50",
    covered_country_codes: ["HR"],
    coverages: [
      {
        code: "HR",
        name: "Croatia",
        networks: [{ name: "A1", types: ["LTE", "5G"] }],
      },
    ],
    ...partial,
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

describe("LocationSeoContent", () => {
  it("renders factual package and local network details", () => {
    const html = renderToStaticMarkup(
      createElement(LocationSeoContent, {
        location: location(),
        packages: [
          pkg(),
          pkg({
            id: "pkg-2",
            data_allowance: "5 GB",
            validity_days: 30,
            price_usd: "12.00",
          }),
        ],
      }),
    );

    assert.match(html, /About Croatia eSIM plans/);
    assert.match(html, /Compare 2 prepaid eSIM plans, with prices from \$4\.50/);
    assert.match(html, /validity from 7 to 30 days/);
    assert.match(html, /Current data options include 1 GB, 5 GB/);
    assert.match(html, /available networks include A1/);
    assert.match(html, /listed connection types include LTE, 5G/);
    assert.match(html, /href="\/plans\?tab=local"/);
  });

  it("renders a regional coverage count and crawlable regional link", () => {
    const html = renderToStaticMarkup(
      createElement(LocationSeoContent, {
        location: location({
          slug: "europe",
          title: "Europe",
          coverage_type: "regional",
          covered_country_codes: ["HR", "SI", "IT"],
          coverages: [],
        }),
        packages: [pkg()],
      }),
    );

    assert.match(html, /coverage across 3 countries and areas/);
    assert.match(html, /href="\/plans\?tab=regional"/);
  });
});
