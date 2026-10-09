import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { publicOrigin } from "./publicOrigin";

function request(url: string, headers: Record<string, string>) {
  return {
    url,
    headers: { get: (name: string) => headers[name.toLowerCase()] ?? null },
  };
}

describe("publicOrigin", () => {
  it("uses the forwarded host instead of the bind address", () => {
    assert.equal(
      publicOrigin(
        request("https://0.0.0.0:3000/join/token", {
          "x-forwarded-host": "staging.roamkit.net",
          "x-forwarded-proto": "https",
          host: "0.0.0.0:3000",
        }),
      ),
      "https://staging.roamkit.net",
    );
  });

  it("falls back to the public app URL when the only host is the bind address", () => {
    const previous = process.env.NEXT_PUBLIC_APP_URL;
    process.env.NEXT_PUBLIC_APP_URL = "https://staging.roamkit.net";
    try {
      assert.equal(
        publicOrigin(request("https://0.0.0.0:3000/join/token", { host: "0.0.0.0:3000" })),
        "https://staging.roamkit.net",
      );
    } finally {
      if (previous === undefined) {
        delete process.env.NEXT_PUBLIC_APP_URL;
      } else {
        process.env.NEXT_PUBLIC_APP_URL = previous;
      }
    }
  });
});
