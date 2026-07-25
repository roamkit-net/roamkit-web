import { isBillingHttpStatus } from "@/lib/billing/session";
import { isAbortError, sleep } from "@/lib/billing/wait";

export type RetryOptions = {
  /** Total attempts including the first call. Default 3. */
  maxAttempts?: number;
  /** Initial backoff delay in ms. Default 400. */
  initialDelayMs?: number;
  /** Cap for exponential backoff. Default 8000. */
  maxDelayMs?: number;
  /** Multiplier applied after each failed attempt. Default 2. */
  factor?: number;
  /** Shared abort signal for the whole retry loop. */
  signal?: AbortSignal;
  /** Override which errors are retryable. */
  shouldRetry?: (error: unknown, attempt: number) => boolean;
  /** Injectable delay (tests). */
  delay?: (ms: number, signal?: AbortSignal) => Promise<void>;
};

export function defaultShouldRetry(error: unknown): boolean {
  if (isAbortError(error)) {
    return false;
  }
  if (isBillingHttpStatus(error, 400) || isBillingHttpStatus(error, 401)) {
    return false;
  }
  if (isBillingHttpStatus(error, 403) || isBillingHttpStatus(error, 404)) {
    return false;
  }
  if (isBillingHttpStatus(error, 402) || isBillingHttpStatus(error, 422)) {
    return false;
  }
  // Network failures, 408/429/5xx, and unknown errors are retryable.
  return true;
}

/**
 * Run an async operation with exponential backoff and AbortController support.
 * Passes the shared signal into each attempt so callers can cancel in-flight work.
 *
 * Idempotency: this helper never generates request payloads or idempotency keys.
 * Callers must close over a stable `idempotency_key` (and other body fields) so
 * every internal retry of the *same* logical request reuses that key.
 */
export async function withRetry<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? 3;
  const initialDelayMs = options.initialDelayMs ?? 400;
  const maxDelayMs = options.maxDelayMs ?? 8_000;
  const factor = options.factor ?? 2;
  const shouldRetry = options.shouldRetry ?? defaultShouldRetry;
  const delay = options.delay ?? sleep;
  const controller = new AbortController();
  const parent = options.signal;

  const onParentAbort = () => {
    controller.abort();
  };
  if (parent) {
    if (parent.aborted) {
      controller.abort();
    } else {
      parent.addEventListener("abort", onParentAbort, { once: true });
    }
  }

  let waitMs = initialDelayMs;
  let lastError: unknown;

  try {
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      if (controller.signal.aborted) {
        throw new DOMException("Aborted", "AbortError");
      }
      try {
        return await operation(controller.signal);
      } catch (error) {
        lastError = error;
        const retriesLeft = attempt < maxAttempts;
        if (!retriesLeft || !shouldRetry(error, attempt) || controller.signal.aborted) {
          throw error;
        }
        await delay(waitMs, controller.signal);
        waitMs = Math.min(maxDelayMs, Math.round(waitMs * factor));
      }
    }
  } finally {
    parent?.removeEventListener("abort", onParentAbort);
  }

  throw lastError;
}
