import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { defaultShouldRetry, withRetry } from "./retry";

describe("defaultShouldRetry", () => {
  it("does not retry client validation or auth errors", () => {
    assert.equal(defaultShouldRetry({ status: 400 }), false);
    assert.equal(defaultShouldRetry({ status: 401 }), false);
    assert.equal(defaultShouldRetry({ status: 402 }), false);
    assert.equal(defaultShouldRetry({ status: 404 }), false);
  });

  it("retries network and server failures", () => {
    assert.equal(defaultShouldRetry(new TypeError("offline")), true);
    assert.equal(defaultShouldRetry({ status: 503 }), true);
    assert.equal(defaultShouldRetry({ status: 429 }), true);
  });
});

describe("withRetry", () => {
  it("returns on first success", async () => {
    let calls = 0;
    const result = await withRetry(async () => {
      calls += 1;
      return "ok";
    });
    assert.equal(result, "ok");
    assert.equal(calls, 1);
  });

  it("retries then succeeds with backoff delays", async () => {
    const delays: number[] = [];
    let calls = 0;
    const result = await withRetry(
      async () => {
        calls += 1;
        if (calls < 3) {
          throw Object.assign(new Error("boom"), { status: 503 });
        }
        return "done";
      },
      {
        maxAttempts: 3,
        initialDelayMs: 10,
        factor: 2,
        delay: async (ms) => {
          delays.push(ms);
        },
      },
    );
    assert.equal(result, "done");
    assert.equal(calls, 3);
    assert.deepEqual(delays, [10, 20]);
  });

  it("stops immediately when aborted", async () => {
    const controller = new AbortController();
    controller.abort();
    await assert.rejects(
      () =>
        withRetry(async () => "never", {
          signal: controller.signal,
        }),
      (error: unknown) =>
        error instanceof DOMException && error.name === "AbortError",
    );
  });

  it("passes the shared AbortSignal into each attempt", async () => {
    const seen: AbortSignal[] = [];
    await withRetry(
      async (signal) => {
        seen.push(signal);
        if (seen.length === 1) {
          throw Object.assign(new Error("retry"), { status: 503 });
        }
        return "ok";
      },
      {
        maxAttempts: 2,
        delay: async () => undefined,
      },
    );
    assert.equal(seen.length, 2);
    assert.equal(seen[0], seen[1]);
    assert.equal(seen[0].aborted, false);
  });

  it("reuses a closed-over idempotency_key across internal retries", async () => {
    const idempotencyKey = "deposit-stable-key";
    const seenKeys: string[] = [];
    let calls = 0;

    await withRetry(
      async () => {
        calls += 1;
        // Caller closes over one key; withRetry must not invent a new one.
        seenKeys.push(idempotencyKey);
        if (calls < 2) {
          throw Object.assign(new Error("transient"), { status: 503 });
        }
        return { ok: true, idempotency_key: idempotencyKey };
      },
      {
        maxAttempts: 3,
        delay: async () => undefined,
      },
    );

    assert.equal(calls, 2);
    assert.deepEqual(seenKeys, [idempotencyKey, idempotencyKey]);
  });
});
