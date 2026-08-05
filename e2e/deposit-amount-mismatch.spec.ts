import { expect, test, type Page } from "@playwright/test";

const TX_HASH =
  "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

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

test.describe("deposit amount mismatch retry (PR3b)", () => {
  test("shows mismatch UI, updates amount, and succeeds on retry", async ({
    page,
  }) => {
    await seedAuth(page);
    await mockDepositRoutes(page);

    let verifyCalls = 0;
    await page.route("**/api/v1/billing/verify-cex/**", async (route) => {
      verifyCalls += 1;
      const body = route.request().postDataJSON() as {
        amount_requested?: string;
        idempotency_key?: string;
        tx_hash?: string;
      };

      expect(body.tx_hash?.toLowerCase()).toBe(TX_HASH.toLowerCase());

      if (verifyCalls === 1) {
        expect(body.amount_requested).toBe("25");
        await route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({
            code: "AMOUNT_MISMATCH",
            on_chain_amount: "24.99",
            amount_requested: "25",
            detail:
              "Amount mismatch: on-chain 24.990000 != requested 25.000000",
          }),
        });
        return;
      }

      expect(body.amount_requested).toBe("24.99");
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "dep-retry-ok",
          amount_requested: "24.990000",
          amount_credited: "24.990000",
          payment_method: "cex_manual",
          tx_hash: TX_HASH,
          idempotency_key: body.idempotency_key,
          status: "completed",
          failure_reason: null,
          verified_at: "2026-08-05T00:01:00Z",
          created_at: "2026-08-05T00:00:00Z",
          updated_at: "2026-08-05T00:01:00Z",
        }),
      });
    });

    await page.goto("/me/deposit", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", { name: "Deposit from exchange" }),
    ).toBeVisible({ timeout: 30_000 });

    const amountInput = page.getByLabel("Amount to deposit");
    await expect(amountInput).toHaveValue("25");

    await page.getByLabel("Transaction hash (TXID)").fill(TX_HASH);
    await page.getByRole("button", { name: "Verify deposit" }).click();

    const mismatch = page.getByTestId("deposit-amount-mismatch");
    await expect(mismatch).toBeVisible({ timeout: 15_000 });
    await expect(mismatch).toContainText(
      "Amount does not match the on-chain transfer",
    );
    await expect(mismatch).toContainText("Received on-chain");
    await expect(mismatch).toContainText("24.99 USDT");

    const explorerLink = mismatch.getByTestId("deposit-tx-explorer-link");
    await expect(explorerLink).toBeVisible();
    await expect(explorerLink).toHaveAttribute(
      "href",
      `https://amoy.polygonscan.com/tx/${TX_HASH}`,
    );

    await mismatch
      .getByRole("button", { name: "Retry with 24.99 USDT" })
      .click();

    await expect(amountInput).toHaveValue("24.99", { timeout: 15_000 });
    await expect(page.getByText(depositCopySuccess())).toBeVisible({
      timeout: 15_000,
    });
    expect(verifyCalls).toBe(2);
  });
});

function depositCopySuccess() {
  return "Deposit verified. Credits will appear in your balance.";
}
