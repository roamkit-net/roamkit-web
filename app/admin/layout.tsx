import type { ReactNode } from "react";

import { AdminGate } from "@/components/admin/AdminGate";
import { noIndexMetadata } from "@/lib/seo/metadata";

export const metadata = noIndexMetadata;

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminGate>{children}</AdminGate>;
}
