import { expect, test, type Page } from "@playwright/test";

const mockBillingConfig = {
  config_version: 1,
  token_symbol: "USDT",
  token_name: "USDT Credits",
  token_decimals: 6,
  display_decimals: 2,
  billing_enabled: true,
};

function depositInfo(vouchersEnabled: boolean) {
  return {
    wallet: "0x0000000000000000000000000000000000000001",
    chain_id: 80002,
    token_symbol: "USDT",
    token_decimals: 6,
    contract: "0x0000000000000000000000000000000000000002",
    min_confirmations: 3,
    eip681_uri: "ethereum:0xtoken@80002/transfer?address=0x1",
    walletconnect_enabled: false,
    subscriptions_enabled: false,
    vouchers_enabled: vouchersEnabled,
  };
}

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

async function mockCommonRoutes(page: Page, balance = "10.00") {
  await page.route("**/api/v1/auth/me/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: 1,
        email: "e2e@roamkit.net",
        first_name: "E2E",
        last_name: "User",
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

  await page.route("**/api/v1/billing/balance/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ balance }),
    });
  });
}

async function mockDepositInfo(page: Page, vouchersEnabled: boolean) {
  await page.route("**/api/v1/billing/deposit-info/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(depositInfo(vouchersEnabled)),
    });
  });
}

async function resetBrowserMocks(page: Page) {
  await page.evaluate(() => {
    try {
      // Reset any query-ish caches the app may keep in web storage.
      for (const key of Object.keys(localStorage)) {
        if (key.includes("react-query") || key.includes("tanstack")) {
          localStorage.removeItem(key);
        }
      }
    } catch {
      // ignore
    }
  });
  await page.unrouteAll({ behavior: "ignoreErrors" });
}

