import { expect, test } from "@playwright/test";

test.describe("catalog prices on /global-esim", () => {
  test("happy path: prices visible, no sticky skeleton", async ({ page }) => {
    await page.goto("/global-esim", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("catalog-price").first()).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByTestId("catalog-price-skeleton")).toHaveCount(0);
  });

  test("chaos: billing/config 500 → degraded price, no skeleton", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      try {
        localStorage.removeItem("roamkit_billing_display_config");
        sessionStorage.removeItem("roamkit_billing_config_circuit");
      } catch {
        // ignore
      }
    });

    await page.route("**/api/v1/billing/config/**", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ detail: "chaos" }),
      });
    });

    await page.goto("/global-esim", { waitUntil: "domcontentloaded" });

    await expect(page.getByTestId("catalog-price-degraded").first()).toBeVisible(
      { timeout: 30_000 },
    );
    await expect(page.getByTestId("catalog-price-skeleton")).toHaveCount(0);
  });
});
