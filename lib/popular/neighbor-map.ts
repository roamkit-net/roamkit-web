/**
 * Product decision: neighbor relevance is intentionally product-driven,
 * not geographic adjacency. Entries are "nearest / most relevant" destinations
 * for travelers browsing from that market — e.g. Germany next to Croatia
 * because it is a high-intent trip, not because of a shared border.
 *
 * Do not "fix" this map to political borders without a product decision.
 */
export const NEIGHBOR_MAP: Readonly<Record<string, readonly string[]>> = {
  HR: ["IT", "SI", "AT", "DE", "BA"],
  DE: ["AT", "FR", "IT", "NL", "CH"],
  GB: ["FR", "ES", "IT", "DE", "PT"],
  US: ["CA", "MX", "GB", "JP", "FR"],
};

export function neighborsFor(viewerCountry: string): readonly string[] {
  return NEIGHBOR_MAP[viewerCountry] ?? [];
}
