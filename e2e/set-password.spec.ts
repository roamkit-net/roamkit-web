import { expect, test, type Page } from "@playwright/test";

const SET_PATH = "/set-password?uid=MTY0&token=activation-token";

async function clearStoredTokens(page: Page) {
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
}

async function mockAccountPages(page: Page) {
  await page.route("**/api/v1/auth/me/", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: 164,
        email: "new@example.com",
        display_name: "",
        is_staff: false,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      }),
    });
  });

  await page.route("**/api/v1/me/esims/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ count: 0, next: null, previous: null, results: [] }),
    });
  });
}

test.describe("account activation", () => {
  test("stores tokens and lands on my eSIMs", async ({ page }) => {
    await clearStoredTokens(page);
    await mockAccountPages(page);

    await page.route("**/api/v1/auth/activate/", async (route) => {
      expect(route.request().method()).toBe("POST");
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          access: "activate-access-token",
          refresh: "activate-refresh-token",
        }),
      });
    });

    await page.goto(SET_PATH);
    await expect(page.getByRole("heading", { name: "Set your password" })).toBeVisible();
    await page.locator("#password").fill("NewSecure1!");
    await page.locator("#password_confirm").fill("NewSecure1!");
    await page.getByRole("button", { name: "Activate account" }).click();

    await expect(page).toHaveURL(/\/me\/esims\/?$/);
    await expect(page).not.toHaveURL(/\/login/);

    const stored = await page.evaluate(() => ({
      access: localStorage.getItem("roamkit_access_token"),
      refresh: localStorage.getItem("roamkit_refresh_token"),
    }));
    expect(stored.access).toBe("activate-access-token");
    expect(stored.refresh).toBe("activate-refresh-token");
  });

  test("invalid activation stays on the form", async ({ page }) => {
    await clearStoredTokens(page);

    await page.route("**/api/v1/auth/activate/", async (route) => {
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({
          non_field_errors: ["This activation link is invalid."],
        }),
      });
    });

    await page.goto(SET_PATH);
    await page.locator("#password").fill("NewSecure1!");
    await page.locator("#password_confirm").fill("NewSecure1!");
    await page.getByRole("button", { name: "Activate account" }).click();

    await expect(page).toHaveURL(/\/set-password\?/);
    await expect(page).not.toHaveURL(/\/login/);
    await expect(
      page.getByRole("alert").filter({ hasText: "This activation link is invalid." }),
    ).toBeVisible();
  });

  test("success without tokens stays on the form", async ({ page }) => {
    await clearStoredTokens(page);

    await page.route("**/api/v1/auth/activate/", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: 1,
          email: "new@example.com",
        }),
      });
    });

    await page.goto(SET_PATH);
    await page.locator("#password").fill("NewSecure1!");
    await page.locator("#password_confirm").fill("NewSecure1!");
    await page.getByRole("button", { name: "Activate account" }).click();

    await expect(page).toHaveURL(/\/set-password\?/);
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page).not.toHaveURL(/\/me\/esims/);
  });
});
