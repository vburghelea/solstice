import { Page } from "@playwright/test";

/**
 * Clear all team memberships for a user
 */
export async function clearUserTeams(page: Page, userEmail: string) {
  const response = await page.request.post("/api/test/cleanup", {
    data: {
      action: "clear-user-teams",
      userEmail,
    },
  });

  if (!response.ok()) {
    const body = await response.text();
    throw new Error(
      `Failed to clear teams for ${userEmail}: ${response.status()} - ${body}`,
    );
  }
}

/**
 * Delete a specific team and all its memberships
 */
export async function deleteTeam(page: Page, teamId: string) {
  const response = await page.request.post("/api/test/cleanup", {
    data: {
      action: "delete-team",
      teamId,
    },
  });

  if (!response.ok()) {
    const body = await response.text();
    throw new Error(`Failed to delete team ${teamId}: ${response.status()} - ${body}`);
  }
}

/**
 * Reset test user to clean state
 */
export async function resetTestUser(page: Page, userEmail: string) {
  const response = await page.request.post("/api/test/cleanup", {
    data: {
      action: "reset-user",
      userEmail,
    },
  });

  if (!response.ok()) {
    const body = await response.text();
    throw new Error(`Failed to reset user ${userEmail}: ${response.status()} - ${body}`);
  }
}
