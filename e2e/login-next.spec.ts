import { expect, test } from "@playwright/test";

const ESIM_ID = "123";
const DETAIL_PATH = `/me/esims/${ESIM_ID}`;

const mockEsim = {
  id: Number(ESIM_ID),
  iccid: "8900000000000000001",
  lpa: "LPA:1$example$matching",
  matching_id: "matching",
  qrcode: "",
  qrcode_url: "",
  direct_apple_installation_url: "",
  manual_installation: "",
  qrcode_installation: "",
  installation_guide_url: "",
  status: "active",
  package_title: "1 GB - 7 days",
  location_title: "Croatia",
  country_code: "HR",
  data_allowance: "1 GB",
  validity_days: 7,
  paid_usd: "4.00",
  currency: "USD",
  issued_at: "2026-01-01T00:00:00Z",
  activated_at: null,
  usage_remaining_mb: 1000,
  usage_total_mb: 1000,
  usage_status: "active",
  usage_is_unlimited: false,
  usage_expired_at: null,
  usage_synced_at: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

test.describe("login next redirect", () => {
  test("preserves next, toggles password, returns after login", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      try {
        localStorage.removeItem("roamkit_access_token");
        localStorage.removeItem("roamkit_refresh_token");
        sessionStorage.removeItem("roamkit_access_token");
        sessionStorage.removeItem("roamkit_refresh_token");
      } catch {
        // ignore
      }
    });

    await page.route("**/api/v1/auth/token/", async (route) => {
      if (route.request().method() !== "POST") {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          access: "test-access-token",
          refresh: "test-refresh-token",
        }),
      });
    });

    await page.route(`**/api/v1/me/esims/${ESIM_ID}/`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockEsim),
      });
    });

    await page.route(`**/api/v1/me/esims/${ESIM_ID}/topups/`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ results: [] }),
      });
    });

    await page.route(`**/api/v1/me/esims/${ESIM_ID}/usage/`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          remaining_mb: 1000,
          total_mb: 1000,
          expired_at: null,
          is_unlimited: false,
          status: "active",
          remaining_voice: 0,
          remaining_text: 0,
          total_voice: 0,
          total_text: 0,
        }),
      });
    });

    await page.goto(DETAIL_PATH, { waitUntil: "domcontentloaded" });

    await expect(page).toHaveURL(
      new RegExp(`/login\\?next=${encodeURIComponent(DETAIL_PATH)}`),
    );

    const password = page.locator("#password");
    const toggle = page.getByRole("button", { name: "Show password" });
    await expect(password).toHaveAttribute("type", "password");
    await toggle.click();
    await expect(password).toHaveAttribute("type", "text");
    await expect(
      page.getByRole("button", { name: "Hide password" }),
    ).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: "Hide password" }).click();
    await expect(password).toHaveAttribute("type", "password");

    await page.getByLabel("Email").fill("user@example.com");
    await password.fill("password123");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(new RegExp(`${DETAIL_PATH}/?$`), {
      timeout: 30_000,
    });
  });
});
