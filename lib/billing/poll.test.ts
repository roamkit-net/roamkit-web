import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { BillingClientError } from "./errors";
import {
  DEPOSIT_POLL_INTERVAL_MS,
  DEPOSIT_POLL_TIMEOUT_MS,
  isTerminalDepositStatus,
  pollUntil,
} from "./poll";

describe("isTerminalDepositStatus", () => {
  it("treats completed and failed as terminal (case-insensitive)", () => {
    assert.equal(isTerminalDepositStatus("completed"), true);
    assert.equal(isTerminalDepositStatus("FAILED"), true);
    assert.equal(isTerminalDepositStatus("COMPLETED"), true);
    assert.equal(isTerminalDepositStatus("pending"), false);
  });
});

describe("pollUntil", () => {
  it("uses 15s / 5min defaults", () => {
    assert.equal(DEPOSIT_POLL_INTERVAL_MS, 15_000);
    assert.equal(DEPOSIT_POLL_TIMEOUT_MS, 5 * 60_000);
  });

  it("stops when shouldStop is true (completed)", async () => {
    const statuses = ["pending", "pending", "completed"];
    let calls = 0;
    const result = await pollUntil(
      async () => {
        const status = statuses[calls] ?? "pending";
        calls += 1;
        return { status };
      },
      {
        intervalMs: 5,
        timeoutMs: 1_000,
        isDocumentVisible: () => true,
        delay: async () => undefined,
        shouldStop: (value) => isTerminalDepositStatus(value.status),
      },
    );
    assert.equal(result.status, "completed");
    assert.equal(calls, 3);
  });

  it("stops on failed", async () => {
    const result = await pollUntil(async () => ({ status: "failed" }), {
      shouldStop: (value) => isTerminalDepositStatus(value.status),
      isDocumentVisible: () => true,
    });
    assert.equal(result.status, "failed");
  });

  it("times out after the configured window", async () => {
    let now = 0;
    await assert.rejects(
      () =>
        pollUntil(async () => ({ status: "pending" }), {
          intervalMs: 10,
          timeoutMs: 30,
          now: () => now,
          isDocumentVisible: () => true,
          delay: async (ms) => {
            now += ms;
          },
          shouldStop: (value) => isTerminalDepositStatus(value.status),
        }),
      (error: unknown) =>
        error instanceof BillingClientError &&
        error.code === "POLL_TIMEOUT" &&
        error.category === "pending",
    );
  });

  it("pauses requests while the document is hidden", async () => {
    let visible = false;
    let calls = 0;
    let now = 0;
    const pending = pollUntil(
      async () => {
        calls += 1;
        return { status: calls >= 2 ? "completed" : "pending" };
      },
      {
        intervalMs: 5,
        timeoutMs: 1_000,
        now: () => now,
        isDocumentVisible: () => visible,
        delay: async (ms) => {
          now += ms;
          // Become visible after a couple of hidden-wait ticks.
          if (!visible && now >= 500) {
            visible = true;
          }
        },
        shouldStop: (value) => isTerminalDepositStatus(value.status),
      },
    );

    const result = await pending;
    assert.equal(result.status, "completed");
    assert.ok(calls >= 2);
    // First request only happens after visibility flips true.
    assert.ok(now >= 500);
  });

  it("aborts when the signal fires", async () => {
    const controller = new AbortController();
    queueMicrotask(() => controller.abort());
    await assert.rejects(
      () =>
        pollUntil(
          async () => {
            await new Promise((resolve) => setTimeout(resolve, 50));
            return { status: "pending" };
          },
          {
            signal: controller.signal,
            intervalMs: 10,
            timeoutMs: 1_000,
            isDocumentVisible: () => true,
            shouldStop: (value) => isTerminalDepositStatus(value.status),
          },
        ),
      (error: unknown) =>
        error instanceof DOMException && error.name === "AbortError",
    );
  });
});
