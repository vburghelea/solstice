import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
dotenv.config({ path: resolve(__dirname, ".env.e2e") });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./e2e",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env["CI"],
  /* Retry on CI only */
  retries: process.env["CI"] ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env["CI_REMOTE_DB"] ? 1 : 4,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: "html",
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env["VITE_BASE_URL"] || "http://localhost:5173",

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",

    /* Take screenshot on failure */
    screenshot: "only-on-failure",

    /* Global timeout settings for better stability */
    navigationTimeout: 15000,
    actionTimeout: 10000,
  },

  /* Configure projects for major browsers */
  projects: [
    // Setup project for authentication
    { name: "setup", testMatch: /.*\.setup\.ts/ },

    // Unauthenticated tests - run without auth state
    {
      name: "chromium-unauthenticated",
      use: {
        ...devices["Desktop Chrome"],
      },
      testMatch: /.*\.(unauth)\.spec\.ts/,
    },

    // All authenticated tests now use inline auth
    {
      name: "chromium-authenticated",
      use: {
        ...devices["Desktop Chrome"],
      },
      testMatch: /.*\.(auth|dashboard|profile|teams|shared)\.spec\.ts/,
    },

    // Firefox unauthenticated
    {
      name: "firefox-unauthenticated",
      use: {
        ...devices["Desktop Firefox"],
        launchOptions: { slowMo: 100 }, // tiny delay prevents spurious abort
      },
      testMatch: /.*\.(unauth)\.spec\.ts/,
    },

    // All Firefox authenticated tests now use inline auth
    {
      name: "firefox-authenticated",
      use: {
        ...devices["Desktop Firefox"],
        launchOptions: { slowMo: 100 }, // tiny delay prevents spurious abort
      },
      testMatch: /.*\.(auth|dashboard|profile|teams|shared)\.spec\.ts/,
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env["CI"],
    timeout: 120 * 1000,
  },
});
