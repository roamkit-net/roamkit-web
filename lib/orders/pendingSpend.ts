/**
 * Persist a spend intent across the 402 → deposit → return hop.
 * Cleared on successful retry or explicit discard.
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
const MAX_AGE_MS = 60 * 60 * 1000; // 1 hour

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
  sessionStorage.removeItem(STORAGE_KEY);
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
