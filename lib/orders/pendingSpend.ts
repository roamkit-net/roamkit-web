/**
 * Pending spend invariants
 *
 * - At most one pending spend exists.
 * - Pending spend is ephemeral.
 * - Pending spend is removed on:
 *   - successful retry
 *   - explicit dismiss
 *   - logout / auth reset
 *   - TTL expiry
 * - Auto-retry is allowed only while a valid pending spend exists.
 */

export type PendingOrderSpend = {
  kind: "order";
  packageId: string;
  idempotencyKey: string;
  returnPath: string;
  createdAt: number;
};

export type PendingTopupSpend = {
  kind: "topup";
  esimId: string;
  packageId: string;
  idempotencyKey: string;
  returnPath: string;
  createdAt: number;
};

export type PendingSpend = PendingOrderSpend | PendingTopupSpend;

const STORAGE_KEY = "roamkit_pending_spend";
/** Pending spend older than this is removed on peek. Exported for tests. */
export const MAX_AGE_MS = 30 * 60 * 1000; // 30 minutes

function canUseSessionStorage(): boolean {
  return typeof window !== "undefined" && typeof sessionStorage !== "undefined";
}

function isPendingSpend(value: unknown): value is PendingSpend {
  if (!value || typeof value !== "object") {
    return false;
  }
  const record = value as Record<string, unknown>;
  if (
    typeof record.packageId !== "string" ||
    typeof record.idempotencyKey !== "string" ||
    typeof record.returnPath !== "string" ||
    typeof record.createdAt !== "number"
  ) {
    return false;
  }
  if (record.kind === "order") {
    return true;
  }
  if (record.kind === "topup" && typeof record.esimId === "string") {
    return true;
  }
  return false;
}

function isFresh(spend: PendingSpend, now = Date.now()): boolean {
  return now - spend.createdAt <= MAX_AGE_MS;
}

export function savePendingSpend(
  spend: Omit<PendingOrderSpend, "createdAt"> | Omit<PendingTopupSpend, "createdAt">,
): void {
  if (!canUseSessionStorage()) {
    return;
  }
  const payload: PendingSpend = { ...spend, createdAt: Date.now() };
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function peekPendingSpend(): PendingSpend | null {
  if (!canUseSessionStorage()) {
    return null;
  }
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isPendingSpend(parsed) || !isFresh(parsed)) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    sessionStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function clearPendingSpend(): void {
  if (!canUseSessionStorage()) {
    return;
  }
  // Best-effort: never throw — callers like clearTokens() must still clear auth.
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Private mode / blocked storage / SecurityError, etc.
  }
}

/**
 * Take a pending spend only when it matches the page we returned to.
 * Prevents accidental retries on unrelated routes.
 */
export function takePendingSpendForReturn(
  currentPath: string,
): PendingSpend | null {
  const pending = peekPendingSpend();
  if (!pending) {
    return null;
  }
  if (pending.returnPath !== currentPath) {
    return null;
  }
  clearPendingSpend();
  return pending;
}
