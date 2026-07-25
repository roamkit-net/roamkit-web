import { ApiError, fetchApi } from "@/lib/api";
import type {
  BillingBalance,
  DepositInfo,
  DepositRequest,
  VerifyDepositPayload,
} from "@/types/billing";

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

/** GET /api/v1/billing/balance/ */
export async function getBalance(): Promise<BillingBalance> {
  return fetchApi<BillingBalance>("/api/v1/billing/balance/", {
    auth: true,
    cache: "no-store",
  });
}

/** GET /api/v1/billing/deposit-info/ — SSoT for chain/token/wallet/flags. */
export async function getDepositInfo(): Promise<DepositInfo> {
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

/** POST /api/v1/billing/verify-cex/ */
export async function verifyCex(
  payload: VerifyDepositPayload,
): Promise<DepositRequest> {
  return verifyDeposit(
    "/api/v1/billing/verify-cex/",
    payload,
    "Unable to verify CEX deposit.",
  );
}

/** POST /api/v1/billing/verify-wallet/ */
export async function verifyWallet(
  payload: VerifyDepositPayload,
): Promise<DepositRequest> {
  return verifyDeposit(
    "/api/v1/billing/verify-wallet/",
    payload,
    "Unable to verify wallet deposit.",
  );
}
