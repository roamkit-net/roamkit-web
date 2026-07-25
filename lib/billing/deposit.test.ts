import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { DepositRequest } from "@/types/billing";

import {
  formatDepositPendingMessage,
  isDepositFailed,
  isDepositPendingConfirmations,
  isDepositVerified,
  shouldContinueDepositPoll,
} from "./deposit";

function deposit(
  overrides: Partial<DepositRequest> & Pick<DepositRequest, "status">,
): DepositRequest {
  return {
    id: "d1",
    amount_requested: "10",
    amount_credited: null,
    payment_method: "cex_manual",
    tx_hash: "0xabc",
    idempotency_key: "key",
    failure_reason: null,
    verified_at: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("deposit status helpers", () => {
  it("detects completed / failed case-insensitively", () => {
    assert.equal(isDepositVerified(deposit({ status: "COMPLETED" })), true);
    assert.equal(isDepositFailed(deposit({ status: "Failed" })), true);
    assert.equal(isDepositVerified(deposit({ status: "pending" })), false);
  });

  it("detects pending confirmations when both counts are present", () => {
    assert.equal(
      isDepositPendingConfirmations(
        deposit({
          status: "pending",
          confirmations: 3,
          required_confirmations: 12,
        }),
      ),
      true,
    );
    assert.equal(
      isDepositPendingConfirmations(deposit({ status: "pending" })),
      false,
    );
  });

  it("continues polling for pending or incomplete payloads", () => {
    assert.equal(
      shouldContinueDepositPoll(deposit({ status: "pending" })),
      true,
    );
    assert.equal(
      shouldContinueDepositPoll(deposit({ status: "completed" })),
      false,
    );
    assert.equal(
      shouldContinueDepositPoll(deposit({ status: "failed" })),
      false,
    );
    assert.equal(
      shouldContinueDepositPoll(deposit({ status: "" })),
      true,
    );
  });

  it("formats pending confirmation messages", () => {
    assert.match(
      formatDepositPendingMessage(
        deposit({
          status: "pending",
          confirmations: 3,
          required_confirmations: 12,
        }),
        12,
      ),
      /3\/12/,
    );
    assert.match(
      formatDepositPendingMessage(deposit({ status: "pending" }), 12),
      /12/,
    );
  });
});
