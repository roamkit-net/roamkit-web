import "./jsdomSetup";

import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { createElement } from "react";
import { cleanup, render, screen } from "@testing-library/react";

import type { Esim } from "@/lib/api";

import { EsimActionRequired } from "./EsimActionRequired";

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

describe("EsimActionRequired", () => {
  it("renders nothing when the list is empty", () => {
    const { container } = render(
      createElement(EsimActionRequired, { esims: [] }),
    );
    assert.equal(container.textContent, "");
  });

  it("shows destination, paused copy, and Resolve deep-link", () => {
    render(
      createElement(EsimActionRequired, {
        esims: [
          baseEsim({
            id: 19,
            location_title: "Croatia",
            auto_topup: {
              enabled: true,
              status: "paused",
              reason: "insufficient_funds",
            },
          }),
          baseEsim({
            id: 20,
            location_title: "Discover Global",
            auto_topup: {
              enabled: true,
              status: "paused",
              reason: "insufficient_funds",
            },
          }),
        ],
      }),
    );

    assert.match(screen.getByRole("region").textContent ?? "", /Action required \(2\)/);
    assert.match(screen.getByRole("region").textContent ?? "", /Croatia/);
    assert.match(
      screen.getByRole("region").textContent ?? "",
      /Auto top-up paused · Insufficient funds/,
    );
    const links = screen.getAllByRole("link", { name: "Resolve" });
    assert.equal(links.length, 2);
    assert.equal(links[0]?.getAttribute("href"), "/me/esims/19#auto-topup");
    assert.equal(links[1]?.getAttribute("href"), "/me/esims/20#auto-topup");
  });

  it("renders funds and package rows once each with their own copy and Resolve href", () => {
    render(
      createElement(EsimActionRequired, {
        esims: [
          baseEsim({
            id: 19,
            location_title: "Croatia",
            auto_topup: {
              enabled: true,
              status: "paused",
              reason: "insufficient_funds",
            },
          }),
          baseEsim({
            id: 21,
            location_title: "Japan",
            auto_topup: {
              enabled: true,
              status: "blocked",
              reason: "package_unavailable",
            },
          }),
        ],
      }),
    );

    const region = screen.getByRole("region");
    assert.match(region.textContent ?? "", /Action required \(2\)/);
    assert.match(region.textContent ?? "", /Croatia/);
    assert.match(region.textContent ?? "", /Japan/);
    assert.match(
      region.textContent ?? "",
      /Auto top-up paused · Insufficient funds/,
    );
    assert.match(
      region.textContent ?? "",
      /Auto top-up blocked · Package unavailable/,
    );
    assert.equal(
      (region.textContent ?? "").match(/Auto top-up paused · Insufficient funds/g)
        ?.length,
      1,
    );
    assert.equal(
      (region.textContent ?? "").match(/Auto top-up blocked · Package unavailable/g)
        ?.length,
      1,
    );

    const links = screen.getAllByRole("link", { name: "Resolve" });
    assert.equal(links.length, 2);
    assert.equal(links[0]?.getAttribute("href"), "/me/esims/19#auto-topup");
    assert.equal(links[1]?.getAttribute("href"), "/me/esims/21#auto-topup");
    const items = region.querySelectorAll("li");
    assert.equal(items.length, 2);
    assert.match(items[0]?.textContent ?? "", /Croatia/);
    assert.match(items[1]?.textContent ?? "", /Japan/);
  });
});
