"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { logout } from "@/lib/api";

function emailInitial(email: string): string {
  const local = email.split("@")[0] ?? "";
  const first = local.trim().charAt(0);
  return first ? first.toUpperCase() : "?";
}

type UserMenuProps = {
  email: string;
};

export function UserMenu({ email }: UserMenuProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    function onPointerDown(event: MouseEvent) {
      if (
        rootRef.current &&
        !rootRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function handleSignOut() {
    setOpen(false);
    logout();
    router.push("/login");
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--app-primary)] text-sm font-semibold text-[var(--app-primary-foreground)] outline-none hover:bg-[var(--app-primary-hover)] focus-visible:ring-2 focus-visible:ring-[var(--app-focus-ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--app-background)]"
        title={email}
        aria-label={`Account menu for ${email}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        {emailInitial(email)}
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label="Account"
          className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
        >
          <div className="border-b border-slate-100 px-3 py-2">
            <p className="truncate text-sm text-slate-600" title={email}>
              {email}
            </p>
          </div>
          <Link
            href="/me/esims"
            role="menuitem"
            className="block px-3 py-2 text-sm text-slate-900 hover:bg-slate-50"
            onClick={() => setOpen(false)}
          >
            My eSIMs
          </Link>
          <Link
            href="/me/deposit"
            role="menuitem"
            className="block px-3 py-2 text-sm text-slate-900 hover:bg-slate-50"
            onClick={() => setOpen(false)}
          >
            Deposit credits
          </Link>
          <Link
            href="/plans"
            role="menuitem"
            className="block px-3 py-2 text-sm text-slate-900 hover:bg-slate-50"
            onClick={() => setOpen(false)}
          >
            Browse plans
          </Link>
          <div className="my-1 border-t border-slate-100" />
          <button
            type="button"
            role="menuitem"
            className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
            onClick={handleSignOut}
          >
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}
