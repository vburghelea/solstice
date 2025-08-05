import { Page } from "@playwright/test";

/**
 * Reset test user data to a known state.
 * This should be called in beforeEach for tests that modify user data.
 */
export async function resetTestUserProfile(page: Page) {
  // Use a server API endpoint to reset the user's profile
  // This is more reliable than trying to do it through the UI

  try {
    // If you have an API endpoint for this:
    // await page.request.post('/api/test/reset-user', {
    //   data: { email }
    // });

    // For now, we'll just ensure we're starting fresh by reloading
    // This at least clears any in-memory state
    await page.reload();
  } catch (error) {
    console.warn("Failed to reset test user data:", error);
  }
}

/**
 * Generate unique test data to avoid conflicts between parallel tests
 */
export function generateUniqueTestData(prefix: string) {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return {
    name: `${prefix} ${timestamp}`,
    slug: `${prefix}-${timestamp}-${random}`,
    email: `${prefix}.${timestamp}.${random}@example.com`,
  };
}
