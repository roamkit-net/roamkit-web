import assert from "node:assert/strict";
import { afterEach, before, describe, it } from "node:test";

import {
  beginShortfallDeposit,
  redirectAfterInsufficientCredits,
} from "./shortfallDeposit";
import { peekPendingSpend, clearPendingSpend } from "./pendingSpend";
import { ApiError } from "@/lib/api";

describe("beginShortfallDeposit", () => {
  const sessionStore = new Map<string, string>();

  before(() => {
    Object.defineProperty(globalThis, "window", {
      value: {
        location: { pathname: "/croatia-esim", search: "" },
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
    clearPendingSpend();
  });

  it("returns can_afford when balance covers price after refresh", async () => {
    const pushes: string[] = [];
    const outcome = await beginShortfallDeposit({
      target: { kind: "order", packageId: "pkg-1" },
      priceUsd: "4.50",
      refreshAndReadBalance: async () => "10.00",
      push: (href) => pushes.push(href),
    });
    assert.equal(outcome.status, "can_afford");
    assert.equal(pushes.length, 0);
    assert.equal(peekPendingSpend(), null);
  });

  it("saves pending and redirects with missing amount", async () => {
    const pushes: string[] = [];
    const outcome = await beginShortfallDeposit({
      target: { kind: "order", packageId: "pkg-1" },
      priceUsd: "4.50",
      refreshAndReadBalance: async () => "1.00",
      push: (href) => pushes.push(href),
    });
    assert.equal(outcome.status, "redirected");
    assert.equal(pushes.length, 1);
    assert.match(pushes[0], /\/me\/deposit\?amount=3\.5/);
    assert.match(pushes[0], /return=%2Fcroatia-esim/);
    const pending = peekPendingSpend();
    assert.ok(pending);
    assert.equal(pending.kind, "order");
    assert.equal(pending.packageId, "pkg-1");
    assert.equal(pending.version, 1);
  });
});

describe("redirectAfterInsufficientCredits", () => {
  const sessionStore = new Map<string, string>();

  before(() => {
    Object.defineProperty(globalThis, "window", {
      value: {
        location: { pathname: "/croatia-esim", search: "" },
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
    clearPendingSpend();
  });

  it("uses API missing amount for deposit prefill", () => {
    const pushes: string[] = [];
    const err = new ApiError("Payment required", 402, {
      code: "INSUFFICIENT_CREDITS",
      detail: "Insufficient funds",
      required: "11.500000",
      balance: "0.000000",
      missing: "11.500000",
    });
    redirectAfterInsufficientCredits({
      target: { kind: "order", packageId: "pkg-402" },
      idempotencyKey: "idem-402",
      err,
      push: (href) => pushes.push(href),
    });
    assert.equal(pushes.length, 1);
    assert.match(pushes[0], /amount=11\.5/);
    const pending = peekPendingSpend();
    assert.ok(pending);
    assert.equal(pending.packageId, "pkg-402");
    assert.equal(pending.idempotencyKey, "idem-402");
  });
});
