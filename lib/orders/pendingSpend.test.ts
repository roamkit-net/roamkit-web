import assert from "node:assert/strict";
import { afterEach, before, describe, it } from "node:test";

import {
  clearPendingSpend,
  peekPendingSpend,
  savePendingSpend,
  takePendingSpendForReturn,
} from "./pendingSpend";

describe("pendingSpend", () => {
  const store = new Map<string, string>();

  before(() => {
    const memoryStorage = {
      getItem(key: string) {
        return store.has(key) ? store.get(key)! : null;
      },
      setItem(key: string, value: string) {
        store.set(key, value);
      },
      removeItem(key: string) {
        store.delete(key);
      },
    };
    Object.defineProperty(globalThis, "window", {
      value: globalThis,
      configurable: true,
    });
    Object.defineProperty(globalThis, "sessionStorage", {
      value: memoryStorage,
      configurable: true,
    });
  });

  afterEach(() => {
    store.clear();
    clearPendingSpend();
  });

  it("saves and peeks an order spend intent", () => {
    savePendingSpend({
      kind: "order",
      packageId: "pkg-1",
      idempotencyKey: "order-key-1",
      returnPath: "/croatia-esim",
    });
    const pending = peekPendingSpend();
    assert.ok(pending);
    assert.equal(pending.kind, "order");
    if (pending.kind === "order") {
      assert.equal(pending.packageId, "pkg-1");
      assert.equal(pending.idempotencyKey, "order-key-1");
      assert.equal(pending.returnPath, "/croatia-esim");
    }
  });

  it("takes a matching return path once", () => {
    savePendingSpend({
      kind: "topup",
      esimId: "42",
      packageId: "topup-1gb",
      idempotencyKey: "topup-key-1",
      returnPath: "/me/esims/42",
    });
    assert.equal(takePendingSpendForReturn("/me/esims/99"), null);
    assert.ok(peekPendingSpend());
    const taken = takePendingSpendForReturn("/me/esims/42");
    assert.ok(taken);
    assert.equal(taken.kind, "topup");
    assert.equal(peekPendingSpend(), null);
  });
});
