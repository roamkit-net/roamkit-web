import Image from "next/image";
import Link from "next/link";

import { CatalogPriceDisplay } from "@/components/CatalogPriceDisplay";
import type { Location } from "@/lib/api";
import { locationImageSrc } from "@/lib/api";
import { locationEsimPath } from "@/lib/routes";

type FeaturedPlansProps = {
  locations: Location[];
};

/** Presentation-only featured catalog teaser (same helpers as LocationCard). */
export function FeaturedPlans({ locations }: FeaturedPlansProps) {
  if (locations.length === 0) {
    return null;
  }

  return (
    <section className="relative px-6 py-12 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Featured plans
        </h2>
        <p className="mt-2 max-w-xl text-sm text-slate-400 sm:text-base">
          Live destinations from the catalog — open a plan to see data packages.
        </p>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {locations.map((location) => {
            const imageSrc = locationImageSrc(location);
            return (
              <li key={location.slug}>
                <Link
                  href={locationEsimPath(location.slug)}
                  className="group flex h-full flex-col gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 outline-none transition hover:border-cyan-500/30 hover:bg-white/[0.05] focus-visible:ring-2 focus-visible:ring-cyan-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070a]"
                >
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-white/5">
                    {imageSrc ? (
                      <Image
                        src={imageSrc}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs font-semibold uppercase text-slate-500">
                        {location.title.slice(0, 2)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-base font-semibold text-white group-hover:text-cyan-200">
                      {location.title}
                    </h3>
                    <p className="mt-0.5 text-sm text-slate-400">
                      {location.min_price_usd ? (
                        <CatalogPriceDisplay
                          amount={location.min_price_usd}
                          from
                        />
                      ) : (
                        "See plans"
                      )}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-cyan-400">
                    View plan
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
