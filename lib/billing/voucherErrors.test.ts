import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ApiError } from "@/lib/api";

import { QR_INVALID_MESSAGE, toVoucherUiError } from "./voucherErrors";

describe("toVoucherUiError", () => {
  it("maps business codes", () => {
    const err = new ApiError("bad", 400, {
      code: "voucher_expired",
      detail: "Voucher expired",
    });
    const mapped = toVoucherUiError(err);
    assert.equal(mapped.category, "business");
    assert.equal(mapped.message, "Voucher has expired.");
    assert.equal(mapped.retryable, false);
  });

  it("maps throttle and network", () => {
    assert.equal(
      toVoucherUiError(new ApiError("t", 429, { detail: "throttled" }))
        .category,
      "throttle",
    );
    assert.equal(toVoucherUiError(new TypeError("fetch")).category, "network");
    assert.equal(
      toVoucherUiError(new TypeError("fetch")).message.includes("connection"),
      true,
    );
  });
});

describe("QR_INVALID_MESSAGE", () => {
  it("is user-facing", () => {
    assert.match(QR_INVALID_MESSAGE, /QR code/i);
  });
});
