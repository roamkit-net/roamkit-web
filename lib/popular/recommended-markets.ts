/**
 * Product recommendations by viewer country.
 *
 * These are NOT geographic neighbours.
 * They represent destinations where users from the
 * given country are most likely to need a RoamKit eSIM.
 *
 * Unknown countries intentionally fall back to:
 * Local → Europe/Global → Curated.
 *
 * Future:
 * Static recommendations may later be replaced
 * by analytics-driven rankings.
 *
 * Phase 1: hand-tune only high-traffic viewer markets (~10–20).
 * Do not expand this map to every ISO country.
 */
export const RECOMMENDED_MARKETS: Readonly<
  Record<string, readonly string[]>
> = {
  HR: [
    "BA", // Bosnia – cross-border, outside EU roaming
    "ME", // Montenegro
    "RS", // Serbia
  ],
  DE: ["AT", "FR", "IT", "NL", "CH"],
  GB: ["FR", "ES", "IT", "DE", "PT"],
  US: ["CA", "MX", "GB", "JP", "FR"],
};

export function recommendedMarketsFor(
  viewerCountry: string,
): readonly string[] {
  return RECOMMENDED_MARKETS[viewerCountry] ?? [];
}
