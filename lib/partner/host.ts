/** Partner portal hosts. Consumer hosts stay on the store shell. */

export const TEAM_HOSTS = new Set([
  "team.roamkit.net",
  "team.staging.roamkit.net",
  "team.localhost",
]);

export function hostnameOf(host: string | null | undefined): string {
  return (host ?? "").split(":")[0].trim().toLowerCase();
}

export function isTeamHost(host: string | null | undefined): boolean {
  return TEAM_HOSTS.has(hostnameOf(host));
}

/** Public files such as `/landing/logo-r.png` must be served, not sent home. */
export function isTeamPublicAsset(path: string): boolean {
  if (!path.startsWith("/") || path.includes("..")) {
    return false;
  }
  const last = path.slice(path.lastIndexOf("/") + 1);
  return last.includes(".");
}

/** Team `next` may only be the portal routes. Anything else falls back to `/`. */
export function teamNextPath(raw: string | null | undefined): string {
  const path = (raw ?? "/").split("?")[0].split("#")[0];
  if (path === "/" || path === "/customers" || path === "/grants") {
    return path;
  }
  return "/";
}

/** Per-request CSP. Next stamps its inline bootstrap scripts with the nonce. */
export function teamContentSecurityPolicy(nonce: string): string {
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "img-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "connect-src 'self' https://api.staging.roamkit.net https://api.roamkit.net http://localhost:8000 http://127.0.0.1:8000",
  ].join("; ");
}
