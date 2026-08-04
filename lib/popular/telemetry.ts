export type PopularRankingSource = "geo" | "fallback" | "flag_off";

export type PopularRankingMeta = {
  ranking_source: PopularRankingSource;
  viewer_country: string | null;
};

/**
 * No-op analytics hook for Popular ranking. Wire a real sink later.
 */
export function recordPopularRankingMeta(meta: PopularRankingMeta): void {
  void meta;
}
