import { ApiError, fetchApi } from "@/lib/api";
import type { PurchaseTopupPayload, TopupPurchase } from "@/types/orders";

function formatTopupError(body: unknown, fallback: string): string {
  if (!body || typeof body !== "object") {
    return fallback;
  }
  const record = body as Record<string, unknown>;
  if (typeof record.detail === "string" && record.detail) {
    return record.detail;
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

export type TopupRequestOptions = {
  signal?: AbortSignal;
};

/** POST /api/v1/me/esims/{id}/topups/ — debit credits then fulfill top-up. */
export async function purchaseTopup(
  esimId: string | number,
  payload: PurchaseTopupPayload,
  options?: TopupRequestOptions,
): Promise<TopupPurchase> {
  const id = encodeURIComponent(String(esimId));
  try {
    return await fetchApi<TopupPurchase>(`/api/v1/me/esims/${id}/topups/`, {
      method: "POST",
      auth: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: options?.signal,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw new ApiError(
        formatTopupError(error.body, "Unable to purchase top-up."),
        error.status,
        error.body,
      );
    }
    throw error;
  }
}
