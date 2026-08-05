import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  formatHealthLabel,
  healthStatusVariant,
  healthTooltip,
  shortestCacheHitTtlMs,
} from "@/lib/ops/healthDisplay";
import type { OpsHealth, OpsHealthItem } from "@/lib/ops/types";

function item(
  overrides: Partial<OpsHealthItem> & Pick<OpsHealthItem, "status">,
): OpsHealthItem {
  return {
    reason: "ok",
    message: "ok",
    checked_at: "2026-08-05T20:00:00Z",
    source: "live",
    timeout_ms: 100,
    details: {},
    ...overrides,
  };
}

function health(partial: Partial<OpsHealth> = {}): OpsHealth {
  return {
    schema_version: 1,
    overall_status: "unknown",
    generated_at: "2026-08-05T20:00:00Z",
    version: {},
    dependencies: {},
    workers: {},
    providers: {},
    metrics: [],
    checks: {},
    ...partial,
  };
}

describe("healthDisplay", () => {
  it("maps status to badge variants without inventing rules", () => {
    assert.equal(healthStatusVariant("healthy"), "success");
    assert.equal(healthStatusVariant("degraded"), "warning");
    assert.equal(healthStatusVariant("unhealthy"), "danger");
    assert.equal(healthStatusVariant("unknown"), "neutral");
  });

  it("formats labels and tooltips from DTO fields", () => {
    assert.equal(formatHealthLabel("celery_worker"), "celery worker");
    assert.equal(
      healthTooltip(
        item({
          status: "healthy",
          reason: "disabled",
          message: "WalletConnect disabled by configuration",
          source: "config",
        }),
      ),
      "WalletConnect disabled by configuration · reason=disabled · source=config",
    );
  });

  it("reads cache TTL from API metadata only", () => {
    assert.equal(shortestCacheHitTtlMs(health()), null);
    assert.equal(
      shortestCacheHitTtlMs(
        health({
          workers: {
            celery_worker: item({
              status: "healthy",
              source: "cached",
              cache: { hit: true, ttl_remaining_ms: 15200 },
            }),
          },
          providers: {
            polygon_rpc: item({
              status: "healthy",
              source: "cached",
              cache: { hit: true, ttl_remaining_ms: 8000 },
            }),
          },
        }),
      ),
      8000,
    );
    assert.equal(
      shortestCacheHitTtlMs(
        health({
          workers: {
            celery_worker: item({
              status: "healthy",
              source: "live",
              cache: { hit: false, ttl_remaining_ms: 20000 },
            }),
          },
        }),
      ),
      null,
    );
  });
});
