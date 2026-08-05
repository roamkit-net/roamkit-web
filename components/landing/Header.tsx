import Link from "next/link";

import { LandingHeaderActions } from "@/components/landing/LandingHeaderActions";
import { Logo } from "@/components/landing/Logo";
import { routes } from "@/lib/routes";

export function Header() {
  return (
    <header className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10 lg:px-16">
      <Logo />
      <div className="flex items-center gap-3 sm:gap-4">
        <Link
          href={routes.plans}
          className="text-sm font-medium text-slate-300 outline-none transition hover:text-white focus-visible:ring-2 focus-visible:ring-cyan-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070a]"
        >
          Plans
        </Link>
        <LandingHeaderActions />
      </div>
    </header>
  );
}
