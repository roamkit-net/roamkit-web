import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { GET } from "@/app/version/route";

describe("GET /version", () => {
  it("returns release metadata and X-Release when git sha is set", async () => {
    const prev = {
      sha: process.env.ROAMKIT_GIT_SHA,
      date: process.env.ROAMKIT_BUILD_DATE,
      tag: process.env.ROAMKIT_IMAGE_TAG,
      env: process.env.ROAMKIT_ENVIRONMENT,
    };
    process.env.ROAMKIT_GIT_SHA = "abc123def";
    process.env.ROAMKIT_BUILD_DATE = "2026-07-26T00:00:00Z";
    process.env.ROAMKIT_IMAGE_TAG = "abc123def";
    process.env.ROAMKIT_ENVIRONMENT = "staging";
    try {
      const response = await GET();
      assert.equal(response.status, 200);
      assert.equal(response.headers.get("X-Release"), "abc123def");
      const body = await response.json();
      assert.deepEqual(body, {
        git_sha: "abc123def",
        build_date: "2026-07-26T00:00:00Z",
        image_tag: "abc123def",
        environment: "staging",
      });
    } finally {
      process.env.ROAMKIT_GIT_SHA = prev.sha;
      process.env.ROAMKIT_BUILD_DATE = prev.date;
      process.env.ROAMKIT_IMAGE_TAG = prev.tag;
      process.env.ROAMKIT_ENVIRONMENT = prev.env;
    }
  });

  it("allows empty metadata locally", async () => {
    const prev = process.env.ROAMKIT_GIT_SHA;
    delete process.env.ROAMKIT_GIT_SHA;
    try {
      const response = await GET();
      const body = await response.json();
      assert.equal(body.git_sha, "");
      assert.equal(response.headers.get("X-Release"), null);
    } finally {
      if (prev === undefined) {
        delete process.env.ROAMKIT_GIT_SHA;
      } else {
        process.env.ROAMKIT_GIT_SHA = prev;
      }
    }
  });
});
