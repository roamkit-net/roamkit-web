import assert from "node:assert/strict";
import { afterEach, before, describe, it } from "node:test";

import { clearTokens, logout } from "@/lib/api";

import {
  clearPendingSpend,
  MAX_AGE_MS,
  peekPendingSpend,
  savePendingSpend,
  takePendingSpendForReturn,
} from "./pendingSpend";

const STORAGE_KEY = "roamkit_pending_spend";

describe("pendingSpend", () => {
  const sessionStore = new Map<string, string>();
  const localStore = new Map<string, string>();

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
    Object.defineProperty(globalThis, "sessionStorage", {
      value: memoryStorage(sessionStore),
      configurable: true,
    });
    Object.defineProperty(globalThis, "localStorage", {
      value: memoryStorage(localStore),
      configurable: true,
    });
  });

  afterEach(() => {
    sessionStore.clear();
    localStore.clear();
    clearPendingSpend();
  });

  it("saves version 1 and peeks an order spend intent", () => {
    savePendingSpend({
      kind: "order",
      packageId: "pkg-1",
      idempotencyKey: "order-key-1",
      returnPath: "/croatia-esim",
    });
    const pending = peekPendingSpend();
    assert.ok(pending);
    assert.equal(pending.kind, "order");
    assert.equal(pending.version, 1);
    if (pending.kind === "order") {
      assert.equal(pending.packageId, "pkg-1");
      assert.equal(pending.idempotencyKey, "order-key-1");
      assert.equal(pending.returnPath, "/croatia-esim");
    }
  });

  it("accepts legacy payloads without version as v1", () => {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        kind: "order",
        packageId: "pkg-legacy",
        idempotencyKey: "legacy-key",
        returnPath: "/croatia-esim",
        createdAt: Date.now(),
      }),
    );
    const pending = peekPendingSpend();
    assert.ok(pending);
    assert.equal(pending.packageId, "pkg-legacy");
  });

  it("discards unknown pending spend versions", () => {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 99,
        kind: "order",
        packageId: "pkg-future",
        idempotencyKey: "future-key",
        returnPath: "/croatia-esim",
        createdAt: Date.now(),
      }),
    );
    assert.equal(peekPendingSpend(), null);
    assert.equal(sessionStorage.getItem(STORAGE_KEY), null);
  });

  it("replace: latest save wins", () => {
    savePendingSpend({
      kind: "order",
      packageId: "pkg-old",
      idempotencyKey: "key-old",
      returnPath: "/croatia-esim",
    });
    savePendingSpend({
      kind: "order",
      packageId: "pkg-new",
      idempotencyKey: "key-new",
      returnPath: "/croatia-esim",
    });
    const pending = peekPendingSpend();
    assert.ok(pending);
    assert.equal(pending.packageId, "pkg-new");
    assert.equal(pending.idempotencyKey, "key-new");
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

  it("dismiss: clearPendingSpend removes pending so peek is null", () => {
    savePendingSpend({
      kind: "order",
      packageId: "pkg-dismiss",
      idempotencyKey: "order-key-dismiss",
      returnPath: "/croatia-esim",
    });
    assert.ok(peekPendingSpend());
    clearPendingSpend();
    assert.equal(peekPendingSpend(), null);
    assert.equal(sessionStorage.getItem(STORAGE_KEY), null);
  });

  it("clearPendingSpend is idempotent", () => {
    savePendingSpend({
      kind: "order",
      packageId: "pkg-idempotent",
      idempotencyKey: "order-key-idempotent",
      returnPath: "/croatia-esim",
    });
    assert.doesNotThrow(() => {
      clearPendingSpend();
      clearPendingSpend();
    });
    assert.equal(peekPendingSpend(), null);
  });

  it("removes expired pending spend from sessionStorage on peek", () => {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        kind: "order",
        packageId: "pkg-stale",
        idempotencyKey: "stale-key",
        returnPath: "/croatia-esim",
        createdAt: Date.now() - MAX_AGE_MS - 1,
      }),
    );
    assert.equal(peekPendingSpend(), null);
    assert.equal(sessionStorage.getItem(STORAGE_KEY), null);
  });

  it("clears pending spend on clearTokens / logout", () => {
    savePendingSpend({
      kind: "order",
      packageId: "pkg-logout",
      idempotencyKey: "order-key-logout",
      returnPath: "/croatia-esim",
    });
    assert.ok(peekPendingSpend());
    clearTokens();
    assert.equal(peekPendingSpend(), null);

    savePendingSpend({
      kind: "order",
      packageId: "pkg-logout-2",
      idempotencyKey: "order-key-logout-2",
      returnPath: "/croatia-esim",
    });
    assert.ok(peekPendingSpend());
    logout();
    assert.equal(peekPendingSpend(), null);
  });

  it("clearTokens still clears auth when sessionStorage remove throws", () => {
    localStore.set("roamkit_access_token", "access");
    localStore.set("roamkit_refresh_token", "refresh");
    const original = sessionStorage.removeItem.bind(sessionStorage);
    sessionStorage.removeItem = () => {
      throw new Error("SecurityError");
    };
    try {
      assert.doesNotThrow(() => clearTokens());
      assert.equal(localStore.has("roamkit_access_token"), false);
      assert.equal(localStore.has("roamkit_refresh_token"), false);
    } finally {
      sessionStorage.removeItem = original;
    }
  });
});
