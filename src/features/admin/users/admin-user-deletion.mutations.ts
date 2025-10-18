import { createServerFn } from "@tanstack/react-start";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { PermissionService } from "~/features/roles/permission.service";
import { requireAdmin } from "~/lib/auth/utils/admin-check";
import { tCommon } from "~/lib/i18n/server-translations";

const deleteUserSchema = z.object({
  userId: z.string().min(1, tCommon("validation.user_id_required")),
});

export const deleteUser = createServerFn({ method: "POST" })
  .validator(deleteUserSchema.parse)
  .handler(async ({ data }) => {
    console.log(`[DELETE USER] Starting deletion for userId: ${data.userId}`);

    // Import server-only modules inside the handler
    const [{ getAuth }, { getWebRequest }] = await Promise.all([
      import("~/lib/auth/server-helpers"),
      import("@tanstack/react-start/server"),
    ]);

    const auth = await getAuth();
    const { headers } = getWebRequest();
    const userSession = await auth.api.getSession({ headers });

    console.log(
      `[DELETE USER] Auth session result:`,
      userSession ? "Authenticated" : "Not authenticated",
    );

    if (!userSession?.user?.id) {
      console.log(`[DELETE USER] Authentication failed - no user session`);
      return {
        success: false,
        error: "User not authenticated",
      };
    }

    console.log(`[DELETE USER] User authenticated: ${userSession.user.id}`);

    // Require admin access AND check for specific deletion permissions
    await requireAdmin(userSession.user.id);

    // Check for specific role permissions using the PermissionService
    console.log(`[DELETE USER] Checking permissions for user: ${userSession.user.id}`);
    const hasDeletePermission = await PermissionService.canDeleteUsers(
      userSession.user.id,
    );
    console.log(`[DELETE USER] Permission check result:`, hasDeletePermission);

    if (!hasDeletePermission) {
      console.log(`[DELETE USER] Permission denied - user lacks delete permissions`);
      return {
        success: false,
        error:
          "Insufficient permissions to delete users. Requires Super Admin or Platform Admin role.",
      };
    }

    console.log(`[DELETE USER] All permission checks passed, proceeding with deletion`);

    try {
      // Import server-only modules inside the handler
      const { getUnpooledDb } = await import("~/db/server-helpers");

      const {
        user,
        account,
        session: userSessionTable,
        teamMembers,
        teams,
        gameParticipants,
        gameApplications,
        games,
        campaignParticipants,
        campaignApplications,
        campaigns,
        eventRegistrations,
        eventPaymentSessions,
        eventAnnouncements,
        memberships,
        membershipPaymentSessions,
        userRoles,
        userTags,
        events,
      } = await import("~/db/schema");

      // Use unpooled connection for transaction (better for complex operations)
      const database = await getUnpooledDb();
      console.log(
        `[DELETE USER] Unpooled database connection established for transaction`,
      );

      // Check if user exists
      const targetUser = await database
        .select()
        .from(user)
        .where(eq(user.id, data.userId))
        .limit(1);
      console.log(
        `[DELETE USER] User lookup completed, found: ${targetUser.length} records`,
      );

      if (!targetUser.length) {
        return {
          success: false,
          error: "User not found",
        };
      }

      const userRecord = targetUser[0];
      if (
        process.env["NODE_ENV"] === "development" ||
        process.env["DEBUG_USER_DELETION"]
      ) {
        console.log(
          `[DEBUG] Starting deletion for user: ${userRecord.name} (${userRecord.id})`,
        );
      }

      // Prevent self-deletion
      if (userRecord.id === userSession.user.id) {
        return {
          success: false,
          error: "Cannot delete your own account",
        };
      }

      // Perform cascading deletion in a transaction to ensure atomicity
      const debugLog = (message: string) => {
        if (
          process.env["NODE_ENV"] === "development" ||
          process.env["DEBUG_USER_DELETION"]
        ) {
          console.log(`[DEBUG] ${message}`);
        }
      };

      console.log(`[DELETE USER] Starting database transaction`);
      await database.transaction(async (tx) => {
        console.log(`[DELETE USER] Transaction started successfully`);
        // 1. Delete authentication-related data (sessions, accounts)
        debugLog(`Deleting sessions for user ${data.userId}`);
        await tx.delete(userSessionTable).where(eq(userSessionTable.userId, data.userId));
        debugLog(`Deleting accounts for user ${data.userId}`);
        await tx.delete(account).where(eq(account.userId, data.userId));

        // 2. Delete role assignments
        debugLog(`Deleting role assignments for user ${data.userId}`);
        await tx.delete(userRoles).where(eq(userRoles.userId, data.userId));

        // 3. Delete user tags
        debugLog(`Deleting user tags for user ${data.userId}`);
        await tx.delete(userTags).where(eq(userTags.userId, data.userId));

        // 4. Handle membership data
        debugLog(`Deleting membership payment sessions for user ${data.userId}`);
        await tx
          .delete(membershipPaymentSessions)
          .where(eq(membershipPaymentSessions.userId, data.userId));
        debugLog(`Deleting memberships for user ${data.userId}`);
        await tx.delete(memberships).where(eq(memberships.userId, data.userId));

        // 5. Handle team memberships and created teams
        // First, remove user from all teams
        debugLog(`Deleting team memberships for user ${data.userId}`);
        await tx.delete(teamMembers).where(eq(teamMembers.userId, data.userId));

        // Handle teams created by this user - either delete them or reassign ownership
        const userTeams = await tx
          .select()
          .from(teams)
          .where(eq(teams.createdBy, data.userId));
        debugLog(`Found ${userTeams.length} teams created by user`);
        for (const team of userTeams) {
          // Check if team has other active members
          const otherMembers = await tx
            .select()
            .from(teamMembers)
            .where(and(eq(teamMembers.teamId, team.id), eq(teamMembers.status, "active")))
            .limit(1);

          if (otherMembers.length > 0) {
            // Reassign team ownership to the first active member
            debugLog(
              `Reassigning team ${team.id} ownership to ${otherMembers[0].userId}`,
            );
            await tx
              .update(teams)
              .set({ createdBy: otherMembers[0].userId })
              .where(eq(teams.id, team.id));
          } else {
            // Delete the team if no other members
            debugLog(`Deleting team ${team.id} (no other members)`);
            await tx.delete(teams).where(eq(teams.id, team.id));
          }
        }

        // 6. Handle game-related data
        // Remove from game participants and applications
        debugLog(`Deleting game applications for user ${data.userId}`);
        await tx.delete(gameApplications).where(eq(gameApplications.userId, data.userId));
        debugLog(`Deleting game participants for user ${data.userId}`);
        await tx.delete(gameParticipants).where(eq(gameParticipants.userId, data.userId));

        // Handle games created by this user
        const userGames = await tx
          .select()
          .from(games)
          .where(eq(games.ownerId, data.userId));
        debugLog(`Found ${userGames.length} games created by user`);
        for (const game of userGames) {
          // Cancel all upcoming games
          if (game.status === "scheduled") {
            debugLog(`Canceling game ${game.id}`);
            await tx
              .update(games)
              .set({ status: "canceled" })
              .where(and(eq(games.id, game.id), eq(games.status, "scheduled")));
          }
        }

        // 7. Handle campaign-related data
        debugLog(`Deleting campaign applications for user ${data.userId}`);
        await tx
          .delete(campaignApplications)
          .where(eq(campaignApplications.userId, data.userId));
        debugLog(`Deleting campaign participants for user ${data.userId}`);
        await tx
          .delete(campaignParticipants)
          .where(eq(campaignParticipants.userId, data.userId));

        // Handle campaigns created by this user
        const userCampaigns = await tx
          .select()
          .from(campaigns)
          .where(eq(campaigns.ownerId, data.userId));
        debugLog(`Found ${userCampaigns.length} campaigns created by user`);
        for (const campaign of userCampaigns) {
          if (campaign.status === "active") {
            // Mark as canceled to notify participants
            debugLog(`Canceling campaign ${campaign.id}`);
            await tx
              .update(campaigns)
              .set({ status: "canceled" })
              .where(eq(campaigns.id, campaign.id));
          }
        }

        // 8. Handle event-related data
        debugLog(`Deleting event payment sessions for user ${data.userId}`);
        await tx
          .delete(eventPaymentSessions)
          .where(eq(eventPaymentSessions.userId, data.userId));
        debugLog(`Deleting event announcements for user ${data.userId}`);
        await tx
          .delete(eventAnnouncements)
          .where(eq(eventAnnouncements.authorId, data.userId));

        const userEventRegistrations = await tx
          .select()
          .from(eventRegistrations)
          .where(eq(eventRegistrations.userId, data.userId));

        debugLog(`Found ${userEventRegistrations.length} event registrations for user`);
        for (const registration of userEventRegistrations) {
          // Cancel all active registrations
          if (registration.status === "confirmed" || registration.status === "pending") {
            debugLog(`Canceling event registration ${registration.id}`);
            await tx
              .update(eventRegistrations)
              .set({
                status: "canceled",
                canceledAt: new Date(),
              })
              .where(eq(eventRegistrations.id, registration.id));
          }
        }

        // 9. Handle events organized by this user
        const userEvents = await tx
          .select()
          .from(events)
          .where(eq(events.organizerId, data.userId));
        debugLog(`Found ${userEvents.length} events organized by user`);
        for (const event of userEvents) {
          if (
            event.status === "draft" ||
            event.status === "published" ||
            event.status === "registration_open"
          ) {
            // Cancel upcoming events
            debugLog(`Canceling event ${event.id}`);
            await tx
              .update(events)
              .set({ status: "canceled" })
              .where(eq(events.id, event.id));
          }
        }

        // 10. Finally, delete the user record
        debugLog(`Finally deleting user record for ${data.userId}`);
        await tx.delete(user).where(eq(user.id, data.userId));
        debugLog("User deletion transaction completed successfully");
        console.log(`[DELETE USER] Transaction completed successfully`);
      });

      // Verify the user was actually deleted
      console.log(`[DELETE USER] Verifying user deletion for ${data.userId}`);
      const verificationCheck = await database
        .select()
        .from(user)
        .where(eq(user.id, data.userId))
        .limit(1);

      if (verificationCheck.length > 0) {
        console.error(`[ERROR] User ${data.userId} still exists after deletion!`);
        throw new Error("User deletion failed - user record still exists");
      }

      console.log(
        `[DELETE USER] User deletion completed successfully for ${userRecord.name}`,
      );
      return {
        success: true,
        message: `User ${userRecord.name} (${userRecord.email}) and all associated data have been permanently deleted.`,
      };
    } catch (error) {
      console.error("[ERROR] Error deleting user:", error);
      console.error(
        "[ERROR] Stack trace:",
        error instanceof Error ? error.stack : "No stack trace available",
      );
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete user",
      };
    }
  });
