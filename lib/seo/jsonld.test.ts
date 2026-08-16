import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { Location } from "@/lib/api";

import { locationBreadcrumbJsonLd, serializeJsonLd } from "./jsonld";

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

describe("JSON-LD", () => {
  it("emits a parseable BreadcrumbList with production URLs", () => {
    const data = locationBreadcrumbJsonLd(location());
    const json = serializeJsonLd(data);
    const parsed = JSON.parse(json) as {
      "@type": string;
      itemListElement: { item: string; name: string }[];
    };
    assert.equal(parsed["@type"], "BreadcrumbList");
    assert.equal(parsed.itemListElement[0]?.item, "https://roamkit.net/plans");
    assert.equal(parsed.itemListElement[1]?.item, "https://roamkit.net/plans");
    assert.equal(
      parsed.itemListElement[2]?.item,
      "https://roamkit.net/croatia-esim",
    );
    assert.ok(!json.includes("</script>"));
  });

  it("escapes < so a title cannot break out of the script tag", () => {
    const json = serializeJsonLd(
      locationBreadcrumbJsonLd({
        ...location(),
        title: 'Croatia</script><script>alert(1)',
      }),
    );
    assert.ok(!json.includes("</script>"));
    assert.match(json, /\\u003c/);
    JSON.parse(json);
  });
});
