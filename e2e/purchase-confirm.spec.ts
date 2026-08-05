import { expect, test, type Page } from "@playwright/test";

const STORE_PATH = "/global-esim";
const ESIM_ID = "456";
const TOPUP_DETAIL_PATH = `/me/esims/${ESIM_ID}`;

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
  ],
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

async function mockBillingRoutes(
  page: Page,
  balance: string,
) {
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
      body: JSON.stringify({ balance }),
    });
  });
}

test.describe("purchase confirm dialog", () => {
  test("cancel does not POST an order", async ({ page }) => {
    await seedAuth(page);
    await mockBillingRoutes(page, "500.00");

    let orderPosts = 0;
    await page.route("**/api/v1/orders/**", async (route) => {
      if (route.request().method() === "POST") {
        orderPosts += 1;
      }
      await route.continue();
    });

    await page.goto(STORE_PATH, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("button", { name: "Buy" }).first()).toBeVisible({
      timeout: 30_000,
    });

    await page.getByRole("button", { name: "Buy" }).first().click();
    await expect(
      page.getByRole("heading", { name: "Confirm purchase" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(
      page.getByRole("heading", { name: "Confirm purchase" }),
    ).toHaveCount(0);
    expect(orderPosts).toBe(0);
  });

  test("confirm sends exactly one order POST", async ({ page }) => {
    await seedAuth(page);
    await mockBillingRoutes(page, "500.00");

    let orderPosts = 0;
    await page.route("**/api/v1/orders/**", async (route) => {
      if (route.request().method() !== "POST") {
        await route.continue();
        return;
      }
      orderPosts += 1;
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          id: "order-e2e-1",
          esims: [{ id: 999, iccid: "890000000000000000999" }],
        }),
      });
    });

    await page.goto(STORE_PATH, { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Buy" }).first().click();
    await expect(
      page.getByRole("button", { name: "Confirm purchase" }),
    ).toBeVisible({ timeout: 10_000 });

    await page.getByRole("button", { name: "Confirm purchase" }).click();
    await expect.poll(() => orderPosts).toBe(1);
  });

  test("low balance shows Add credits CTA and redirects to deposit", async ({
    page,
  }) => {
    await seedAuth(page);
    await mockBillingRoutes(page, "0.01");

    await page.goto(STORE_PATH, { waitUntil: "domcontentloaded" });
    const cta = page
      .getByRole("button", { name: /Add credits|Add \d/ })
      .first();
    await expect(cta).toBeVisible({ timeout: 30_000 });
    await expect(cta).toBeEnabled();
    await expect(cta).toHaveAttribute(
      "title",
      "Not enough credits — deposit to buy this plan",
    );

    await cta.click();
    await expect(page).toHaveURL(/\/me\/deposit\?/, { timeout: 15_000 });
    await expect(page).toHaveURL(/amount=/);
    await expect(page).toHaveURL(/return=/);

    const pending = await page.evaluate(() =>
      sessionStorage.getItem("roamkit_pending_spend"),
    );
    expect(pending).toBeTruthy();
    const parsed = JSON.parse(pending!) as {
      kind: string;
      version?: number;
      packageId: string;
    };
    expect(parsed.kind).toBe("order");
    expect(parsed.packageId).toBeTruthy();
  });

  test("double-click shortfall CTA creates one pending spend", async ({
    page,
  }) => {
    await seedAuth(page);
    await mockBillingRoutes(page, "0");

    await page.goto(STORE_PATH, { waitUntil: "domcontentloaded" });
    const cta = page.getByRole("button", { name: "Add credits" }).first();
    await expect(cta).toBeVisible({ timeout: 30_000 });

    await Promise.all([cta.click(), cta.click()]);
    await expect(page).toHaveURL(/\/me\/deposit\?/, { timeout: 15_000 });

    const pending = await page.evaluate(() =>
      sessionStorage.getItem("roamkit_pending_spend"),
    );
    expect(pending).toBeTruthy();
    // Single JSON object — replace allowed, but not two concurrent saves mid-flight
    expect(() => JSON.parse(pending!)).not.toThrow();
  });

  test("pending spend auto-retries without opening the dialog", async ({
    page,
  }) => {
    await seedAuth(page);
    await mockBillingRoutes(page, "500.00");

    await page.addInitScript(
      ({ returnPath }) => {
        sessionStorage.setItem(
          "roamkit_pending_spend",
          JSON.stringify({
            version: 1,
            kind: "order",
            packageId: "pending-package-id",
            idempotencyKey: "order-idem-e2e",
            returnPath,
            createdAt: Date.now(),
          }),
        );
      },
      { returnPath: STORE_PATH },
    );

    let orderPosts = 0;
    await page.route("**/api/v1/orders/**", async (route) => {
      if (route.request().method() !== "POST") {
        await route.continue();
        return;
      }
      orderPosts += 1;
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          id: "order-retry-1",
          esims: [{ id: 888, iccid: "890000000000000000888" }],
        }),
      });
    });

    await page.goto(STORE_PATH, { waitUntil: "domcontentloaded" });
    await expect(
      page.getByText("Completing your purchase after deposit…"),
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByRole("heading", { name: "Confirm purchase" }),
    ).toHaveCount(0);
    await expect.poll(() => orderPosts).toBe(1);

    const pendingAfter = await page.evaluate(() =>
      sessionStorage.getItem("roamkit_pending_spend"),
    );
    expect(pendingAfter).toBeNull();

    // Returning to the store without pending must not POST again
    await page.goto(STORE_PATH, { waitUntil: "domcontentloaded" });
    await expect(
      page.getByText("Completing your purchase after deposit…"),
    ).toHaveCount(0);
    await expect.poll(() => orderPosts).toBe(1);
  });
});

