import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { formatGoogleAuthError } from "@/lib/api";

describe("formatGoogleAuthError", () => {
  it("maps known Google auth codes", () => {
    assert.equal(
      formatGoogleAuthError(
        { code: "google_email_not_verified", detail: "x" },
        "fallback",
      ),
      "Your Google account email is not verified. Verify it with Google, or use email sign-in.",
    );
    assert.equal(
      formatGoogleAuthError(
        { code: "google_sub_conflict", detail: "x" },
        "fallback",
      ),
      "This Google account is already linked to another user.",
    );
  });

  it("falls back for unknown bodies", () => {
    assert.equal(formatGoogleAuthError({}, "fallback"), "fallback");
  });
});
