/** App path helpers — prefer these over scattered string literals on landing. */

export const routes = {
  home: "/",
  plans: "/plans",
  login: "/login",
  register: "/register",
  deposit: "/me/deposit",
  esims: "/me/esims",
  orgs: "/me/orgs",
  orgCreate: "/me/orgs/new",
  orgInviteAccept: "/me/orgs/invites/accept",
  adminDashboard: "/admin/dashboard",
  adminMembers: "/admin/members",
  adminForbidden: "/admin/forbidden",
} as const;

export function adminMemberPath(id: number | string): string {
  return `/admin/members/${id}`;
}

export function organizationPath(organizationId: string): string {
  return `/me/orgs/${organizationId}`;
}

export function organizationInviteAcceptPath(token?: string): string {
  if (!token) {
    return routes.orgInviteAccept;
  }
  return `${routes.orgInviteAccept}?token=${encodeURIComponent(token)}`;
}

/** Store URL for a catalog location slug (`europe` → `/europe-esim`). */
export function locationEsimPath(slug: string): string {
  return `/${slug}-esim`;
}

/** Crawlable catalog tab href. Popular is canonical `/plans` (no query). */
export function plansTabHref(
  tab: "popular" | "local" | "regional" | "global" | "all",
): string {
  if (tab === "popular") {
    return routes.plans;
  }
  return `${routes.plans}?tab=${tab}`;
}

export const CONTACT_EMAIL = "support@roamkit.net";

export const contactMailto = `mailto:${CONTACT_EMAIL}`;

/** Canonical site origin for metadata (matches AppKit fallback). */
export function siteOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://roamkit.net"
  );
}
