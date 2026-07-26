/**
 * Circuit breaker for public GET /api/v1/billing/config/.
 * After MAX_FAILURES attempts, pause network for BACKOFF_MS.
 */

export const MAX_FAILURES = 3;
export const BACKOFF_MS = 5 * 60 * 1000;

const CIRCUIT_STORAGE_KEY = "roamkit_billing_config_circuit";

export type CircuitState = {
  openUntil: number;
  failureCount: number;
};

function canUseSessionStorage(): boolean {
  return typeof window !== "undefined" && typeof sessionStorage !== "undefined";
}

export function readCircuitState(): CircuitState {
  if (!canUseSessionStorage()) {
    return { openUntil: 0, failureCount: 0 };
  }
  try {
    const raw = sessionStorage.getItem(CIRCUIT_STORAGE_KEY);
    if (!raw) {
      return { openUntil: 0, failureCount: 0 };
    }
    const parsed = JSON.parse(raw) as Partial<CircuitState>;
    return {
      openUntil:
        typeof parsed.openUntil === "number" && Number.isFinite(parsed.openUntil)
          ? parsed.openUntil
          : 0,
      failureCount:
        typeof parsed.failureCount === "number" &&
        Number.isFinite(parsed.failureCount)
          ? Math.max(0, Math.floor(parsed.failureCount))
          : 0,
    };
  } catch {
    return { openUntil: 0, failureCount: 0 };
  }
}

export function writeCircuitState(state: CircuitState): void {
  if (!canUseSessionStorage()) {
    return;
  }
  try {
    sessionStorage.setItem(CIRCUIT_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota / private mode
  }
}

export function clearCircuitState(): void {
  if (!canUseSessionStorage()) {
    return;
  }
  try {
    sessionStorage.removeItem(CIRCUIT_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function isCircuitOpen(
  state: CircuitState = readCircuitState(),
  now: number = Date.now(),
): boolean {
  return state.openUntil > now;
}

/**
 * Record one failed fetch attempt. Opens the circuit when failures reach MAX_FAILURES.
 */
export function recordCircuitFailure(
  state: CircuitState = readCircuitState(),
  now: number = Date.now(),
): CircuitState {
  const failureCount = state.failureCount + 1;
  const next: CircuitState = {
    failureCount,
    openUntil:
      failureCount >= MAX_FAILURES ? now + BACKOFF_MS : state.openUntil,
  };
  writeCircuitState(next);
  return next;
}

/** Reset after a successful config fetch. */
export function recordCircuitSuccess(): CircuitState {
  const next: CircuitState = { openUntil: 0, failureCount: 0 };
  writeCircuitState(next);
  return next;
}
