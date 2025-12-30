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

type OrgMembershipOptions = {
  userEmail: string;
  organizationId?: string;
  organizationSlug?: string;
};

type OrgMembershipResponse = {
  success: boolean;
  organization?: {
    id: string;
    name: string;
    slug: string;
  };
  error?: string;
};

export async function ensureOrgMembership(page: Page, options: OrgMembershipOptions) {
  const response = await page.request.post("/api/test/cleanup", {
    data: {
      action: "ensure-org-member",
      ...options,
    },
  });

  if (!response.ok()) {
    const body = await response.text();
    throw new Error(
      `Failed to ensure org membership for ${options.userEmail}: ${response.status()} - ${body}`,
    );
  }

  const payload = (await response.json()) as OrgMembershipResponse;
  if (!payload.organization) {
    throw new Error(
      `Org membership response missing organization: ${payload.error ?? "unknown"}`,
    );
  }

  return payload.organization;
}

export async function removeOrgMembership(page: Page, options: OrgMembershipOptions) {
  const response = await page.request.post("/api/test/cleanup", {
    data: {
      action: "remove-org-member",
      ...options,
    },
  });

  if (!response.ok()) {
    const body = await response.text();
    throw new Error(
      `Failed to remove org membership for ${options.userEmail}: ${response.status()} - ${body}`,
    );
  }
}

export async function deleteImportJobs(
  page: Page,
  options: { userEmail: string; organizationId?: string; fileName?: string },
) {
  const response = await page.request.post("/api/test/cleanup", {
    data: {
      action: "delete-import-jobs",
      ...options,
    },
  });

  if (!response.ok()) {
    const body = await response.text();
    throw new Error(
      `Failed to delete import jobs for ${options.userEmail}: ${response.status()} - ${body}`,
    );
  }
}
