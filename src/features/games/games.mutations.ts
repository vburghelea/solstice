import { createServerFn } from "@tanstack/react-start";
import { and, eq } from "drizzle-orm";
import { gameParticipants, games } from "~/db/schema";
import { getCampaignParticipants } from "~/features/campaigns/campaigns.queries";
import {
  findGameById,
  findGameParticipantByGameAndUserId,
  findGameParticipantById,
  findUserByEmail,
} from "~/features/games/games.repository";
import { summarizeEventChanges } from "~/shared/lib/change-summary";
import { OperationResult } from "~/shared/types/common";
import {
  addGameParticipantInputSchema,
  applyToGameInputSchema,
  createGameInputSchema,
  createGameSessionForCampaignInputSchema,
  getGameSchema,
  inviteToGameInputSchema,
  removeGameParticipantBanInputSchema,
  removeGameParticipantInputSchema,
  respondToGameApplicationSchema,
  respondToGameInvitationSchema,
  updateGameInputSchema,
  updateGameParticipantInputSchema,
  updateGameSessionStatusInputSchema,
} from "./games.schemas";
import { GameParticipant, GameWithDetails } from "./games.types";

/**
 * Create a new game session
 */
export const createGame = createServerFn({ method: "POST" })
  .validator(createGameInputSchema.parse)
  .handler(async ({ data }): Promise<OperationResult<GameWithDetails>> => {
    try {
      const { getDb } = await import("~/db/server-helpers");
      const { getCurrentUser } = await import("~/features/auth/auth.queries");

      const currentUser = await getCurrentUser();
      if (!currentUser) {
        return {
          success: false,
          errors: [{ code: "AUTH_ERROR", message: "Not authenticated" }],
        };
      }

      const db = await getDb();

      const [newGame] = await db
        .insert(games)
        .values({
          ownerId: currentUser.id,
          gameSystemId: data.gameSystemId,
          name: data.name,
          dateTime: new Date(data.dateTime),
          description: data.description,
          expectedDuration: data.expectedDuration,
          price: data.price,
          language: data.language,
          location: data.location,
          status: "scheduled",
          minimumRequirements: data.minimumRequirements,
          visibility: data.visibility,
          safetyRules: data.safetyRules,
          campaignId: data.campaignId,
        })
        .returning();

      if (!newGame) {
        return {
          success: false,
          errors: [{ code: "DATABASE_ERROR", message: "Failed to create game" }],
        };
      }

      // Add owner as a participant
      const [ownerParticipant] = await db
        .insert(gameParticipants)
        .values({
          gameId: newGame.id,
          userId: currentUser.id,
          role: "player",
          status: "approved",
        })
        .returning();

      if (!ownerParticipant) {
        return {
          success: false,
          errors: [
            { code: "DATABASE_ERROR", message: "Failed to add owner as participant" },
          ],
        };
      }

      if (data.campaignId) {
        const participantsResult = await getCampaignParticipants({
          data: { id: data.campaignId },
        });
        if (participantsResult.success && participantsResult.data) {
          const participantPromises = participantsResult.data.map((p) => {
            if (p.userId !== currentUser.id) {
              return db.insert(gameParticipants).values({
                gameId: newGame.id,
                userId: p.userId,
                role: "invited",
                status: "pending",
              });
            }
            return null;
          });
          await Promise.all(participantPromises);
        }
      }

      // Fetch the newly created game with details
      const { getGame } = await import("./games.queries");
      const gameWithDetails = await getGame({ data: { id: newGame.id } });

      if (!gameWithDetails.success || !gameWithDetails.data) {
        return {
          success: false,
          errors: [{ code: "DATABASE_ERROR", message: "Failed to fetch created game" }],
        };
      }

      return {
        success: true,
        data: {
          ...gameWithDetails.data,
          location: gameWithDetails.data.location,
        },
      };
    } catch (error) {
      console.error("Error creating game:", error);
      return {
        success: false,
        errors: [{ code: "SERVER_ERROR", message: "Failed to create game" }],
      };
    }
  });

/**
 * Update an existing game session
 */
