import { fetchApi } from "@/lib/api";
import { rethrowOrgApiError } from "@/lib/org/errors";
import type {
  Membership,
  Organization,
  OrganizationInvite,
  OrganizationInviteAcceptResponse,
  OrganizationInviteCreatePayload,
  OrganizationInviteCreateResponse,
} from "@/types/org";

const NO_STORE = { auth: true as const, cache: "no-store" as RequestCache };

export type OrgRequestOptions = {
  signal?: AbortSignal;
};

/** GET /api/v1/orgs/ */
export async function listOrganizations(
  options?: OrgRequestOptions,
): Promise<Organization[]> {
  try {
    return await fetchApi<Organization[]>("/api/v1/orgs/", {
      ...NO_STORE,
      signal: options?.signal,
    });
  } catch (error) {
    rethrowOrgApiError(error, "Unable to load organizations.");
  }
}

/** POST /api/v1/orgs/ — creates org + team Account + owner membership. */
export async function createOrganization(
  name: string,
  options?: OrgRequestOptions,
): Promise<Organization> {
  try {
    return await fetchApi<Organization>("/api/v1/orgs/", {
      method: "POST",
      ...NO_STORE,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
      signal: options?.signal,
    });
  } catch (error) {
    rethrowOrgApiError(error, "Unable to create organization.");
  }
}

/** GET /api/v1/orgs/{id}/ */
export async function getOrganization(
  organizationId: string,
  options?: OrgRequestOptions,
): Promise<Organization> {
  try {
    return await fetchApi<Organization>(`/api/v1/orgs/${organizationId}/`, {
      ...NO_STORE,
      signal: options?.signal,
    });
  } catch (error) {
    rethrowOrgApiError(error, "Unable to load organization.");
  }
}

/** GET /api/v1/orgs/{id}/members/ */
export async function listOrganizationMembers(
  organizationId: string,
  options?: OrgRequestOptions,
): Promise<Membership[]> {
  try {
    return await fetchApi<Membership[]>(
      `/api/v1/orgs/${organizationId}/members/`,
      {
        ...NO_STORE,
        signal: options?.signal,
      },
    );
  } catch (error) {
    rethrowOrgApiError(error, "Unable to load members.");
  }
}

/** PATCH /api/v1/orgs/{id}/members/{membershipId}/ */
export async function updateOrganizationMemberRole(
  organizationId: string,
  membershipId: string,
  role: "admin" | "member" | "viewer",
  options?: OrgRequestOptions,
): Promise<Membership> {
  try {
    return await fetchApi<Membership>(
      `/api/v1/orgs/${organizationId}/members/${membershipId}/`,
      {
        method: "PATCH",
        ...NO_STORE,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
        signal: options?.signal,
      },
    );
  } catch (error) {
    rethrowOrgApiError(error, "Unable to update member role.");
  }
}

/** POST /api/v1/orgs/{id}/members/{membershipId}/revoke/ */
export async function revokeOrganizationMember(
  organizationId: string,
  membershipId: string,
  options?: OrgRequestOptions,
): Promise<Membership> {
  try {
    return await fetchApi<Membership>(
      `/api/v1/orgs/${organizationId}/members/${membershipId}/revoke/`,
      {
        method: "POST",
        ...NO_STORE,
        signal: options?.signal,
      },
    );
  } catch (error) {
    rethrowOrgApiError(error, "Unable to revoke membership.");
  }
}

/** GET /api/v1/orgs/{id}/invites/ */
export async function listPendingInvites(
  organizationId: string,
  options?: OrgRequestOptions,
): Promise<OrganizationInvite[]> {
  try {
    return await fetchApi<OrganizationInvite[]>(
      `/api/v1/orgs/${organizationId}/invites/`,
      {
        ...NO_STORE,
        signal: options?.signal,
      },
    );
  } catch (error) {
    rethrowOrgApiError(error, "Unable to load invites.");
  }
}

/**
 * POST /api/v1/orgs/{id}/invites/
 * Returns plaintext ``token`` only on this response — never persisted by the API.
 */
export async function createOrganizationInvite(
  organizationId: string,
  payload: OrganizationInviteCreatePayload,
  options?: OrgRequestOptions,
): Promise<OrganizationInviteCreateResponse> {
  try {
    return await fetchApi<OrganizationInviteCreateResponse>(
      `/api/v1/orgs/${organizationId}/invites/`,
      {
        method: "POST",
        ...NO_STORE,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: options?.signal,
      },
    );
  } catch (error) {
    rethrowOrgApiError(error, "Unable to create invite.");
  }
}

/** POST /api/v1/orgs/{id}/invites/{inviteId}/revoke/ */
export async function revokeOrganizationInvite(
  organizationId: string,
  inviteId: string,
  options?: OrgRequestOptions,
): Promise<OrganizationInvite> {
  try {
    return await fetchApi<OrganizationInvite>(
      `/api/v1/orgs/${organizationId}/invites/${inviteId}/revoke/`,
      {
        method: "POST",
        ...NO_STORE,
        signal: options?.signal,
      },
    );
  } catch (error) {
    rethrowOrgApiError(error, "Unable to revoke invite.");
  }
}

/** POST /api/v1/orgs/invites/accept/ — capability token; no prior membership. */
export async function acceptOrganizationInvite(
  token: string,
  options?: OrgRequestOptions,
): Promise<OrganizationInviteAcceptResponse> {
  try {
    return await fetchApi<OrganizationInviteAcceptResponse>(
      "/api/v1/orgs/invites/accept/",
      {
        method: "POST",
        ...NO_STORE,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
        signal: options?.signal,
      },
    );
  } catch (error) {
    rethrowOrgApiError(error, "Unable to accept invite.");
  }
}
