import "./jsdomSetup";

import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { createElement, type ComponentProps } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import type { AppliedPackage, EsimUsage } from "@/lib/api";

import { EsimPackagesCard } from "./EsimPackagesCard";

afterEach(() => {
  cleanup();
});

function pkg(overrides: Partial<AppliedPackage> = {}): AppliedPackage {
  return {
    id: "1",
    kind: "topup",
    status: "active",
    data_allowance: "1 GB",
    validity_days: 7,
    is_unlimited: false,
    remaining_mb: 900,
    created_at: "2026-08-12T10:50:00Z",
    activated_at: "2026-08-12T10:50:00Z",
    expires_at: "2026-08-19T10:50:00Z",
    paid_usd: "3.20",
    currency: "USD",
    ...overrides,
  };
}

const usage: EsimUsage = {
  remaining_mb: 1926,
  total_mb: 2048,
  expired_at: null,
  is_unlimited: false,
  status: "ACTIVE",
  remaining_voice: 0,
  remaining_text: 0,
  total_voice: 0,
  total_text: 0,
};

function renderCard(
  overrides: Partial<ComponentProps<typeof EsimPackagesCard>> = {},
) {
  return render(
    createElement(EsimPackagesCard, {
      packages: [],
      packagesError: null,
      usage,
      cachedRemainingMb: 1926,
      cachedTotalMb: 2048,
      cachedUnlimited: false,
      isRefreshing: false,
      onRefresh: () => undefined,
      ...overrides,
    }),
  );
}

describe("EsimPackagesCard", () => {
  it("shows usage bar labels from remaining and used", () => {
    renderCard();
    assert.match(screen.getByTestId("esim-packages-usage").textContent ?? "", /1\.88 GB/);
    assert.match(screen.getByTestId("esim-packages-usage").textContent ?? "", /122 MB/);
  });

  it("places not_active in Available and expired in Previous", () => {
    renderCard({
      packages: [
        pkg({ id: "a", status: "active" }),
        pkg({ id: "n", status: "not_active" }),
        pkg({ id: "e", status: "expired", kind: "esim", data_allowance: "300 MB" }),
      ],
    });
    const available = screen.getByTestId("esim-packages-available");
    const previous = screen.getByTestId("esim-packages-previous");
    assert.match(available.textContent ?? "", /Not active/);
    assert.match(available.textContent ?? "", /Active/);
    assert.doesNotMatch(previous.textContent ?? "", /Not active/);
    assert.match(previous.textContent ?? "", /Expired/);
    assert.match(previous.textContent ?? "", /eSIM/);
  });

  it("shows Unknown for unknown status, not Expired", () => {
    renderCard({
      packages: [pkg({ id: "u", status: "unknown" })],
    });
    const unknown = screen.getByTestId("esim-packages-unknown");
    assert.match(unknown.textContent ?? "", /Unknown/);
    assert.equal(screen.queryByTestId("esim-packages-available"), null);
    assert.equal(screen.queryByTestId("esim-packages-previous"), null);
    assert.doesNotMatch(
      screen.getByTestId("esim-packages-row-status").textContent ?? "",
      /Expired/,
    );
  });

  it("keeps the card usable when packages fail", () => {
    const clicks: number[] = [];
    renderCard({
      packagesError: "Could not load packages.",
      onRefresh: () => {
        clicks.push(1);
      },
    });
    assert.ok(screen.getByTestId("esim-packages-card"));
    assert.match(
      screen.getByTestId("esim-packages-error").textContent ?? "",
      /Could not load packages/,
    );
    assert.match(screen.getByTestId("esim-packages-usage").textContent ?? "", /1\.88 GB/);
    fireEvent.click(screen.getByTestId("esim-packages-retry"));
    assert.equal(clicks.length, 1);
  });

  it("does not render an MB bar for unlimited usage", () => {
    renderCard({
      usage: { ...usage, is_unlimited: true, remaining_mb: 0, total_mb: 0 },
    });
    assert.equal(screen.getByTestId("esim-packages-usage").textContent, "Unlimited");
    assert.equal(screen.queryByRole("progressbar"), null);
  });

  it("expands package details including amount", () => {
    renderCard({ packages: [pkg()] });
    fireEvent.click(screen.getByTestId("esim-packages-row-trigger"));
    assert.match(screen.getByText("Amount").parentElement?.textContent ?? "", /\$3\.20 USD/);
    assert.match(screen.getByText("Created on").parentElement?.textContent ?? "", /2026|8/);
  });
});
