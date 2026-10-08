import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { accountLabel } from "./accountLabel";

describe("accountLabel", () => {
  it("uses a trimmed display name when one is set", () => {
    assert.equal(accountLabel("  Ada Lovelace  ", "ada@example.com"), "Ada Lovelace");
  });

  it("falls back to email when the display name is empty", () => {
    assert.equal(accountLabel("   ", "ada@example.com"), "ada@example.com");
    assert.equal(accountLabel("", "ada@example.com"), "ada@example.com");
    assert.equal(accountLabel(null, "ada@example.com"), "ada@example.com");
  });
});
