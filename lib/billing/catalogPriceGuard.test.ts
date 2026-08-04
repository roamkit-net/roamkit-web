import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

/**
 * Catalog / plans / location / top-up surfaces that must render prices
 * only via `<CatalogPriceDisplay />`.
 */
const CATALOG_SCAN_GLOBS = [
  "components/LocationCard.tsx",
  "components/LocationDetail.tsx",
  "components/LocationSearch.tsx",
  "components/PackageRow.tsx",
  "components/PlanCard.tsx",
  "components/PlansStore.tsx",
  "components/CatalogPriceDisplay.tsx",
  "components/landing/FeaturedPlans.tsx",
  "app/plans/page.tsx",
  "app/[location]/page.tsx",
  "app/me/esims/[id]/page.tsx",
] as const;

/** Files allowed to import / call catalog money formatters. */
const FORMATTER_ALLOWLIST = new Set([
  "components/CatalogPriceDisplay.tsx",
  "lib/billing/format.ts",
]);

type GuardRule = {
  id: string;
  description: string;
  pattern: RegExp;
  /** When true, FORMATTER_ALLOWLIST paths skip this rule. */
  allowlistFormatters?: boolean;
};

export const CATALOG_PRICE_GUARD_RULES: GuardRule[] = [
  {
    id: "catalog-usd-currency",
    description: 'hardcoded currency: "USD" (use CatalogPriceDisplay)',
    pattern: /\bcurrency\s*:\s*['"]USD['"]/,
  },
  {
    id: "catalog-usd-literal",
    description: 'literal " USD" in catalog UI (use CatalogPriceDisplay)',
    pattern: /\sUSD\b/,
  },
  {
    id: "catalog-dollar-amount",
    description: "dollar-prefixed amount ($…) in catalog UI",
    pattern: /\$\d/,
  },
  {
    id: "catalog-intl-currency",
    description: 'Intl style: "currency" in catalog UI',
    pattern: /\bstyle\s*:\s*['"]currency['"]/,
  },
  {
    id: "catalog-format-money-call",
    description: "formatMoney( in catalog UI (use CatalogPriceDisplay)",
    pattern: /\bformatMoney\s*\(/,
    allowlistFormatters: true,
  },
  {
    id: "catalog-format-credits-call",
    description: "formatCredits( in catalog UI (use CatalogPriceDisplay)",
    pattern: /\bformatCredits\s*\(/,
    allowlistFormatters: true,
  },
  {
    id: "catalog-format-catalog-price-call",
    description:
      "formatCatalogPrice( outside CatalogPriceDisplay (catalog UI rule)",
    pattern: /\bformatCatalogPrice\s*\(/,
    allowlistFormatters: true,
  },
  {
    id: "catalog-format-import",
    description:
      "direct import of formatCredits/formatMoney/formatCatalogPrice in catalog UI",
    pattern:
      /\bimport\s*\{[^}]*\b(?:formatCredits|formatMoney|formatCatalogPrice)\b[^}]*\}\s*from\s*['"]@\/lib\/billing\/format['"]/,
    allowlistFormatters: true,
  },
];

export function findCatalogPriceViolations(
  source: string,
  rules: GuardRule[] = CATALOG_PRICE_GUARD_RULES,
  options: { relPath?: string } = {},
): string[] {
  const rel = options.relPath?.replace(/\\/g, "/") ?? "";
  const allowlisted = FORMATTER_ALLOWLIST.has(rel);
  const hits: string[] = [];
  for (const rule of rules) {
    if (rule.allowlistFormatters && allowlisted) {
      continue;
    }
    if (rule.pattern.test(source)) {
      hits.push(rule.id);
    }
  }
  return hits;
}

function catalogFiles(): string[] {
  return CATALOG_SCAN_GLOBS.map((rel) => path.join(ROOT, rel)).filter((abs) =>
    fs.existsSync(abs),
  );
}

function scanCatalogTree(): string[] {
  const offenders: string[] = [];
  for (const abs of catalogFiles()) {
    const rel = path.relative(ROOT, abs).replace(/\\/g, "/");
    const source = fs.readFileSync(abs, "utf8");
    const hits = findCatalogPriceViolations(source, CATALOG_PRICE_GUARD_RULES, {
      relPath: rel,
    });
    for (const id of hits) {
      offenders.push(`${rel}: ${id}`);
    }
  }
  return offenders;
}

describe("catalog price display guard", () => {
  it("detects USD / $ / formatMoney in sample snippets", () => {
    assert.ok(
      findCatalogPriceViolations(`currency: "USD"`).includes(
        "catalog-usd-currency",
      ),
    );
    assert.ok(
      findCatalogPriceViolations(`return \`from \${x} USD\`;`).includes(
        "catalog-usd-literal",
      ),
    );
    assert.ok(
      findCatalogPriceViolations(`return "$9.50";`).includes(
        "catalog-dollar-amount",
      ),
    );
    assert.ok(
      findCatalogPriceViolations(`style: "currency"`).includes(
        "catalog-intl-currency",
      ),
    );
    assert.ok(
      findCatalogPriceViolations(`formatMoney(topup.price_usd)`).includes(
        "catalog-format-money-call",
      ),
    );
  });

  it("detects direct formatter imports in catalog UI", () => {
    assert.ok(
      findCatalogPriceViolations(
        `import { formatMoney } from "@/lib/billing/format";`,
      ).includes("catalog-format-import"),
    );
    assert.ok(
      findCatalogPriceViolations(
        `import { formatCredits, formatCatalogPrice } from "@/lib/billing/format";`,
      ).includes("catalog-format-import"),
    );
  });

  it("allowlists CatalogPriceDisplay for formatCatalogPrice", () => {
    assert.deepEqual(
      findCatalogPriceViolations(
        `import { formatCatalogPrice } from "@/lib/billing/format";\nformatCatalogPrice(price);`,
        CATALOG_PRICE_GUARD_RULES,
        { relPath: "components/CatalogPriceDisplay.tsx" },
      ),
      [],
    );
  });

  it("passes for catalog UI sources (no $ / USD / direct formatters)", () => {
    assert.deepEqual(scanCatalogTree(), []);
  });
});
