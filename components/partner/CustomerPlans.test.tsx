import "../esim/jsdomSetup";

import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { createElement, useEffect, useState } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";

import type { PartnerCustomerPlan, PartnerCustomerPlans } from "@/lib/partner/client";
import {
  customerColumnCount,
  planDataAllowance,
  planDestination,
  planExpiry,
  planUpdatedAt,
  planUsage,
  planValidity,
} from "@/lib/partner/customerPlans";
import { usePartnerChannelGuard } from "@/components/partner/usePartnerChannel";

import { CustomerPlansPanel, CustomerPlansToggle } from "./CustomerPlans";

afterEach(() => {
  cleanup();
});

function plan(overrides: Partial<PartnerCustomerPlan> = {}): PartnerCustomerPlan {
  return {
    location_title: "Croatia",
    package_title: "Croatia 5 GB - 30 Days",
    data_allowance: "5 GB",
    validity_days: 30,
    status: "in_use",
    usage_remaining_mb: 4123,
    usage_total_mb: 5120,
    usage_is_unlimited: false,
    usage_expired_at: null,
    usage_synced_at: null,
    created_at: "2026-10-01T08:10:00Z",
    ...overrides,
  };
}

function plans(active: PartnerCustomerPlan[], expired: PartnerCustomerPlan[]): PartnerCustomerPlans {
  return { active, expired };
}

describe("customer plans controls", () => {
  it("shows the expand control for owner and admin and hides it otherwise", () => {
    const { rerender } = render(
      createElement(CustomerPlansToggle, {
        canView: true,
        label: "user6",
        expanded: false,
        controlsId: "customer-plans-6",
        onClick: () => undefined,
      }),
    );
    const button = screen.getByRole("button", { name: "Show plans for user6" });
    assert.equal(button.getAttribute("aria-expanded"), "false");
    assert.equal(button.getAttribute("aria-controls"), "customer-plans-6");

    rerender(
      createElement(CustomerPlansToggle, {
        canView: false,
        label: "user6",
        expanded: false,
        controlsId: "customer-plans-6",
        onClick: () => undefined,
      }),
    );
    assert.equal(screen.queryByRole("button", { name: "Show plans for user6" }), null);
  });

  function renderPlans(active: PartnerCustomerPlan[], expired: PartnerCustomerPlan[]) {
    render(
      createElement(CustomerPlansPanel, {
        id: "customer-plans-6",
        state: { status: "loaded", data: plans(active, expired) },
        onRetry: () => undefined,
      }),
    );
  }

  function headersOf(table: HTMLElement): string[] {
    return [...table.querySelectorAll("th")].map((cell) => cell.textContent ?? "");
  }

  it("renders a table for each group that has plans", () => {
    const active = plan({ usage_expired_at: "2026-11-08T12:00:00Z", usage_synced_at: "2026-10-10T17:42:00Z" });
    const expired = plan({
      status: "expired",
      package_title: "Old Croatia",
      location_title: "",
      usage_is_unlimited: null,
    });
    renderPlans([active], [expired]);

    const tables = screen.getAllByRole("table");
    assert.equal(tables.length, 2);
    assert.equal(tables[0].getAttribute("aria-label"), "Active plans");
    assert.equal(tables[1].getAttribute("aria-label"), "Expired plans");
    assert.deepEqual(headersOf(tables[0]), [
      "Destination",
      "Data",
      "Validity",
      "Usage",
      "Expires",
      "Updated",
    ]);
    const cells = [...tables[0].querySelectorAll("tbody td")].map((cell) => cell.textContent);
    assert.deepEqual(cells, [
      planDestination(active),
      planDataAllowance(active),
      planValidity(active),
      planUsage(active),
      planExpiry(active),
      planUpdatedAt(active),
    ]);
    assert.equal(planUsage(expired), "Usage not synced");
    assert.ok(screen.getByText("Usage not synced"));
    assert.equal(document.querySelector("caption"), null);
    assert.equal(document.querySelector("a"), null);
    assert.equal(screen.queryByText("Top up"), null);
    assert.equal(screen.queryByText(/install/i), null);
    assert.equal(screen.queryByText(/subscription/i), null);
    assert.equal(screen.queryByText(/archived/i), null);
    assert.equal(screen.queryByText(/Updated /), null);
  });

  it("hides the expired group when it has no plans", () => {
    renderPlans([plan({ usage_is_unlimited: true })], []);
    assert.equal(screen.getAllByRole("table").length, 1);
    assert.equal(screen.getByRole("table").getAttribute("aria-label"), "Active plans");
    assert.ok(screen.getByText("Unlimited"));
    assert.equal(screen.queryByRole("heading", { name: "Expired" }), null);
    assert.equal(screen.queryByText("None"), null);
  });

  it("shows None for the empty active group", () => {
    renderPlans([], [plan({ status: "expired" })]);
    assert.equal(screen.getAllByRole("table").length, 1);
    assert.equal(screen.getByRole("table").getAttribute("aria-label"), "Expired plans");
    assert.ok(screen.getByRole("heading", { name: "Active" }));
    assert.ok(screen.getByText("None"));
  });

  it("renders an em dash for null usage, empty snapshots, and a missing update", () => {
    const row = plan({
      usage_is_unlimited: false,
      usage_remaining_mb: null,
      usage_total_mb: null,
      usage_synced_at: null,
      data_allowance: "",
      location_title: "",
      package_title: "",
    });
    renderPlans([row], []);
    const cells = [...screen.getByRole("table").querySelectorAll("tbody td")].map(
      (cell) => cell.textContent,
    );
    assert.equal(cells[0], "—");
    assert.equal(cells[1], "—");
    assert.equal(cells[3], "—");
    assert.equal(cells[5], "—");
    assert.equal(screen.queryByText("Unlimited"), null);
  });

  it("says there are no visible plans without mentioning archived", () => {
    renderPlans([], []);
    assert.ok(screen.getByText("No active or expired plans available."));
    assert.equal(screen.queryByRole("table"), null);
    assert.equal(screen.queryByRole("heading"), null);
    assert.equal(screen.queryByText("None"), null);
    assert.equal(screen.queryByText(/archived/i), null);
  });

  it("keeps loading and failure inside the row and retries that row", () => {
    const calls: number[] = [];
    const { rerender } = render(
      createElement(
        "table",
        null,
        createElement(
          "tbody",
          null,
          createElement(
            "tr",
            null,
            createElement(
              "td",
              {
                colSpan: customerColumnCount({
                  showBalance: true,
                  showEarned: true,
                  showAccruals: true,
                  canGrant: true,
                }),
              },
              createElement(CustomerPlansPanel, {
                id: "customer-plans-6",
                state: { status: "loading" },
                onRetry: () => calls.push(6),
              }),
            ),
          ),
        ),
      ),
    );
    assert.equal(screen.getByText("Loading plans…").closest("td")?.getAttribute("colspan"), "6");

    rerender(
      createElement(
        "table",
        null,
        createElement(
          "tbody",
          null,
          createElement(
            "tr",
            null,
            createElement(
              "td",
              { colSpan: 2 },
              createElement(CustomerPlansPanel, {
                id: "customer-plans-6",
                state: { status: "error", message: "The partner request failed." },
                onRetry: () => calls.push(6),
              }),
            ),
          ),
        ),
      ),
    );
    assert.ok(screen.getByText("The partner request failed."));
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    assert.deepEqual(calls, [6]);
    assert.equal(screen.getByText("The partner request failed.").closest("td")?.getAttribute("colspan"), "2");
  });
});

