import { Page } from "@playwright/test";

/**
 * Waits for the auth state to be properly loaded by checking the session API
 * This is more reliable than checking DOM elements which may not exist yet
 */
export async function waitForAuthStateToLoad(page: Page) {
  try {
    // Check session endpoint first - this is fast and deterministic
    const response = await page.request.get("/api/auth/session");
    const hasSession = response.ok();

    if (!hasSession) {
      console.warn("No auth session found via API");
      return false;
    }

    // If we have a session, wait for UI to reflect it
    // Only wait if we're on a dashboard page
    const currentUrl = page.url();
    if (
      currentUrl.includes("/dashboard") ||
      currentUrl.includes("/profile") ||
      currentUrl.includes("/teams")
    ) {
      try {
        await page.waitForSelector('[role="complementary"] button:has-text("Logout")', {
          timeout: 5_000,
          state: "visible",
        });
      } catch {
        console.debug("Could not find logout button, but session exists");
      }
    }

    return true;
  } catch (e) {
    console.error("Failed to check auth state:", e);
    return false;
  }
}

/**
 * Navigates to a URL and ensures authentication is maintained
 */
export async function authenticatedGoto(page: Page, url: string) {
  // First check if we have an active session via API
  const hasAuth = await waitForAuthStateToLoad(page);

  if (!hasAuth) {
    console.warn("No auth state found, will need fresh login");
  }

  // Navigate to the URL - use domcontentloaded for faster navigation
  await page.goto(url, { waitUntil: "domcontentloaded" });

  // If we end up on login page, authenticate using our helper
  if (page.url().includes("/auth/login")) {
    console.log("Redirected to login, authenticating...");

    const { uiLogin } = await import("../utils/auth");
    await uiLogin(
      page,
      process.env["E2E_TEST_EMAIL"]!,
      process.env["E2E_TEST_PASSWORD"]!,
      url,
    );
  }

  // Wait for page to stabilize - use UI-based wait instead of networkidle
  try {
    await page.waitForSelector('[role="complementary"] button:has-text("Logout")', {
      timeout: 10_000,
      state: "visible",
    });
  } catch {
    // Not all pages have the sidebar, so this is ok
    console.debug("Page may not have sidebar");
  }
}
