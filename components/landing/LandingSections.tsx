import Link from "next/link";

import { routes } from "@/lib/routes";

const STEPS = [
  "Choose destination",
  "Add prepaid credits",
  "Install your eSIM",
] as const;

const BENEFITS = [
  "Instant activation",
  "One prepaid balance",
  "Global coverage",
  "No physical SIM",
] as const;

export function HowItWorks() {
  return (
    <section className="relative px-6 py-12 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          How it works
        </h2>
        <ol className="mt-8 flex max-w-md flex-col gap-0">
          {STEPS.map((step, index) => (
            <li key={step} className="flex flex-col">
              <div className="flex items-center gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15 text-sm font-semibold text-cyan-400">
                  {index + 1}
                </span>
                <span className="text-base font-medium text-slate-200 sm:text-lg">
                  {step}
                </span>
              </div>
              {index < STEPS.length - 1 ? (
                <div
                  className="ml-4 h-6 w-px bg-white/15"
                  aria-hidden="true"
                />
              ) : null}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function WhyRoamKit() {
  return (
    <section className="relative px-6 py-12 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Why RoamKit
        </h2>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:max-w-3xl">
          {BENEFITS.map((benefit) => (
            <li
              key={benefit}
              className="flex items-start gap-3 text-base text-slate-300"
            >
              <span className="mt-1 text-cyan-400" aria-hidden="true">
                ✓
              </span>
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function ClosingCta() {
  return (
    <section className="relative px-6 py-16 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Ready to stay online?
        </h2>
        <p className="mt-3 max-w-lg text-base text-slate-400">
          Browse destinations and activate an eSIM in minutes.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
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
