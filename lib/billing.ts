import { ApiError, fetchApi } from "@/lib/api";

export type BillingBalance = {
  balance: string;
};

export type DepositInfo = {
  wallet: string;
  chain_id: number;
  token_symbol: string;
  token_decimals: number;
  contract: string;
  min_confirmations: number;
  eip681_uri: string;
  walletconnect_enabled: boolean;
  subscriptions_enabled: boolean;
};

export type DepositRequest = {
  id: string;
  amount_requested: string;
  amount_credited: string | null;
  payment_method: string;
  tx_hash: string | null;
  idempotency_key: string;
  status: string;
  failure_reason: string | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
  confirmations?: number;
  required_confirmations?: number;
};

export type VerifyDepositPayload = {
  tx_hash: string;
  amount_requested: string;
  idempotency_key: string;
};

function formatBillingError(body: unknown, fallback: string): string {
  if (!body || typeof body !== "object") {
    return fallback;
  }
  const record = body as Record<string, unknown>;
  if (typeof record.detail === "string" && record.detail) {
    return record.detail;
  }
  if (typeof record.failure_reason === "string" && record.failure_reason) {
    return record.failure_reason;
  }
  const parts: string[] = [];
  for (const [key, value] of Object.entries(record)) {
    if (typeof value === "string") {
      parts.push(key === "detail" ? value : `${key}: ${value}`);
      continue;
    }
    if (Array.isArray(value)) {
      const joined = value.filter((item) => typeof item === "string").join(" ");
      if (joined) {
        parts.push(key === "non_field_errors" ? joined : `${key}: ${joined}`);
      }
    }
  }
  return parts.length > 0 ? parts.join(" ") : fallback;
}

export function formatBalance(balance: string): string {
  const value = Number(balance);
  if (!Number.isFinite(value)) {
    return balance;
  }
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  }).format(value);
}

export function newIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `deposit-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export async function fetchBillingBalance(): Promise<BillingBalance> {
  return fetchApi<BillingBalance>("/api/v1/billing/balance/", {
    auth: true,
    cache: "no-store",
  });
}

export async function fetchDepositInfo(): Promise<DepositInfo> {
  return fetchApi<DepositInfo>("/api/v1/billing/deposit-info/", {
    auth: true,
    cache: "no-store",
  });
}

async function verifyDeposit(
  path: "/api/v1/billing/verify-wallet/" | "/api/v1/billing/verify-cex/",
  payload: VerifyDepositPayload,
  fallbackError: string,
): Promise<DepositRequest> {
  try {
    return await fetchApi<DepositRequest>(path, {
      method: "POST",
      auth: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw new ApiError(
        formatBillingError(error.body, fallbackError),
        error.status,
        error.body,
      );
    }
    throw error;
  }
}

export async function verifyWalletDeposit(
  payload: VerifyDepositPayload,
): Promise<DepositRequest> {
  return verifyDeposit(
    "/api/v1/billing/verify-wallet/",
    payload,
    "Unable to verify wallet deposit.",
  );
}

export async function verifyCexDeposit(
  payload: VerifyDepositPayload,
): Promise<DepositRequest> {
  return verifyDeposit(
    "/api/v1/billing/verify-cex/",
    payload,
    "Unable to verify CEX deposit.",
  );
}

export function isDepositVerified(deposit: DepositRequest): boolean {
  return deposit.status === "completed";
}

export function isDepositPendingConfirmations(
  deposit: DepositRequest,
): boolean {
  return (
    deposit.status === "pending" &&
    typeof deposit.confirmations === "number" &&
    typeof deposit.required_confirmations === "number"
  );
}
