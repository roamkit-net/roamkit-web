import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { partnerErrorMessage } from "./errors";

describe("partner error copy", () => {
  it("treats a missing settlement account as a system error", () => {
    assert.match(
      partnerErrorMessage("partner_settlement_account_missing"),
      /Nothing was changed/,
    );
    assert.equal(
      partnerErrorMessage("partner_settlement_account_missing").includes("access"),
      false,
    );
  });

  it("does not echo an unknown server string", () => {
    assert.equal(
      partnerErrorMessage("Traceback: secret"),
      "The partner request failed.",
    );
  });

  it("keeps several contexts out of the error map", () => {
    assert.equal(
      partnerErrorMessage("partner_context_ambiguous"),
      "The partner request failed.",
    );
  });
});
