import assert from "node:assert/strict";
import { afterEach, before, describe, it } from "node:test";

import { clearTokens, logout } from "@/lib/api";

import {
  clearPendingDeposit,
  peekPendingDeposit,
  PENDING_DEPOSIT_MAX_AGE_MS,
  savePendingDeposit,
  truncateTxHash,
} from "./pendingDeposit";

const STORAGE_KEY = "roamkit_pending_deposit";
const TX =
  "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

describe("pendingDeposit", () => {
  const localStore = new Map<string, string>();
  const sessionStore = new Map<string, string>();

  before(() => {
    const memoryStorage = (store: Map<string, string>) => ({
      getItem(key: string) {
        return store.has(key) ? store.get(key)! : null;
      },
      setItem(key: string, value: string) {
        store.set(key, value);
      },
      removeItem(key: string) {
        store.delete(key);
      },
    });
    Object.defineProperty(globalThis, "window", {
      value: globalThis,
      configurable: true,
    });
    Object.defineProperty(globalThis, "localStorage", {
      value: memoryStorage(localStore),
      configurable: true,
    });
    Object.defineProperty(globalThis, "sessionStorage", {
      value: memoryStorage(sessionStore),
      configurable: true,
    });
  });

  afterEach(() => {
    localStore.clear();
    sessionStore.clear();
    clearPendingDeposit();
  });

  it("saves and peeks a pending deposit session", () => {
    savePendingDeposit({
      txHash: TX,
      amount: "25.00",
      idempotencyKey: "dep-key-1",
      method: "cex",
    });
    const pending = peekPendingDeposit();
    assert.ok(pending);
    assert.equal(pending.txHash, TX);
    assert.equal(pending.amount, "25.00");
    assert.equal(pending.idempotencyKey, "dep-key-1");
    assert.equal(pending.method, "cex");
    assert.equal(typeof pending.updatedAt, "number");
  });

  it("overwrites so only one session exists", () => {
    savePendingDeposit({
      txHash: TX,
      amount: "10",
      idempotencyKey: "old",
      method: "cex",
    });
    savePendingDeposit({
      txHash: TX,
      amount: "20",
      idempotencyKey: "new",
      method: "wallet",
    });
    const pending = peekPendingDeposit();
    assert.ok(pending);
    assert.equal(pending.amount, "20");
    assert.equal(pending.idempotencyKey, "new");
    assert.equal(pending.method, "wallet");
  });

  it("dismiss: clearPendingDeposit removes pending so peek is null", () => {
    savePendingDeposit({
      txHash: TX,
      amount: "25",
      idempotencyKey: "dismiss-key",
      method: "cex",
    });
    assert.ok(peekPendingDeposit());
    clearPendingDeposit();
    assert.equal(peekPendingDeposit(), null);
    assert.equal(localStorage.getItem(STORAGE_KEY), null);
  });

  it("clearPendingDeposit is idempotent", () => {
    assert.doesNotThrow(() => {
      clearPendingDeposit();
      clearPendingDeposit();
    });
  });

  it("removes expired sessions from localStorage on peek", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        txHash: TX,
        amount: "25",
        idempotencyKey: "stale",
        method: "cex",
        updatedAt: Date.now() - PENDING_DEPOSIT_MAX_AGE_MS - 1,
      }),
    );
    assert.equal(peekPendingDeposit(), null);
    assert.equal(localStorage.getItem(STORAGE_KEY), null);
  });

  it("rejects malformed payloads", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ txHash: TX }));
    assert.equal(peekPendingDeposit(), null);
    assert.equal(localStorage.getItem(STORAGE_KEY), null);
  });

  it("clears pending deposit on clearTokens / logout", () => {
    savePendingDeposit({
      txHash: TX,
      amount: "25",
      idempotencyKey: "logout-key",
      method: "cex",
    });
    assert.ok(peekPendingDeposit());
    clearTokens();
    assert.equal(peekPendingDeposit(), null);

    savePendingDeposit({
      txHash: TX,
      amount: "25",
      idempotencyKey: "logout-key-2",
      method: "wallet",
    });
    assert.ok(peekPendingDeposit());
    logout();
    assert.equal(peekPendingDeposit(), null);
  });

  it("truncates long tx hashes for display", () => {
    assert.equal(truncateTxHash(TX), "0xaaaaaa…aaaaaa");
    assert.equal(truncateTxHash("0xabc"), "0xabc");
  });
});
