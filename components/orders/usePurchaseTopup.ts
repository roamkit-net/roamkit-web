"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useBilling } from "@/components/billing/useBilling";
import { ApiError, isAuthenticated } from "@/lib/api";
import { toBillingError } from "@/lib/billing/errors";
import { billingTelemetry } from "@/lib/billing/telemetry";
import { newSpendIdempotencyKey } from "@/lib/orders/idempotency";
import {
  buildDepositRedirectUrl,
  isInsufficientCreditsError,
  parseInsufficientCredits,
} from "@/lib/orders/insufficientCredits";
import {
  clearPendingSpend,
  peekPendingSpend,
  savePendingSpend,
} from "@/lib/orders/pendingSpend";
import { purchaseTopup } from "@/lib/orders/topupClient";
import type { TopupPurchase } from "@/types/orders";

export type PurchaseTopupState = {
  busyPackageId: string | null;
  error: string | null;
  successTopup: TopupPurchase | null;
  isRetrying: boolean;
  purchase: (packageId: string) => Promise<void>;
  clearError: () => void;
  clearSuccess: () => void;
};

function currentPathWithSearch(): string {
  if (typeof window === "undefined") {
    return "/";
  }
  return `${window.location.pathname}${window.location.search}`;
}

function returnPathMatches(returnPath: string, pathname: string): boolean {
  const current = currentPathWithSearch();
  return returnPath === current || returnPath === pathname;
}

/**
 * Purchase an eSIM top-up with 402 → deposit → return → retry.
 * Spend HTTP goes only through lib/orders/topupClient.ts.
 */
export function usePurchaseTopup(esimId: string): PurchaseTopupState {
  const router = useRouter();
  const pathname = usePathname();
  const { invalidateBalance } = useBilling();
  const [busyPackageId, setBusyPackageId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successTopup, setSuccessTopup] = useState<TopupPurchase | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const retryStarted = useRef(false);
  const inFlightRef = useRef(false);

  const redirectToDeposit = useCallback(
    (packageId: string, idempotencyKey: string, err: unknown) => {
      const info = parseInsufficientCredits(err);
      const amount = info?.missing || info?.required || "";
      const returnPath = currentPathWithSearch();
      savePendingSpend({
        kind: "topup",
        esimId: String(esimId),
        packageId,
        idempotencyKey,
        returnPath,
      });
      billingTelemetry.track("spend_insufficient_credits", {
        kind: "topup",
        packageId,
        esimId: String(esimId),
        missing: amount || null,
      });
      router.push(
        buildDepositRedirectUrl({
          amount: amount || "25",
          returnPath,
        }),
      );
    },
    [esimId, router],
  );

  const executePurchase = useCallback(
    async (
      packageId: string,
      idempotencyKey: string,
      options?: { isRetry?: boolean },
    ) => {
      if (inFlightRef.current) {
        return;
      }
      inFlightRef.current = true;
      setBusyPackageId(packageId);
      setError(null);
      try {
        const topup = await purchaseTopup(esimId, {
          package_id: packageId,
          idempotency_key: idempotencyKey,
        });
        clearPendingSpend();
        setSuccessTopup(topup);
        if (options?.isRetry) {
          billingTelemetry.track("spend_retry_after_deposit", {
            kind: "topup",
            packageId,
            status: "success",
          });
        }
        try {
          await invalidateBalance();
        } catch {
          // best-effort
        }
      } catch (err) {
        if (isInsufficientCreditsError(err)) {
          redirectToDeposit(packageId, idempotencyKey, err);
          return;
        }
        if (options?.isRetry) {
          billingTelemetry.track("spend_retry_after_deposit", {
            kind: "topup",
            packageId,
            status: "failed",
          });
        }
        if (err instanceof ApiError && err.status === 401) {
          setError("You need to sign in to purchase a top-up.");
          router.push("/login");
          return;
        }
        setError(toBillingError(err, "Unable to purchase top-up.").message);
      } finally {
        inFlightRef.current = false;
        setBusyPackageId(null);
        setIsRetrying(false);
      }
    },
    [esimId, invalidateBalance, redirectToDeposit, router],
  );

  const purchase = useCallback(
    async (packageId: string) => {
      if (inFlightRef.current) {
        return;
      }
      if (!isAuthenticated()) {
        router.push("/login");
        return;
      }
      const key = newSpendIdempotencyKey("topup");
      await executePurchase(packageId, key);
    },
    [executePurchase, router],
  );

  useEffect(() => {
    if (retryStarted.current) {
      return;
    }
    const pending = peekPendingSpend();
    if (!pending || pending.kind !== "topup") {
      return;
    }
    if (pending.esimId !== String(esimId)) {
      return;
    }
    if (!returnPathMatches(pending.returnPath, pathname)) {
      return;
    }
    retryStarted.current = true;
    clearPendingSpend();
    setIsRetrying(true);
    void executePurchase(pending.packageId, pending.idempotencyKey, {
      isRetry: true,
    });
  }, [esimId, executePurchase, pathname]);

  return {
    busyPackageId,
    error,
    successTopup,
    isRetrying,
    purchase,
    clearError: () => setError(null),
    clearSuccess: () => setSuccessTopup(null),
  };
}
