import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isPopularGeoRankingEnabled } from "./flags";
import {
  getViewerCountry,
  normalizeCountryCode,
} from "./viewer-country";

describe("normalizeCountryCode", () => {
  it("uppercases valid ISO2", () => {
    assert.equal(normalizeCountryCode("hr"), "HR");
  });

  it("rejects XX and T1 Cloudflare placeholders", () => {
    assert.equal(normalizeCountryCode("XX"), null);
    assert.equal(normalizeCountryCode("T1"), null);
  });

  it("rejects empty and non-ISO2", () => {
    assert.equal(normalizeCountryCode(""), null);
    assert.equal(normalizeCountryCode("   "), null);
    assert.equal(normalizeCountryCode("USA"), null);
    assert.equal(normalizeCountryCode(null), null);
    assert.equal(normalizeCountryCode(undefined), null);
  });
});

describe("getViewerCountry", () => {
  it("prefers cookie over profile and header", () => {
    assert.equal(
      getViewerCountry({
        cookieCountry: "de",
        profileCountry: "HR",
        headerCountry: "US",
      }),
      "DE",
    );
  });

  it("falls through to header when cookie and profile are null", () => {
    assert.equal(
      getViewerCountry({
        cookieCountry: null,
        profileCountry: null,
        headerCountry: "hr",
      }),
      "HR",
    );
  });

  it("returns null when all sources are invalid", () => {
    assert.equal(
      getViewerCountry({
        cookieCountry: "XX",
        profileCountry: "",
        headerCountry: "T1",
      }),
      null,
    );
  });
});

describe("isPopularGeoRankingEnabled", () => {
  it("defaults to true when unset", () => {
    assert.equal(isPopularGeoRankingEnabled({}), true);
  });

  it("is false for false/0/off/no", () => {
    assert.equal(
      isPopularGeoRankingEnabled({ POPULAR_GEO_RANKING_ENABLED: "false" }),
      false,
    );
    assert.equal(
      isPopularGeoRankingEnabled({ POPULAR_GEO_RANKING_ENABLED: "0" }),
      false,
    );
    assert.equal(
      isPopularGeoRankingEnabled({ POPULAR_GEO_RANKING_ENABLED: "off" }),
      false,
    );
  });

  it("is true for true and other values", () => {
    assert.equal(
      isPopularGeoRankingEnabled({ POPULAR_GEO_RANKING_ENABLED: "true" }),
      true,
    );
    assert.equal(
      isPopularGeoRankingEnabled({ POPULAR_GEO_RANKING_ENABLED: "1" }),
      true,
    );
  });
});
