import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { toBillingDisplayConfig } from "@/lib/billing/config";
import type { BillingConfigResponse } from "@/types/billing";

const SCHEMA_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "billing-config.response.schema.json",
);

type JsonSchema = {
  type?: string;
  required?: string[];
  additionalProperties?: boolean;
  properties?: Record<
    string,
    { type?: string; minLength?: number; minimum?: number }
  >;
};

function loadSchema(): JsonSchema {
  return JSON.parse(fs.readFileSync(SCHEMA_PATH, "utf8")) as JsonSchema;
}

function validateBillingConfigContract(payload: Record<string, unknown>): void {
  const schema = loadSchema();
  assert.equal(schema.type, "object");
  const required = schema.required ?? [];
  const props = schema.properties ?? {};
  for (const key of required) {
    assert.ok(key in payload, `missing required field: ${key}`);
  }
  if (schema.additionalProperties === false) {
    const extra = Object.keys(payload).filter((key) => !(key in props));
    assert.deepEqual(extra, []);
  }
  for (const [key, value] of Object.entries(payload)) {
    const spec = props[key];
    assert.ok(spec, `unexpected field: ${key}`);
    if (spec.type === "integer") {
      assert.equal(typeof value, "number");
      assert.ok(Number.isInteger(value));
      if (spec.minimum != null) {
        assert.ok((value as number) >= spec.minimum);
      }
    } else if (spec.type === "string") {
      assert.equal(typeof value, "string");
      if (spec.minLength != null) {
        assert.ok((value as string).length >= spec.minLength);
      }
    } else if (spec.type === "boolean") {
      assert.equal(typeof value, "boolean");
    } else {
      assert.fail(`unsupported type for ${key}`);
    }
  }
}

const sample: BillingConfigResponse = {
  config_version: 1,
  token_symbol: "USDT",
  token_name: "USDT Credits",
  token_decimals: 6,
  display_decimals: 2,
  billing_enabled: true,
};

describe("billing/config JSON contract", () => {
  it("validates the shared schema against a sample payload", () => {
    validateBillingConfigContract({ ...sample });
  });

  it("maps a contract-valid payload through toBillingDisplayConfig", () => {
    validateBillingConfigContract({ ...sample });
    const mapped = toBillingDisplayConfig(sample);
    assert.equal(mapped.currency.symbol, "USDT");
    assert.equal(mapped.configVersion, 1);
    assert.equal(mapped.currency.decimals, 2);
  });

  it("rejects renamed fields", () => {
    assert.throws(() =>
      validateBillingConfigContract({
        config_version: 1,
        token: "USDT",
        token_name: "USDT Credits",
        token_decimals: 6,
        display_decimals: 2,
        billing_enabled: true,
      }),
    );
  });
});
