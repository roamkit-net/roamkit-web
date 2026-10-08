import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  ACCOUNT_LABEL_EVENT,
  accountLabel,
  publishAccountLabel,
} from "./accountLabel";

describe("accountLabel", () => {
  it("uses a trimmed display name when one is set", () => {
    assert.equal(accountLabel("  Ada Lovelace  ", "ada@example.com"), "Ada Lovelace");
  });

  it("falls back to email when the display name is empty", () => {
    assert.equal(accountLabel("   ", "ada@example.com"), "ada@example.com");
    assert.equal(accountLabel("", "ada@example.com"), "ada@example.com");
    assert.equal(accountLabel(null, "ada@example.com"), "ada@example.com");
  });

  it("publishes the saved label for the open account menu", () => {
    const target = new EventTarget();
    const previous = globalThis.window;
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: target,
    });
    let received = "";
    target.addEventListener(ACCOUNT_LABEL_EVENT, (event) => {
      received = (event as CustomEvent<string>).detail;
    });
    try {
      publishAccountLabel("Ada Lovelace");
    } finally {
      Object.defineProperty(globalThis, "window", {
        configurable: true,
        value: previous,
      });
    }
    assert.equal(received, "Ada Lovelace");
  });
});
