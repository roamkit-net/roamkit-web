import "./jsdomSetup";

import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { createElement, useState, type ReactElement } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";

import type { Esim } from "@/lib/api";

import { EsimListSection } from "./EsimListSection";

afterEach(() => {
  cleanup();
});

function baseEsim(overrides: Partial<Esim> = {}): Esim {
  return {
    id: 1,
    iccid: "8901",
    lpa: "",
    matching_id: "",
    qrcode: "",
    qrcode_url: "",
    direct_apple_installation_url: "",
    manual_installation: "",
    qrcode_installation: "",
    installation_guide_url: "",
    status: "expired",
    usage_remaining_mb: null,
    usage_total_mb: null,
    usage_status: null,
    usage_is_unlimited: null,
    usage_expired_at: null,
    usage_synced_at: null,
    archived_at: null,
    location_title: "Croatia",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function RerenderHarness({
  defaultOpen,
  listId,
  title,
}: {
  defaultOpen: boolean;
  listId: string;
  title: string;
}): ReactElement {
  const [tick, setTick] = useState(0);
  return createElement(
    "div",
    null,
    createElement(EsimListSection, {
      title,
      listId,
      defaultOpen,
      esims: [baseEsim()],
      pendingId: null,
    }),
    createElement(
      "button",
      {
        type: "button",
        onClick: () => setTick((value) => value + 1),
      },
      `rerender-${tick}`,
    ),
  );
}

describe("EsimListSection collapse", () => {
  it("starts closed when defaultOpen is false and keeps stable aria-controls", () => {
    render(
      createElement(EsimListSection, {
        title: "Archived",
        listId: "esim-section-archived",
        defaultOpen: false,
        esims: [baseEsim()],
        pendingId: null,
      }),
    );

    const toggle = screen.getByRole("button", { name: /Archived/i });
    assert.equal(toggle.getAttribute("aria-expanded"), "false");
    assert.equal(toggle.getAttribute("aria-controls"), "esim-section-archived");
    assert.equal(document.getElementById("esim-section-archived"), null);
  });

  it("toggles open and closed on click with stable aria-controls", () => {
    render(
      createElement(EsimListSection, {
        title: "Archived",
        listId: "esim-section-archived",
        defaultOpen: false,
        esims: [baseEsim()],
        pendingId: null,
      }),
    );

    const toggle = screen.getByRole("button", { name: /Archived/i });
    fireEvent.click(toggle);
    assert.equal(toggle.getAttribute("aria-expanded"), "true");
    assert.equal(toggle.getAttribute("aria-controls"), "esim-section-archived");
    assert.ok(document.getElementById("esim-section-archived"));
    assert.match(document.body.textContent ?? "", /Croatia/);

    fireEvent.click(toggle);
    assert.equal(toggle.getAttribute("aria-expanded"), "false");
    assert.equal(toggle.getAttribute("aria-controls"), "esim-section-archived");
    assert.equal(document.getElementById("esim-section-archived"), null);
  });

  it("preserves user-opened state across parent re-renders", () => {
    render(
      createElement(RerenderHarness, {
        title: "Archived",
        listId: "esim-section-archived",
        defaultOpen: false,
      }),
    );

    const toggle = screen.getByRole("button", { name: /Archived/i });
    fireEvent.click(toggle);
    assert.equal(toggle.getAttribute("aria-expanded"), "true");

    fireEvent.click(screen.getByRole("button", { name: /rerender-0/ }));
    assert.equal(
      screen.getByRole("button", { name: /Archived/i }).getAttribute(
        "aria-expanded",
      ),
      "true",
    );
  });

  it("starts open when defaultOpen is true", () => {
    render(
      createElement(EsimListSection, {
        title: "Active",
        listId: "esim-section-active",
        defaultOpen: true,
        esims: [baseEsim({ status: "in_use" })],
        pendingId: null,
      }),
    );

    const toggle = screen.getByRole("button", { name: /Active/i });
    assert.equal(toggle.getAttribute("aria-expanded"), "true");
    assert.ok(document.getElementById("esim-section-active"));
  });

  it("toggles with Enter and Space via native button semantics", () => {
    render(
      createElement(EsimListSection, {
        title: "Expired",
        listId: "esim-section-expired",
        defaultOpen: true,
        esims: [baseEsim()],
        pendingId: null,
      }),
    );

    const toggle = screen.getByRole("button", { name: /Expired/i });
    toggle.focus();
    assert.equal(document.activeElement, toggle);

    act(() => {
      fireEvent.keyDown(toggle, { key: "Enter", code: "Enter", charCode: 13 });
      fireEvent.click(toggle);
    });
    assert.equal(toggle.getAttribute("aria-expanded"), "false");

    act(() => {
      fireEvent.keyDown(toggle, { key: " ", code: "Space", charCode: 32 });
      fireEvent.click(toggle);
    });
    assert.equal(toggle.getAttribute("aria-expanded"), "true");
  });

  it("renders nothing when esims is empty", () => {
    const { container } = render(
      createElement(EsimListSection, {
        title: "Archived",
        listId: "esim-section-archived",
        defaultOpen: false,
        esims: [],
        pendingId: null,
      }),
    );

    assert.equal(container.textContent, "");
    assert.equal(container.querySelector("h2"), null);
    assert.equal(container.querySelector("button"), null);
    assert.equal(container.querySelector("ul"), null);
  });

  it("marks the chevron as decorative", () => {
    render(
      createElement(EsimListSection, {
        title: "Active",
        listId: "esim-section-active",
        defaultOpen: true,
        esims: [baseEsim()],
        pendingId: null,
      }),
    );

    const toggle = screen.getByRole("button", { name: /Active/i });
    const decorative = toggle.querySelector("[aria-hidden]");
    assert.ok(decorative);
    assert.match(decorative?.textContent ?? "", /[▾▸]/);
  });
});
