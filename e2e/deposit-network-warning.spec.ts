import { expect, test, type Page } from "@playwright/test";

const mockBillingConfig = {
  config_version: 1,
  token_symbol: "USDT",
  token_name: "USDT Credits",
  token_decimals: 6,
  display_decimals: 2,
  billing_enabled: true,
};

function depositInfo() {
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
    vouchers_enabled: false,
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

async function mockDepositRoutes(page: Page) {
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
      body: JSON.stringify({ balance: "10.00" }),
    });
  });

  await page.route("**/api/v1/billing/deposit-info/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(depositInfo()),
    });
  });
}

test.describe("deposit network warning (PR1)", () => {
  test("shows Polygon PoS warning before QR address", async ({ page }) => {
    await seedAuth(page);
    await mockDepositRoutes(page);
    await page.goto("/me/deposit", { waitUntil: "domcontentloaded" });

    const warning = page.getByTestId("deposit-network-warning");
    await expect(warning).toBeVisible({ timeout: 30_000 });
    await expect(
      warning.getByRole("heading", { name: "Polygon PoS only" }),
    ).toBeVisible();
    await expect(warning.getByText(/Do not use Ethereum ERC-20/i)).toBeVisible();
    await expect(warning.getByText(/Do not use TRON TRC-20/i)).toBeVisible();
    await expect(warning.getByText(/Do not use BNB Smart Chain/i)).toBeVisible();

    await expect(
      page.getByRole("heading", { name: "Send using QR" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Deposit from exchange" }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: /EIP-681/i })).toHaveCount(0);

    const warningBox = await warning.boundingBox();
    const qrHeading = page.getByRole("heading", { name: "Send using QR" });
    const qrBox = await qrHeading.boundingBox();
    expect(warningBox).toBeTruthy();
    expect(qrBox).toBeTruthy();
    expect(warningBox!.y).toBeLessThan(qrBox!.y);
  });
});
