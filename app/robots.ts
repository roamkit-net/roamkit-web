import type { MetadataRoute } from "next";

import { buildRobots } from "@/lib/seo/robots";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  return buildRobots();
}
