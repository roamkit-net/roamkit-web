"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { AppShell } from "@/components/AppShell";
import { logout } from "@/lib/api";
import { clearStoredPartnerChannelId } from "@/lib/partner/selection";
import { buttonClassName } from "@/components/ui/Button";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/customers", label: "Customers" },
  { href: "/grants", label: "Grants" },
];

export function PartnerFrame({
  children,
  switcher,
}: {
  children: ReactNode;
  switcher?: ReactNode;
}) {
  return (
    <AppShell
      nav={
        <div className="flex flex-wrap items-center gap-4">
          <nav aria-label="Partner" className="flex gap-4 text-sm">
            {LINKS.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>
          {switcher}
        </div>
      }
      rightSlot={
        <button
          type="button"
          className={buttonClassName({ variant: "ghost", size: "sm" })}
          onClick={() => {
            clearStoredPartnerChannelId();
            logout();
          }}
        >
          Log out
        </button>
      }
    >
      {children}
    </AppShell>
  );
}

export function PartnerMessage({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <section className="rounded-xl border border-slate-200 p-6">
      <h1 className="text-lg font-semibold">{title}</h1>
      <p className="mt-2 text-sm text-slate-600">{body}</p>
    </section>
  );
}
