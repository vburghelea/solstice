import { createServerFn } from "@tanstack/react-start";
import {
  getGameSchema,
  listGamesSchema,
  searchGamesSchema,
  searchGameSystemsSchema,
  searchUsersForInvitationSchema,
} from "./games.schemas";

import type { User } from "~/lib/auth/types";
import {
  findGameById,
  findGameParticipantsByGameId,
  findPendingGameApplicationsByGameId,
} from "./games.repository";
import type {
  GameListItem,
  GameLocation,
  GameParticipant,
  GameWithDetails,
  MinimumRequirements,
  OperationResult,
  SafetyRules,
} from "./games.types";

import { and, eq, gte, ilike, lte, or, sql } from "drizzle-orm";
import { gameParticipants, games, gameSystems, user } from "~/db/schema";
import { getDb } from "~/db/server-helpers";
import { getCurrentUser } from "~/features/auth/auth.queries";

interface GameQueryResultRow {
  game: typeof games.$inferSelect;
  owner: {
    id: typeof user.$inferSelect.id;
    name: typeof user.$inferSelect.name;
    email: typeof user.$inferSelect.email;
  };
  gameSystem: {
    id: typeof gameSystems.$inferSelect.id;
    name: typeof gameSystems.$inferSelect.name;
  };
  participantCount: number;
}

/**
 * Search game systems by name
 */
export const searchGameSystems = createServerFn({ method: "POST" })
  .validator(searchGameSystemsSchema.parse)
  .handler(
    async ({
      data,
    }): Promise<
      OperationResult<
        Array<{
          id: number;
          name: string;
          averagePlayTime: number | null;
          minPlayers: number | null;
          maxPlayers: number | null;
        }>
      >
    > => {
      try {
        const db = await getDb();
        const searchTerm = `%${data.query}%`;

        const systems = await db
          .select({
            id: gameSystems.id,
            name: gameSystems.name,
            averagePlayTime: gameSystems.averagePlayTime,
            minPlayers: gameSystems.minPlayers,
            maxPlayers: gameSystems.maxPlayers,
          })
          .from(gameSystems)
          .where(ilike(gameSystems.name, searchTerm))
          .limit(10);

        return { success: true, data: systems };
      } catch (error) {
        console.error("Error searching game systems:", error);
        return {
          success: false,
          errors: [{ code: "SERVER_ERROR", message: "Failed to search game systems" }],
        };
      }
    },
  );

/**
 * Get a single game by ID with all details
 */
export const getGame = createServerFn({ method: "POST" })
  .validator(getGameSchema.parse)
  .handler(async ({ data }): Promise<OperationResult<GameWithDetails | null>> => {
    try {
      // Simple UUID validation
      const UUID_REGEX =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!UUID_REGEX.test(data.id)) {
        return {
          success: false,
          errors: [{ code: "VALIDATION_ERROR", message: "Invalid game ID format" }],
        };
      }

      const game = await findGameById(data.id);

      if (!game) {
        return {
          success: false,
          errors: [{ code: "NOT_FOUND", message: "Game not found" }],
        };
      }

      return {
        success: true,
        data: {
          ...game,
          location: game.location as GameLocation,
          owner: game.owner as User,
        } as GameWithDetails,
      };
    } catch (error) {
      console.error("Error fetching game:", error);
      return {
        success: false,
        errors: [{ code: "DATABASE_ERROR", message: "Failed to fetch game" }],
      };
    }
  });

/**
 * List games based on filters
 */
export const listGames = createServerFn({ method: "POST" })
  .validator(listGamesSchema.parse)
  .handler(async ({ data = {} }): Promise<OperationResult<GameListItem[]>> => {
    try {
      const db = await getDb();

      const currentUser = await getCurrentUser();
      const currentUserId = currentUser?.id;

      const baseConditions = [];

      if (data.filters?.gameSystemId) {
        baseConditions.push(eq(games.gameSystemId, data.filters.gameSystemId));
      }
      if (data.filters?.status) {
        baseConditions.push(eq(games.status, data.filters.status));
      }
      if (data.filters?.dateFrom) {
        baseConditions.push(gte(games.dateTime, new Date(data.filters.dateFrom)));
      }
      if (data.filters?.dateTo) {
        baseConditions.push(lte(games.dateTime, new Date(data.filters.dateTo)));
      }
      if (data.filters?.searchTerm) {
        const searchTerm = `%${data.filters.searchTerm.toLowerCase()}%`;
        baseConditions.push(
          or(
            sql`lower(${games.description}) LIKE ${searchTerm}`,
            sql`lower(${games.language}) LIKE ${searchTerm}`,
          ),
        );
      }

      const visibilityConditions = [];

      // Rule 1: All public games
      visibilityConditions.push(eq(games.visibility, "public"));

      if (currentUserId) {
        // Rule 2: All private games they are a participant of or invited to
        const userGames = db
          .select({ gameId: gameParticipants.gameId })
          .from(gameParticipants)
          .where(
            and(
              eq(gameParticipants.userId, currentUserId),
              or(
                eq(gameParticipants.role, "player"),
                eq(gameParticipants.role, "invited"),
              ),
            ),
          );

        visibilityConditions.push(
          and(eq(games.visibility, "private"), sql`${games.id} IN ${userGames}`),
        );

        // Rule 3: All games they own
        visibilityConditions.push(eq(games.ownerId, currentUserId));

        // Rule 4: Protected games where user meets minimum requirements (placeholder)
        // This would involve checking the user's profile against games.minimumRequirements
        // For now, we'll just include games where the user is an owner or participant/invited
        // and the game is protected. A more robust check would be needed here.
        visibilityConditions.push(
          and(
            eq(games.visibility, "protected"),
            or(eq(games.ownerId, currentUserId), sql`${games.id} IN ${userGames}`),
            // TODO: Add actual minimum requirements check here
          ),
        );
      }

      // Combine base conditions with visibility conditions
      const finalConditions = and(...baseConditions, or(...visibilityConditions));

      const result = await db
        .select({
          game: games,
          owner: { id: user.id, name: user.name, email: user.email },
          gameSystem: { id: gameSystems.id, name: gameSystems.name },
          participantCount: sql<number>`count(distinct ${gameParticipants.userId})::int`,
        })
        .from(games)
        .innerJoin(user, eq(games.ownerId, user.id))
        .innerJoin(gameSystems, eq(games.gameSystemId, gameSystems.id))
        .leftJoin(gameParticipants, eq(gameParticipants.gameId, games.id))
        .where(finalConditions)
        .groupBy(games.id, user.id, gameSystems.id);

      return {
        success: true,
        data: result.map((r: GameQueryResultRow) => ({
          ...r.game,
          location: r.game.location as GameLocation,
          minimumRequirements: r.game.minimumRequirements as MinimumRequirements,
          safetyRules: r.game.safetyRules as SafetyRules,
          owner: r.owner as User,
          gameSystem: r.gameSystem,
          participantCount: r.participantCount,
        })),
      };
    } catch (error) {
      console.error("Error listing games:", error);
      return {
        success: false,
        errors: [{ code: "DATABASE_ERROR", message: "Failed to list games" }],
      };
    }
  });

