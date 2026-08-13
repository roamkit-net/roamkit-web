"use client";

import Link from "next/link";

import { Alert } from "@/components/ui/Alert";
import { buttonClassName } from "@/components/ui/Button";
import { listRowClassName } from "@/components/ui/ListRow";
import type { Esim } from "@/lib/api";
import { AUTO_TOPUP_HASH } from "@/lib/esim/autoTopupHash";
import { esimDestinationLabel } from "@/lib/esim/display";

export function EsimActionRequired({ esims }: { esims: Esim[] }) {
  if (esims.length === 0) {
    return null;
  }

  return (
    <Alert
      variant="warning"
      role="region"
      aria-labelledby="esim-action-required-heading"
      title={
        <span id="esim-action-required-heading">
          Action required ({esims.length})
        </span>
      }
    >
      <ul className="grid gap-3 pt-2">
        {esims.map((esim) => {
          const destination = esimDestinationLabel(esim);
          return (
            <li key={esim.id}>
              <div className={listRowClassName()}>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-semibold text-slate-900">
                    {destination}
                  </p>
                  <p className="mt-0.5 text-sm text-slate-600">
                    Auto top-up paused · Insufficient funds
                  </p>
                </div>
                <Link
                  href={`/me/esims/${esim.id}${AUTO_TOPUP_HASH}`}
                  className={buttonClassName({
                    variant: "secondary",
                    size: "sm",
                    tone: "app",
                    className: "shrink-0",
                  })}
                >
                  Resolve
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </Alert>
  );
}
