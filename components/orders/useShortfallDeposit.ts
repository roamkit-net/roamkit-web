"use client";

import {
  useCallback,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { getBalance } from "@/lib/billing/client";
import { billingKeys } from "@/lib/billing/keys";
import type { BillingBalance } from "@/types/billing";
import {
  beginShortfallDeposit,
  type ShortfallDepositOutcome,
  type ShortfallDepositTarget,
} from "@/lib/orders/shortfallDeposit";
import { saveShortfallScroll } from "@/lib/orders/shortfallScroll";

/**
 * Shared shortfall → deposit redirect for store and topup hooks.
 * Owns refresh / pending / analytics / push; caller shares inFlight + busy.
 */
export function useShortfallDeposit(options: {
  inFlightRef: MutableRefObject<boolean>;
  setBusyPackageId: Dispatch<SetStateAction<string | null>>;
  setError: Dispatch<SetStateAction<string | null>>;
}): {
  startDepositForShortfall: (
    target: ShortfallDepositTarget,
    priceUsd: string,
  ) => Promise<ShortfallDepositOutcome>;
} {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { inFlightRef, setBusyPackageId, setError } = options;

  const startDepositForShortfall = useCallback(
    async (
      target: ShortfallDepositTarget,
      priceUsd: string,
    ): Promise<ShortfallDepositOutcome> => {
      if (inFlightRef.current) {
        return { status: "noop" };
      }
      inFlightRef.current = true;
      setBusyPackageId(target.packageId);
      setError(null);
      try {
        if (typeof window !== "undefined") {
          saveShortfallScroll(
            `${window.location.pathname}${window.location.search}`,
            window.scrollY,
          );
        }
        const outcome = await beginShortfallDeposit({
          target,
          priceUsd,
          refreshAndReadBalance: async () => {
            const data = await queryClient.fetchQuery<BillingBalance>({
              queryKey: billingKeys.balance,
              queryFn: getBalance,
            });
            return data.balance;
          },
          push: (href) => {
            router.push(href);
          },
        });
        if (outcome.status === "error") {
          setError(outcome.message);
        }
        return outcome;
      } finally {
        inFlightRef.current = false;
        setBusyPackageId(null);
      }
    },
    [inFlightRef, queryClient, router, setBusyPackageId, setError],
  );

  return { startDepositForShortfall };
}
