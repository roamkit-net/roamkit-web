"use client";

import { useQuery } from "@tanstack/react-query";
import {
  createContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { getBillingConfig } from "@/lib/billing/client";
import { toBillingDisplayConfig } from "@/lib/billing/config";
import {
  BACKOFF_MS,
  isCircuitOpen,
  MAX_FAILURES,
  readCircuitState,
  recordCircuitFailure,
  recordCircuitSuccess,
} from "@/lib/billing/circuitBreaker";
import {
  readDisplayConfigCache,
  writeDisplayConfigCache,
} from "@/lib/billing/displayConfigCache";
import {
  BILLING_CONFIG_STALE_TIME_MS,
  billingKeys,
} from "@/lib/billing/keys";
import type {
  BillingDisplayConfig,
  DisplayCurrency,
} from "@/types/billing";

export type DisplayCurrencyContextValue = {
  currency: DisplayCurrency | null;
  config: BillingDisplayConfig | null;
  configVersion: number | null;
  billingEnabled: boolean | null;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
};

export const DisplayCurrencyContext =
  createContext<DisplayCurrencyContextValue | null>(null);

type DisplayCurrencyProviderProps = {
  children: ReactNode;
};

/**
 * Public billing/config cache for catalog price display.
 * Always enabled (AllowAny). Long staleTime aligns with API max-age.
 * Must sit under the same QueryClientProvider as BillingProvider.
 *
 * Non-blocking (ADR-010): cache + circuit breaker; catalog must degrade
 * when this fetch fails — never block prices forever.
 */
export function DisplayCurrencyProvider({
  children,
}: DisplayCurrencyProviderProps) {
  const cached = useMemo(() => readDisplayConfigCache(), []);
  const [circuitOpenUntil, setCircuitOpenUntil] = useState(
    () => readCircuitState().openUntil,
  );
  const [now, setNow] = useState(() => Date.now());
  const circuitOpen = isCircuitOpen(
    { openUntil: circuitOpenUntil, failureCount: 0 },
    now,
  );

  useEffect(() => {
    if (!circuitOpen) {
      return;
    }
    const remaining = Math.max(0, circuitOpenUntil - Date.now());
    const timer = window.setTimeout(() => {
      setNow(Date.now());
    }, Math.min(remaining + 50, BACKOFF_MS));
    return () => window.clearTimeout(timer);
  }, [circuitOpen, circuitOpenUntil]);

  const query = useQuery({
    queryKey: billingKeys.config,
    queryFn: async ({ signal }) => {
      try {
        const payload = await getBillingConfig({ signal });
        recordCircuitSuccess();
        setCircuitOpenUntil(0);
        writeDisplayConfigCache(payload);
        return payload;
      } catch (error) {
        const next = recordCircuitFailure();
        if (next.openUntil > Date.now()) {
          setCircuitOpenUntil(next.openUntil);
        }
        throw error;
      }
    },
    staleTime: BILLING_CONFIG_STALE_TIME_MS,
    refetchOnWindowFocus: false,
    retry: MAX_FAILURES - 1,
    enabled: !circuitOpen,
    initialData: cached?.config,
    initialDataUpdatedAt: cached?.saved_at,
  });

  const mapped = useMemo(() => {
    if (!query.data) {
      return null;
    }
    return toBillingDisplayConfig(query.data);
  }, [query.data]);

  const value = useMemo<DisplayCurrencyContextValue>(
    () => ({
      currency: mapped?.currency ?? null,
      config: mapped,
      configVersion: mapped?.configVersion ?? null,
      billingEnabled: mapped?.billingEnabled ?? null,
      // Cached initialData means we are not "loading" for catalog paint.
      isLoading: query.isPending && !query.data && !cached?.config,
      isFetching: query.isFetching,
      error:
        query.error instanceof Error
          ? query.error
          : query.error
            ? new Error(String(query.error))
            : null,
    }),
    [
      cached?.config,
      mapped,
      query.data,
      query.error,
      query.isFetching,
      query.isPending,
    ],
  );

  return (
    <DisplayCurrencyContext.Provider value={value}>
      {children}
    </DisplayCurrencyContext.Provider>
  );
}