export const updateGame = createServerFn({ method: "POST" })
  .validator(updateGameInputSchema.parse)
  .handler(async ({ data }): Promise<OperationResult<GameWithDetails>> => {
    try {
      const { getDb } = await import("~/db/server-helpers");
      const { getCurrentUser } = await import("~/features/auth/auth.queries");
      const { eq } = await import("drizzle-orm");

      const currentUser = await getCurrentUser();
      if (!currentUser) {
        return {
          success: false,
          errors: [{ code: "AUTH_ERROR", message: "Not authenticated" }],
        };
      }

      const db = await getDb();

      // Check if current user is the owner
      const existingGame = await findGameById(data.id);

      if (!existingGame || existingGame.ownerId !== currentUser.id) {
        return {
          success: false,
          errors: [{ code: "AUTH_ERROR", message: "Not authorized to update this game" }],
        };
      }

      const [updatedGame] = await db
        .update(games)
        .set({
          gameSystemId: data.gameSystemId,
          dateTime: data.dateTime ? new Date(data.dateTime) : undefined,
          description: data.description,
          expectedDuration: data.expectedDuration,
          price: data.price,
          language: data.language,
          location: data.location,
          status: data.status,
          minimumRequirements: data.minimumRequirements,
          visibility: data.visibility,
          safetyRules: data.safetyRules,
          updatedAt: new Date(),
        })
        .where(eq(games.id, data.id))
        .returning();

      if (!updatedGame) {
        return {
          success: false,
          errors: [{ code: "DATABASE_ERROR", message: "Failed to update game" }],
        };
      }

      // Fetch the updated game with details
      const { getGame } = await import("./games.queries");
      const gameWithDetails = await getGame({ data: { id: updatedGame.id } });

      if (!gameWithDetails.success || !gameWithDetails.data) {
        return {
          success: false,
          errors: [{ code: "DATABASE_ERROR", message: "Failed to fetch updated game" }],
        };
      }

      // Notify approved participants if key fields changed
      try {
        const previousSnapshot = {
          status: existingGame.status,
          dateTime: existingGame.dateTime as Date | string | null,
          location: existingGame.location,
        };
        const updatedSnapshot: {
          status?: string | null;
          dateTime?: Date | string | null;
          location?: unknown;
        } = {};
        if (typeof data.status !== "undefined") {
          updatedSnapshot.status = data.status;
        }
        if (typeof data.dateTime !== "undefined") {
          updatedSnapshot.dateTime = data.dateTime;
        }
        if (typeof data.location !== "undefined") {
          updatedSnapshot.location = data.location;
        }
        const changes = summarizeEventChanges(previousSnapshot, updatedSnapshot);

        if (changes.length > 0) {
          const changeSummary = changes.join(" • ");
          const notifiedEmails = new Set<string>();
          const { findGameParticipantsByGameId } = await import("./games.repository");
          const participants = await findGameParticipantsByGameId(updatedGame.id);
          const approved = participants.filter(
            (p) =>
              p.status === "approved" &&
              p.user?.email &&
              p.user?.notificationPreferences?.gameUpdates !== false,
          );
          if (approved.length > 0) {
            const recipients = approved
              .map((p) => ({
                email: p.user!.email!,
                name: p.user!.name ?? undefined,
              }))
              .filter((recipient) => {
                const key = recipient.email.toLowerCase();
                if (notifiedEmails.has(key)) {
                  return false;
                }
                notifiedEmails.add(key);
                return true;
              });
            if (recipients.length > 0) {
              const { sendGameStatusUpdate } = await import("~/lib/email/resend");
              const { getBaseUrl } = await import("~/lib/env.server");
              const baseUrl = getBaseUrl();
              const detailsUrl = `${baseUrl}/dashboard/games/${updatedGame.id}`;
              type GameLocation = { address?: string } | null;
              const locationText =
                (gameWithDetails.data?.location as unknown as GameLocation)?.address ||
                "See details page";
              await sendGameStatusUpdate({
                to: recipients,
                gameName: gameWithDetails.data!.name,
                dateTime: new Date(gameWithDetails.data!.dateTime as unknown as string),
                location: locationText,
                changeSummary,
                detailsUrl,
              });
            }
          }

          // Also notify campaign participants if this is part of a campaign
          if (existingGame.campaignId) {
            const { findCampaignParticipantsByCampaignId } = await import(
              "~/features/campaigns/campaigns.repository"
            );
            const cParticipants = await findCampaignParticipantsByCampaignId(
              existingGame.campaignId,
            );
            const cApproved = cParticipants.filter(
              (p) =>
                p.status === "approved" &&
                p.user?.email &&
                p.user?.notificationPreferences?.campaignUpdates !== false,
            );
            if (cApproved.length > 0) {
              const cRecipients = cApproved
                .map((p) => ({
                  email: p.user!.email!,
                  name: p.user!.name ?? undefined,
                }))
                .filter((recipient) => {
                  const key = recipient.email.toLowerCase();
                  if (notifiedEmails.has(key)) {
                    return false;
                  }
                  notifiedEmails.add(key);
                  return true;
                });
              if (cRecipients.length > 0) {
                const { sendCampaignSessionUpdate } = await import("~/lib/email/resend");
                const { getBaseUrl } = await import("~/lib/env.server");
                const baseUrl2 = getBaseUrl();
                const detailsUrl2 = `${baseUrl2}/games/${updatedGame.id}`;
                type GameLocation2 = { address?: string } | null;
                const locationText2 =
                  (gameWithDetails.data?.location as unknown as GameLocation2)?.address ||
                  "See details page";
                await sendCampaignSessionUpdate({
                  to: cRecipients,
                  sessionTitle: gameWithDetails.data!.name,
                  dateTime: new Date(gameWithDetails.data!.dateTime as unknown as string),
                  location: locationText2,
                  changeSummary,
                  detailsUrl: detailsUrl2,
                });
              }
            }
          }
        }
      } catch (notifyError) {
        console.error("Failed to send game update notifications:", notifyError);
      }

      return {
        success: true,
        data: {
          ...gameWithDetails.data,
          location: gameWithDetails.data.location,
        },
      };
    } catch (error) {
      console.error("Error updating game:", error);
      return {
        success: false,
        errors: [{ code: "SERVER_ERROR", message: "Failed to update game" }],
      };
    }
  });

/**
 * Delete a game session
 */
export const deleteGame = createServerFn({ method: "POST" })
  .validator(getGameSchema.parse)
  .handler(async ({ data }): Promise<OperationResult<boolean>> => {
    try {
      const { getDb } = await import("~/db/server-helpers");
      const { getCurrentUser } = await import("~/features/auth/auth.queries");
      const { eq } = await import("drizzle-orm");

      const currentUser = await getCurrentUser();
      if (!currentUser) {
        return {
          success: false,
          errors: [{ code: "AUTH_ERROR", message: "Not authenticated" }],
        };
      }

      const db = await getDb();

      // Check if current user is the owner
      const existingGame = await findGameById(data.id);

      if (!existingGame || existingGame.ownerId !== currentUser.id) {
        return {
          success: false,
          errors: [{ code: "AUTH_ERROR", message: "Not authorized to delete this game" }],
        };
      }

      await db.delete(games).where(eq(games.id, data.id));

      return { success: true, data: true };
    } catch (error) {
      console.error("Error deleting game:", error);
      return {
        success: false,
        errors: [{ code: "SERVER_ERROR", message: "Failed to delete game" }],
      };
    }
  });

/**
 * Cancel a game session
 */
