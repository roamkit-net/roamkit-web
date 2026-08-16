import type { MetadataRoute } from "next";

import type { Location } from "@/lib/api";
import { locationEsimPath, routes } from "@/lib/routes";

import { canonicalUrl } from "./origin";
import { indexableLocationSlugs } from "./slugs";

export function staticSitemapEntries(): MetadataRoute.Sitemap {
  return [
    { url: canonicalUrl(routes.home) },
    { url: canonicalUrl(routes.plans) },
  ];
}

export function buildSitemapEntries(
  locations: Pick<Location, "slug">[],
): MetadataRoute.Sitemap {
  const slugs = indexableLocationSlugs(locations.map((location) => location.slug));
  const entries: MetadataRoute.Sitemap = [
    ...staticSitemapEntries(),
    ...slugs.map((slug) => ({ url: canonicalUrl(locationEsimPath(slug)) })),
  ];
  return entries.filter((entry) => entry.url.startsWith("https://roamkit.net/"));
}

export function assertProductionSitemapUrls(
  entries: MetadataRoute.Sitemap,
): void {
  for (const entry of entries) {
    if (!entry.url.startsWith("https://roamkit.net/")) {
      throw new Error(`Sitemap URL is not production origin: ${entry.url}`);
    }
  }
}

export async function sitemapFromCatalog(
  load: () => Promise<Pick<Location, "slug">[]>,
): Promise<MetadataRoute.Sitemap> {
  try {
    return buildSitemapEntries(await load());
  } catch {
    return staticSitemapEntries();
  }
}
