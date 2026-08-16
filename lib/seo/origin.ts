/** Canonical origin for all indexable URLs. Never use staging host. */
export const PRODUCTION_ORIGIN = "https://roamkit.net";

export function canonicalUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (normalized === "/") {
    return `${PRODUCTION_ORIGIN}/`;
  }
  return `${PRODUCTION_ORIGIN}${normalized}`;
}