export const cancelGame = createServerFn({ method: "POST" })
  .validator(getGameSchema.parse)
  .handler(async ({ data }): Promise<OperationResult<GameWithDetails>> => {
    try {
      const { getDb } = await import("~/db/server-helpers");
      const { getCurrentUser } = await import("~/features/auth/auth.queries");

      const currentUser = await getCurrentUser();
      if (!currentUser) {
        return {
          success: false,
          errors: [{ code: "AUTH_ERROR", message: "Not authenticated" }],
        };
      }

      const db = await getDb();

      // Check if current user is the owner
      const existingGame = await findGameById(data.id);

      if (!existingGame || existingGame.ownerId !== currentUser.id) {
        return {
          success: false,
          errors: [{ code: "AUTH_ERROR", message: "Not authorized to cancel this game" }],
        };
      }

      const [updatedGame] = await db
        .update(games)
        .set({
          status: "canceled",
          updatedAt: new Date(),
        })
        .where(eq(games.id, data.id))
        .returning();

      if (!updatedGame) {
        return {
          success: false,
          errors: [{ code: "DATABASE_ERROR", message: "Failed to cancel game" }],
        };
      }

      // Fetch the updated game with details
      const { getGame } = await import("./games.queries");
      const gameWithDetails = await getGame({ data: { id: updatedGame.id } });

      if (!gameWithDetails.success || !gameWithDetails.data) {
        return {
          success: false,
          errors: [{ code: "DATABASE_ERROR", message: "Failed to fetch updated game" }],
        };
      }

      return {
        success: true,
        data: {
          ...gameWithDetails.data,
          location: gameWithDetails.data.location,
        },
      };
    } catch (error) {
      console.error("Error canceling game:", error);
      return {
        success: false,
        errors: [{ code: "SERVER_ERROR", message: "Failed to cancel game" }],
      };
    }
  });

/**
 * Add a participant to a game (e.g., owner adding a player, or inviting)
 */
export const addGameParticipant = createServerFn({ method: "POST" })
  .validator(addGameParticipantInputSchema.parse)
  .handler(async ({ data }): Promise<OperationResult<GameParticipant>> => {
    try {
      const { getDb } = await import("~/db/server-helpers");
      const { getCurrentUser } = await import("~/features/auth/auth.queries");
      const [{ canInvite, getRelationship }] = await Promise.all([
        import("~/features/social/relationship.server"),
      ]);

      const currentUser = await getCurrentUser();
      if (!currentUser) {
        return {
          success: false,
          errors: [{ code: "AUTH_ERROR", message: "Not authenticated" }],
        };
      }

      const db = await getDb();

      // Check if current user is game owner or has permission to add participants
      const game = await findGameById(data.gameId);

      if (!game || game.ownerId !== currentUser.id) {
        return {
          success: false,
          errors: [{ code: "AUTH_ERROR", message: "Not authorized to add participants" }],
        };
      }

      // Only scheduled games can accept new participants
      if (game.status !== "scheduled") {
        return {
          success: false,
          errors: [
            {
              code: "CONFLICT",
              message: "Cannot invite players to a canceled or completed game",
            },
          ],
        };
      }

      // Respect blocklist and invitee privacy for owner → target actions
      if (data.userId !== currentUser.id) {
        const rel = await getRelationship(currentUser.id, data.userId);
        if (rel.blocked || rel.blockedBy) {
          return {
            success: false,
            errors: [{ code: "FORBIDDEN", message: "You cannot add this user" }],
          };
        }
        const ok = await canInvite(currentUser.id, data.userId);
        if (!ok) {
          return {
            success: false,
            errors: [
              {
                code: "FORBIDDEN",
                message: "This user only accepts invites from connections",
              },
            ],
          };
        }
      }

      const [newParticipant] = await db
        .insert(gameParticipants)
        .values({
          gameId: data.gameId,
          userId: data.userId,
          role: data.role,
          status: data.status,
        })
        .returning();

      if (!newParticipant) {
        return {
          success: false,
          errors: [{ code: "DATABASE_ERROR", message: "Failed to add participant" }],
        };
      }

      // Fetch participant with user details

      const participantWithUser = await findGameParticipantById(newParticipant.id);

      if (!participantWithUser) {
        return {
          success: false,
          errors: [
            { code: "DATABASE_ERROR", message: "Failed to fetch new participant" },
          ],
        };
      }

      return { success: true, data: participantWithUser as GameParticipant };
    } catch (error) {
      console.error("Error adding participant:", error);
      return {
        success: false,
        errors: [{ code: "SERVER_ERROR", message: "Failed to add participant" }],
      };
    }
  });

/**
 * Update a game participant's role or status
 */
export const updateGameParticipant = createServerFn({ method: "POST" })
  .validator(updateGameParticipantInputSchema.parse)
  .handler(async ({ data }): Promise<OperationResult<GameParticipant>> => {
    try {
      const { getDb } = await import("~/db/server-helpers");
      const { getCurrentUser } = await import("~/features/auth/auth.queries");
      const { eq } = await import("drizzle-orm");

      const currentUser = await getCurrentUser();
      if (!currentUser) {
        return {
          success: false,
          errors: [{ code: "AUTH_ERROR", message: "Not authenticated" }],
        };
      }

      const db = await getDb();

      // Check if current user is game owner or the participant themselves
      const existingParticipant = await findGameParticipantById(data.id);

      if (
        !existingParticipant ||
        (existingParticipant.game.ownerId !== currentUser.id &&
          existingParticipant.userId !== currentUser.id)
      ) {
        return {
          success: false,
          errors: [
            { code: "AUTH_ERROR", message: "Not authorized to update this participant" },
          ],
        };
      }

      const [updatedParticipant] = await db
        .update(gameParticipants)
        .set({
          status: data.status,
          role: data.role,
          updatedAt: new Date(),
        })
        .where(eq(gameParticipants.id, data.id))
        .returning();

      if (!updatedParticipant) {
        return {
          success: false,
          errors: [{ code: "DATABASE_ERROR", message: "Failed to update participant" }],
        };
      }

      // Fetch updated participant with user details

      const participantWithUser = await findGameParticipantById(updatedParticipant.id);

      if (!participantWithUser) {
        return {
          success: false,
          errors: [
            { code: "DATABASE_ERROR", message: "Failed to fetch updated participant" },
          ],
        };
      }

      return { success: true, data: participantWithUser as GameParticipant };
    } catch (error) {
      console.error("Error updating participant:", error);
      return {
        success: false,
        errors: [{ code: "SERVER_ERROR", message: "Failed to update participant" }],
      };
    }
  });

