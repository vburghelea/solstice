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
  // Navigate to the URL - use domcontentloaded for faster navigation
  await page.goto(url, { waitUntil: "domcontentloaded" });

  // Wait for the application's auth state to resolve
  // This is critical - we need to give the app time to check cookies and populate context
  await page.waitForLoadState("networkidle", { timeout: 15_000 });

  // Check if we were redirected to login
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

  // Wait for page to stabilize by checking for auth UI elements
  // This confirms the auth context is fully loaded
  try {
    // Use getByRole which is more reliable and matches the test patterns
    await page.getByRole("button", { name: "Logout" }).waitFor({
      timeout: 10_000,
      state: "visible",
    });
  } catch {
    // For pages without sidebar, check for other auth indicators
    const currentUrl = page.url();
    if (
      currentUrl.includes("/dashboard") ||
      currentUrl.includes("/profile") ||
      currentUrl.includes("/teams")
    ) {
      // These pages should have auth UI, re-throw if missing
      console.error("Failed to find logout button. Current URL:", currentUrl);
      console.error("Page title:", await page.title());
      throw new Error(`Authentication check failed on ${url}. Logout button not found.`);
    }
  }
}
