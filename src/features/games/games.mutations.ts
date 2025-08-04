import { createServerFn } from "@tanstack/react-start";
import {
  addGameParticipantInputSchema,
  applyToGameInputSchema,
  createGameInputSchema,
  getGameSchema,
  inviteToGameInputSchema,
  removeGameParticipantInputSchema,
  updateGameInputSchema,
  updateGameParticipantInputSchema,
} from "./games.schemas";
import type {
  GameLocation,
  GameParticipant,
  GameWithDetails,
  MinimumRequirements,
  OperationResult,
  SafetyRules,
} from "./games.types";

/**
 * Create a new game session
 */
export const createGame = createServerFn({ method: "POST" })
  .validator(createGameInputSchema.parse)
  .handler(async ({ data }): Promise<OperationResult<GameWithDetails>> => {
    try {
      const { getDb } = await import("~/db/server-helpers");
      const { games, gameParticipants } = await import("~/db/schema");
      const { getCurrentUser } = await import("~/features/auth/auth.queries");

      const currentUser = await getCurrentUser();
      if (!currentUser) {
        return {
          success: false,
          errors: [{ code: "AUTH_ERROR", message: "Not authenticated" }],
        };
      }

      const db = await getDb();

      const [newGame] = await db()
        .insert(games)
        .values({
          id: `game-${Date.now()}`,
          ownerId: currentUser.id,
          gameSystemId: data.gameSystemId,
          dateTime: new Date(data.dateTime),
          description: data.description,
          expectedDuration: data.expectedDuration,
          price: data.price,
          language: data.language,
          location: data.location,
          status: "scheduled",
          minimumRequirements: data.minimumRequirements as MinimumRequirements,
          visibility: data.visibility,
          safetyRules: data.safetyRules as SafetyRules,
        })
        .returning();

      if (!newGame) {
        return {
          success: false,
          errors: [{ code: "DATABASE_ERROR", message: "Failed to create game" }],
        };
      }

      // Add owner as a participant
      const [ownerParticipant] = await db()
        .insert(gameParticipants)
        .values({
          id: `game-participant-${Date.now()}`,
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
          errors: [{ code: "DATABASE_ERROR", message: "Failed to fetch created game" }],
        };
      }

      return {
        success: true,
        data: {
          ...gameWithDetails.data,
          location: gameWithDetails.data.location as GameLocation,
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
      const { games } = await import("~/db/schema");
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
      const existingGame = await db().query.games.findFirst({
        where: eq(games.id, data.id),
      });

      if (!existingGame || existingGame.ownerId !== currentUser.id) {
        return {
          success: false,
          errors: [{ code: "AUTH_ERROR", message: "Not authorized to update this game" }],
        };
      }

      const [updatedGame] = await db()
        .update(games)
        .set({
          gameSystemId: data.gameSystemId,
          dateTime: data.dateTime ? new Date(data.dateTime) : undefined,
          description: data.description,
          expectedDuration: data.expectedDuration,
          price: data.price,
          language: data.language,
          location: data.location as GameLocation,
          status: data.status,
          minimumRequirements: data.minimumRequirements as MinimumRequirements,
          visibility: data.visibility,
          safetyRules: data.safetyRules as SafetyRules,
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
          location: gameWithDetails.data.location as GameLocation,
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
      const { games } = await import("~/db/schema");
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
      const existingGame = await db().query.games.findFirst({
        where: eq(games.id, data.id),
      });

      if (!existingGame || existingGame.ownerId !== currentUser.id) {
        return {
          success: false,
          errors: [{ code: "AUTH_ERROR", message: "Not authorized to delete this game" }],
        };
      }

      await db().delete(games).where(eq(games.id, data.id));

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
      const { gameParticipants, games } = await import("~/db/schema");
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

      // Check if current user is game owner or has permission to add participants
      const game = await db().query.games.findFirst({
        where: eq(games.id, data.gameId),
      });

      if (!game || game.ownerId !== currentUser.id) {
        return {
          success: false,
          errors: [{ code: "AUTH_ERROR", message: "Not authorized to add participants" }],
        };
      }

      const [newParticipant] = await db()
        .insert(gameParticipants)
        .values({
          id: `game-participant-${Date.now()}`,
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

      const participantWithUser = await db().query.gameParticipants.findFirst({
        where: eq(gameParticipants.id, newParticipant.id),
        with: { user: true },
      });

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
      const { gameParticipants } = await import("~/db/schema");
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
      const existingParticipant = await db().query.gameParticipants.findFirst({
        where: eq(gameParticipants.id, data.id),
        with: { game: true },
      });

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

      const [updatedParticipant] = await db()
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

      const participantWithUser = await db().query.gameParticipants.findFirst({
        where: eq(gameParticipants.id, updatedParticipant.id),
        with: { user: true },
      });

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
      const { gameParticipants } = await import("~/db/schema");
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
      const existingParticipant = await db().query.gameParticipants.findFirst({
        where: eq(gameParticipants.id, data.id),
        with: { game: true },
      });

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

      await db().delete(gameParticipants).where(eq(gameParticipants.id, data.id));

      return { success: true, data: true };
    } catch (error) {
      console.error("Error removing participant:", error);
      return {
        success: false,
        errors: [{ code: "SERVER_ERROR", message: "Failed to remove participant" }],
      };
    }
  });

/**
 * Player applies to join a game
 */
export const applyToGame = createServerFn({ method: "POST" })
  .validator(applyToGameInputSchema.parse)
  .handler(async ({ data }): Promise<OperationResult<GameParticipant>> => {
    try {
      const { getDb } = await import("~/db/server-helpers");
      const { gameParticipants } = await import("~/db/schema");
      const { getCurrentUser } = await import("~/features/auth/auth.queries");
      const { eq, and } = await import("drizzle-orm");

      const currentUser = await getCurrentUser();
      if (!currentUser) {
        return {
          success: false,
          errors: [{ code: "AUTH_ERROR", message: "Not authenticated" }],
        };
      }

      const db = await getDb();

      // Check if already a participant
      const existingParticipant = await db().query.gameParticipants.findFirst({
        where: and(
          eq(gameParticipants.gameId, data.gameId),
          eq(gameParticipants.userId, currentUser.id),
        ),
      });

      if (existingParticipant) {
        return {
          success: false,
          errors: [{ code: "CONFLICT", message: "Already a participant or applicant" }],
        };
      }

      const [newParticipant] = await db()
        .insert(gameParticipants)
        .values({
          id: `game-participant-${Date.now()}`,
          gameId: data.gameId,
          userId: currentUser.id,
          role: "applicant",
          status: "pending",
        })
        .returning();

      if (!newParticipant) {
        return {
          success: false,
          errors: [{ code: "DATABASE_ERROR", message: "Failed to apply to game" }],
        };
      }

      // Fetch participant with user details

      const participantWithUser = await db().query.gameParticipants.findFirst({
        where: eq(gameParticipants.id, newParticipant.id),
        with: { user: true },
      });

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
      const { gameParticipants, games, user } = await import("~/db/schema");
      const { getCurrentUser } = await import("~/features/auth/auth.queries");
      const { eq, and } = await import("drizzle-orm");

      const currentUser = await getCurrentUser();
      if (!currentUser) {
        return {
          success: false,
          errors: [{ code: "AUTH_ERROR", message: "Not authenticated" }],
        };
      }

      const db = await getDb();

      // Check if current user is game owner
      const game = await db().query.games.findFirst({
        where: eq(games.id, data.gameId),
      });

      if (!game || game.ownerId !== currentUser.id) {
        return {
          success: false,
          errors: [
            { code: "AUTH_ERROR", message: "Not authorized to invite participants" },
          ],
        };
      }

      let targetUserId: string | undefined;

      if (data.userId) {
        targetUserId = data.userId;
      } else if (data.email) {
        const invitedUser = await db().query.user.findFirst({
          where: eq(user.email, data.email),
        });
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

      // Check if already a participant
      const existingParticipant = await db().query.gameParticipants.findFirst({
        where: and(
          eq(gameParticipants.gameId, data.gameId),
          eq(gameParticipants.userId, targetUserId),
        ),
      });

      if (existingParticipant) {
        return {
          success: false,
          errors: [
            { code: "CONFLICT", message: "User is already a participant or has applied" },
          ],
        };
      }

      const [newParticipant] = await db()
        .insert(gameParticipants)
        .values({
          id: `game-participant-${Date.now()}`,
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
      const participantWithUser = await db().query.gameParticipants.findFirst({
        where: eq(gameParticipants.id, newParticipant.id),
        with: { user: true },
      });

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
