/** App path helpers — prefer these over scattered string literals on landing. */

export const routes = {
  home: "/",
  plans: "/plans",
  login: "/login",
  register: "/register",
  deposit: "/me/deposit",
  esims: "/me/esims",
  adminDashboard: "/admin/dashboard",
  adminMembers: "/admin/members",
  adminForbidden: "/admin/forbidden",
} as const;

export function adminMemberPath(id: number | string): string {
  return `/admin/members/${id}`;
}

/** Store URL for a catalog location slug (`europe` → `/europe-esim`). */
export function locationEsimPath(slug: string): string {
  return `/${slug}-esim`;
}

export const CONTACT_EMAIL = "support@roamkit.net";

export const contactMailto = `mailto:${CONTACT_EMAIL}`;

/** Canonical site origin for metadata (matches AppKit fallback). */
export function siteOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://roamkit.net"
  );
}
