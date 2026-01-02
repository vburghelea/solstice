/**
 * Lighthouse CI Authentication Script
 * Logs in before collecting metrics on authenticated routes.
 *
 * Usage:
 *   PERF_EMAIL="user@example.com" PERF_PASSWORD="password" pnpm exec lhci autorun
 */

module.exports = async (browser, context) => {
  const page = await browser.newPage();
  const baseUrl = new URL(context.url).origin;

  try {
    await page.goto(`${baseUrl}/auth/login`, { waitUntil: "networkidle0" });

    // Fill login form
    await page.waitForSelector('input[name="email"]', { timeout: 10000 });
    await page.type('input[name="email"]', process.env.PERF_EMAIL || "");
    await page.type('input[name="password"]', process.env.PERF_PASSWORD || "");

    // Submit and wait for navigation
    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle0" }),
      page.click('button[type="submit"]'),
    ]);

    // Check if we landed on dashboard or 2FA
    const currentUrl = page.url();
    if (currentUrl.includes("2fa") || currentUrl.includes("verify")) {
      console.warn(
        "[LHCI Auth] 2FA detected - use a no-MFA perf user for automation",
      );
    }
  } catch (err) {
    console.error("[LHCI Auth] Login failed:", err.message);
  }

  await page.close();
};
