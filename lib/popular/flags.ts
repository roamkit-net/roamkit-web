/**
 * Server-only feature flag for geo-aware Popular ranking.
 * Not NEXT_PUBLIC — flip at runtime without rebuilding the client bundle.
 */
export function isPopularGeoRankingEnabled(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  const raw = env.POPULAR_GEO_RANKING_ENABLED?.trim().toLowerCase();
  if (raw === undefined || raw === "") {
    return true;
  }
  return raw !== "false" && raw !== "0" && raw !== "off" && raw !== "no";
}
