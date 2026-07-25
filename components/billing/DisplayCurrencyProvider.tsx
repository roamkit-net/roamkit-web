"use client";

import { useQuery } from "@tanstack/react-query";
import {
  createContext,
  useMemo,
  type ReactNode,
} from "react";

import { getBillingConfig } from "@/lib/billing/client";
import { toBillingDisplayConfig } from "@/lib/billing/config";
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
 */
export function DisplayCurrencyProvider({
  children,
}: DisplayCurrencyProviderProps) {
  const query = useQuery({
    queryKey: billingKeys.config,
    queryFn: ({ signal }) => getBillingConfig({ signal }),
    staleTime: BILLING_CONFIG_STALE_TIME_MS,
    refetchOnWindowFocus: false,
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
      isLoading: query.isPending && !query.data,
      isFetching: query.isFetching,
      error:
        query.error instanceof Error
          ? query.error
          : query.error
            ? new Error(String(query.error))
            : null,
    }),
    [
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
