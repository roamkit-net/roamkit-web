const INVALID_HEADERS = new Set(["XX", "T1"]);

/**
 * Normalize a candidate country value to ISO2, or null if unusable.
 */
export function normalizeCountryCode(
  value: string | null | undefined,
): string | null {
  if (value == null) {
    return null;
  }
  const code = value.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code) || INVALID_HEADERS.has(code)) {
    return null;
  }
  return code;
}

export type ViewerCountrySources = {
  cookieCountry?: string | null;
  profileCountry?: string | null;
  headerCountry?: string | null;
};

/**
 * Resolve viewer country for Popular ranking.
 * Priority: cookie override → profile stub → CF-IPCountry (or equivalent) header.
 */
export function getViewerCountry(sources: ViewerCountrySources): string | null {
  return (
    normalizeCountryCode(sources.cookieCountry) ??
    normalizeCountryCode(sources.profileCountry) ??
    normalizeCountryCode(sources.headerCountry)
  );
}
