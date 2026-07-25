"use client";

import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { DisplayCurrencyProvider } from "@/components/billing/DisplayCurrencyProvider";
import { getBalance, getDepositInfo } from "@/lib/billing/client";
import { toBillingConfig, toBillingFeatures } from "@/lib/billing/config";
import { billingKeys } from "@/lib/billing/keys";
import {
  isBillingHttpStatus,
  isBillingSessionActive,
} from "@/lib/billing/session";
import type { BillingConfig, BillingFeatures } from "@/types/billing";

export type BillingContextValue = {
  balance: string | null;
  config: BillingConfig | null;
  features: BillingFeatures;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  refreshBalance: () => Promise<void>;
  invalidateBalance: () => Promise<void>;
  refreshAll: () => Promise<void>;
};

export const BillingContext = createContext<BillingContextValue | null>(null);

function createBillingQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: (failureCount, error) => {
          if (isBillingHttpStatus(error, 404) || isBillingHttpStatus(error, 401)) {
            return false;
          }
          return failureCount < 2;
        },
        refetchOnWindowFocus: false,
      },
    },
  });
}

type BillingQueryBridgeProps = {
  children: ReactNode;
  enabled: boolean;
};

function BillingQueryBridge({ children, enabled }: BillingQueryBridgeProps) {
  const queryClient = useQueryClient();

  const balanceQuery = useQuery({
    queryKey: billingKeys.balance,
    queryFn: getBalance,
    enabled,
  });

  const depositInfoQuery = useQuery({
    queryKey: billingKeys.depositInfo,
    queryFn: getDepositInfo,
    enabled,
  });

  const config = useMemo(() => {
    if (!depositInfoQuery.data) {
      return null;
    }
    return toBillingConfig(depositInfoQuery.data);
  }, [depositInfoQuery.data]);

  const features = useMemo(
    () =>
      toBillingFeatures(depositInfoQuery.data, {
        // deposit-info 404s when BILLING_ENABLED=false
        billingEnabled: depositInfoQuery.isSuccess,
      }),
    [depositInfoQuery.data, depositInfoQuery.isSuccess],
  );

  const error = useMemo(() => {
    const candidates = [balanceQuery.error, depositInfoQuery.error];
    for (const err of candidates) {
      if (!err) {
        continue;
      }
      if (isBillingHttpStatus(err, 404)) {
        continue;
      }
      return err instanceof Error ? err : new Error(String(err));
    }
    return null;
  }, [balanceQuery.error, depositInfoQuery.error]);

  const invalidateBalance = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: billingKeys.balance });
  }, [queryClient]);

  const refreshBalance = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: billingKeys.balance });
    if (enabled) {
      await queryClient.refetchQueries({ queryKey: billingKeys.balance });
    }
  }, [enabled, queryClient]);

  const refreshAll = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: billingKeys.balance }),
      queryClient.invalidateQueries({ queryKey: billingKeys.depositInfo }),
    ]);
    if (enabled) {
      await Promise.all([
        queryClient.refetchQueries({ queryKey: billingKeys.balance }),
        queryClient.refetchQueries({ queryKey: billingKeys.depositInfo }),
      ]);
    }
  }, [enabled, queryClient]);

  const value = useMemo<BillingContextValue>(
    () => ({
      balance: balanceQuery.data?.balance ?? null,
      config,
      features,
      isLoading:
        enabled &&
        (balanceQuery.isPending || depositInfoQuery.isPending) &&
        !balanceQuery.data &&
        !depositInfoQuery.data,
      isFetching: balanceQuery.isFetching || depositInfoQuery.isFetching,
      error,
      refreshBalance,
      invalidateBalance,
      refreshAll,
    }),
    [
      balanceQuery.data,
      balanceQuery.isFetching,
      balanceQuery.isPending,
      config,
      depositInfoQuery.data,
      depositInfoQuery.isFetching,
      depositInfoQuery.isPending,
      enabled,
      error,
      features,
      invalidateBalance,
      refreshAll,
      refreshBalance,
    ],
  );

  return (
    <BillingContext.Provider value={value}>{children}</BillingContext.Provider>
  );
}

type BillingProviderProps = {
  children: ReactNode;
};

/**
 * Thin billing state shell: load / cache / invalidate / features only.
 * No verify, spend, polling, or AppKit logic.
 */
export function BillingProvider({ children }: BillingProviderProps) {
  const [queryClient] = useState(createBillingQueryClient);
  // Read session on first client render so /me/deposit does not flash "unavailable".
  const [enabled, setEnabled] = useState(() =>
    typeof window !== "undefined" ? isBillingSessionActive() : false,
  );
  const pathname = usePathname();

  useEffect(() => {
    setEnabled(isBillingSessionActive());
  }, [pathname]);

  useEffect(() => {
    function syncAuth() {
      setEnabled(isBillingSessionActive());
    }

    window.addEventListener("storage", syncAuth);
    window.addEventListener("focus", syncAuth);
    return () => {
      window.removeEventListener("storage", syncAuth);
      window.removeEventListener("focus", syncAuth);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <DisplayCurrencyProvider>
        <BillingQueryBridge enabled={enabled}>{children}</BillingQueryBridge>
      </DisplayCurrencyProvider>
    </QueryClientProvider>
  );
}