/**
 * Remove a participant from a game
 */
export const removeGameParticipant = createServerFn({ method: "POST" })
  .validator(removeGameParticipantInputSchema.parse)
  .handler(async ({ data }): Promise<OperationResult<boolean>> => {
    try {
      const { getDb } = await import("~/db/server-helpers");
      const { getCurrentUser } = await import("~/features/auth/auth.queries");
      const { eq } = await import("drizzle-orm");

      const currentUser = await getCurrentUser();
      if (!currentUser) {
        return {
          success: false,
          errors: [{ code: "AUTH_ERROR", message: "Not authenticated" }],
        };
      }

      const db = await getDb();

      // Check if current user is game owner or the participant themselves
      const existingParticipant = await findGameParticipantById(data.id);

      if (
        !existingParticipant ||
        (existingParticipant.game.ownerId !== currentUser.id &&
          existingParticipant.userId !== currentUser.id)
      ) {
        return {
          success: false,
          errors: [
            { code: "AUTH_ERROR", message: "Not authorized to remove this participant" },
          ],
        };
      }

      await db.delete(gameParticipants).where(eq(gameParticipants.id, data.id));

      return { success: true, data: true };
    } catch (error) {
      console.error("Error removing participant:", error);
      return {
        success: false,
        errors: [{ code: "SERVER_ERROR", message: "Failed to remove participant" }],
      };
    }
  });

import { gameApplications } from "~/db/schema"; // Add gameApplications import
import { findGameApplicationById } from "~/features/games/games.repository"; // Import findGameApplicationById
import { enforceApplyEligibility } from "~/features/social/enforcement.helpers";
import { GameApplication } from "./games.types"; // Import GameApplication type
// Import relationship helper statically for reliable testing/mocking
import { getRelationship } from "~/features/social/relationship.server";

/**
 * Player applies to join a game
 */
export const applyToGame = createServerFn({ method: "POST" })
  .validator(applyToGameInputSchema.parse)
  .handler(async ({ data }): Promise<OperationResult<GameApplication>> => {
    try {
      const { getDb } = await import("~/db/server-helpers");
      const { getCurrentUser } = await import("~/features/auth/auth.queries");

      const currentUser = await getCurrentUser();
      if (!currentUser) {
        return {
          success: false,
          errors: [{ code: "AUTH_ERROR", message: "Not authenticated" }],
        };
      }

      const db = await getDb();

      const game = await findGameById(data.gameId);
      if (!game) {
        return {
          success: false,
          errors: [{ code: "NOT_FOUND", message: "Game not found" }],
        };
      }

      // Social enforcement: blocks and connections-only
      const gate = await enforceApplyEligibility({
        viewerId: currentUser.id,
        ownerId: game.ownerId,
        visibility: game.visibility,
        getRelationship,
      });
      if (!gate.allowed) {
        return { success: false, errors: [{ code: gate.code, message: gate.message }] };
      }

      // Check if user has a rejected participant entry for this game
      const existingRejectedParticipant = await db.query.gameParticipants.findFirst({
        where: and(
          eq(gameParticipants.gameId, data.gameId),
          eq(gameParticipants.userId, currentUser.id),
          eq(gameParticipants.status, "rejected"),
        ),
      });

      if (existingRejectedParticipant) {
        return {
          success: false,
          errors: [
            {
              code: "CONFLICT",
              message: "You cannot apply to this game as you were previously rejected.",
            },
          ],
        };
      }

      // Check if game is open for applications (e.g., not canceled or completed)
      if (game.status === "canceled" || game.status === "completed") {
        return {
          success: false,
          errors: [
            { code: "CONFLICT", message: "This game is not open for applications." },
          ],
        };
      }

      // Check if already applied
      const existingApplication = await db.query.gameApplications.findFirst({
        where: and(
          eq(gameApplications.gameId, data.gameId),
          eq(gameApplications.userId, currentUser.id),
        ),
      });

      if (existingApplication) {
        if (existingApplication.status === "rejected") {
          return {
            success: false,
            errors: [
              {
                code: "CONFLICT",
                message:
                  "You have already applied to this game and your application was rejected.",
              },
            ],
          };
        } else if (existingApplication.status === "pending") {
          return {
            success: false,
            errors: [
              {
                code: "CONFLICT",
                message: "You have a pending application for this game.",
              },
            ],
          };
        } else if (existingApplication.status === "approved") {
          return {
            success: false,
            errors: [
              {
                code: "CONFLICT",
                message: "You have already been approved for this game.",
              },
            ],
          };
        }
      }

      const [newApplication] = await db
        .insert(gameApplications)
        .values({
          gameId: data.gameId,
          userId: currentUser.id,
          status: "pending",
        })
        .returning();

      if (!newApplication) {
        return {
          success: false,
          errors: [{ code: "DATABASE_ERROR", message: "Failed to apply to game" }],
        };
      }

      const applicationWithDetails = await findGameApplicationById(newApplication.id);

      if (!applicationWithDetails) {
        return {
          success: false,
          errors: [
            { code: "DATABASE_ERROR", message: "Failed to fetch new application" },
          ],
        };
      }

      return { success: true, data: applicationWithDetails as GameApplication };
    } catch (error) {
      console.error("Error applying to game:", error);
      return {
        success: false,
        errors: [{ code: "SERVER_ERROR", message: "Failed to apply to game" }],
      };
    }
  });

/**
 * Owner invites a player to a game
 */
