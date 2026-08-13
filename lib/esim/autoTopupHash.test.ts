import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  AUTO_TOPUP_HASH,
  AUTO_TOPUP_SECTION_ID,
  focusAutoTopupSection,
  isAutoTopupHash,
} from "./autoTopupHash";

describe("auto top-up hash target", () => {
  it("matches only #auto-topup", () => {
    assert.equal(AUTO_TOPUP_SECTION_ID, "auto-topup");
    assert.equal(AUTO_TOPUP_HASH, "#auto-topup");
    assert.equal(isAutoTopupHash("#auto-topup"), true);
    assert.equal(isAutoTopupHash(""), false);
    assert.equal(isAutoTopupHash("#installation"), false);
  });

  it("scrolls and focuses the wrapper, not a missing node", () => {
    const calls: string[] = [];
    const el = {
      scrollIntoView(options: { block: string }) {
        calls.push(`scroll:${options.block}`);
      },
      focus(options: { preventScroll: boolean }) {
        calls.push(`focus:${String(options.preventScroll)}`);
      },
    } as unknown as HTMLElement;

    focusAutoTopupSection(null);
    assert.deepEqual(calls, []);

    focusAutoTopupSection(el);
    assert.deepEqual(calls, ["scroll:nearest", "focus:true"]);
  });
});
