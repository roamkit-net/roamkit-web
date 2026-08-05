/**
 * Pending deposit verify session (client-only).
 *
 * - At most one session.
 * - Survives refresh via localStorage (TTL 24h).
 * - Cleared on terminal success/fail, dismiss, logout, or TTL expiry.
 * - Never auto-resumes verify — UI must call Continue.
 */

export type PendingDepositMethod = "cex" | "wallet";

export type PendingDepositSession = {
  txHash: string;
  amount: string;
  idempotencyKey: string;
  method: PendingDepositMethod;
  updatedAt: number;
};

const STORAGE_KEY = "roamkit_pending_deposit";

/** Sessions older than this are removed on peek. Exported for tests. */
export const PENDING_DEPOSIT_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export type SavePendingDepositInput = Omit<PendingDepositSession, "updatedAt">;

function canUseLocalStorage(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function isPendingDepositSession(value: unknown): value is PendingDepositSession {
  if (!value || typeof value !== "object") {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    typeof record.txHash === "string" &&
    record.txHash.length > 0 &&
    typeof record.amount === "string" &&
    record.amount.length > 0 &&
    typeof record.idempotencyKey === "string" &&
    record.idempotencyKey.length > 0 &&
    (record.method === "cex" || record.method === "wallet") &&
    typeof record.updatedAt === "number" &&
    Number.isFinite(record.updatedAt)
  );
}

function isFresh(session: PendingDepositSession, now = Date.now()): boolean {
  return now - session.updatedAt <= PENDING_DEPOSIT_MAX_AGE_MS;
}

export function savePendingDeposit(input: SavePendingDepositInput): void {
  if (!canUseLocalStorage()) {
    return;
  }
  const payload: PendingDepositSession = {
    ...input,
    updatedAt: Date.now(),
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Private mode / quota — best-effort only.
  }
}

export function peekPendingDeposit(now = Date.now()): PendingDepositSession | null {
  if (!canUseLocalStorage()) {
    return null;
  }
  let raw: string | null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
  if (!raw) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isPendingDepositSession(parsed) || !isFresh(parsed, now)) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    return null;
  }
}

export function clearPendingDeposit(): void {
  if (!canUseLocalStorage()) {
    return;
  }
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Private mode / blocked storage — never throw (logout path).
  }
}

/** Truncate a TX hash for banner display (keeps 0x + 6…6). */
export function truncateTxHash(txHash: string): string {
  const trimmed = txHash.trim();
  if (trimmed.length <= 16) {
    return trimmed;
  }
  return `${trimmed.slice(0, 8)}…${trimmed.slice(-6)}`;
}
