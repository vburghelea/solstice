import { test as base } from "@playwright/test";

/**
 * Custom test fixture that preserves authentication.
 * We don't clear cookies or localStorage since Better Auth uses them.
 * Instead, we'll rely on unique test data to avoid conflicts.
 */
export const test = base.extend({
  // Override the default page fixture if needed for future enhancements
  page: async ({ page }, use) => {
    // Before each test: We do NOT clear cookies or localStorage
    // as they contain the auth state we want to preserve

    // Run the test
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(page);

    // After each test: Reset any test data if needed
    // You could add API calls here to reset test user state
    // For example:
    // await page.request.post('/api/test/reset-user-state');
  },
});

export { expect } from "@playwright/test";