export const inviteToGame = createServerFn({ method: "POST" })
  .validator(inviteToGameInputSchema.parse)
  .handler(async ({ data }): Promise<OperationResult<GameParticipant>> => {
    try {
      const { getDb } = await import("~/db/server-helpers");
      const { getCurrentUser } = await import("~/features/auth/auth.queries");
      const [{ canInvite, getRelationship }] = await Promise.all([
        import("~/features/social/relationship.server"),
      ]);

      const currentUser = await getCurrentUser();
      if (!currentUser) {
        return {
          success: false,
          errors: [{ code: "AUTH_ERROR", message: "Not authenticated" }],
        };
      }

      const db = await getDb();

      // Check if current user is game owner
      const game = await findGameById(data.gameId);

      if (!game || game.ownerId !== currentUser.id) {
        return {
          success: false,
          errors: [
            { code: "AUTH_ERROR", message: "Not authorized to invite participants" },
          ],
        };
      }

      // Only scheduled games can accept invitations
      if (game.status !== "scheduled") {
        return {
          success: false,
          errors: [
            {
              code: "CONFLICT",
              message: "Cannot invite players to a canceled or completed game",
            },
          ],
        };
      }

      let targetUserId: string;

      if (data.userId) {
        targetUserId = data.userId;
      } else if (data.email) {
        const invitedUser = await findUserByEmail(data.email);
        if (invitedUser) {
          targetUserId = invitedUser.id;
        } else {
          // For non-users, create a user account using Better Auth
          const { getAuth } = await import("~/lib/auth/server-helpers");
          const auth = await getAuth();

          // Generate a random password for the user
          const { randomBytes } = await import("crypto");
          const randomPassword = randomBytes(32).toString("hex");

          try {
            const newUser = await auth.api.signUpEmail({
              body: {
                email: data.email,
                password: randomPassword,
                name: data.name || data.email.split("@")[0],
              },
            });

            targetUserId = newUser.user.id;

            // Email will be sent after participant record is created
          } catch (signUpError) {
            console.error("Failed to create user account:", signUpError);
            return {
              success: false,
              errors: [
                {
                  code: "DATABASE_ERROR",
                  message: "Failed to create user account for invitation",
                },
              ],
            };
          }
        }
      } else {
        return {
          success: false,
          errors: [
            { code: "VALIDATION_ERROR", message: "User ID or email must be provided" },
          ],
        };
      }

      // Blocklist restriction between inviter and invitee
      const relToInvitee = await getRelationship(currentUser.id, targetUserId);
      if (relToInvitee.blocked || relToInvitee.blockedBy) {
        return {
          success: false,
          errors: [{ code: "FORBIDDEN", message: "You cannot invite this user" }],
        };
      }

      // Invitee privacy: only allow invites from connections if enabled
      const canInviteNow = await canInvite(currentUser.id, targetUserId);
      if (!canInviteNow) {
        return {
          success: false,
          errors: [
            {
              code: "FORBIDDEN",
              message: "This user only accepts invites from connections",
            },
          ],
        };
      }

      // Check if already a participant
      const existingParticipant = await findGameParticipantByGameAndUserId(
        data.gameId,
        targetUserId,
      );

      if (existingParticipant) {
        if (existingParticipant.status === "rejected") {
          // Re-invite: update status to pending and role to invited
          const [updatedParticipant] = await db
            .update(gameParticipants)
            .set({
              role: "invited",
              status: "pending",
              updatedAt: new Date(),
            })
            .where(eq(gameParticipants.id, existingParticipant.id))
            .returning();

          if (!updatedParticipant) {
            return {
              success: false,
              errors: [
                { code: "DATABASE_ERROR", message: "Failed to re-invite participant" },
              ],
            };
          }

          const participantWithUser = await findGameParticipantById(
            updatedParticipant.id,
          );

          if (!participantWithUser) {
            return {
              success: false,
              errors: [
                {
                  code: "DATABASE_ERROR",
                  message: "Failed to fetch re-invited participant",
                },
              ],
            };
          }
          return { success: true, data: participantWithUser as GameParticipant };
        } else {
          return {
            success: false,
            errors: [
              {
                code: "CONFLICT",
                message: "User is already a participant or has applied",
              },
            ],
          };
        }
      }

      const [newParticipant] = await db
        .insert(gameParticipants)
        .values({
          gameId: data.gameId,
          userId: targetUserId,
          role: data.role,
          status: "pending", // Invited participants are pending until they accept
        })
        .returning();

      if (!newParticipant) {
        return {
          success: false,
          errors: [{ code: "DATABASE_ERROR", message: "Failed to invite participant" }],
        };
      }

      // Fetch participant with user details
      const participantWithUser = await findGameParticipantById(newParticipant.id);

      if (!participantWithUser) {
        return {
          success: false,
          errors: [
            { code: "DATABASE_ERROR", message: "Failed to fetch new participant" },
          ],
        };
      }

      // Send email invitation
      try {
        const { sendGameInvitation } = await import("~/lib/email/resend");
        const inviteUrl = `${
          process.env["SITE_URL"] || "https://roundup.games"
        }/games/${data.gameId}?token=${targetUserId}`;
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await sendGameInvitation({
          invitationId: newParticipant.id,
          to: {
            email: participantWithUser.user.email,
            name: participantWithUser.user.name ?? undefined,
          },
          inviterName: currentUser.name || "A game organizer",
          gameName: game.name,
          gameDescription: game.description,
          gameSystem: game.gameSystem?.name || "",
          inviteUrl,
          expiresAt,
        });
      } catch (emailError) {
        console.error("Failed to send email invitation:", emailError);
      }

      return { success: true, data: participantWithUser as GameParticipant };
    } catch (error) {
      console.error("Error inviting participant:", error);
      return {
        success: false,
        errors: [{ code: "SERVER_ERROR", message: "Failed to invite participant" }],
      };
    }
  });

/**
 * Respond to a game invitation (accept or reject)
 */
