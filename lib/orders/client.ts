import { ApiError, fetchApi } from "@/lib/api";
import type { CreateOrderPayload, Order } from "@/types/orders";

function formatOrderError(body: unknown, fallback: string): string {
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

export type OrderRequestOptions = {
  signal?: AbortSignal;
};

/** POST /api/v1/orders/ — debit credits then fulfill. */
export async function createOrder(
  payload: CreateOrderPayload,
  options?: OrderRequestOptions,
): Promise<Order> {
  try {
    return await fetchApi<Order>("/api/v1/orders/", {
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
        formatOrderError(error.body, "Unable to complete purchase."),
        error.status,
        error.body,
      );
    }
    throw error;
  }
}
