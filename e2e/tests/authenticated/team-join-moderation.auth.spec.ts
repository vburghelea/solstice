import { expect, type Page, test } from "@playwright/test";
import { clearAuthState, gotoWithAuth, logout } from "../../utils/auth";

const TEAM_ID = "test-team-1";
const TEAM_JOIN_USER_ID = "clxpfz4jn000508l8f7k8e6o7";
const TEAM_DETAIL_PATH = `/player/teams/${TEAM_ID}`;
const TEAM_MEMBERS_PATH = `${TEAM_DETAIL_PATH}/members`;

const CAPTAIN_CREDENTIALS = {
  email: "test@example.com",
  password: "testpassword123",
} as const;

const JOIN_USER_CREDENTIALS = {
  email: "team-join@example.com",
  password: "testpassword123",
} as const;

async function resetJoinUserState(page: Page) {
  await clearAuthState(page);
  await gotoWithAuth(page, TEAM_MEMBERS_PATH, CAPTAIN_CREDENTIALS);
  await page.waitForLoadState("networkidle");

  const joinCard = page.locator(
    `[data-testid="team-member-card"][data-member-id="${TEAM_JOIN_USER_ID}"]`,
  );

  if ((await joinCard.count()) > 0) {
    const declineButton = joinCard.getByRole("button", { name: "Decline" });
    if (await declineButton.isVisible().catch(() => false)) {
      await declineButton.click();
      await expect(page.getByText("Join request declined.")).toBeVisible({
        timeout: 15000,
      });
      await expect(joinCard.getByText("declined")).toBeVisible({ timeout: 15000 });
    }

    const statusesNeedingReset = ["active", "declined", "pending"] as const;
    let requiresRemoval = false;
    for (const status of statusesNeedingReset) {
      const badge = joinCard.getByText(status, { exact: true });
      if (await badge.isVisible().catch(() => false)) {
        requiresRemoval = true;
        break;
      }
    }

    if (requiresRemoval) {
      const removeTrigger = joinCard.getByRole("button", {
        name: "Remove Team Join User",
      });
      if (await removeTrigger.isVisible().catch(() => false)) {
        await removeTrigger.click();
        await page.getByRole("button", { name: "Remove Member" }).click();
        await expect(joinCard.getByText("inactive")).toBeVisible({
          timeout: 15000,
        });
      }
    }
  }

  await logout(page);
}

test.describe("Team membership moderation", () => {
  test("player join request can be approved and declined by a captain", async ({
    page,
  }) => {
    await resetJoinUserState(page);

    // Player submits a join request from the team details page
    await clearAuthState(page);
    await gotoWithAuth(page, TEAM_DETAIL_PATH, JOIN_USER_CREDENTIALS);
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: "Quick Actions" })).toBeVisible({
      timeout: 15000,
    });

    const requestButton = page.getByRole("button", {
      name: /Ask to Join|Request Again/,
    });
    await expect(requestButton).toBeVisible({ timeout: 15000 });
    await requestButton.click();

    await expect(page.getByText("Join request sent to the team captains.")).toBeVisible({
      timeout: 15000,
    });
    await expect(
      page.getByText("Your join request is awaiting approval from the team captains."),
    ).toBeVisible({ timeout: 15000 });

    await logout(page);

    // Captain approves the pending request
    await clearAuthState(page);
    await gotoWithAuth(page, TEAM_MEMBERS_PATH, CAPTAIN_CREDENTIALS);
    await page.waitForLoadState("networkidle");

    const joinCard = page.locator(
      `[data-testid="team-member-card"][data-member-id="${TEAM_JOIN_USER_ID}"]`,
    );
    await expect(joinCard).toBeVisible({ timeout: 15000 });
    await expect(joinCard.getByText("pending", { exact: true })).toBeVisible({
      timeout: 15000,
    });
    await expect(joinCard.getByText(/Join request received/i)).toBeVisible({
      timeout: 15000,
    });

    await joinCard.getByRole("button", { name: "Approve" }).click();
    await expect(page.getByText("Join request approved.")).toBeVisible({
      timeout: 15000,
    });
    await expect(joinCard.getByText("active", { exact: true })).toBeVisible({
      timeout: 15000,
    });

    // Remove the member to reset to an inactive state before testing decline flow
    await joinCard.getByRole("button", { name: "Remove Team Join User" }).click();
    await page.getByRole("button", { name: "Remove Member" }).click();
    await expect(joinCard.getByText("inactive", { exact: true })).toBeVisible({
      timeout: 15000,
    });

    await logout(page);

    // Player requests to join again
    await clearAuthState(page);
    await gotoWithAuth(page, TEAM_DETAIL_PATH, JOIN_USER_CREDENTIALS);
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: "Quick Actions" })).toBeVisible({
      timeout: 15000,
    });

    const retryButton = page.getByRole("button", {
      name: /Ask to Join|Request Again/,
    });
    await retryButton.click();
    await expect(page.getByText("Join request sent to the team captains.")).toBeVisible({
      timeout: 15000,
    });

    await logout(page);

    // Captain declines the new request
    await clearAuthState(page);
    await gotoWithAuth(page, TEAM_MEMBERS_PATH, CAPTAIN_CREDENTIALS);
    await page.waitForLoadState("networkidle");

    await expect(joinCard).toBeVisible({ timeout: 15000 });
    await joinCard.getByRole("button", { name: "Decline" }).click();
    await expect(page.getByText("Join request declined.")).toBeVisible({
      timeout: 15000,
    });
    await expect(joinCard.getByText("declined", { exact: true })).toBeVisible({
      timeout: 15000,
    });

    await logout(page);

    // Player sees declined messaging and the ability to request again
    await clearAuthState(page);
    await gotoWithAuth(page, TEAM_DETAIL_PATH, JOIN_USER_CREDENTIALS);
    await page.waitForLoadState("networkidle");

    await expect(page.getByText(/previous join request was declined/i)).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByRole("button", { name: "Request Again" })).toBeVisible({
      timeout: 15000,
    });

    await logout(page);

    // Return roster entry to inactive state for subsequent runs
    await resetJoinUserState(page);
  });
});
