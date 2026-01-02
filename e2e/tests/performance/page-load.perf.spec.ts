import { test, expect, type Page } from "@playwright/test";
import { existsSync } from "fs";

const baseURL = process.env["VITE_BASE_URL"] ?? "http://localhost:5173";
const hasAuthState = existsSync("e2e/.auth/user.json");

// Route configurations with readiness selectors
const publicRoutes = [
  { name: "Login Page", path: "/auth/login", readySelector: "form" },
  { name: "Signup Page", path: "/auth/signup", readySelector: "form" },
];

// Authenticated routes that don't require org selection
// Note: Dashboard (/dashboard) is excluded because it redirects to select-org
// which has slow org loading queries that skew performance measurements
const authenticatedRoutes = [
  {
    name: "Profile",
    path: "/dashboard/profile",
    readySelector: 'button:has-text("Logout")',
  },
  {
    name: "Settings",
    path: "/dashboard/settings",
    readySelector: 'button:has-text("Logout")',
  },
];

// Thresholds (in milliseconds)
// Local dev with SST tunnel has high latency due to remote database
// Production targets (in comments) are what we aim for in deployed environments
const THRESHOLDS = {
  // Local dev: generous due to SST tunnel latency to remote DB
  // Production target: 3000ms
  maxLoadTime: 10000,
  // Local dev: SST tunnel adds 3-6s latency
  // Production target: 500ms
  maxTTFB: 8000,
  // Production target: 2000ms
  maxDOMContentLoaded: 8000,
};

interface PerformanceMetrics {
  ttfb: number;
  domContentLoaded: number;
  load: number;
  lcp?: number | undefined;
}

async function measurePageLoad(
  page: Page,
  url: string,
  readySelector?: string,
): Promise<{ loadTime: number; metrics: PerformanceMetrics }> {
  const startTime = Date.now();

  await page.goto(url, { waitUntil: "load", timeout: 30000 });

  // Wait for route-specific readiness if selector provided (short timeout)
  // Use 2s timeout to minimize impact on load time measurement
  if (readySelector) {
    try {
      await page.waitForSelector(readySelector, { timeout: 2000 });
    } catch {
      // Selector may not exist - that's OK for baseline measurement
    }
  }

  const loadTime = Date.now() - startTime;

  // Get Web Vitals via Performance API
  const metrics = await page.evaluate(() => {
    const entries = performance.getEntriesByType(
      "navigation",
    )[0] as PerformanceNavigationTiming;

    // Try to get LCP
    let lcp: number | undefined;
    const lcpEntries = performance.getEntriesByType("largest-contentful-paint");
    if (lcpEntries.length > 0) {
      lcp = lcpEntries[lcpEntries.length - 1].startTime;
    }

    return {
      ttfb: entries.responseStart - entries.requestStart,
      domContentLoaded: entries.domContentLoadedEventEnd - entries.startTime,
      load: entries.loadEventEnd - entries.startTime,
      lcp,
    };
  });

  return { loadTime, metrics };
}

test.describe("Performance: Public Routes", () => {
  for (const route of publicRoutes) {
    test(`${route.name} - Load Time`, async ({ page }) => {
      const { loadTime, metrics } = await measurePageLoad(
        page,
        `${baseURL}${route.path}`,
        route.readySelector,
      );

      // Log results for analysis
      console.log(
        `[Perf] ${route.name}: Load=${loadTime}ms, TTFB=${metrics.ttfb.toFixed(0)}ms, DOM=${metrics.domContentLoaded.toFixed(0)}ms`,
      );

      // Assert thresholds
      expect(
        loadTime,
        `${route.name} should load in under ${THRESHOLDS.maxLoadTime}ms`,
      ).toBeLessThan(THRESHOLDS.maxLoadTime);
      expect(
        metrics.ttfb,
        `${route.name} TTFB should be under ${THRESHOLDS.maxTTFB}ms`,
      ).toBeLessThan(THRESHOLDS.maxTTFB);
    });
  }
});

test.describe("Performance: Authenticated Routes", () => {
  // Skip if auth state doesn't exist (e.g., running without e2e setup)
  test.skip(!hasAuthState, "Skipping authenticated routes - no auth state available");

  test.use({
    storageState: "e2e/.auth/user.json",
  });

  for (const route of authenticatedRoutes) {
    test(`${route.name} - Load Time`, async ({ page }) => {
      const { loadTime, metrics } = await measurePageLoad(
        page,
        `${baseURL}${route.path}`,
        route.readySelector,
      );

      // Log results for analysis
      console.log(
        `[Perf] ${route.name}: Load=${loadTime}ms, TTFB=${metrics.ttfb.toFixed(0)}ms, DOM=${metrics.domContentLoaded.toFixed(0)}ms${metrics.lcp ? `, LCP=${metrics.lcp.toFixed(0)}ms` : ""}`,
      );

      // Assert thresholds
      expect(
        loadTime,
        `${route.name} should load in under ${THRESHOLDS.maxLoadTime}ms`,
      ).toBeLessThan(THRESHOLDS.maxLoadTime);
      expect(
        metrics.ttfb,
        `${route.name} TTFB should be under ${THRESHOLDS.maxTTFB}ms`,
      ).toBeLessThan(THRESHOLDS.maxTTFB);
    });
  }
});

