import { Page } from "@playwright/test";

/**
 * Quick, deterministic check to verify shared auth state is loaded
 */
export async function verifySharedAuth(page: Page) {
  // Quick check for session cookies
  const cookies = await page.context().cookies();
  const hasSession = cookies.some((c) => c.name.startsWith("solstice.session"));

  if (!hasSession) {
    throw new Error(
      "Shared auth state missing - did auth.setup.ts run? " +
        "Re-run `pnpm test:e2e:setup` or clear e2e/.auth",
    );
  }
}
