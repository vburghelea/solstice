import { createServerFileRoute } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

const cleanupSchema = z.object({
  action: z.enum([
    "reset-user",
    "delete-team",
    "clear-user-teams",
    "clear-user-memberships",
  ]),
  userId: z.string().optional(),
  teamId: z.string().optional(),
  userEmail: z.string().email().optional(),
});

export const ServerRoute = createServerFileRoute("/api/test/cleanup").methods({
  POST: async ({ request }) => {
    // Only allow in non-production environments
    // The server seems to be setting NODE_ENV=production even in test runs
    const isProduction =
      process.env["NODE_ENV"] === "production" &&
      !process.env["E2E_TEST_EMAIL"] &&
      !process.env["SKIP_ENV_VALIDATION"];

    if (isProduction) {
      return new Response(
        JSON.stringify({ error: "Test endpoints are not available in production" }),
        { status: 403 },
      );
    }

    try {
      const body = await request.json();
      const { action, userId, teamId, userEmail } = cleanupSchema.parse(body);

      // Import server-only modules inside the handler
      const { getDb } = await import("~/db/server-helpers");
      const { teams, teamMembers, user, memberships } = await import("~/db/schema");

      const db = await getDb();

      switch (action) {
        case "clear-user-teams": {
          // Remove all team memberships for a user
          if (userId) {
            await db.delete(teamMembers).where(eq(teamMembers.userId, userId));
          } else if (userEmail) {
            const [targetUser] = await db
              .select({ id: user.id })
              .from(user)
              .where(eq(user.email, userEmail));

            if (targetUser) {
              await db.delete(teamMembers).where(eq(teamMembers.userId, targetUser.id));
            }
          }
          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }

        case "delete-team": {
          // Delete a team and all its memberships
          if (teamId) {
            await db.transaction(async (tx) => {
              await tx.delete(teamMembers).where(eq(teamMembers.teamId, teamId));
              await tx.delete(teams).where(eq(teams.id, teamId));
            });
          }
          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }

        case "reset-user": {
          // Reset user to clean state (remove teams, memberships, etc.)
          if (userId || userEmail) {
            const targetUserId =
              userId ||
              (await db
                .select({ id: user.id })
                .from(user)
                .where(eq(user.email, userEmail!))
                .then((rows) => rows[0]?.id));

            if (targetUserId) {
              // Remove team memberships
              await db.delete(teamMembers).where(eq(teamMembers.userId, targetUserId));

              // Remove memberships
              await db.delete(memberships).where(eq(memberships.userId, targetUserId));

              // Reset profile to incomplete state
              await db
                .update(user)
                .set({
                  profileComplete: false,
                  phone: null,
                  gender: null,
                  pronouns: null,
                  privacySettings: null,
                  profileUpdatedAt: null,
                })
                .where(eq(user.id, targetUserId));
            }
          }
          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }

        case "clear-user-memberships": {
          // Remove all memberships for a user
          if (userId || userEmail) {
            const targetUserId =
              userId ||
              (await db
                .select({ id: user.id })
                .from(user)
                .where(eq(user.email, userEmail!))
                .then((rows) => rows[0]?.id));

            if (targetUserId) {
              await db.delete(memberships).where(eq(memberships.userId, targetUserId));
            }
          }
          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }

        default:
          return new Response(JSON.stringify({ error: "Invalid action" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
      }
    } catch (error) {
      console.error("Cleanup error:", error);
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : "Cleanup failed",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  },
});