export const respondToGameInvitation = createServerFn({ method: "POST" })
  .validator(respondToGameInvitationSchema.parse)
  .handler(async ({ data }): Promise<OperationResult<GameParticipant | boolean>> => {
    try {
      const { getDb } = await import("~/db/server-helpers");
      const { getCurrentUser } = await import("~/features/auth/auth.queries");
      const { eq } = await import("drizzle-orm");
      const { getRelationship } = await import("~/features/social/relationship.server");

      const currentUser = await getCurrentUser();
      if (!currentUser) {
        return {
          success: false,
          errors: [{ code: "AUTH_ERROR", message: "Not authenticated" }],
        };
      }

      const db = await getDb();

      const existingParticipant = await findGameParticipantById(data.participantId);

      if (!existingParticipant) {
        return {
          success: false,
          errors: [{ code: "NOT_FOUND", message: "Invitation not found" }],
        };
      }

      // Ensure the current user is the invitee
      if (existingParticipant.userId !== currentUser.id) {
        return {
          success: false,
          errors: [
            {
              code: "AUTH_ERROR",
              message: "Not authorized to respond to this invitation",
            },
          ],
        };
      }

      // Ensure the role is 'invited' before responding
      if (existingParticipant.role !== "invited") {
        return {
          success: false,
          errors: [{ code: "CONFLICT", message: "Not an active invitation" }],
        };
      }

      if (data.action === "accept") {
        // Blocklist restriction: invitee cannot accept if blocked any direction with owner
        const rel = await getRelationship(
          currentUser.id,
          existingParticipant.game.ownerId,
        );
        if (rel.blocked || rel.blockedBy) {
          return {
            success: false,
            errors: [{ code: "FORBIDDEN", message: "You cannot accept this invitation" }],
          };
        }
        const [updatedParticipant] = await db
          .update(gameParticipants)
          .set({
            role: "player",
            status: "approved",
            updatedAt: new Date(),
          })
          .where(eq(gameParticipants.id, data.participantId))
          .returning();

        if (!updatedParticipant) {
          return {
            success: false,
            errors: [{ code: "DATABASE_ERROR", message: "Failed to accept invitation" }],
          };
        }

        const participantWithUser = await findGameParticipantById(updatedParticipant.id);

        if (!participantWithUser) {
          return {
            success: false,
            errors: [
              { code: "DATABASE_ERROR", message: "Failed to fetch accepted participant" },
            ],
          };
        }

        // Notify inviter (game owner)
        try {
          const { findGameById } = await import("./games.repository");
          const gameFull = await findGameById(existingParticipant.gameId);
          if (
            gameFull?.owner?.email &&
            gameFull.owner?.notificationPreferences?.socialNotifications !== false
          ) {
            const { sendGameInviteResponse } = await import("~/lib/email/resend");
            const { getBaseUrl } = await import("~/lib/env.server");
            const baseUrl = getBaseUrl();
            const rosterUrl = `${baseUrl}/games/${existingParticipant.gameId}#roster`;
            await sendGameInviteResponse({
              to: { email: gameFull.owner.email, name: gameFull.owner.name ?? undefined },
              inviterName: gameFull.owner.name || "Organizer",
              inviteeName: currentUser.name || "Player",
              gameName: gameFull.name,
              response: "accepted",
              time: new Date(),
              rosterUrl,
            });
          }
        } catch (notifyError) {
          console.error("Failed to notify inviter of acceptance:", notifyError);
        }

        return { success: true, data: participantWithUser as GameParticipant };
      } else if (data.action === "reject") {
        await db
          .delete(gameParticipants)
          .where(eq(gameParticipants.id, data.participantId));

        // Notify inviter (game owner)
        try {
          const { findGameById } = await import("./games.repository");
          const gameFull = await findGameById(existingParticipant.gameId);
          if (
            gameFull?.owner?.email &&
            gameFull.owner?.notificationPreferences?.socialNotifications !== false
          ) {
            const { sendGameInviteResponse } = await import("~/lib/email/resend");
            const { getBaseUrl } = await import("~/lib/env.server");
            const baseUrl = getBaseUrl();
            const rosterUrl = `${baseUrl}/games/${existingParticipant.gameId}#roster`;
            await sendGameInviteResponse({
              to: { email: gameFull.owner.email, name: gameFull.owner.name ?? undefined },
              inviterName: gameFull.owner.name || "Organizer",
              inviteeName: currentUser.name || "Player",
              gameName: gameFull.name,
              response: "declined",
              time: new Date(),
              rosterUrl,
            });
          }
        } catch (notifyError) {
          console.error("Failed to notify inviter of decline:", notifyError);
        }
        return { success: true, data: true };
      }

      return {
        success: false,
        errors: [{ code: "VALIDATION_ERROR", message: "Invalid action" }],
      };
    } catch (error) {
      console.error("Error responding to invitation:", error);
      return {
        success: false,
        errors: [{ code: "SERVER_ERROR", message: "Failed to respond to invitation" }],
      };
    }
  });

import { getCampaign } from "~/features/campaigns/campaigns.queries"; // Import getCampaign

/**
 * Create a new game session for a campaign
 */