/**
 * Search games by name or description
 */
export const searchGames = createServerFn({ method: "POST" })
  .validator(searchGamesSchema.parse)
  .handler(async ({ data = {} }): Promise<OperationResult<GameListItem[]>> => {
    try {
      const db = await getDb();
      const searchTerm = `%${data.query}%`;

      const result = await db
        .select({
          game: games,
          owner: { id: user.id, name: user.name, email: user.email },
          gameSystem: { id: gameSystems.id, name: gameSystems.name },
          participantCount: sql<number>`count(distinct ${gameParticipants.userId})::int`,
        })
        .from(games)
        .innerJoin(user, eq(games.ownerId, user.id))
        .innerJoin(gameSystems, eq(games.gameSystemId, gameSystems.id))
        .leftJoin(gameParticipants, eq(gameParticipants.gameId, games.id))
        .where(
          and(
            eq(games.visibility, "public"), // Only search public games
            ilike(games.description, searchTerm),
          ),
        )
        .groupBy(games.id, user.id, gameSystems.id)
        .orderBy(games.dateTime)
        .limit(20);

      return {
        success: true,
        data: result.map((r: GameQueryResultRow) => ({
          ...r.game,
          location: r.game.location as GameLocation,
          minimumRequirements: r.game.minimumRequirements as MinimumRequirements,
          safetyRules: r.game.safetyRules as SafetyRules,
          owner: r.owner as User,
          gameSystem: r.gameSystem,
          participantCount: r.participantCount,
        })),
      };
    } catch (error) {
      console.error("Error searching games:", error);
      return {
        success: false,
        errors: [{ code: "SERVER_ERROR", message: "Failed to search games" }],
      };
    }
  });

/**
 * Search users for invitation by name or email
 */
export const searchUsersForInvitation = createServerFn({ method: "POST" })
  .validator(searchUsersForInvitationSchema.parse)
  .handler(
    async ({
      data,
    }): Promise<OperationResult<Array<{ id: string; name: string; email: string }>>> => {
      try {
        const db = await getDb();
        const searchTerm = `%${data.query}%`;

        const users = await db
          .select({
            id: user.id,
            name: user.name,
            email: user.email,
          })
          .from(user)
          .where(or(ilike(user.name, searchTerm), ilike(user.email, searchTerm)))
          .limit(10);

        return { success: true, data: users };
      } catch (error) {
        console.error("Error searching users for invitation:", error);
        return {
          success: false,
          errors: [{ code: "SERVER_ERROR", message: "Failed to search users" }],
        };
      }
    },
  );

/**
 * Get pending applications for a specific game
 */
export const getGameApplications = createServerFn({ method: "POST" })
  .validator(getGameSchema.parse)
  .handler(async ({ data }): Promise<OperationResult<GameParticipant[]>> => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        return {
          success: false,
          errors: [{ code: "AUTH_ERROR", message: "Not authenticated" }],
        };
      }

      // Check if current user is the owner of the game
      const game = await findGameById(data.id);

      if (!game || game.ownerId !== currentUser.id) {
        return {
          success: false,
          errors: [
            {
              code: "AUTH_ERROR",
              message: "Not authorized to view applications for this game",
            },
          ],
        };
      }

      const applications = await findPendingGameApplicationsByGameId(data.id);

      return { success: true, data: applications as GameParticipant[] };
    } catch (error) {
      console.error("Error fetching game applications:", error);
      return {
        success: false,
        errors: [{ code: "SERVER_ERROR", message: "Failed to fetch applications" }],
      };
    }
  });

/**
 * Get participants for a specific game
 */
export const getGameParticipants = createServerFn({ method: "POST" })
  .validator(getGameSchema.parse)
  .handler(async ({ data }): Promise<OperationResult<GameParticipant[]>> => {
    try {
      const participants = await findGameParticipantsByGameId(data.id);

      return { success: true, data: participants as GameParticipant[] };
    } catch (error) {
      console.error("Error fetching game participants:", error);
      return {
        success: false,
        errors: [{ code: "SERVER_ERROR", message: "Failed to fetch participants" }],
      };
    }
  });
