"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AccountClusterSkeleton } from "@/components/AccountCluster";
import { AuthNav } from "@/components/AuthNav";
import { isAuthenticated } from "@/lib/api";
import { routes } from "@/lib/routes";

type AuthState = "loading" | "anonymous" | "authenticated";

/**
 * Landing header right chrome: AuthNav when a session token exists;
 * Log in + Sign up when anonymous.
 */
export function LandingHeaderActions() {
  const [state, setState] = useState<AuthState>("loading");

  useEffect(() => {
    setState(isAuthenticated() ? "authenticated" : "anonymous");
  }, []);

  if (state === "loading") {
    return <AccountClusterSkeleton />;
  }

  if (state === "authenticated") {
    return <AuthNav />;
  }

  return (
    <div className="flex items-center gap-3 sm:gap-4">
      <Link
        href={routes.login}
        className="text-sm font-medium text-slate-300 outline-none transition hover:text-white focus-visible:ring-2 focus-visible:ring-cyan-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070a]"
      >
        Log in
      </Link>
      <Link
        href={routes.register}
        className="rounded-lg bg-cyan-500 px-3 py-1.5 text-sm font-semibold text-slate-950 outline-none transition hover:bg-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070a]"
      >
        Sign up
      </Link>
    </div>
  );
}
