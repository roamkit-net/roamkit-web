import {
  ApiError,
  clearTokens,
  getAccessToken,
  getApiBaseUrl,
} from "@/lib/api";

import { teamNextPath } from "./host";
import type { PartnerContextItem } from "./selection";

export type PartnerRole = "owner" | "admin" | "viewer" | "";

export type PartnerSummary = {
  total_earned: string;
  available_balance: string;
  accrual_counts: {
    order: number;
    topup: number;
    subscription: number;
    total: number;
  };
};

export type PartnerCustomer = {
  customer_id: number;
  email: string;
  display_name: string;
  attributed_at: string;
  total_partner_earned: string;
  accrual_count: number;
};

export type PartnerCustomersPage = {
  count: number;
  page: number;
  page_size: number;
  results: PartnerCustomer[];
};

export type PartnerGrant = {
  grant_id: string;
  customer_id: number;
  email: string | null;
  display_name: string;
  amount: string;
  granted_by: {
    user_id: number;
    email: string | null;
    display_name: string;
  } | null;
  created_at: string;
};

export type PartnerGrantsPage = {
  count: number;
  page: number;
  page_size: number;
  results: PartnerGrant[];
};

export type PartnerInvite = {
  url: string;
  is_active: boolean;
  created_at: string;
  regenerated_at: string | null;
};

type PartnerResult<T> = { data: T; role: PartnerRole };

function roleOf(response: Response): PartnerRole {
  const value = response.headers.get("X-Partner-Role");
  if (value === "owner" || value === "admin" || value === "viewer") {
    return value;
  }
  return "";
}

export async function partnerFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<PartnerResult<T>> {
  const headers = new Headers(init?.headers);
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }
  const access = getAccessToken();
  if (access) {
    headers.set("Authorization", `Bearer ${access}`);
  }
  const response = await fetch(`${getApiBaseUrl().replace(/\/$/, "")}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });
  if (response.status === 401 && typeof window !== "undefined") {
    clearTokens();
    const next = teamNextPath(window.location.pathname);
    window.location.assign(`/login?next=${encodeURIComponent(next)}`);
  }
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const code =
      body && typeof body === "object" && "code" in body
        ? String((body as { code: string }).code)
        : "request_failed";
    throw new ApiError(code, response.status, body);
  }
  return { data: body as T, role: roleOf(response) };
}

function channelPath(channelId: string, suffix: string): string {
  return `/api/v1/partner/channels/${encodeURIComponent(channelId)}/${suffix}`;
}

export function partnerContextsPath(): string {
  return "/api/v1/partner/contexts/";
}

export function partnerSummaryPath(channelId: string): string {
  return channelPath(channelId, "summary/");
}

export function partnerCustomersPath(channelId: string, params: URLSearchParams): string {
  const query = params.toString();
  const suffix = query ? `?${query}` : "";
  return `${channelPath(channelId, "customers/")}${suffix}`;
}

export function partnerGrantsPath(channelId: string, params: URLSearchParams): string {
  const query = params.toString();
  const suffix = query ? `?${query}` : "";
  return `${channelPath(channelId, "grants/")}${suffix}`;
}

export function partnerInvitePath(
  channelId: string,
  action?: "regenerate" | "activate" | "deactivate",
): string {
  const suffix = action ? `invite-link/${action}/` : "invite-link/";
  return channelPath(channelId, suffix);
}

export function fetchPartnerContexts() {
  return partnerFetch<{ contexts: PartnerContextItem[] }>(partnerContextsPath());
}

export function fetchSummary(channelId: string) {
  return partnerFetch<PartnerSummary>(partnerSummaryPath(channelId));
}

export function fetchCustomers(channelId: string, params: URLSearchParams) {
  return partnerFetch<PartnerCustomersPage>(partnerCustomersPath(channelId, params));
}

export function fetchGrants(channelId: string, params: URLSearchParams) {
  return partnerFetch<PartnerGrantsPage>(partnerGrantsPath(channelId, params));
}

export function fetchInvite(channelId: string) {
  return partnerFetch<PartnerInvite>(partnerInvitePath(channelId));
}

export function mutateInvite(
  channelId: string,
  action: "regenerate" | "activate" | "deactivate",
) {
  return partnerFetch<PartnerInvite>(partnerInvitePath(channelId, action), {
    method: "POST",
  });
}

export function postGrant(
  channelId: string,
  body: {
    customer_id: number;
    amount: string;
    idempotency_key: string;
  },
) {
  return partnerFetch<{ grant_id: string }>(partnerGrantsPath(channelId, new URLSearchParams()), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
