import type { MetadataRoute } from "next";

import { fetchAllLocations } from "@/lib/api";
import { sitemapFromCatalog } from "@/lib/seo/sitemap";

export const dynamic = "force-dynamic";

const SITEMAP_REVALIDATE_SECONDS = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return sitemapFromCatalog(() =>
    fetchAllLocations(undefined, { revalidate: SITEMAP_REVALIDATE_SECONDS }),
  );
}
