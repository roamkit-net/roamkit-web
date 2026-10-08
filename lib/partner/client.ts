import {
  ApiError,
  clearTokens,
  getAccessToken,
  getApiBaseUrl,
} from "@/lib/api";

import { teamNextPath } from "./host";

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
  amount: string;
  granted_by: { user_id: number; email: string | null } | null;
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

export function fetchSummary() {
  return partnerFetch<PartnerSummary>("/api/v1/orgs/partner/summary/");
}

export function fetchCustomers(params: URLSearchParams) {
  const query = params.toString();
  const suffix = query ? `?${query}` : "";
  return partnerFetch<PartnerCustomersPage>(
    `/api/v1/orgs/partner/customers/${suffix}`,
  );
}

export function fetchGrants(params: URLSearchParams) {
  const query = params.toString();
  const suffix = query ? `?${query}` : "";
  return partnerFetch<PartnerGrantsPage>(`/api/v1/orgs/partner/grants/${suffix}`);
}

export function fetchInvite() {
  return partnerFetch<PartnerInvite>("/api/v1/orgs/partner/invite-link/");
}

export function mutateInvite(action: "regenerate" | "activate" | "deactivate") {
  return partnerFetch<PartnerInvite>(`/api/v1/orgs/partner/invite-link/${action}/`, {
    method: "POST",
  });
}

export function postGrant(body: {
  customer_id: number;
  amount: string;
  idempotency_key: string;
}) {
  return partnerFetch<{ grant_id: string }>("/api/v1/billing/partner-grants/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