export const createGameSessionForCampaign = createServerFn({ method: "POST" })
  .validator(createGameSessionForCampaignInputSchema.parse)
  .handler(async ({ data }): Promise<OperationResult<GameWithDetails>> => {
    try {
      const { getDb } = await import("~/db/server-helpers");
      const { getCurrentUser } = await import("~/features/auth/auth.queries");

      const currentUser = await getCurrentUser();
      if (!currentUser) {
        return {
          success: false,
          errors: [{ code: "AUTH_ERROR", message: "Not authenticated" }],
        };
      }

      const db = await getDb();

      // Fetch campaign details to get expectedDuration and safetyRules
      const campaignResult = await getCampaign({ data: { id: data.campaignId } });
      if (!campaignResult.success || !campaignResult.data) {
        return {
          success: false,
          errors: [{ code: "NOT_FOUND", message: "Campaign not found" }],
        };
      }
      const campaign = campaignResult.data;

      const [newGame] = await db
        .insert(games)
        .values({
          ownerId: currentUser.id,
          campaignId: data.campaignId,
          gameSystemId: data.gameSystemId,
          name: data.name,
          dateTime: new Date(data.dateTime),
          description: data.description,
          expectedDuration: campaign.sessionDuration, // Use campaign's sessionDuration
          price: data.price,
          language: data.language,
          location: data.location,
          status: "scheduled",
          minimumRequirements: data.minimumRequirements,
          visibility: data.visibility,
          safetyRules: campaign.safetyRules, // Use campaign's safetyRules
        })
        .returning();

      if (!newGame) {
        return {
          success: false,
          errors: [{ code: "DATABASE_ERROR", message: "Failed to create game session" }],
        };
      }

      // Add owner as a participant
      const [ownerParticipant] = await db
        .insert(gameParticipants)
        .values({
          gameId: newGame.id,
          userId: currentUser.id,
          role: "player",
          status: "approved",
        })
        .returning();

      if (!ownerParticipant) {
        return {
          success: false,
          errors: [
            { code: "DATABASE_ERROR", message: "Failed to add owner as participant" },
          ],
        };
      }

      // Fetch the newly created game with details
      const { getGame } = await import("./games.queries");
      const gameWithDetails = await getGame({ data: { id: newGame.id } });

      if (!gameWithDetails.success || !gameWithDetails.data) {
        return {
          success: false,
          errors: [
            { code: "DATABASE_ERROR", message: "Failed to fetch created game session" },
          ],
        };
      }

      // Notify campaign participants that a new session is scheduled
      try {
        if (newGame.campaignId) {
          const { findCampaignParticipantsByCampaignId } = await import(
            "~/features/campaigns/campaigns.repository"
          );
          const participants = await findCampaignParticipantsByCampaignId(
            newGame.campaignId,
          );
          const approved = participants.filter(
            (p) =>
              p.status === "approved" &&
              p.user?.email &&
              p.user?.notificationPreferences?.campaignUpdates !== false,
          );
          if (approved.length > 0) {
            const recipients = approved.map((p) => ({
              email: p.user!.email!,
              name: p.user!.name ?? undefined,
            }));
            const { sendCampaignSessionUpdate } = await import("~/lib/email/resend");
            const { getBaseUrl } = await import("~/lib/env.server");
            const baseUrl = getBaseUrl();
            const detailsUrl = `${baseUrl}/dashboard/games/${newGame.id}`;
            type GameLocation4 = { address?: string } | null;
            const locationText =
              (gameWithDetails.data?.location as unknown as GameLocation4)?.address ||
              "See details page";
            await sendCampaignSessionUpdate({
              to: recipients,
              sessionTitle: gameWithDetails.data!.name,
              dateTime: new Date(gameWithDetails.data!.dateTime as unknown as string),
              location: locationText,
              changeSummary: "Scheduled",
              detailsUrl,
            });
          }
        }
      } catch (notifyError) {
        console.error(
          "Failed to send campaign session scheduled notifications:",
          notifyError,
        );
      }

      return { success: true, data: gameWithDetails.data };
    } catch (error) {
      console.error("Error creating game session:", error);
      return {
        success: false,
        errors: [{ code: "SERVER_ERROR", message: "Failed to create game session" }],
      };
    }
  });

/**
 * Update a game session's status (e.g., cancel, complete)
 */
export const updateGameSessionStatus = createServerFn({ method: "POST" })
  .validator(updateGameSessionStatusInputSchema.parse)
  .handler(async ({ data }): Promise<OperationResult<GameWithDetails>> => {
    try {
      const { getDb } = await import("~/db/server-helpers");
      const { getCurrentUser } = await import("~/features/auth/auth.queries");
      const { and, eq, sql } = await import("drizzle-orm");

      const currentUser = await getCurrentUser();
      if (!currentUser) {
        return {
          success: false,
          errors: [{ code: "AUTH_ERROR", message: "Not authenticated" }],
        };
      }

      const db = await getDb();

      // Check if current user is the owner of the game session
      const existingGame = await findGameById(data.gameId);

      if (!existingGame || existingGame.ownerId !== currentUser.id) {
        return {
          success: false,
          errors: [
            { code: "AUTH_ERROR", message: "Not authorized to update this game session" },
          ],
        };
      }

      const [updatedGame] = await db
        .update(games)
        .set({
          status: data.status,
          updatedAt: new Date(),
        })
        .where(eq(games.id, data.gameId))
        .returning();

      if (!updatedGame) {
        return {
          success: false,
          errors: [
            { code: "DATABASE_ERROR", message: "Failed to update game session status" },
          ],
        };
      }

      // Revoke any pending invitations when game is canceled or completed
      if (data.status === "canceled" || data.status === "completed") {
        await db
          .update(gameParticipants)
          .set({ status: "rejected", updatedAt: new Date() })
          .where(
            and(
              eq(gameParticipants.gameId, data.gameId),
              eq(gameParticipants.role, "invited"),
              eq(gameParticipants.status, "pending"),
            ),
          );
      }

      // If newly marked as completed (and was not previously), increment owner's gamesHosted
      if (data.status === "completed" && existingGame.status !== "completed") {
        const { user } = await import("~/db/schema");
        await db
          .update(user)
          .set({ gamesHosted: sql`${user.gamesHosted} + 1` })
          .where(eq(user.id, existingGame.ownerId));
      }

      // Fetch the updated game with details
      const { getGame } = await import("./games.queries");
      const gameWithDetails = await getGame({ data: { id: updatedGame.id } });

      if (!gameWithDetails.success || !gameWithDetails.data) {
        return {
          success: false,
          errors: [
            { code: "DATABASE_ERROR", message: "Failed to fetch updated game session" },
          ],
        };
      }

      const statusChanges = summarizeEventChanges(
        {
          status: existingGame.status,
          dateTime: existingGame.dateTime as Date | string | null,
          location: existingGame.location,
        },
        { status: data.status },
      );

      // Notify approved participants of status change
      if (statusChanges.length > 0) {
        try {
          const { findGameParticipantsByGameId } = await import("./games.repository");
          const participants = await findGameParticipantsByGameId(updatedGame.id);
          const approved = participants.filter(
            (p) => p.status === "approved" && p.user?.email,
          );
          if (approved.length > 0) {
            const recipients = approved.map((p) => ({
              email: p.user!.email!,
              name: p.user!.name ?? undefined,
            }));
            const { sendGameStatusUpdate } = await import("~/lib/email/resend");
            const { getBaseUrl } = await import("~/lib/env.server");
            const baseUrl = getBaseUrl();
            const detailsUrl = `${baseUrl}/dashboard/games/${updatedGame.id}`;
            type GameLocation5 = { address?: string } | null;
            const locationText =
              (gameWithDetails.data?.location as unknown as GameLocation5)?.address ||
              "See details page";
            await sendGameStatusUpdate({
              to: recipients,
              gameName: gameWithDetails.data!.name,
              dateTime: new Date(gameWithDetails.data!.dateTime as unknown as string),
              location: locationText,
              changeSummary: statusChanges.join(" • "),
              detailsUrl,
            });
          }
        } catch (notifyError) {
          console.error("Failed to send game status notifications:", notifyError);
        }
      }

      return { success: true, data: gameWithDetails.data };
    } catch (error) {
      console.error("Error updating game session status:", error);
      return {
        success: false,
        errors: [
          { code: "SERVER_ERROR", message: "Failed to update game session status" },
        ],
      };
    }
  });

