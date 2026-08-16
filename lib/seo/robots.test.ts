import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildRobots } from "./robots";

describe("buildRobots", () => {
  it("disallows everything and omits sitemap when indexing is closed", () => {
    const robots = buildRobots({
      SEO_INDEXING_ENABLED: "true",
      ROAMKIT_ENVIRONMENT: "staging",
    });
    assert.deepEqual(robots.rules, { userAgent: "*", disallow: "/" });
    assert.equal(robots.sitemap, undefined);
  });

  it("stays closed when the production origin is set without the dual gate", () => {
    const robots = buildRobots({
      NEXT_PUBLIC_APP_URL: "https://roamkit.net",
      SEO_INDEXING_ENABLED: "true",
      ROAMKIT_ENVIRONMENT: "develop",
    });
    assert.deepEqual(robots.rules, { userAgent: "*", disallow: "/" });
    assert.equal(robots.sitemap, undefined);
  });

  it("allows crawl and advertises the production sitemap when indexing is on", () => {
    const robots = buildRobots({
      SEO_INDEXING_ENABLED: "true",
      ROAMKIT_ENVIRONMENT: "production",
    });
    assert.deepEqual(robots.rules, {
      userAgent: "*",
      allow: "/",
      disallow: ["/version"],
    });
    assert.equal(robots.sitemap, "https://roamkit.net/sitemap.xml");
    const rules = robots.rules;
    const disallow = Array.isArray(rules) ? undefined : rules.disallow;
    const disallowList = Array.isArray(disallow)
      ? disallow
      : disallow
        ? [disallow]
        : [];
    assert.ok(!disallowList.some((path) => path === "/login"));
    assert.ok(!disallowList.some((path) => path === "/me"));
    assert.ok(!disallowList.some((path) => path === "/admin"));
  });
});
