import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import { LocationDetail } from "@/components/LocationDetail";
import { ApiError, fetchAllPackages, fetchLocation } from "@/lib/api";

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
    return { title: "Not found — RoamKit" };
  }

  try {
    const location = await fetchLocation(slug);
    return {
      title: `${location.title} eSIMs — RoamKit`,
      description: `Browse ${location.title} eSIM data plans on RoamKit.`,
    };
  } catch {
    return { title: "Destination — RoamKit" };
  }
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

  try {
    const [location, packages] = await Promise.all([
      fetchLocation(slug),
      fetchAllPackages({ location: slug }),
    ]);

    return <LocationDetail location={location} packages={packages} />;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }
}