/**
 * Respond to a game application (approve or reject)
 */
export const respondToGameApplication = createServerFn({ method: "POST" })
  .validator(respondToGameApplicationSchema.parse)
  .handler(async ({ data }): Promise<OperationResult<GameApplication | boolean>> => {
    try {
      const { getDb } = await import("~/db/server-helpers");
      const { getCurrentUser } = await import("~/features/auth/auth.queries");

      const currentUser = await getCurrentUser();
      if (!currentUser) {
        return {
          success: false,
          errors: [{ code: "AUTH_ERROR", message: "Not authenticated" }],
        };
      }

      const db = await getDb();

      const application = await findGameApplicationById(data.applicationId);

      if (!application || application.game.ownerId !== currentUser.id) {
        // Renamed from gameSession
        return {
          success: false,
          errors: [
            {
              code: "AUTH_ERROR",
              message: "Application not found or you are not the owner of the game",
            },
          ],
        };
      }

      if (data.status === "approved") {
        const [updatedApplication] = await db
          .update(gameApplications)
          .set({ status: data.status, updatedAt: new Date() })
          .where(eq(gameApplications.id, data.applicationId))
          .returning();

        if (!updatedApplication) {
          return {
            success: false,
            errors: [{ code: "DATABASE_ERROR", message: "Failed to update application" }],
          };
        }

        await db.insert(gameParticipants).values({
          gameId: application.gameId, // Renamed from gameSessionId
          userId: application.userId,
          role: "player", // Default role for approved applicants
          status: "approved",
        });

        const applicationWithDetails = await findGameApplicationById(
          updatedApplication.id,
        );

        if (!applicationWithDetails) {
          return {
            success: false,
            errors: [
              { code: "DATABASE_ERROR", message: "Failed to fetch updated application" },
            ],
          };
        }

        return { success: true, data: applicationWithDetails as GameApplication };
      } else if (data.status === "rejected") {
        const [updatedApplication] = await db
          .update(gameApplications)
          .set({ status: data.status, updatedAt: new Date() })
          .where(eq(gameApplications.id, data.applicationId))
          .returning();

        if (!updatedApplication) {
          return {
            success: false,
            errors: [{ code: "DATABASE_ERROR", message: "Failed to reject application" }],
          };
        }

        const applicationWithDetails = await findGameApplicationById(
          updatedApplication.id,
        );

        if (!applicationWithDetails) {
          return {
            success: false,
            errors: [
              { code: "DATABASE_ERROR", message: "Failed to fetch rejected application" },
            ],
          };
        }

        return { success: true, data: applicationWithDetails as GameApplication };
      }

      return {
        success: false,
        errors: [{ code: "VALIDATION_ERROR", message: "Invalid action" }],
      };
    } catch (error) {
      console.error("Error responding to application:", error);
      return {
        success: false,
        errors: [{ code: "SERVER_ERROR", message: "Failed to respond to application" }],
      };
    }
  });

/**
 * Remove a participant's rejection ban from a game
 */
export const removeGameParticipantBan = createServerFn({ method: "POST" })
  .validator(removeGameParticipantBanInputSchema.parse)
  .handler(async ({ data }): Promise<OperationResult<boolean>> => {
    try {
      const { getDb } = await import("~/db/server-helpers");
      const { getCurrentUser } = await import("~/features/auth/auth.queries");
      const { eq } = await import("drizzle-orm");

      const currentUser = await getCurrentUser();
      if (!currentUser) {
        return {
          success: false,
          errors: [{ code: "AUTH_ERROR", message: "Not authenticated" }],
        };
      }

      const db = await getDb();

      // Check if current user is game owner
      const existingParticipant = await findGameParticipantById(data.id);

      if (!existingParticipant || existingParticipant.game.ownerId !== currentUser.id) {
        return {
          success: false,
          errors: [
            {
              code: "AUTH_ERROR",
              message: "Not authorized to remove this participant's ban",
            },
          ],
        };
      }

      // Only remove if the participant is currently 'rejected'
      if (existingParticipant.status !== "rejected") {
        return {
          success: false,
          errors: [
            { code: "CONFLICT", message: "Participant is not currently rejected" },
          ],
        };
      }

      await db.delete(gameParticipants).where(eq(gameParticipants.id, data.id));

      return { success: true, data: true };
    } catch (error) {
      console.error("Error removing participant ban:", error);
      return {
        success: false,
        errors: [{ code: "SERVER_ERROR", message: "Failed to remove participant ban" }],
      };
    }
  });
