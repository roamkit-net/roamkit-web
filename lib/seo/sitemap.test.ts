import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  assertProductionSitemapUrls,
  buildSitemapEntries,
  sitemapFromCatalog,
  staticSitemapEntries,
} from "./sitemap";

describe("sitemap entries", () => {
  it("includes home, plans, and valid destination URLs on roamkit.net", () => {
    const entries = buildSitemapEntries([
      { slug: "croatia" },
      { slug: "europe" },
      { slug: "global" },
    ]);
    const urls = entries.map((entry) => entry.url);
    assert.deepEqual(urls, [
      "https://roamkit.net/",
      "https://roamkit.net/plans",
      "https://roamkit.net/croatia-esim",
      "https://roamkit.net/europe-esim",
      "https://roamkit.net/global-esim",
    ]);
    assertProductionSitemapUrls(entries);
    assert.ok(entries.every((entry) => entry.lastModified === undefined));
  });

  it("drops reserved, alias, mixed-case, and duplicate slugs and sorts the rest", () => {
    const entries = buildSitemapEntries([
      { slug: "Japan" },
      { slug: "login" },
      { slug: "world" },
      { slug: "japan" },
      { slug: "Croatia" },
      { slug: "plans" },
    ]);
    assert.deepEqual(
      entries.map((entry) => entry.url),
      [
        "https://roamkit.net/",
        "https://roamkit.net/plans",
        "https://roamkit.net/croatia-esim",
        "https://roamkit.net/japan-esim",
      ],
    );
  });

  it("never emits query strings, /me, or package ids", () => {
    const urls = buildSitemapEntries([{ slug: "france" }]).map(
      (entry) => entry.url,
    );
    assert.ok(urls.every((url) => !url.includes("?")));
    assert.ok(urls.every((url) => !url.includes("/me")));
    assert.ok(urls.every((url) => !url.includes("/login")));
    assert.ok(!urls.some((url) => /\/plans\/.+/.test(url)));
  });

  it("falls back to the static minimum", () => {
    const urls = staticSitemapEntries().map((entry) => entry.url);
    assert.deepEqual(urls, [
      "https://roamkit.net/",
      "https://roamkit.net/plans",
    ]);
  });

  it("returns the static minimum when the catalog loader throws", async () => {
    const entries = await sitemapFromCatalog(async () => {
      throw new Error("API 500");
    });
    assert.deepEqual(
      entries.map((entry) => entry.url),
      ["https://roamkit.net/", "https://roamkit.net/plans"],
    );
  });
});
