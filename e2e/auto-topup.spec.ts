import { expect, test, type Page } from "@playwright/test";

const ESIM_ID = "456";
const DETAIL_PATH = `/me/esims/${ESIM_ID}`;

const mockBillingConfig = {
  config_version: 1,
  token_symbol: "USDT",
  token_name: "USDT Credits",
  token_decimals: 6,
  display_decimals: 2,
  billing_enabled: true,
};

const mockDepositInfo = {
  wallet: "0x0000000000000000000000000000000000000001",
  chain_id: 80002,
  token_symbol: "USDT",
  token_decimals: 6,
  contract: "0x0000000000000000000000000000000000000002",
  min_confirmations: 3,
  eip681_uri: "ethereum:0xtoken@80002/transfer?address=0x1",
  walletconnect_enabled: false,
  subscriptions_enabled: false,
  vouchers_enabled: false,
};

const mockEsim = {
  id: Number(ESIM_ID),
  iccid: "890000000000000000456",
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
  note: "",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

const mockTopups = {
  results: [
    {
      id: "topup-pkg-1",
      title: "1 GB Top-up",
      data_allowance: "1 GB",
      is_unlimited: false,
      validity_days: 7,
      price_usd: "9.99",
    },
    {
      id: "topup-pkg-2",
      title: "3 GB Top-up",
      data_allowance: "3 GB",
      is_unlimited: false,
      validity_days: 15,
      price_usd: "19.99",
    },
  ],
};

const mockPolicy = {
  id: "11111111-1111-1111-1111-111111111111",
  package_id: "topup-pkg-1",
  enabled: true,
  status: "active",
  reason: "",
  trigger_mode: "expiry",
  threshold_mb: null,
  renew_mode: "until_funds",
  remaining_count: null,
  cooldown_until: null,
  last_triggered_at: null,
  version: 0,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

async function seedAuth(page: Page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem("roamkit_access_token", "e2e-access-token");
      localStorage.setItem("roamkit_refresh_token", "e2e-refresh-token");
      localStorage.setItem("roamkit_remember_me", "true");
    } catch {
      // ignore
    }
  });
}

async function mockBillingRoutes(page: Page) {
  await page.route("**/api/v1/auth/me/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: 1,
        email: "e2e@roamkit.net",
        is_staff: false,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      }),
    });
  });
  await page.route("**/api/v1/billing/config/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockBillingConfig),
    });
  });
  await page.route("**/api/v1/billing/deposit-info/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockDepositInfo),
    });
  });
  await page.route("**/api/v1/billing/balance/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ balance: "500.00" }),
    });
  });
}

async function mockEsimDetailRoutes(page: Page) {
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
  await page.route(`**/api/v1/me/esims/${ESIM_ID}/topups/**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockTopups),
    });
  });
  await page.route(`**/api/v1/me/esims/${ESIM_ID}/`, async (route) => {
    const url = route.request().url();
    if (
      url.includes("/auto-topup") ||
      url.includes("/topups") ||
      url.includes("/usage")
    ) {
      await route.fallback();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockEsim),
    });
  });
}

function isAutoTopupUrl(url: URL): boolean {
  return url.pathname.includes(`/me/esims/${ESIM_ID}/auto-topup`);
}

test.describe("eSIM auto top-up controls", () => {
  test("creates policy via PUT with selected package and trigger", async ({
    page,
  }) => {
    await seedAuth(page);
    await mockBillingRoutes(page);
    await mockEsimDetailRoutes(page);

    await page.route(isAutoTopupUrl, async (route) => {
      const method = route.request().method();
      if (method === "GET") {
        await route.fulfill({
          status: 404,
          contentType: "application/json",
          body: JSON.stringify({ detail: "Not found." }),
        });
        return;
      }
      if (method === "PUT") {
        const body = route.request().postDataJSON() as {
          package_id: string;
          trigger_mode: string;
          renew_mode: string;
          enabled: boolean;
        };
        expect(body.package_id).toBe("topup-pkg-2");
        expect(body.trigger_mode).toBe("usage_zero");
        expect(body.renew_mode).toBe("until_funds");
        expect(body.enabled).toBe(true);
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            ...mockPolicy,
            package_id: body.package_id,
            trigger_mode: body.trigger_mode,
            renew_mode: body.renew_mode,
            version: 0,
          }),
        });
        return;
      }
      await route.fulfill({ status: 405 });
    });

    await page.goto(DETAIL_PATH, { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", { name: "Available top-ups" }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(
      page.getByRole("heading", { name: "Auto top-up" }),
    ).toBeVisible();

    await page
      .getByLabel("Enable auto top-up for a package below")
      .check();
    await page.getByLabel("Package", { exact: true }).selectOption("topup-pkg-2");
    await page
      .getByLabel("When remaining data reaches 0")
      .check();
    await page.getByRole("button", { name: "Save auto top-up" }).click();

    await expect(page.getByText("Auto top-up saved.")).toBeVisible({
      timeout: 10_000,
    });
    await expect(
      page.getByText("Auto top-up is on for this eSIM."),
    ).toBeVisible();
  });

  test("shows status banner from paused reason", async ({ page }) => {
    await seedAuth(page);
    await mockBillingRoutes(page);
    await mockEsimDetailRoutes(page);

    await page.route(isAutoTopupUrl, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ...mockPolicy,
          status: "paused",
          reason: "insufficient_funds",
          version: 2,
        }),
      });
    });

    await page.goto(DETAIL_PATH, { waitUntil: "domcontentloaded" });
    await expect(
      page.getByText(
        "Paused — not enough credits for the next auto top-up.",
      ),
    ).toBeVisible({ timeout: 30_000 });
  });

  test("Buy CTA remains available alongside auto top-up", async ({ page }) => {
    await seedAuth(page);
    await mockBillingRoutes(page);
    await mockEsimDetailRoutes(page);

    await page.route(isAutoTopupUrl, async (route) => {
      await route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Not found." }),
      });
    });

    await page.goto(DETAIL_PATH, { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", { name: "Auto top-up" }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("button", { name: "Buy" }).first()).toBeVisible();
  });
});
