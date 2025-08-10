import { createServerFn } from "@tanstack/react-start";
import { and, eq } from "drizzle-orm";
import { gameParticipants, games } from "~/db/schema";
import { getCampaignParticipants } from "~/features/campaigns/campaigns.queries";
import { OperationResult } from "~/shared/types/common";
import {
  findGameById,
  findGameParticipantByGameAndUserId,
  findGameParticipantById,
  findUserByEmail,
} from "./games.repository";
import {
  addGameParticipantInputSchema,
  applyToGameInputSchema,
  createGameInputSchema,
  createGameSessionForCampaignInputSchema,
  getGameSchema,
  inviteToGameInputSchema,
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
 * Add a participant to a game (e.g., owner adding a player, or inviting)
 */
export const addGameParticipant = createServerFn({ method: "POST" })
  .validator(addGameParticipantInputSchema.parse)
  .handler(async ({ data }): Promise<OperationResult<GameParticipant>> => {
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

      // Check if current user is game owner or has permission to add participants
      const game = await findGameById(data.gameId);

      if (!game || game.ownerId !== currentUser.id) {
        return {
          success: false,
          errors: [{ code: "AUTH_ERROR", message: "Not authorized to add participants" }],
        };
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
import { findGameApplicationById } from "./games.repository"; // Import findGameApplicationById
import { GameApplication } from "./games.types"; // Import GameApplication type

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

      // Check if already applied
      const existingApplication = await db.query.gameApplications.findFirst({
        where: and(
          eq(gameApplications.gameId, data.gameId),
          eq(gameApplications.userId, currentUser.id),
        ),
      });

      if (existingApplication) {
        return {
          success: false,
          errors: [
            { code: "CONFLICT", message: "You have already applied to this game" },
          ],
        };
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

      let targetUserId: string;

      if (data.userId) {
        targetUserId = data.userId;
      } else if (data.email) {
        const invitedUser = await findUserByEmail(data.email);
        if (!invitedUser) {
          return {
            success: false,
            errors: [{ code: "NOT_FOUND", message: "User with this email not found" }],
          };
        }
        targetUserId = invitedUser.id;
      } else {
        return {
          success: false,
          errors: [
            { code: "VALIDATION_ERROR", message: "User ID or email must be provided" },
          ],
        };
      }

      // Ensure targetUserId is defined before proceeding
      if (!targetUserId) {
        return {
          success: false,
          errors: [
            {
              code: "VALIDATION_ERROR",
              message: "Target user ID could not be determined",
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

        return { success: true, data: participantWithUser as GameParticipant };
      } else if (data.action === "reject") {
        await db
          .delete(gameParticipants)
          .where(eq(gameParticipants.id, data.participantId));
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
      const { eq } = await import("drizzle-orm");

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
        await db
          .delete(gameApplications)
          .where(eq(gameApplications.id, data.applicationId));
        return { success: true, data: true };
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
