import assert from "node:assert/strict";
import { afterEach, before, describe, it } from "node:test";

import {
  restoreShortfallScroll,
  saveShortfallScroll,
} from "./shortfallScroll";

describe("shortfallScroll", () => {
  const sessionStore = new Map<string, string>();
  let scrollTop = 0;

  before(() => {
    Object.defineProperty(globalThis, "window", {
      value: {
        scrollTo({ top }: { top: number }) {
          scrollTop = top;
        },
      },
      configurable: true,
    });
    Object.defineProperty(globalThis, "sessionStorage", {
      value: {
        getItem(key: string) {
          return sessionStore.has(key) ? sessionStore.get(key)! : null;
        },
        setItem(key: string, value: string) {
          sessionStore.set(key, value);
        },
        removeItem(key: string) {
          sessionStore.delete(key);
        },
      },
      configurable: true,
    });
  });

  afterEach(() => {
    sessionStore.clear();
    scrollTop = 0;
  });

  it("restores matching path scroll and clears storage", () => {
    saveShortfallScroll("/croatia-esim", 420);
    restoreShortfallScroll("/croatia-esim");
    assert.equal(scrollTop, 420);
    assert.equal(sessionStorage.getItem("roamkit_shortfall_scroll"), null);
  });

  it("ignores mismatched path", () => {
    saveShortfallScroll("/croatia-esim", 420);
    restoreShortfallScroll("/global-esim");
    assert.equal(scrollTop, 0);
    assert.ok(sessionStorage.getItem("roamkit_shortfall_scroll"));
  });
});
