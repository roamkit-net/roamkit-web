import type { Location } from "@/lib/api";
import { locationEsimPath, routes } from "@/lib/routes";

import { canonicalUrl } from "./origin";

function coverageLabel(coverageType: Location["coverage_type"]): string {
  if (coverageType === "local") {
    return "Local";
  }
  if (coverageType === "regional") {
    return "Regional";
  }
  return "Global";
}

export function locationBreadcrumbJsonLd(location: Location): Record<string, unknown> {
  const destinationUrl = canonicalUrl(locationEsimPath(location.slug));
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Store",
        item: canonicalUrl(routes.plans),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: coverageLabel(location.coverage_type),
        item: canonicalUrl(routes.plans),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: location.title,
        item: destinationUrl,
      },
    ],
  };
}

/** Serialize JSON-LD and escape `<` so `</script>` cannot break out. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
