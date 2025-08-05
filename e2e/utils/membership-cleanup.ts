import type { Page } from "@playwright/test";

/**
 * Clear all memberships for a test user
 * This ensures tests start with a clean state
 */
export async function clearUserMemberships(page: Page, email: string) {
  try {
    // Call API endpoint to clear memberships
    const response = await page.request.delete(`/api/test/cleanup/memberships`, {
      data: { email },
    });

    if (!response.ok()) {
      const error = await response.text();
      console.warn(`Warning: Failed to clear memberships: ${error}`);
    }
  } catch {
    console.warn("Warning: Failed to clear memberships, test may use existing state");
  }
}
