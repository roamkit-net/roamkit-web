import type { MetadataRoute } from "next";

import { isSeoIndexingEnabled } from "./indexing";
import { canonicalUrl } from "./origin";

export function buildRobots(
  env: NodeJS.ProcessEnv = process.env,
): MetadataRoute.Robots {
  if (!isSeoIndexingEnabled(env)) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/version"],
    },
    sitemap: canonicalUrl("/sitemap.xml"),
  };
}
