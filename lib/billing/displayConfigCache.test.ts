import assert from "node:assert/strict";
import { afterEach, before, describe, it } from "node:test";

import {
  DISPLAY_CONFIG_CACHE_SCHEMA,
  parseDisplayConfigCache,
  writeDisplayConfigCache,
  readDisplayConfigCache,
  clearDisplayConfigCache,
  DISPLAY_CONFIG_CACHE_KEY,
} from "@/lib/billing/displayConfigCache";
import type { BillingConfigResponse } from "@/types/billing";

const sample: BillingConfigResponse = {
  config_version: 1,
  token_symbol: "USDT",
  token_name: "USDT Credits",
  token_decimals: 6,
  display_decimals: 2,
  billing_enabled: true,
};

describe("displayConfigCache", () => {
  const localStore = new Map<string, string>();

  before(() => {
    Object.defineProperty(globalThis, "window", {
      value: globalThis,
      configurable: true,
    });
    Object.defineProperty(globalThis, "localStorage", {
      value: {
        getItem(key: string) {
          return localStore.has(key) ? localStore.get(key)! : null;
        },
        setItem(key: string, value: string) {
          localStore.set(key, value);
        },
        removeItem(key: string) {
          localStore.delete(key);
        },
      },
      configurable: true,
    });
  });

  afterEach(() => {
    localStore.clear();
    clearDisplayConfigCache();
  });

  it("parses a valid envelope", () => {
    const raw = JSON.stringify({
      cache_schema: DISPLAY_CONFIG_CACHE_SCHEMA,
      saved_at: 42,
      config: sample,
    });
    const parsed = parseDisplayConfigCache(raw);
    assert.ok(parsed);
    assert.equal(parsed.config.config_version, 1);
    assert.equal(parsed.config.token_symbol, "USDT");
  });

  it("rejects wrong cache_schema", () => {
    const raw = JSON.stringify({
      cache_schema: DISPLAY_CONFIG_CACHE_SCHEMA + 1,
      saved_at: 42,
      config: sample,
    });
    assert.equal(parseDisplayConfigCache(raw), null);
  });

  it("rejects missing fields", () => {
    const raw = JSON.stringify({
      cache_schema: DISPLAY_CONFIG_CACHE_SCHEMA,
      saved_at: 42,
      config: { token_symbol: "USDT" },
    });
    assert.equal(parseDisplayConfigCache(raw), null);
  });

  it("overwrites when config_version changes (localStorage)", () => {
    writeDisplayConfigCache(sample, 100);
    const first = readDisplayConfigCache();
    assert.ok(first);
    assert.equal(first.config.config_version, 1);

    writeDisplayConfigCache({ ...sample, config_version: 2 }, 200);
    const second = readDisplayConfigCache();
    assert.ok(second);
    assert.equal(second.config.config_version, 2);
    assert.equal(second.saved_at, 200);

    writeDisplayConfigCache({ ...sample, config_version: 2 }, 999);
    const third = readDisplayConfigCache();
    assert.ok(third);
    assert.equal(third.saved_at, 200);

    clearDisplayConfigCache();
    assert.equal(localStorage.getItem(DISPLAY_CONFIG_CACHE_KEY), null);
  });
});
