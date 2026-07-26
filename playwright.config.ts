import { defineConfig, devices } from "@playwright/test";

const baseURL =
  process.env.PLAYWRIGHT_BASE_URL?.trim() || "https://staging.roamkit.net";

/**
 * Catalog price acceptance / chaos tests (Gate D).
 * Run: PLAYWRIGHT_BASE_URL=https://staging.roamkit.net npx playwright test
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 30_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL,
    trace: "on-first-retry",
    ...devices["Desktop Chrome"],
  },
});
