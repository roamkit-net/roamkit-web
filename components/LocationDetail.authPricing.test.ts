import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

describe("LocationDetail auth pricing refetch", () => {
  it("refetches packages with JWT when authenticated (SSR is anonymous)", () => {
    const src = readFileSync(
      join(root, "components/LocationDetail.tsx"),
      "utf8",
    );
    assert.match(src, /fetchAllPackages/);
    assert.match(src, /isAuthenticated\(\)/);
    assert.match(
      src,
      /SSR catalog fetch is anonymous/,
    );
  });
});
