import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  BACKOFF_MS,
  clearCircuitState,
  isCircuitOpen,
  MAX_FAILURES,
  readCircuitState,
  recordCircuitFailure,
  recordCircuitSuccess,
} from "@/lib/billing/circuitBreaker";

describe("billing config circuit breaker", () => {
  it("exports named failure and backoff constants", () => {
    assert.equal(MAX_FAILURES, 3);
    assert.equal(BACKOFF_MS, 5 * 60 * 1000);
  });

  it("opens after MAX_FAILURES consecutive failures", () => {
    clearCircuitState();
    const t0 = 1_000_000;
    let state = readCircuitState();
    for (let i = 0; i < MAX_FAILURES - 1; i += 1) {
      state = recordCircuitFailure(state, t0);
      assert.equal(isCircuitOpen(state, t0), false);
    }
    state = recordCircuitFailure(state, t0);
    assert.equal(state.failureCount, MAX_FAILURES);
    assert.equal(isCircuitOpen(state, t0), true);
    assert.equal(state.openUntil, t0 + BACKOFF_MS);
    assert.equal(isCircuitOpen(state, t0 + BACKOFF_MS), false);
  });

  it("resets on success", () => {
    clearCircuitState();
    let state = recordCircuitFailure(readCircuitState(), 0);
    state = recordCircuitFailure(state, 0);
    state = recordCircuitFailure(state, 0);
    assert.equal(isCircuitOpen(state, 0), true);
    state = recordCircuitSuccess();
    assert.equal(state.failureCount, 0);
    assert.equal(isCircuitOpen(state, 0), false);
  });
});
