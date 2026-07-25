import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { DepositRequest, VerifyDepositPayload } from "@/types/billing";

import { BillingClientError } from "./errors";
import { verifyDepositUntilSettled } from "./verifyPoll";

const payload: VerifyDepositPayload = {
  tx_hash: "0x" + "ab".repeat(32),
  amount_requested: "10",
  idempotency_key: "stable-key",
};

const fastPoll = {
  intervalMs: 5,
  timeoutMs: 1_000,
  isDocumentVisible: () => true,
  delay: async () => undefined,
};

function deposit(status: string, extra: Partial<DepositRequest> = {}): DepositRequest {
  return {
    id: "d1",
    amount_requested: "10",
    amount_credited: status === "completed" ? "10" : null,
    payment_method: "cex_manual",
    tx_hash: payload.tx_hash,
    idempotency_key: payload.idempotency_key,
    status,
    failure_reason: null,
    verified_at: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...extra,
  };
}

describe("verifyDepositUntilSettled", () => {
  it("returns immediately when the first verify is completed", async () => {
    let calls = 0;
    const result = await verifyDepositUntilSettled(
      async () => {
        calls += 1;
        return deposit("completed");
      },
      payload,
      { poll: fastPoll },
    );
    assert.equal(result.status, "completed");
    assert.equal(calls, 1);
  });

  it("polls until completed and reuses the same payload", async () => {
    const seenKeys: string[] = [];
    const statuses = ["pending", "pending", "completed"];
    let calls = 0;
    const updates: string[] = [];

    const result = await verifyDepositUntilSettled(
      async (body) => {
        seenKeys.push(body.idempotency_key);
        const status = statuses[calls] ?? "pending";
        calls += 1;
        return deposit(status, {
          confirmations: calls,
          required_confirmations: 3,
        });
      },
      payload,
      {
        onUpdate: (d) => updates.push(d.status),
        poll: fastPoll,
      },
    );

    assert.equal(result.status, "completed");
    assert.equal(calls, 3);
    assert.deepEqual(seenKeys, ["stable-key", "stable-key", "stable-key"]);
    assert.deepEqual(updates, ["pending", "pending", "completed"]);
  });

  it("maps abort to BillingClientError", async () => {
    const controller = new AbortController();
    controller.abort();
    await assert.rejects(
      () =>
        verifyDepositUntilSettled(async () => deposit("pending"), payload, {
          signal: controller.signal,
          poll: fastPoll,
        }),
      (error: unknown) => {
        assert.ok(error instanceof BillingClientError);
        assert.equal(error.code, "ABORTED");
        return true;
      },
    );
  });

  it("maps poll timeout to BillingClientError", async () => {
    let now = 0;
    await assert.rejects(
      () =>
        verifyDepositUntilSettled(async () => deposit("pending"), payload, {
          poll: {
            intervalMs: 5,
            timeoutMs: 20,
            isDocumentVisible: () => true,
            delay: async () => undefined,
            now: () => {
              now += 10;
              return now;
            },
          },
        }),
      (error: unknown) => {
        assert.ok(error instanceof BillingClientError);
        assert.equal(error.code, "POLL_TIMEOUT");
        return true;
      },
    );
  });
});
