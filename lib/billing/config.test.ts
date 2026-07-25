import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  toBillingConfig,
  toBillingDisplayConfig,
  toBillingFeatures,
  toDisplayCurrency,
} from "./config";
import type { BillingConfigResponse, DepositInfo } from "@/types/billing";

const sampleInfo: DepositInfo = {
  wallet: "0xabc",
  chain_id: 80002,
  token_symbol: "TEST",
  token_decimals: 6,
  contract: "0xdef",
  min_confirmations: 12,
  eip681_uri: "ethereum:0xdef@80002/transfer?address=0xabc",
  walletconnect_enabled: true,
  subscriptions_enabled: false,
};

/** Empty / zeroed payload — mapper must not invent chain/token defaults. */
const minimalInfo: DepositInfo = {
  wallet: "",
  chain_id: 0,
  token_symbol: "",
  token_decimals: 0,
  contract: "",
  min_confirmations: 0,
  eip681_uri: "",
  walletconnect_enabled: false,
  subscriptions_enabled: false,
};

const sampleDisplayConfig: BillingConfigResponse = {
  config_version: 1,
  token_symbol: "USDT",
  token_name: "USDT Credits",
  token_decimals: 6,
  display_decimals: 2,
  billing_enabled: true,
};

describe("toDisplayCurrency / toBillingDisplayConfig", () => {
  it("maps public billing/config fields", () => {
    const currency = toDisplayCurrency(sampleDisplayConfig);
    assert.deepEqual(currency, {
      symbol: "USDT",
      name: "USDT Credits",
      decimals: 2,
    });

    const mapped = toBillingDisplayConfig(sampleDisplayConfig);
    assert.deepEqual(mapped, {
      currency,
      configVersion: 1,
      billingEnabled: true,
      tokenDecimals: 6,
    });
  });

  it("passes through empty symbol without inventing USDT", () => {
    const mapped = toBillingDisplayConfig({
      ...sampleDisplayConfig,
      token_symbol: "",
      billing_enabled: false,
    });
    assert.equal(mapped.currency.symbol, "");
    assert.equal(mapped.billingEnabled, false);
    assert.notEqual(mapped.currency.symbol, "USDT");
  });
});

describe("toBillingConfig", () => {
  it("maps deposit-info fields without inventing values", () => {
    const config = toBillingConfig(sampleInfo);
    assert.equal(config.wallet, sampleInfo.wallet);
    assert.equal(config.chainId, sampleInfo.chain_id);
    assert.equal(config.tokenSymbol, sampleInfo.token_symbol);
    assert.equal(config.decimals, sampleInfo.token_decimals);
    assert.equal(config.contract, sampleInfo.contract);
    assert.equal(config.confirmations, sampleInfo.min_confirmations);
    assert.equal(config.eip681Uri, sampleInfo.eip681_uri);
  });

  it("passes through a minimal empty payload without hardcoding chain/token", () => {
    const config = toBillingConfig(minimalInfo);
    assert.deepEqual(config, {
      wallet: "",
      chainId: 0,
      tokenSymbol: "",
      decimals: 0,
      contract: "",
      confirmations: 0,
      eip681Uri: "",
    });
    assert.notEqual(config.chainId, 137);
    assert.notEqual(config.tokenSymbol, "USDT");
  });

  it("does not replace invalid empty fields with Polygon USDT defaults", () => {
    const broken = {
      ...sampleInfo,
      wallet: "",
      chain_id: Number.NaN,
      token_symbol: "",
      contract: "",
      eip681_uri: "",
    } satisfies DepositInfo;
    const config = toBillingConfig(broken);
    assert.equal(config.wallet, "");
    assert.ok(Number.isNaN(config.chainId));
    assert.equal(config.tokenSymbol, "");
    assert.equal(config.contract, "");
    assert.equal(config.eip681Uri, "");
  });
});

describe("toBillingFeatures", () => {
  it("reads flags from deposit-info", () => {
    const features = toBillingFeatures(sampleInfo, { billingEnabled: true });
    assert.deepEqual(features, {
      billingEnabled: true,
      walletConnect: true,
      subscriptions: false,
    });
  });

  it("defaults flags when deposit-info is missing", () => {
    const features = toBillingFeatures(null, { billingEnabled: false });
    assert.deepEqual(features, {
      billingEnabled: false,
      walletConnect: false,
      subscriptions: false,
    });
  });

  it("does not invent true flags from an empty deposit-info payload", () => {
    const features = toBillingFeatures(minimalInfo, { billingEnabled: true });
    assert.deepEqual(features, {
      billingEnabled: true,
      walletConnect: false,
      subscriptions: false,
    });
  });
});
