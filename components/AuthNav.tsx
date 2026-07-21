"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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

function emailInitial(email: string): string {
  const local = email.split("@")[0] ?? "";
  const first = local.trim().charAt(0);
  return first ? first.toUpperCase() : "?";
}

const avatarClassName =
  "inline-flex h-10 w-10 items-center justify-center rounded-full bg-sky-700 text-sm font-semibold text-white hover:bg-sky-800";

const placeholderClassName =
  "inline-flex h-10 w-10 rounded-full bg-slate-200";

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
      <span className={placeholderClassName} aria-hidden="true" />
    );
  }

  if (state.status === "authenticated") {
    return (
      <Link
        href="/me/esims"
        className={avatarClassName}
        title={state.email}
        aria-label={state.email}
      >
        {emailInitial(state.email)}
      </Link>
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
