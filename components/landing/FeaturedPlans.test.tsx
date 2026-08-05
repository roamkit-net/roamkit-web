import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import type { Location } from "@/lib/api";

import { FeaturedPlans } from "./FeaturedPlans";

function loc(slug: string, title: string): Location {
  return {
    slug,
    title,
    country_code: "",
    coverage_type: "local",
    image_url: "",
    is_popular: true,
    min_price_usd: "3.00",
    covered_country_codes: [],
    coverages: [],
  };
}

describe("FeaturedPlans", () => {
  it("renders Browse all destinations CTA to /plans", () => {
    const html = renderToStaticMarkup(
      createElement(FeaturedPlans, {
        locations: [loc("europe", "Europe"), loc("japan", "Japan")],
      }),
    );
    assert.match(html, /Browse all destinations/);
    assert.match(html, /href="\/plans"/);
  });

  it("returns null when there are no locations", () => {
    const html = renderToStaticMarkup(
      createElement(FeaturedPlans, { locations: [] }),
    );
    assert.equal(html, "");
  });
});
