import { expect, test, type Page } from "@playwright/test";

const TX_HASH =
  "0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc";

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

function pendingBody(idempotencyKey: string | undefined) {
  return {
    id: "dep-pending-e2e",
    amount_requested: "25.000000",
    amount_credited: null,
    payment_method: "cex_manual",
    tx_hash: TX_HASH,
    idempotency_key: idempotencyKey,
    status: "pending",
    confirmations: 1,
    required_confirmations: 3,
    failure_reason: null,
    verified_at: null,
    created_at: "2026-08-05T00:00:00Z",
    updated_at: "2026-08-05T00:00:30Z",
  };
}

test.describe("deposit pending session resume (PR5)", () => {
  test("refresh mid-verify shows banner; Continue resumes; success clears", async ({
    page,
  }) => {
    await seedAuth(page);
    await mockDepositRoutes(page);

    let verifyCalls = 0;
    let allowComplete = false;
    await page.route("**/api/v1/billing/verify-cex/**", async (route) => {
      verifyCalls += 1;
      const body = route.request().postDataJSON() as {
        idempotency_key?: string;
        tx_hash?: string;
        amount_requested?: string;
      };
      expect(body.tx_hash?.toLowerCase()).toBe(TX_HASH.toLowerCase());

      if (!allowComplete) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(pendingBody(body.idempotency_key)),
        });
        return;
      }

      expect(body.amount_requested).toBe("25");
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "dep-pending-e2e",
          amount_requested: "25.000000",
          amount_credited: "25.000000",
          payment_method: "cex_manual",
          tx_hash: TX_HASH,
          idempotency_key: body.idempotency_key,
          status: "completed",
          failure_reason: null,
          verified_at: "2026-08-05T00:02:00Z",
          created_at: "2026-08-05T00:00:00Z",
          updated_at: "2026-08-05T00:02:00Z",
        }),
      });
    });

    await page.goto("/me/deposit", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", { name: "Deposit from exchange" }),
    ).toBeVisible({ timeout: 30_000 });

    await page.getByLabel("Transaction hash (TXID)").fill(TX_HASH);
    await page.getByRole("button", { name: "Verify deposit" }).click();

    await expect(page.getByText(/Waiting for confirmations/i)).toBeVisible({
      timeout: 15_000,
    });

    const stored = await page.evaluate(() =>
      localStorage.getItem("roamkit_pending_deposit"),
    );
    expect(stored).toBeTruthy();

    await page.reload({ waitUntil: "domcontentloaded" });

    const banner = page.getByTestId("deposit-pending-banner");
    await expect(banner).toBeVisible({ timeout: 30_000 });
    await expect(banner).toContainText("Pending deposit detected");
    await expect(banner.getByTestId("deposit-tx-explorer-link")).toHaveAttribute(
      "href",
      `https://amoy.polygonscan.com/tx/${TX_HASH}`,
    );

    // No auto-verify on load — only after Continue.
    const callsBeforeContinue = verifyCalls;
    allowComplete = true;
    await page.getByTestId("deposit-pending-continue").click();
    await expect(banner).toHaveCount(0);

    await expect(
      page.getByText("Deposit verified. Credits will appear in your balance."),
    ).toBeVisible({ timeout: 15_000 });
    expect(verifyCalls).toBeGreaterThan(callsBeforeContinue);

    const afterSuccess = await page.evaluate(() =>
      localStorage.getItem("roamkit_pending_deposit"),
    );
    expect(afterSuccess).toBeNull();
  });

  test("Dismiss clears pending so banner does not return", async ({ page }) => {
    await seedAuth(page);
    await mockDepositRoutes(page);

    await page.goto("/me/deposit", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", { name: "Deposit from exchange" }),
    ).toBeVisible({ timeout: 30_000 });

    // Seed after first paint (not addInitScript) so reload after dismiss
    // does not re-write the cleared localStorage entry.
    await page.evaluate(
      ({ tx }) => {
        localStorage.setItem(
          "roamkit_pending_deposit",
          JSON.stringify({
            txHash: tx,
            amount: "25",
            idempotencyKey: "seed-dismiss",
            method: "cex",
            updatedAt: Date.now(),
          }),
        );
      },
      { tx: TX_HASH },
    );
    await page.reload({ waitUntil: "domcontentloaded" });

    const banner = page.getByTestId("deposit-pending-banner");
    await expect(banner).toBeVisible({ timeout: 30_000 });

    await page.getByTestId("deposit-pending-dismiss").click();
    await expect(banner).toHaveCount(0);

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", { name: "Deposit from exchange" }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("deposit-pending-banner")).toHaveCount(0);
  });

  test("expired TTL session does not show banner", async ({ page }) => {
    await seedAuth(page);
    await page.addInitScript(
      ({ tx }) => {
        try {
          localStorage.setItem(
            "roamkit_pending_deposit",
            JSON.stringify({
              txHash: tx,
              amount: "25",
              idempotencyKey: "seed-stale",
              method: "cex",
              updatedAt: Date.now() - 25 * 60 * 60 * 1000,
            }),
          );
        } catch {
          // ignore
        }
      },
      { tx: TX_HASH },
    );
    await mockDepositRoutes(page);

    await page.goto("/me/deposit", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", { name: "Deposit from exchange" }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("deposit-pending-banner")).toHaveCount(0);

    const cleared = await page.evaluate(() =>
      localStorage.getItem("roamkit_pending_deposit"),
    );
    expect(cleared).toBeNull();
  });

  test("FAILED verify clears pending session", async ({ page }) => {
    await seedAuth(page);
    await mockDepositRoutes(page);

    await page.route("**/api/v1/billing/verify-cex/**", async (route) => {
      const body = route.request().postDataJSON() as {
        idempotency_key?: string;
      };
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "dep-failed-e2e",
          amount_requested: "25.000000",
          amount_credited: null,
          payment_method: "cex_manual",
          tx_hash: TX_HASH,
          idempotency_key: body.idempotency_key,
          status: "failed",
          failure_reason: "Transaction not found.",
          verified_at: null,
          created_at: "2026-08-05T00:00:00Z",
          updated_at: "2026-08-05T00:00:01Z",
        }),
      });
    });

    await page.goto("/me/deposit", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", { name: "Deposit from exchange" }),
    ).toBeVisible({ timeout: 30_000 });

    await page.getByLabel("Transaction hash (TXID)").fill(TX_HASH);
    await page.getByRole("button", { name: "Verify deposit" }).click();

    await expect(page.getByText("Transaction not found.")).toBeVisible({
      timeout: 15_000,
    });

    const afterFail = await page.evaluate(() =>
      localStorage.getItem("roamkit_pending_deposit"),
    );
    expect(afterFail).toBeNull();
  });
});
