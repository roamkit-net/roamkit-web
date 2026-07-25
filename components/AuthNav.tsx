"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { BalanceChip } from "@/components/billing/BalanceChip";
import { UserMenu } from "@/components/UserMenu";
import {
  ApiError,
  clearTokens,
  fetchMe,
  isAuthenticated,
} from "@/lib/api";

type AuthNavState =
  | { status: "loading" }
  | { status: "anonymous" }
  | { status: "authenticated"; email: string };

const placeholderClassName =
  "inline-flex h-10 w-10 animate-pulse rounded-full bg-slate-200";

export function AuthNav() {
  const [state, setState] = useState<AuthNavState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      if (!isAuthenticated()) {
        if (!cancelled) {
          setState({ status: "anonymous" });
        }
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
    return (
      <div className="flex items-center gap-3">
        <span
          className="inline-flex h-10 w-[7.5rem] animate-pulse rounded-full bg-slate-200"
          aria-hidden="true"
        />
        <span className={placeholderClassName} aria-hidden="true" />
      </div>
    );
  }

  if (state.status === "authenticated") {
    return (
      <div className="flex flex-wrap items-center justify-end gap-3">
        <BalanceChip />
        <UserMenu email={state.email} />
      </div>
    );
  }

  return (
    <Link
      href="/login"
      className="rounded-lg bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-800"
    >
      Sign in
    </Link>
  );
}
