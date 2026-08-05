import { expect, test, type Page } from "@playwright/test";

const WALLET = "0x0000000000000000000000000000000000000001";

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
    wallet: WALLET,
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

test.describe("deposit CEX panel (PR4)", () => {
  test("shows wallet, Polygon badge, and checklist without QR", async ({
    page,
  }) => {
    await seedAuth(page);
    await mockDepositRoutes(page);
    await page.goto("/me/deposit", { waitUntil: "domcontentloaded" });

    const panel = page.getByTestId("deposit-cex-panel");
    await expect(panel).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("deposit-cex-network-badge")).toHaveText(
      "Polygon PoS",
    );
    await expect(page.getByTestId("deposit-cex-wallet")).toHaveText(WALLET);
    await expect(
      panel.getByRole("button", { name: "Copy address" }),
    ).toBeVisible();
    await expect(panel.getByText(/Token: USDT/)).toBeVisible();
    await expect(panel.getByText(/Network: Polygon PoS/)).toBeVisible();
    await expect(
      panel.getByText(/exact amount received on-chain/i),
    ).toBeVisible();
    await expect(
      panel.getByRole("link", { name: /View address on Amoy Polygonscan/i }),
    ).toHaveAttribute("href", `https://amoy.polygonscan.com/address/${WALLET}`);
  });
});