test.describe("voucher redeem on /me/deposit", () => {
  test.afterEach(async ({ page }) => {
    await resetBrowserMocks(page);
  });

  test("vouchers_enabled=false hides section", async ({ page }) => {
    await seedAuth(page);
    await mockCommonRoutes(page);
    await mockDepositInfo(page, false);
    await page.goto("/me/deposit", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Deposit" })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByTestId("voucher-redeem-section")).toHaveCount(0);
  });

  test("vouchers_enabled=true shows section", async ({ page }) => {
    await seedAuth(page);
    await mockCommonRoutes(page);
    await mockDepositInfo(page, true);
    await page.goto("/me/deposit", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("voucher-redeem-section")).toBeVisible({
      timeout: 30_000,
    });
  });

  test("manual redeem success updates balance", async ({ page }) => {
    await seedAuth(page);
    await mockCommonRoutes(page, "10.00");
    await mockDepositInfo(page, true);

    let balance = "10.00";
    await page.unroute("**/api/v1/billing/balance/**");
    await page.route("**/api/v1/billing/balance/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ balance }),
      });
    });

    await page.route("**/api/v1/billing/vouchers/redeem/**", async (route) => {
      balance = "25.00";
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ credited: "15.00", balance: "25.00" }),
      });
    });

    await page.goto("/me/deposit", { waitUntil: "domcontentloaded" });
    await page.getByTestId("voucher-code-input").fill("RK-TEST-1");
    await page.getByTestId("voucher-redeem-submit").click();
    await expect(page.getByTestId("voucher-redeem-success")).toBeVisible();
    await expect(page.getByTestId("voucher-redeem-success")).toContainText(
      "+15",
    );
    await expect(
      page.getByTestId("voucher-redeem-success").getByText(/Current balance:\s*25\.00/),
    ).toBeVisible();
  });

  test("idempotent replay shows already-redeemed copy", async ({ page }) => {
    await seedAuth(page);
    await mockCommonRoutes(page, "25.00");
    await mockDepositInfo(page, true);

    await page.route("**/api/v1/billing/vouchers/redeem/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          credited: "15.00",
          balance: "25.00",
          replay: true,
        }),
      });
    });

    await page.goto("/me/deposit", { waitUntil: "domcontentloaded" });
    await page.getByTestId("voucher-code-input").fill("RK-REPLAY-1");
    await page.getByTestId("voucher-redeem-submit").click();
    const success = page.getByTestId("voucher-redeem-success");
    await expect(success).toBeVisible();
    await expect(success).toContainText("Already redeemed");
    await expect(success).toContainText(
      "You already redeemed this voucher. Your balance was not changed.",
    );
    await expect(success).not.toContainText("+15");
    await expect(
      success.getByText(/Current balance:\s*25\.00/),
    ).toBeVisible();
    await expect(success.getByRole("button", { name: "Redeem another" })).toBeVisible();
  });

  test("maps invalid / expired / revoked errors", async ({ page }) => {
    await seedAuth(page);
    await mockCommonRoutes(page);
    await mockDepositInfo(page, true);

    const cases: Array<{ code: string; message: RegExp }> = [
      { code: "voucher_invalid", message: /invalid/i },
      { code: "voucher_expired", message: /expired/i },
      { code: "voucher_revoked", message: /revoked/i },
    ];

    for (const c of cases) {
      await page.unroute("**/api/v1/billing/vouchers/redeem/**");
      await page.route("**/api/v1/billing/vouchers/redeem/**", async (route) => {
        await route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({ code: c.code, detail: c.code }),
        });
      });

      await page.goto("/me/deposit", { waitUntil: "domcontentloaded" });
      await page.getByTestId("voucher-code-input").fill(`CODE-${c.code}`);
      await page.getByTestId("voucher-redeem-submit").click();
      await expect(page.getByTestId("voucher-redeem-error")).toContainText(
        c.message,
      );
    }
  });

  test("429 shows Try again", async ({ page }) => {
    await seedAuth(page);
    await mockCommonRoutes(page);
    await mockDepositInfo(page, true);

    let calls = 0;
    await page.route("**/api/v1/billing/vouchers/redeem/**", async (route) => {
      calls += 1;
      if (calls === 1) {
        await route.fulfill({
          status: 429,
          contentType: "application/json",
          body: JSON.stringify({ detail: "throttled" }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ credited: "1.00", balance: "11.00" }),
      });
    });

    await page.goto("/me/deposit", { waitUntil: "domcontentloaded" });
    await page.getByTestId("voucher-code-input").fill("RK-RETRY");
    await page.getByTestId("voucher-redeem-submit").click();
    await expect(page.getByTestId("voucher-redeem-error")).toContainText(
      /too many/i,
    );
    await page.getByRole("button", { name: "Try again" }).click();
    await expect(page.getByTestId("voucher-redeem-success")).toBeVisible();
  });

  test("network failure shows connection copy", async ({ page }) => {
    await seedAuth(page);
    await mockCommonRoutes(page);
    await mockDepositInfo(page, true);
    await page.route("**/api/v1/billing/vouchers/redeem/**", async (route) => {
      await route.abort("failed");
    });

    await page.goto("/me/deposit", { waitUntil: "domcontentloaded" });
    await page.getByTestId("voucher-code-input").fill("RK-NET");
    await page.getByTestId("voucher-redeem-submit").click();
    await expect(page.getByTestId("voucher-redeem-error")).toContainText(
      /connection/i,
    );
  });

  test("deep-link prefills code without auto POST", async ({ page }) => {
    await seedAuth(page);
    await mockCommonRoutes(page);
    await mockDepositInfo(page, true);

    let redeemHits = 0;
    await page.route("**/api/v1/billing/vouchers/redeem/**", async (route) => {
      redeemHits += 1;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ credited: "1.00", balance: "11.00" }),
      });
    });

    await page.goto("/me/deposit?code=rk-deep-1", {
      waitUntil: "domcontentloaded",
    });
    await expect(page.getByTestId("voucher-code-input")).toHaveValue(
      "RK-DEEP-1",
    );
    await expect.poll(() => redeemHits).toBe(0);
    await expect
      .poll(() => page.url().includes("code="), { timeout: 5_000 })
      .toBe(false);
  });

  test("Scan QR button appears when camera APIs exist", async ({ page }) => {
    await seedAuth(page);
    await mockCommonRoutes(page);
    await mockDepositInfo(page, true);
    await page.addInitScript(() => {
      Object.defineProperty(window, "isSecureContext", {
        configurable: true,
        get: () => true,
      });
      Object.defineProperty(navigator, "mediaDevices", {
        configurable: true,
        value: {
          getUserMedia: async () =>
            ({
              getTracks: () => [],
            }) as unknown as MediaStream,
        },
      });
    });

    await page.goto("/me/deposit", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("voucher-scan-button")).toBeVisible({
      timeout: 30_000,
    });
  });
});
