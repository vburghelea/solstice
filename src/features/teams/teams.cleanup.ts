import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { zod$ } from "~/lib/server/fn-utils";
import { assertFeatureEnabled } from "~/tenant/feature-gates";

const getDb = createServerOnlyFn(async () => {
  const { getDb } = await import("~/db/server-helpers");
  return getDb();
});

const clearUserTeamsSchema = z.object({
  userEmail: z.email(),
});

export const clearUserTeamsForTesting = createServerFn({ method: "POST" })
  .inputValidator(zod$(clearUserTeamsSchema))
  .handler(async ({ data }) => {
    await assertFeatureEnabled("qc_teams");
    // Only allow in test environments
    if (process.env["NODE_ENV"] === "production" && !process.env["E2E_TEST_EMAIL"]) {
      throw new Error("This function is only available in test environments");
    }

    const db = await getDb();
    const { user, teamMembers } = await import("~/db/schema");

    // Find the user
    const [targetUser] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, data.userEmail));

    if (!targetUser) {
      return { success: true, message: "User not found, nothing to clear" };
    }

    // Delete all team memberships for this user
    await db.delete(teamMembers).where(eq(teamMembers.userId, targetUser.id));

    return { success: true, message: `Cleared teams for ${data.userEmail}` };
  });
