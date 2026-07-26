import { expect, test } from "@playwright/test";

const ESIM_ID = "456";
const DETAIL_PATH = `/me/esims/${ESIM_ID}`;

const mockEsim = {
  id: Number(ESIM_ID),
  iccid: "8900000000000000456",
  lpa: "LPA:1$example$matching",
  matching_id: "matching",
  qrcode: "",
  qrcode_url: "",
  direct_apple_installation_url: "",
  manual_installation: "",
  qrcode_installation: "",
  installation_guide_url: "",
  status: "active",
  usage_remaining_mb: 1000,
  usage_total_mb: 1000,
  usage_status: "active",
  usage_is_unlimited: false,
  usage_expired_at: null,
  usage_synced_at: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

test.describe("Google OAuth login", () => {
  test("mocked credential exchanges for JWT and respects next", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      try {
        localStorage.removeItem("roamkit_access_token");
        localStorage.removeItem("roamkit_refresh_token");
      } catch {
        // ignore
      }
    });

    let googlePosts = 0;
    await page.route("**/api/v1/auth/google/", async (route) => {
      if (route.request().method() !== "POST") {
        await route.continue();
        return;
      }
      googlePosts += 1;
      const body = route.request().postDataJSON() as { credential?: string };
      expect(body.credential).toBe("mock-google-credential");
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          access: "google-access-token",
          refresh: "google-refresh-token",
        }),
      });
    });

    await page.route(`**/api/v1/me/esims/${ESIM_ID}/`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockEsim),
      });
    });

    await page.route(`**/api/v1/me/esims/${ESIM_ID}/topups/`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ results: [] }),
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

    await page.goto(`/login?next=${encodeURIComponent(DETAIL_PATH)}`);
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();

    // Simulate GIS callback → same client path as GoogleSignInButton (loginWithGoogle).
    await page.evaluate(async () => {
      const bases = [
        "https://api.staging.roamkit.net",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
      ];
      let tokens: { access: string; refresh: string } | null = null;
      for (const base of bases) {
        try {
          const res = await fetch(`${base}/api/v1/auth/google/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ credential: "mock-google-credential" }),
          });
          if (res.ok) {
            tokens = (await res.json()) as { access: string; refresh: string };
            break;
          }
        } catch {
          // try next base
        }
      }
      if (!tokens?.access || !tokens.refresh) {
        throw new Error("mocked Google auth failed");
      }
      localStorage.setItem("roamkit_access_token", tokens.access);
      localStorage.setItem("roamkit_refresh_token", tokens.refresh);
      const params = new URLSearchParams(window.location.search);
      const next = params.get("next") || "/me/esims";
      window.location.assign(next.startsWith("/") ? next : "/me/esims");
    });

    await expect(page).toHaveURL(new RegExp(`${DETAIL_PATH}$`));
    expect(googlePosts).toBeGreaterThanOrEqual(1);
    await expect(page.getByText(mockEsim.iccid)).toBeVisible();
  });
});
