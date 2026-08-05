import { expect, test, type Page } from "@playwright/test";

const TX_HASH =
  "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

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

test.describe("deposit explorer links (PR2)", () => {
  test("shows Amoy Polygonscan link while CEX verify is pending", async ({
    page,
  }) => {
    await seedAuth(page);
    await mockDepositRoutes(page);

    await page.route("**/api/v1/billing/verify-cex/**", async (route) => {
      await route.fulfill({
        status: 202,
        contentType: "application/json",
        body: JSON.stringify({
          id: "dep-pending",
          amount_requested: "25.000000",
          amount_credited: null,
          payment_method: "cex_manual",
          tx_hash: TX_HASH,
          idempotency_key: "e2e-key",
          status: "pending",
          failure_reason: null,
          verified_at: null,
          created_at: "2026-08-05T00:00:00Z",
          updated_at: "2026-08-05T00:00:00Z",
          confirmations: 1,
          required_confirmations: 3,
        }),
      });
    });

    await page.goto("/me/deposit", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", { name: "Deposit from exchange" }),
    ).toBeVisible({ timeout: 30_000 });

    await page.getByLabel("Transaction hash (TXID)").fill(TX_HASH);
    await page.getByRole("button", { name: "Verify deposit" }).click();

    const link = page.getByTestId("deposit-tx-explorer-link");
    await expect(link).toBeVisible({ timeout: 15_000 });
    await expect(link).toHaveAttribute("data-status", "pending");
    await expect(link).toHaveAttribute(
      "href",
      `https://amoy.polygonscan.com/tx/${TX_HASH}`,
    );
    await expect(link).toHaveAttribute(
      "aria-label",
      "View transaction on Amoy Polygonscan",
    );
  });

  test("shows explorer link after completed CEX verify", async ({ page }) => {
    await seedAuth(page);
    await mockDepositRoutes(page);

    await page.route("**/api/v1/billing/verify-cex/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "dep-ok",
          amount_requested: "25.000000",
          amount_credited: "25.000000",
          payment_method: "cex_manual",
          tx_hash: TX_HASH,
          idempotency_key: "e2e-key-ok",
          status: "completed",
          failure_reason: null,
          verified_at: "2026-08-05T00:01:00Z",
          created_at: "2026-08-05T00:00:00Z",
          updated_at: "2026-08-05T00:01:00Z",
        }),
      });
    });

    await page.goto("/me/deposit", { waitUntil: "domcontentloaded" });
    await page.getByLabel("Transaction hash (TXID)").fill(TX_HASH);
    await page.getByRole("button", { name: "Verify deposit" }).click();

    const link = page.getByTestId("deposit-tx-explorer-link");
    await expect(link).toBeVisible({ timeout: 15_000 });
    await expect(link).toHaveAttribute("data-status", "completed");
    await expect(link).toHaveAttribute(
      "href",
      `https://amoy.polygonscan.com/tx/${TX_HASH}`,
    );
  });

  test("shows explorer link after failed CEX verify", async ({ page }) => {
    await seedAuth(page);
    await mockDepositRoutes(page);

    await page.route("**/api/v1/billing/verify-cex/**", async (route) => {
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({
          id: "dep-fail",
          amount_requested: "25.000000",
          amount_credited: null,
          payment_method: "cex_manual",
          tx_hash: TX_HASH,
          idempotency_key: "e2e-key-fail",
          status: "failed",
          failure_reason: "Amount mismatch: on-chain 24.990000 != requested 25.000000",
          verified_at: null,
          created_at: "2026-08-05T00:00:00Z",
          updated_at: "2026-08-05T00:00:00Z",
        }),
      });
    });

    await page.goto("/me/deposit", { waitUntil: "domcontentloaded" });
    await page.getByLabel("Transaction hash (TXID)").fill(TX_HASH);
    await page.getByRole("button", { name: "Verify deposit" }).click();

    const link = page.getByTestId("deposit-tx-explorer-link");
    await expect(link).toBeVisible({ timeout: 15_000 });
    await expect(link).toHaveAttribute("data-status", "failed");
    await expect(link).toHaveAttribute(
      "href",
      `https://amoy.polygonscan.com/tx/${TX_HASH}`,
    );
  });
});
