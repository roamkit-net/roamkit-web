/** First-segment app routes and global aliases that must never become /{slug}-esim. */
export const RESERVED_LOCATION_SLUGS = new Set([
  "login",
  "register",
  "forgot-password",
  "reset-password",
  "set-password",
  "me",
  "admin",
  "plans",
  "version",
  "world",
  "worldwide",
  "discover",
  "discover-global",
]);

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isIndexableLocationSlug(slug: string): boolean {
  if (!SLUG_RE.test(slug)) {
    return false;
  }
  return !RESERVED_LOCATION_SLUGS.has(slug);
}

/** Lowercase, validate, drop reserved/aliases, dedupe, sort. */
export function indexableLocationSlugs(slugs: Iterable<string>): string[] {
  const unique = new Set<string>();
  for (const raw of slugs) {
    const slug = raw.trim().toLowerCase();
    if (isIndexableLocationSlug(slug)) {
      unique.add(slug);
    }
  }
  return [...unique].sort();
}
