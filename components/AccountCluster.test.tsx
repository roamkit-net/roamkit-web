import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import {
  AccountCluster,
  AccountClusterSkeleton,
} from "./AccountCluster";
import { BillingContext, type BillingContextValue } from "./billing/BillingProvider";
import { BalanceChip } from "./billing/BalanceChip";

function billingValue(
  overrides: Partial<BillingContextValue> & {
    features: BillingContextValue["features"];
  },
): BillingContextValue {
  return {
    balance: null,
    config: null,
    isLoading: false,
    isFetching: false,
    error: null,
    refreshBalance: async () => {},
    invalidateBalance: async () => {},
    refreshAll: async () => {},
    ...overrides,
  };
}

function renderWithBilling(
  ui: ReactNode,
  value: BillingContextValue,
): string {
  return renderToStaticMarkup(
    createElement(BillingContext.Provider, { value }, ui),
  );
}

function AvatarStub() {
  return createElement("button", {
    type: "button",
    "data-testid": "account-avatar",
    "aria-label": "Account menu for user@example.com",
  }, "U");
}

describe("account cluster", () => {
  it("loading → cluster skeleton with chip, divider, and avatar placeholders", () => {
    const html = renderToStaticMarkup(createElement(AccountClusterSkeleton));

    assert.match(html, /data-testid="account-cluster"/);
    assert.match(html, /data-state="loading"/);
    assert.match(html, /data-testid="account-cluster-chip-skeleton"/);
    assert.match(html, /data-testid="account-cluster-divider"/);
    assert.match(html, /data-testid="account-cluster-avatar-skeleton"/);
  });

  it("billing enabled → chip + divider + avatar", () => {
    const html = renderWithBilling(
      createElement(
        AccountCluster,
        null,
        createElement(BalanceChip, { embedded: true }),
        createElement(AvatarStub),
      ),
      billingValue({
        balance: "12.5",
        config: {
          wallet: "0xabc",
          chainId: 137,
          tokenSymbol: "USDT",
          decimals: 6,
          contract: "0xtoken",
          confirmations: 3,
          eip681Uri: "ethereum:0xtoken@137/transfer?address=0xabc",
        },
        features: {
          billingEnabled: true,
          walletConnect: false,
          subscriptions: false,
        },
      }),
    );

    assert.match(html, /data-testid="account-cluster"/);
    assert.match(html, /data-testid="balance-chip"/);
    assert.match(html, /data-testid="account-cluster-divider"/);
    assert.match(html, /data-testid="account-avatar"/);
    assert.match(html, /12\.50 USDT/);
  });

  it("billing disabled → only avatar, no divider", () => {
    const html = renderWithBilling(
      createElement(
        AccountCluster,
        null,
        createElement(BalanceChip, { embedded: true }),
        createElement(AvatarStub),
      ),
      billingValue({
        features: {
          billingEnabled: false,
          walletConnect: false,
          subscriptions: false,
        },
      }),
    );

    assert.match(html, /data-testid="account-cluster"/);
    assert.match(html, /data-testid="account-avatar"/);
    assert.doesNotMatch(html, /data-testid="balance-chip"/);
    assert.doesNotMatch(html, /data-testid="account-cluster-divider"/);
    assert.doesNotMatch(html, /data-testid="balance-chip-skeleton"/);
  });
});
