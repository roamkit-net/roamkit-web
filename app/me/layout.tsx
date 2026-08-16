import type { ReactNode } from "react";

import { noIndexMetadata } from "@/lib/seo/metadata";

export const metadata = noIndexMetadata;

export default function MeLayout({ children }: { children: ReactNode }) {
  return children;
}
