import Image from "next/image";
import Link from "next/link";

import { CatalogPriceDisplay } from "@/components/CatalogPriceDisplay";
import { listRowClassName } from "@/components/ui/ListRow";
import type { Location } from "@/lib/api";
import { locationImageSrc } from "@/lib/api";

export function LocationCard({ location }: { location: Location }) {
  const imageSrc = locationImageSrc(location);
  const href = `/${location.slug}-esim`;

  return (
    <Link
      href={href}
      className={listRowClassName({
        interactive: true,
        className: "group",
      })}
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
          {location.min_price_usd ? (
            <CatalogPriceDisplay amount={location.min_price_usd} from />
          ) : (
            "See plans"
          )}
        </p>
      </div>
    </Link>
  );
}
