import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  BillingClientError,
  readApiErrorCode,
  toBillingError,
} from "./errors";

describe("toBillingError", () => {
  it("maps abort errors to network/ABORTED", () => {
    const mapped = toBillingError(new DOMException("Aborted", "AbortError"));
    assert.deepEqual(mapped, {
      code: "ABORTED",
      category: "network",
      message: "Request was cancelled.",
    });
  });

  it("maps TypeError to network", () => {
    const mapped = toBillingError(new TypeError("Failed to fetch"));
    assert.equal(mapped.code, "NETWORK_ERROR");
    assert.equal(mapped.category, "network");
  });

  it("maps insufficient confirmations body to pending", () => {
    const mapped = toBillingError({
      status: 202,
      body: { detail: "Insufficient confirmations: 3 < 12" },
      message: "Accepted",
    });
    assert.equal(mapped.code, "NOT_ENOUGH_CONFIRMATIONS");
    assert.equal(mapped.category, "pending");
    assert.equal(mapped.message, "Insufficient confirmations: 3 < 12");
  });

  it("preserves structured API code and detail message", () => {
    assert.equal(
      readApiErrorCode({ code: "INSUFFICIENT_CREDITS", detail: "x" }),
      "INSUFFICIENT_CREDITS",
    );
    const mapped = toBillingError({
      status: 402,
      body: {
        code: "INSUFFICIENT_CREDITS",
        detail: "Insufficient funds: balance=1.000000 debit=5.000000",
        required: "5.000000",
        balance: "1.000000",
      },
    });
    assert.deepEqual(mapped, {
      code: "INSUFFICIENT_CREDITS",
      category: "validation",
      message: "Insufficient funds: balance=1.000000 debit=5.000000",
    });
  });

  it("keeps unknown API codes so UI can branch on code, not text", () => {
    const mapped = toBillingError({
      status: 400,
      body: {
        code: "CUSTOM_API_CODE",
        detail: "Something domain-specific happened",
      },
    });
    assert.equal(mapped.code, "CUSTOM_API_CODE");
    assert.equal(mapped.category, "validation");
    assert.equal(mapped.message, "Something domain-specific happened");
  });

  it("maps 400 validation and 402 without code via status inference", () => {
    assert.equal(
      toBillingError({ status: 400, body: { detail: "bad" } }).category,
      "validation",
    );
    assert.deepEqual(
      toBillingError(
        { status: 402, body: { detail: "need credits" } },
        "Pay first",
      ),
      {
        code: "INSUFFICIENT_CREDITS",
        category: "validation",
        message: "Pay first",
      },
    );
  });

  it("maps 5xx to server and auth to fatal", () => {
    assert.equal(
      toBillingError({ status: 503, body: { detail: "down" } }).category,
      "server",
    );
    assert.equal(
      toBillingError({ status: 401, body: { detail: "nope" } }).category,
      "fatal",
    );
  });

  it("preserves BillingClientError shape", () => {
    const original = new BillingClientError({
      code: "POLL_TIMEOUT",
      category: "pending",
      message: "Timed out waiting for deposit confirmation.",
    });
    assert.deepEqual(toBillingError(original), original.toJSON());
  });
});
