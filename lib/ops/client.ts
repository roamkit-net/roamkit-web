import { fetchApi } from "@/lib/api";
import type {
  OpsDashboard,
  OpsHealth,
  OpsPaginated,
  OpsSearchResponse,
  OpsUserDetail,
  OpsUserListItem,
} from "@/lib/ops/types";

const NO_STORE = { auth: true as const, cache: "no-store" as RequestCache };

export async function fetchOpsDashboard(): Promise<OpsDashboard> {
  return fetchApi<OpsDashboard>("/api/v1/admin/dashboard/", NO_STORE);
}

/** Manual health refresh only — do not call on initial dashboard load. */
export async function fetchOpsHealth(): Promise<OpsHealth> {
  return fetchApi<OpsHealth>("/api/v1/admin/health/", NO_STORE);
}

export async function fetchOpsSearch(q: string): Promise<OpsSearchResponse> {
  const params = new URLSearchParams({ q });
  return fetchApi<OpsSearchResponse>(
    `/api/v1/admin/search/?${params.toString()}`,
    NO_STORE,
  );
}

export async function fetchOpsUsers(opts?: {
  q?: string;
  page?: number;
}): Promise<OpsPaginated<OpsUserListItem>> {
  const params = new URLSearchParams();
  if (opts?.q) {
    params.set("q", opts.q);
  }
  if (opts?.page) {
    params.set("page", String(opts.page));
  }
  const qs = params.toString();
  const path = qs ? `/api/v1/admin/users/?${qs}` : "/api/v1/admin/users/";
  return fetchApi<OpsPaginated<OpsUserListItem>>(path, NO_STORE);
}

export async function fetchOpsUser(id: number | string): Promise<OpsUserDetail> {
  return fetchApi<OpsUserDetail>(`/api/v1/admin/users/${id}/`, NO_STORE);
}
