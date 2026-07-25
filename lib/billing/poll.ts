import { BillingClientError } from "@/lib/billing/errors";
import { abortError, sleep } from "@/lib/billing/wait";

/**
 * Pure async polling helper — no React imports or hooks.
 * Deposit/spend UI may call this from effects or event handlers.
 */

/** Default poll interval for deposit 202 / pending flows. */
export const DEPOSIT_POLL_INTERVAL_MS = 15_000;

/** Hard stop after five minutes of wall-clock time. */
export const DEPOSIT_POLL_TIMEOUT_MS = 5 * 60_000;

export type PollUntilOptions<T> = {
  intervalMs?: number;
  timeoutMs?: number;
  signal?: AbortSignal;
  /** Return true when polling should stop (e.g. completed/failed). */
  shouldStop: (value: T) => boolean;
  /**
   * Visibility gate. When false, polling pauses (no requests) until true again.
   * Defaults to `document.visibilityState === "visible"` in browsers.
   */
  isDocumentVisible?: () => boolean;
  delay?: (ms: number, signal?: AbortSignal) => Promise<void>;
  now?: () => number;
};

/** Terminal deposit statuses (case-insensitive). */
export function isTerminalDepositStatus(status: string): boolean {
  const normalized = status.trim().toLowerCase();
  return normalized === "completed" || normalized === "failed";
}

function defaultIsDocumentVisible(): boolean {
  if (typeof document === "undefined") {
    return true;
  }
  return document.visibilityState === "visible";
}

async function waitWhileHidden(
  isDocumentVisible: () => boolean,
  signal: AbortSignal | undefined,
  delay: (ms: number, signal?: AbortSignal) => Promise<void>,
): Promise<void> {
  while (!isDocumentVisible()) {
    if (signal?.aborted) {
      throw abortError();
    }
    await delay(250, signal);
  }
}

/**
 * Poll an async operation until `shouldStop` is true, abort, or timeout.
 *
 * Rules:
 * - interval defaults to 15s
 * - stops when shouldStop(value) is true (use completed|failed for deposits)
 * - times out after 5 minutes (wall clock)
 * - pauses requests while the document is hidden
 */
export async function pollUntil<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  options: PollUntilOptions<T>,
): Promise<T> {
  const intervalMs = options.intervalMs ?? DEPOSIT_POLL_INTERVAL_MS;
  const timeoutMs = options.timeoutMs ?? DEPOSIT_POLL_TIMEOUT_MS;
  const delay = options.delay ?? sleep;
  const now = options.now ?? Date.now;
  const isDocumentVisible = options.isDocumentVisible ?? defaultIsDocumentVisible;
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

  const startedAt = now();

  try {
    while (true) {
      if (controller.signal.aborted) {
        throw abortError();
      }

      await waitWhileHidden(isDocumentVisible, controller.signal, delay);

      if (now() - startedAt >= timeoutMs) {
        throw new BillingClientError({
          code: "POLL_TIMEOUT",
          category: "pending",
          message: "Timed out waiting for deposit confirmation.",
        });
      }

      const value = await operation(controller.signal);
      if (options.shouldStop(value)) {
        return value;
      }

      const remaining = timeoutMs - (now() - startedAt);
      if (remaining <= 0) {
        throw new BillingClientError({
          code: "POLL_TIMEOUT",
          category: "pending",
          message: "Timed out waiting for deposit confirmation.",
        });
      }

      await delay(Math.min(intervalMs, remaining), controller.signal);
    }
  } finally {
    parent?.removeEventListener("abort", onParentAbort);
  }
}
