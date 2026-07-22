import Image from "next/image";
import Link from "next/link";

import type { Location } from "@/lib/api";
import { locationImageSrc } from "@/lib/api";

function formatFromPrice(priceUsd: string | null): string {
  if (!priceUsd) {
    return "See plans";
  }
  const amount = Number.parseFloat(priceUsd);
  if (Number.isNaN(amount)) {
    return `from ${priceUsd} USD`;
  }
  return `from ${new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount)} USD`;
}

export function LocationCard({ location }: { location: Location }) {
  const imageSrc = locationImageSrc(location);
  const href = `/${location.slug}-esim`;

  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-sky-300 hover:shadow-md"
    >
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-slate-100">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt=""
            fill
            className="object-cover"
            sizes="48px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs font-semibold uppercase text-slate-400">
            {location.title.slice(0, 2)}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-base font-semibold text-slate-900 group-hover:text-sky-800">
          {location.title}
        </h2>
        <p className="mt-0.5 text-sm text-slate-600">
          {formatFromPrice(location.min_price_usd)}
        </p>
      </div>
    </Link>
  );
}