let finishLoad: (() => void) | null = null;

function LateChannel() {
  const [channelId, setChannelId] = useState("channel-a");
  const { isCurrent } = usePartnerChannelGuard(channelId);
  const [openId, setOpenId] = useState<number | null>(6);
  const [applied, setApplied] = useState("cached-a");

  useEffect(() => {
    setOpenId(null);
    setApplied("");
  }, [channelId]);

  return createElement(
    "div",
    null,
    createElement(
      "button",
      {
        type: "button",
        onClick: () => {
          const requested = channelId;
          setOpenId(6);
          void new Promise<string>((resolve) => {
            finishLoad = () => resolve("plans-a");
          }).then((value) => {
            if (!isCurrent(requested)) {
              return;
            }
            setApplied(value);
          });
        },
      },
      "Load",
    ),
    createElement(
      "button",
      { type: "button", onClick: () => setChannelId("channel-b") },
      "Switch",
    ),
    createElement(
      "button",
      { type: "button", onClick: () => finishLoad?.() },
      "Finish",
    ),
    createElement("p", null, `open:${openId ?? "none"}`),
    createElement("p", null, `applied:${applied}`),
  );
}

describe("customer plans channel guard", () => {
  it("closes the row and ignores a late response from the previous channel", async () => {
    render(createElement(LateChannel));
    fireEvent.click(screen.getByRole("button", { name: "Load" }));
    fireEvent.click(screen.getByRole("button", { name: "Switch" }));
    assert.equal(screen.getByText("open:none").textContent, "open:none");
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Finish" }));
    });
    assert.equal(screen.getByText("applied:").textContent, "applied:");
  });
});
