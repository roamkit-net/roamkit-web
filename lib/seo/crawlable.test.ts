import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { LocationCard } from "@/components/LocationCard";
import type { Location } from "@/lib/api";
import { locationEsimPath, plansTabHref } from "@/lib/routes";

import { buildSitemapEntries } from "./sitemap";

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

describe("crawlable catalog links", () => {
  it("exposes real tab hrefs including /plans?tab=all", () => {
    assert.equal(plansTabHref("popular"), "/plans");
    assert.equal(plansTabHref("local"), "/plans?tab=local");
    assert.equal(plansTabHref("all"), "/plans?tab=all");
  });

  it("renders each destination card as an <a href> matching the sitemap path", () => {
    const croatia = loc("croatia", "Croatia");
    const html = renderToStaticMarkup(
      createElement(LocationCard, { location: croatia }),
    );
    assert.match(html, /href="\/croatia-esim"/);
    const sitemapUrls = buildSitemapEntries([croatia]).map((entry) => entry.url);
    assert.ok(sitemapUrls.includes("https://roamkit.net/croatia-esim"));
    assert.equal(locationEsimPath(croatia.slug), "/croatia-esim");
  });
});
