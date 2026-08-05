"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type PropsWithChildren } from "react";

import { OpsShell } from "@/components/ops/OpsShell";
import { ListSkeleton } from "@/components/ui/ListSkeleton";
import {
  ApiError,
  clearTokens,
  fetchMe,
  isAuthenticated,
} from "@/lib/api";
import { loginHref } from "@/lib/navigation/safePath";
import { routes } from "@/lib/routes";

export default function AdminLayout({ children }: PropsWithChildren) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const isForbidden = pathname === routes.adminForbidden;

  useEffect(() => {
    let cancelled = false;

    async function gate() {
      if (!isAuthenticated()) {
        router.replace(loginHref(pathname || routes.adminDashboard));
        return;
      }
      try {
        const me = await fetchMe();
        if (cancelled) return;
        if (!me.is_staff) {
          if (!isForbidden) {
            router.replace(routes.adminForbidden);
          } else {
            setReady(true);
          }
          return;
        }
        setReady(true);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          clearTokens();
          router.replace(loginHref(pathname || routes.adminDashboard));
          return;
        }
        if (err instanceof ApiError && err.status === 403) {
          router.replace(routes.adminForbidden);
          return;
        }
        router.replace(routes.adminForbidden);
      }
    }

    void gate();
    return () => {
      cancelled = true;
    };
  }, [router, pathname, isForbidden]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-slate-100 px-4 py-10">
        <div className="mx-auto max-w-6xl">
          <ListSkeleton rows={2} label="Checking staff access…" />
        </div>
      </div>
    );
  }

  if (isForbidden) {
    return <>{children}</>;
  }

  return <OpsShell>{children}</OpsShell>;
}
