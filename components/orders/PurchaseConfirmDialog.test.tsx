import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { createElement, createRef, useState } from "react";
import { JSDOM } from "jsdom";
import { cleanup, fireEvent, render, within } from "@testing-library/react";

import {
  BillingContext,
  type BillingContextValue,
} from "@/components/billing/BillingProvider";
import {
  PurchaseConfirmDialog,
  type PurchaseSummary,
} from "./PurchaseConfirmDialog";

function setGlobal(name: string, value: unknown) {
  Object.defineProperty(globalThis, name, {
    value,
    configurable: true,
    writable: true,
  });
}

function installDom() {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", {
    url: "http://localhost/",
  });
  const { window } = dom;

  setGlobal("window", window);
  setGlobal("document", window.document);
  setGlobal("HTMLElement", window.HTMLElement);
  setGlobal("Node", window.Node);
  setGlobal("navigator", window.navigator);
  setGlobal("DocumentFragment", window.DocumentFragment);
  setGlobal("MutationObserver", window.MutationObserver);
  setGlobal("getComputedStyle", window.getComputedStyle.bind(window));
  setGlobal("requestAnimationFrame", (cb: FrameRequestCallback) =>
    setTimeout(() => cb(Date.now()), 0),
  );
  setGlobal("cancelAnimationFrame", (id: number) => clearTimeout(id));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
}

installDom();

afterEach(() => {
  cleanup();
});

const summary: PurchaseSummary = {
  title: "Global 5 GB",
  dataLabel: "5 GB",
  validityLabel: "30 days",
  priceUsd: "12.50",
};

function billingValue(
  overrides: Partial<BillingContextValue> = {},
): BillingContextValue {
  return {
    balance: "100.00",
    config: {
      wallet: "0xabc",
      chainId: 80002,
      tokenSymbol: "USDT",
      decimals: 6,
      contract: "0xtoken",
      confirmations: 3,
      eip681Uri: "ethereum:0xtoken@80002/transfer?address=0xabc",
    },
    features: {
      billingEnabled: true,
      walletConnect: false,
      subscriptions: false,
    },
    isLoading: false,
    isFetching: false,
    error: null,
    refreshBalance: async () => {},
    invalidateBalance: async () => {},
    refreshAll: async () => {},
    ...overrides,
  };
}

function renderDialog(
  props: Partial<Parameters<typeof PurchaseConfirmDialog>[0]> = {},
  billing: BillingContextValue = billingValue(),
) {
  const onCancel = props.onCancel ?? (() => undefined);
  const onConfirm = props.onConfirm ?? (() => undefined);
  return render(
    createElement(
      BillingContext.Provider,
      { value: billing },
      createElement(PurchaseConfirmDialog, {
        summary,
        isPurchasing: false,
        onCancel,
        onConfirm,
        ...props,
      }),
    ),
  );
}

describe("PurchaseConfirmDialog", () => {
  it("renders summary and balance when balance is known", () => {
    const { container } = renderDialog();
    const view = within(container);

    assert.ok(view.getByRole("heading", { name: "Confirm purchase" }));
    assert.ok(view.getByText("Global 5 GB"));
    assert.ok(view.getByText("5 GB"));
    assert.ok(view.getByText("30 days"));
    assert.ok(view.getByText("Your balance"));
    assert.match(container.textContent ?? "", /100\.00 USDT/);
  });

  it("locks cancel and backdrop while purchasing", () => {
    const { container } = renderDialog({ isPurchasing: true });
    const view = within(container);

    const cancel = view.getByRole("button", { name: "Cancel" });
    assert.equal(cancel.hasAttribute("disabled"), true);

    const backdrop = view.getByRole("button", { name: "Close dialog" });
    assert.equal(backdrop.hasAttribute("disabled"), true);
    assert.ok(view.getByTestId("purchase-confirm-spinner"));
  });

  it("calls onConfirm only once on double click", () => {
    let confirmCount = 0;
    const { container } = renderDialog({
      onConfirm: () => {
        confirmCount += 1;
      },
    });
    const confirm = within(container).getByRole("button", {
      name: "Confirm purchase",
    });

    fireEvent.click(confirm);
    fireEvent.click(confirm);
    assert.equal(confirmCount, 1);
  });

  it("restores focus to the Buy button when closed", () => {
    const returnFocusRef = createRef<HTMLButtonElement>();

    function Harness() {
      const [open, setOpen] = useState(true);
      return createElement(
        BillingContext.Provider,
        { value: billingValue() },
        createElement(
          "div",
          null,
          createElement(
            "button",
            {
              type: "button",
              ref: returnFocusRef,
              onClick: () => setOpen(true),
            },
            "Buy",
          ),
          open
            ? createElement(PurchaseConfirmDialog, {
                summary,
                isPurchasing: false,
                onCancel: () => setOpen(false),
                onConfirm: () => setOpen(false),
                returnFocusRef,
              })
            : null,
        ),
      );
    }

    const { container } = render(createElement(Harness));

    const buy = within(container).getByRole("button", { name: "Buy" });
    buy.focus();
    assert.equal(document.activeElement, buy);

    fireEvent.click(within(container).getByRole("button", { name: "Cancel" }));
    assert.equal(document.activeElement, buy);
  });

  it("omits balance row when balance is unknown", () => {
    const { container } = renderDialog({}, billingValue({ balance: null }));
    const view = within(container);

    assert.equal(view.queryByText("Your balance"), null);
  });
});
