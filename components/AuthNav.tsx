"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  AccountCluster,
  AccountClusterSkeleton,
} from "@/components/AccountCluster";
import { BalanceChip } from "@/components/billing/BalanceChip";
import { UserMenu } from "@/components/UserMenu";
import { buttonClassName } from "@/components/ui/Button";
import {
  ApiError,
  clearTokens,
  fetchMe,
  isAuthenticated,
} from "@/lib/api";
import { routes } from "@/lib/routes";

type AuthNavState =
  | { status: "loading" }
  | { status: "anonymous" }
  | { status: "authenticated"; email: string };

export type AuthNavVariant = "app" | "landing";

type AuthNavProps = {
  /**
   * `landing` only changes visual presentation for the marketing homepage.
   * Authentication behaviour must remain identical to the default app variant.
   */
  variant?: AuthNavVariant;
};

/** Landing Sign-in keeps marketing CTA chrome (not AppShell primary). */
const LANDING_SIGN_IN =
  "rounded-lg px-4 py-2.5 text-sm font-semibold outline-none transition landing-cta";

export function AuthNav({ variant = "app" }: AuthNavProps) {
  const [state, setState] = useState<AuthNavState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      if (!isAuthenticated()) {
        if (!cancelled) setState({ status: "anonymous" });
        return;
      }
      try {
        const me = await fetchMe();
        if (!cancelled) {
          setState({ status: "authenticated", email: me.email });
        }
      } catch (err) {
        if (cancelled) {
          return;
        }
        if (err instanceof ApiError && err.status === 401) {
          clearTokens();
        }
        setState({ status: "anonymous" });
      }
    }

    void resolve();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === "loading") {
    return <AccountClusterSkeleton />;
  }

  if (state.status === "authenticated") {
    return (
      <AccountCluster>
        <BalanceChip embedded />
        <UserMenu email={state.email} />
      </AccountCluster>
    );
  }

  return (
    <Link
      href={routes.login}
      className={
        variant === "landing"
          ? LANDING_SIGN_IN
          : buttonClassName({ variant: "primary", size: "md", tone: "app" })
      }
    >
      Sign in
    </Link>
  );
}
