"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useBilling } from "@/components/billing/useBilling";
import { ApiError, isAuthenticated } from "@/lib/api";
import { toBillingError } from "@/lib/billing/errors";
import { billingTelemetry } from "@/lib/billing/telemetry";
import { createOrder } from "@/lib/orders/client";
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
import type { Order } from "@/types/orders";

export type BuyPackageState = {
  busyPackageId: string | null;
  error: string | null;
  successOrder: Order | null;
  isRetrying: boolean;
  buy: (packageId: string) => Promise<void>;
  clearError: () => void;
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
 * Buy an eSIM package with 402 → deposit → return → retry.
 * Spend HTTP goes only through lib/orders/client.ts.
 */
export function useBuyPackage(): BuyPackageState {
  const router = useRouter();
  const pathname = usePathname();
  const { invalidateBalance } = useBilling();
  const [busyPackageId, setBusyPackageId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successOrder, setSuccessOrder] = useState<Order | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const retryStarted = useRef(false);
  const inFlightRef = useRef(false);

  const completeSuccess = useCallback(
    async (order: Order) => {
      clearPendingSpend();
      setSuccessOrder(order);
      try {
        await invalidateBalance();
      } catch {
        // Balance cache refresh is best-effort after spend.
      }
      const firstEsim = order.esims[0];
      if (firstEsim) {
        router.push(`/me/esims/${firstEsim.id}/setup`);
      } else {
        router.push("/me/esims");
      }
    },
    [invalidateBalance, router],
  );

  const redirectToDeposit = useCallback(
    (packageId: string, idempotencyKey: string, err: unknown) => {
      const info = parseInsufficientCredits(err);
      const amount = info?.missing || info?.required || "";
      const returnPath = currentPathWithSearch();
      savePendingSpend({
        kind: "order",
        packageId,
        idempotencyKey,
        returnPath,
      });
      billingTelemetry.track("spend_insufficient_credits", {
        kind: "order",
        packageId,
        missing: amount || null,
      });
      router.push(
        buildDepositRedirectUrl({
          amount: amount || "25",
          returnPath,
        }),
      );
    },
    [router],
  );

  const executeBuy = useCallback(
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
        const order = await createOrder({
          package_id: packageId,
          idempotency_key: idempotencyKey,
        });
        if (options?.isRetry) {
          billingTelemetry.track("spend_retry_after_deposit", {
            kind: "order",
            packageId,
            status: "success",
          });
        }
        await completeSuccess(order);
      } catch (err) {
        if (isInsufficientCreditsError(err)) {
          redirectToDeposit(packageId, idempotencyKey, err);
          return;
        }
        if (options?.isRetry) {
          billingTelemetry.track("spend_retry_after_deposit", {
            kind: "order",
            packageId,
            status: "failed",
          });
        }
        if (err instanceof ApiError && err.status === 401) {
          setError("You need to sign in to buy a plan.");
          router.push("/login");
          return;
        }
        setError(toBillingError(err, "Unable to complete purchase.").message);
      } finally {
        inFlightRef.current = false;
        setBusyPackageId(null);
        setIsRetrying(false);
      }
    },
    [completeSuccess, redirectToDeposit, router],
  );

  const buy = useCallback(
    async (packageId: string) => {
      if (inFlightRef.current) {
        return;
      }
      if (!isAuthenticated()) {
        router.push("/login");
        return;
      }
      const key = newSpendIdempotencyKey("order");
      await executeBuy(packageId, key);
    },
    [executeBuy, router],
  );

  useEffect(() => {
    if (retryStarted.current) {
      return;
    }
    const pending = peekPendingSpend();
    if (!pending || pending.kind !== "order") {
      return;
    }
    if (!returnPathMatches(pending.returnPath, pathname)) {
      return;
    }
    retryStarted.current = true;
    clearPendingSpend();
    setIsRetrying(true);
    void executeBuy(pending.packageId, pending.idempotencyKey, {
      isRetry: true,
    });
  }, [executeBuy, pathname]);

  return {
    busyPackageId,
    error,
    successOrder,
    isRetrying,
    buy,
    clearError: () => setError(null),
  };
}
