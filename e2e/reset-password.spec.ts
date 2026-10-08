import { expect, test, type Page } from "@playwright/test";

const RESET_PATH = "/reset-password?uid=MTY0&token=reset-token";

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
        email: "reset@example.com",
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

test.describe("password reset confirm", () => {
  test("stores tokens and lands on my eSIMs", async ({ page }) => {
    await clearStoredTokens(page);
    await mockAccountPages(page);

    await page.route("**/api/v1/auth/password-reset/confirm/", async (route) => {
      expect(route.request().method()).toBe("POST");
      const body = route.request().postDataJSON() as {
        uid?: string;
        token?: string;
      };
      expect(body.uid).toBe("MTY0");
      expect(body.token).toBe("reset-token");
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          access: "reset-access-token",
          refresh: "reset-refresh-token",
        }),
      });
    });

    await page.goto(RESET_PATH);
    await expect(page.getByRole("heading", { name: "Reset password" })).toBeVisible();
    await page.locator("#password").fill("NewSecure1!");
    await page.locator("#password_confirm").fill("NewSecure1!");
    await page.getByRole("button", { name: "Reset password" }).click();

    await expect(page).toHaveURL(/\/me\/esims\/?$/);
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { name: "Password updated" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Continue to sign in" })).toHaveCount(0);

    const stored = await page.evaluate(() => ({
      access: localStorage.getItem("roamkit_access_token"),
      refresh: localStorage.getItem("roamkit_refresh_token"),
    }));
    expect(stored.access).toBe("reset-access-token");
    expect(stored.refresh).toBe("reset-refresh-token");
  });

  test("invalid reset stays on the form", async ({ page }) => {
    await clearStoredTokens(page);

    await page.route("**/api/v1/auth/password-reset/confirm/", async (route) => {
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({
          non_field_errors: ["This password reset link is invalid."],
        }),
      });
    });

    await page.goto(RESET_PATH);
    await page.locator("#password").fill("NewSecure1!");
    await page.locator("#password_confirm").fill("NewSecure1!");
    await page.getByRole("button", { name: "Reset password" }).click();

    await expect(page).toHaveURL(/\/reset-password\?/);
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.getByRole("alert").filter({ hasText: "This password reset link is invalid." })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Reset password" })).toBeVisible();

    const stored = await page.evaluate(() => ({
      access: localStorage.getItem("roamkit_access_token"),
      refresh: localStorage.getItem("roamkit_refresh_token"),
    }));
    expect(stored.access).toBeNull();
    expect(stored.refresh).toBeNull();
  });

  test("success without tokens stays on the form", async ({ page }) => {
    await clearStoredTokens(page);

    await page.route("**/api/v1/auth/password-reset/confirm/", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Password has been reset." }),
      });
    });

    await page.goto(RESET_PATH);
    await page.locator("#password").fill("NewSecure1!");
    await page.locator("#password_confirm").fill("NewSecure1!");
    await page.getByRole("button", { name: "Reset password" }).click();

    await expect(page).toHaveURL(/\/reset-password\?/);
    await expect(page).not.toHaveURL(/\/me\/esims/);
    await expect(page).not.toHaveURL(/\/login/);
    await expect(
      page.getByRole("alert").filter({ hasText: "Password has been reset." }),
    ).toBeVisible();

    const stored = await page.evaluate(() => ({
      access: localStorage.getItem("roamkit_access_token"),
      refresh: localStorage.getItem("roamkit_refresh_token"),
    }));
    expect(stored.access).toBeNull();
    expect(stored.refresh).toBeNull();
  });
});
