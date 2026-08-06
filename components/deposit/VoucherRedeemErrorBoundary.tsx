"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
};

type State = {
  hasError: boolean;
};

/** Isolates voucher card crashes (e.g. QR lib) from the rest of /me/deposit. */
export class VoucherRedeemErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("VoucherRedeemForm crashed", error, info);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900 shadow-sm">
            <h2 className="text-lg font-semibold">
              Voucher redeem unavailable
            </h2>
            <p className="mt-2 text-sm leading-6">
              Something went wrong loading this section. You can still deposit
              using the methods below.
            </p>
          </section>
        )
      );
    }
    return this.props.children;
  }
}
