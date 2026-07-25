import { isAuthenticated } from "@/lib/api";

/** Whether the browser has an auth session for billing queries. */
export function isBillingSessionActive(): boolean {
  return isAuthenticated();
}

/** Duck-type HTTP status without importing ApiError into UI. */
export function isBillingHttpStatus(
  error: unknown,
  status: number,
): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }
  return "status" in error && (error as { status: unknown }).status === status;
}
