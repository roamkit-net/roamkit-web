import Link from "next/link";

import { routes } from "@/lib/routes";

export function HeroSection() {
  return (
    <section className="relative px-6 pb-12 pt-4 sm:px-10 sm:pb-16 lg:px-16 lg:pb-20">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 lg:max-w-2xl">
        <div className="flex flex-col gap-6">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">
            RoamKit
          </p>
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
            Stay connected before you land.
          </h1>
          <p className="max-w-lg text-base leading-relaxed text-slate-400 sm:text-lg">
            Browse global data plans, top up your prepaid balance, and activate
            your eSIM instantly.
          </p>
          <p className="text-sm text-slate-500">
            Supports prepaid credits via Polygon USDT.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            href={routes.plans}
            className="inline-flex items-center justify-center rounded-xl bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 outline-none transition hover:bg-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070a]"
          >
            Browse plans
          </Link>
          <Link
            href={routes.register}
            className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/[0.03] px-6 py-3 text-sm font-semibold text-white outline-none transition hover:border-white/25 hover:bg-white/[0.06] focus-visible:ring-2 focus-visible:ring-cyan-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070a]"
          >
            Create account
          </Link>
        </div>
      </div>
    </section>
  );
}