test.describe("purchase confirm dialog — top-up", () => {
  test("low balance top-up CTA redirects to deposit", async ({ page }) => {
    await seedAuth(page);
    await mockBillingRoutes(page, "0");

    await page.route(`**/api/v1/me/esims/${ESIM_ID}/`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockEsim),
      });
    });
    await page.route(`**/api/v1/me/esims/${ESIM_ID}/topups/**`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockTopups),
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
          synced_at: null,
        }),
      });
    });

    await page.goto(TOPUP_DETAIL_PATH, { waitUntil: "domcontentloaded" });
    const cta = page.getByRole("button", { name: "Add credits" }).first();
    await expect(cta).toBeVisible({ timeout: 30_000 });
    await cta.click();
    await expect(page).toHaveURL(/\/me\/deposit\?/, { timeout: 15_000 });
    const pending = await page.evaluate(() =>
      sessionStorage.getItem("roamkit_pending_spend"),
    );
    expect(pending).toBeTruthy();
    expect(JSON.parse(pending!).kind).toBe("topup");
  });

  test("pending top-up spend auto-retries without dialog", async ({ page }) => {
    await seedAuth(page);
    await mockBillingRoutes(page, "500.00");

    await page.route(`**/api/v1/me/esims/${ESIM_ID}/`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockEsim),
      });
    });

    let topupPosts = 0;
    await page.route(`**/api/v1/me/esims/${ESIM_ID}/topups/**`, async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(mockTopups),
        });
        return;
      }
      if (route.request().method() === "POST") {
        topupPosts += 1;
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            id: "topup-purchase-retry",
            amount: "9.99",
          }),
        });
        return;
      }
      await route.continue();
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
          synced_at: null,
        }),
      });
    });

    await page.addInitScript(
      ({ returnPath, esimId }) => {
        sessionStorage.setItem(
          "roamkit_pending_spend",
          JSON.stringify({
            kind: "topup",
            esimId,
            packageId: "topup-pkg-1",
            idempotencyKey: "topup-idem-e2e",
            returnPath,
            createdAt: Date.now(),
          }),
        );
      },
      { returnPath: TOPUP_DETAIL_PATH, esimId: ESIM_ID },
    );

    await page.goto(TOPUP_DETAIL_PATH, { waitUntil: "domcontentloaded" });
    await expect(
      page.getByText("Completing your top-up after deposit…"),
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByRole("heading", { name: "Confirm purchase" }),
    ).toHaveCount(0);
    await expect.poll(() => topupPosts).toBe(1);
  });
});
