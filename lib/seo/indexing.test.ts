import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isSeoIndexingEnabled } from "./indexing";

describe("isSeoIndexingEnabled", () => {
  it("is true only when flag is true and environment is production", () => {
    assert.equal(
      isSeoIndexingEnabled({
        SEO_INDEXING_ENABLED: "true",
        ROAMKIT_ENVIRONMENT: "production",
      }),
      true,
    );
  });

  it("stays closed when the flag is set on a non-production environment", () => {
    assert.equal(
      isSeoIndexingEnabled({
        SEO_INDEXING_ENABLED: "true",
        ROAMKIT_ENVIRONMENT: "staging",
      }),
      false,
    );
    assert.equal(
      isSeoIndexingEnabled({
        SEO_INDEXING_ENABLED: "true",
        ROAMKIT_ENVIRONMENT: "develop",
      }),
      false,
    );
  });

  it("stays closed when production environment is missing the flag", () => {
    assert.equal(
      isSeoIndexingEnabled({
        ROAMKIT_ENVIRONMENT: "production",
      }),
      false,
    );
    assert.equal(
      isSeoIndexingEnabled({
        SEO_INDEXING_ENABLED: "false",
        ROAMKIT_ENVIRONMENT: "production",
      }),
      false,
    );
    assert.equal(
      isSeoIndexingEnabled({
        SEO_INDEXING_ENABLED: "TRUE",
        ROAMKIT_ENVIRONMENT: "production",
      }),
      false,
    );
  });

  it("stays closed when origin-like values are production but the dual gate is not", () => {
    assert.equal(
      isSeoIndexingEnabled({
        NEXT_PUBLIC_APP_URL: "https://roamkit.net",
        SEO_INDEXING_ENABLED: "true",
        ROAMKIT_ENVIRONMENT: "staging",
      }),
      false,
    );
    assert.equal(
      isSeoIndexingEnabled({
        NEXT_PUBLIC_APP_URL: "https://roamkit.net",
        NODE_ENV: "production",
      }),
      false,
    );
  });
});
