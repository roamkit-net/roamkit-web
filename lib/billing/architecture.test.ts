import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

/**
 * UI surfaces only. Billing/orders HTTP is allowed exclusively in:
 * - `lib/billing/client.ts`
 * - `lib/orders/client.ts`
 * - `lib/orders/topupClient.ts`
 * Those paths are intentionally outside this scan.
 */
const SCAN_DIRS = ["app", "components"] as const;

type GuardRule = {
  id: string;
  description: string;
  pattern: RegExp;
};

/** Patterns that must not appear under app/ or components/. */
export const ARCHITECTURE_GUARD_RULES: GuardRule[] = [
  {
    id: "raw-billing-fetch",
    description: "raw billing HTTP from UI (use lib/billing/client.ts)",
    pattern:
      /\b(?:fetch|fetchApi)\s*\(\s*(['"`])\/api\/v1\/billing(?:\/|\1)/,
  },
  {
    id: "raw-orders-fetch",
    description: "raw orders HTTP from UI (use lib/orders/client.ts)",
    pattern:
      /\b(?:fetch|fetchApi)\s*\(\s*(['"`])\/api\/v1\/orders(?:\/|\1)/,
  },
  {
    id: "raw-topups-fetch",
    description: "raw top-up HTTP from UI (use lib/orders/topupClient.ts)",
    pattern:
      /\b(?:fetch|fetchApi)\s*\(\s*(['"`])\/api\/v1\/me\/esims\/[^'"`]*\/topups/,
  },
  {
    id: "hardcoded-chain-id",
    description: "hardcoded Polygon chain id (use BillingConfig.chainId)",
    pattern: /\b(?:chainId|chain_id)\s*[:=]\s*137\b/,
  },
  {
    id: "hardcoded-token-symbol",
    description: "hardcoded USDT token symbol (use BillingConfig.tokenSymbol)",
    pattern: /\b(?:tokenSymbol|token_symbol)\s*[:=]\s*['"]USDT['"]/,
  },
  {
    id: "hardcoded-usdt-contract",
    description: "hardcoded USDT contract (use BillingConfig.contract)",
    pattern: /0xc2132[dD]05[dD]31[cC]914[aA]87[cC]6611[cC]10748[aA][eE][bB]04[bB]58[eE]8[fF]/,
  },
];

function listSourceFiles(dir: string): string[] {
  const absolute = path.join(ROOT, dir);
  if (!fs.existsSync(absolute)) {
    return [];
  }
  const out: string[] = [];
  const stack = [absolute];
  while (stack.length > 0) {
    const current = stack.pop()!;
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name === ".next") {
          continue;
        }
        stack.push(full);
        continue;
      }
      if (/\.(ts|tsx|js|jsx)$/.test(entry.name) && !entry.name.endsWith(".test.ts")) {
        out.push(full);
      }
    }
  }
  return out.sort();
}

export function findArchitectureViolations(
  source: string,
  rules: GuardRule[] = ARCHITECTURE_GUARD_RULES,
): string[] {
  const hits: string[] = [];
  for (const rule of rules) {
    if (rule.pattern.test(source)) {
      hits.push(rule.id);
    }
  }
  return hits;
}

function scanTree(): string[] {
  const offenders: string[] = [];
  for (const dir of SCAN_DIRS) {
    for (const file of listSourceFiles(dir)) {
      const source = fs.readFileSync(file, "utf8");
      const hits = findArchitectureViolations(source);
      if (hits.length === 0) {
        continue;
      }
      const rel = path.relative(ROOT, file);
      for (const id of hits) {
        offenders.push(`${rel}: ${id}`);
      }
    }
  }
  return offenders;
}

describe("billing architecture guard", () => {
  it("detects raw billing and orders fetches in sample snippets", () => {
    assert.deepEqual(
      findArchitectureViolations(
        `await fetch("/api/v1/billing/balance/");`,
      ),
      ["raw-billing-fetch"],
    );
    assert.deepEqual(
      findArchitectureViolations(
        `await fetchApi('/api/v1/orders/');`,
      ),
      ["raw-orders-fetch"],
    );
    assert.deepEqual(
      findArchitectureViolations(
        "await fetch(`/api/v1/billing/deposit-info/`);",
      ),
      ["raw-billing-fetch"],
    );
    assert.deepEqual(
      findArchitectureViolations(
        `await fetchApi("/api/v1/me/esims/12/topups/");`,
      ),
      ["raw-topups-fetch"],
    );
  });

  it("detects hardcoded chain/token/contract in sample snippets", () => {
    assert.ok(
      findArchitectureViolations(`const cfg = { chainId: 137 };`).includes(
        "hardcoded-chain-id",
      ),
    );
    assert.ok(
      findArchitectureViolations(`tokenSymbol: "USDT"`).includes(
        "hardcoded-token-symbol",
      ),
    );
    assert.ok(
      findArchitectureViolations(
        `const contract = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F";`,
      ).includes("hardcoded-usdt-contract"),
    );
  });

  it("allows client-mediated billing usage patterns", () => {
    assert.deepEqual(
      findArchitectureViolations(
        `import { getBalance } from "@/lib/billing/client";\nawait getBalance();`,
      ),
      [],
    );
    assert.deepEqual(
      findArchitectureViolations(
        `import { createOrder } from "@/lib/orders/client";\nawait createOrder(payload);`,
      ),
      [],
    );
    assert.deepEqual(
      findArchitectureViolations(
        `const chainId = config.chainId;\nconst symbol = config.tokenSymbol;`,
      ),
      [],
    );
  });

  it("passes for app/ and components/ (no hardcoded billing config or raw fetch)", () => {
    assert.deepEqual(scanTree(), []);
  });

  it("does not scan lib clients (billing/orders HTTP allowed only there)", () => {
    assert.ok(!(SCAN_DIRS as readonly string[]).includes("lib"));
    assert.deepEqual(
      findArchitectureViolations(
        `await fetchApi("/api/v1/billing/balance/");`,
      ),
      ["raw-billing-fetch"],
    );
    // Same snippet is fine in lib/billing/client.ts because that path is not scanned.
  });
});