test.describe("Performance: Cold vs Warm Cache", () => {
  test("Login page cold vs warm load", async ({ browser }) => {
    // Cold load (new context, no cache)
    const coldContext = await browser.newContext();
    const coldPage = await coldContext.newPage();

    const coldStart = Date.now();
    await coldPage.goto(`${baseURL}/auth/login`, { waitUntil: "load" });
    const coldLoadTime = Date.now() - coldStart;

    // Warm load (same context, cached resources)
    const warmStart = Date.now();
    await coldPage.goto(`${baseURL}/auth/login`, { waitUntil: "load" });
    const warmLoadTime = Date.now() - warmStart;

    console.log(
      `[Perf] Cold Load: ${coldLoadTime}ms, Warm Load: ${warmLoadTime}ms, Delta: ${coldLoadTime - warmLoadTime}ms`,
    );

    // Warm load should not be significantly slower (allow for variance)
    // With very fast loads (<100ms), timing variance can exceed actual cache benefit
    // Use a more lenient threshold: max of 2x cold time or cold + 200ms
    const maxWarmTime = Math.max(coldLoadTime * 2, coldLoadTime + 200, 300);
    expect(
      warmLoadTime,
      `Warm load should not be significantly slower than cold load (max ${maxWarmTime}ms)`,
    ).toBeLessThan(maxWarmTime);

    await coldContext.close();
  });
});

test.describe("Performance: Navigation Speed", () => {
  // Skip if auth state doesn't exist
  test.skip(!hasAuthState, "Skipping navigation tests - no auth state available");

  test.use({
    storageState: "e2e/.auth/user.json",
  });

  test("Client-side navigation using sidebar links", async ({ page }) => {
    const navigationTimes: { from: string; to: string; time: number }[] = [];

    // Initial load - go to Profile (skipping Dashboard which has slow org loading)
    await page.goto(`${baseURL}/dashboard/profile`, {
      waitUntil: "load",
      timeout: 30000,
    });
    await page
      .waitForSelector('button:has-text("Logout")', { timeout: 5000 })
      .catch(() => {});

    // Navigation 1: Profile -> Settings (use sidebar link)
    let navStart = Date.now();
    await Promise.all([
      page.waitForURL("**/dashboard/settings**"),
      page.click('a[href="/dashboard/settings"]'),
    ]);
    await page.waitForLoadState("networkidle");
    navigationTimes.push({
      from: "/dashboard/profile",
      to: "/dashboard/settings",
      time: Date.now() - navStart,
    });

    // Navigation 2: Settings -> Privacy (use sidebar link)
    navStart = Date.now();
    await Promise.all([
      page.waitForURL("**/dashboard/privacy**"),
      page.click('a[href="/dashboard/privacy"]'),
    ]);
    await page.waitForLoadState("networkidle");
    navigationTimes.push({
      from: "/dashboard/settings",
      to: "/dashboard/privacy",
      time: Date.now() - navStart,
    });

    // Navigation 3: Privacy -> Profile (use sidebar link)
    navStart = Date.now();
    await Promise.all([
      page.waitForURL("**/dashboard/profile**"),
      page.click('a[href="/dashboard/profile"]'),
    ]);
    await page.waitForLoadState("networkidle");
    navigationTimes.push({
      from: "/dashboard/privacy",
      to: "/dashboard/profile",
      time: Date.now() - navStart,
    });

    // Log results and assert
    for (const nav of navigationTimes) {
      console.log(`[Perf] SPA Nav ${nav.from} -> ${nav.to}: ${nav.time}ms`);
      // Client-side navigation: first nav may need to wait for data, subsequent should be faster
      // Local dev has high latency due to SST tunnel
      // Production target: 1000ms
      const threshold = 10000;
      expect(
        nav.time,
        `SPA navigation from ${nav.from} to ${nav.to} should be under ${threshold}ms`,
      ).toBeLessThan(threshold);
    }

    // Calculate average
    const avgTime =
      navigationTimes.reduce((sum, n) => sum + n.time, 0) / navigationTimes.length;
    console.log(`[Perf] Average SPA navigation time: ${avgTime.toFixed(0)}ms`);
  });

  test("Full page load vs SPA navigation comparison", async ({ page }) => {
    // Measure full page load time to profile page
    const fullLoadStart = Date.now();
    await page.goto(`${baseURL}/dashboard/profile`, { waitUntil: "load" });
    await page
      .waitForSelector('button:has-text("Logout")', { timeout: 5000 })
      .catch(() => {});
    const fullLoadTime = Date.now() - fullLoadStart;

    // Navigate to settings first
    await page.click('a[href="/dashboard/settings"]');
    await page.waitForURL("**/dashboard/settings**");
    await page.waitForLoadState("networkidle");

    // Measure SPA navigation back to profile
    const spaNavStart = Date.now();
    await Promise.all([
      page.waitForURL("**/dashboard/profile**"),
      page.click('a[href="/dashboard/profile"]'),
    ]);
    await page.waitForLoadState("networkidle");
    const spaNavTime = Date.now() - spaNavStart;

    console.log(`[Perf] Full page load: ${fullLoadTime}ms, SPA nav: ${spaNavTime}ms`);

    if (fullLoadTime > spaNavTime) {
      console.log(
        `[Perf] SPA is ${((1 - spaNavTime / fullLoadTime) * 100).toFixed(0)}% faster`,
      );
    } else {
      console.log(`[Perf] Note: Full page load was faster (possibly cached)`);
    }

    // SPA navigation should generally be faster, but with caching it might not be
    // Just ensure SPA navigation is reasonably fast
    expect(spaNavTime, "SPA navigation should be under 2s").toBeLessThan(2000);
  });
});
