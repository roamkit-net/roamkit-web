import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import { LocationDetail } from "@/components/LocationDetail";
import { JsonLd } from "@/components/seo/JsonLd";
import { locationBreadcrumbJsonLd } from "@/lib/seo/jsonld";
import { loadLocationPage } from "@/lib/seo/locationLoader";
import { locationMetadata, noIndexMetadata } from "@/lib/seo/metadata";

const ESIM_SUFFIX = "-esim";

/** Partner/Airalo aliases → canonical /global-esim store URL. */
const GLOBAL_SLUG_REDIRECTS = new Set([
  "world",
  "worldwide",
  "discover",
  "discover-global",
]);

function parseLocationSlug(param: string): string | null {
  if (!param.endsWith(ESIM_SUFFIX)) {
    return null;
  }
  const slug = param.slice(0, -ESIM_SUFFIX.length);
  return slug || null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ location: string }>;
}): Promise<Metadata> {
  const { location: locationParam } = await params;
  const slug = parseLocationSlug(locationParam);
  if (!slug) {
    return { title: "Not found — RoamKit.net", ...noIndexMetadata };
  }

  if (GLOBAL_SLUG_REDIRECTS.has(slug.toLowerCase())) {
    return { title: "Global eSIMs — RoamKit.net" };
  }

  const result = await loadLocationPage(slug);
  if (result.status === "FOUND") {
    return locationMetadata(result.data.location);
  }
  if (result.status === "UPSTREAM_ERROR") {
    return { title: "Destination — RoamKit.net", ...noIndexMetadata };
  }
  return { title: "Not found — RoamKit.net", ...noIndexMetadata };
}

export default async function LocationEsimPage({
  params,
}: {
  params: Promise<{ location: string }>;
}) {
  const { location: locationParam } = await params;
  const slug = parseLocationSlug(locationParam);
  if (!slug) {
    notFound();
  }

  if (GLOBAL_SLUG_REDIRECTS.has(slug.toLowerCase())) {
    permanentRedirect("/global-esim");
  }

  const result = await loadLocationPage(slug);
  if (result.status === "NOT_FOUND" || result.status === "NO_ACTIVE_PLAN") {
    notFound();
  }
  if (result.status === "UPSTREAM_ERROR") {
    throw result.error;
  }

  return (
    <>
      <JsonLd data={locationBreadcrumbJsonLd(result.data.location)} />
      <LocationDetail
        location={result.data.location}
        packages={result.data.packages}
      />
    </>
  );
}
