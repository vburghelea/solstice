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
        const { getDb } = await import("~/db/server-helpers");
        const { gameSystems } = await import("~/db/schema");
        const { ilike } = await import("drizzle-orm");

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
  .handler(async ({ data }): Promise<OperationResult<GameListItem[]>> => {
    try {
      const { getDb } = await import("~/db/server-helpers");
      const { games, user, gameSystems, gameParticipants } = await import("~/db/schema");
      const { and, eq, sql, gte, lte } = await import("drizzle-orm");

      const db = await getDb();

      const conditions = [];

      if (data.filters?.gameSystemId) {
        conditions.push(eq(games.gameSystemId, data.filters.gameSystemId));
      }
      if (data.filters?.status) {
        conditions.push(eq(games.status, data.filters.status));
      }
      if (data.filters?.visibility) {
        conditions.push(eq(games.visibility, data.filters.visibility));
      }
      if (data.filters?.ownerId) {
        conditions.push(eq(games.ownerId, data.filters.ownerId));
      }
      if (data.filters?.dateFrom) {
        conditions.push(gte(games.dateTime, new Date(data.filters.dateFrom)));
      }
      if (data.filters?.dateTo) {
        conditions.push(lte(games.dateTime, new Date(data.filters.dateTo)));
      }
      if (data.filters?.searchTerm) {
        const searchTerm = `%${data.filters.searchTerm.toLowerCase()}%`;
        conditions.push(
          sql`lower(${games.description}) LIKE ${searchTerm} OR lower(${games.language}) LIKE ${searchTerm}`,
        );
      }

      // Filter by participant
      if (data.filters?.participantId) {
        const participantGames = await db
          .select({ gameId: gameParticipants.gameId })
          .from(gameParticipants)
          .where(eq(gameParticipants.userId, data.filters.participantId));
        const gameIds = participantGames.map((p) => p.gameId);
        conditions.push(sql`${games.id} IN ${gameIds}`);
      }

      const result = await db
        .select({
          game: games,
          owner: { id: user.id, name: user.name, email: user.email },
          gameSystem: { id: gameSystems.id, name: gameSystems.name },
          participantCount: sql<number>`count(distinct ${gameParticipants.userId})::int`,
        })
        .from(games)
        .leftJoin(user, eq(games.ownerId, user.id))
        .leftJoin(gameSystems, eq(games.gameSystemId, gameSystems.id))
        .leftJoin(gameParticipants, eq(gameParticipants.gameId, games.id))
        .where(and(...conditions))
        .groupBy(games.id, user.id, gameSystems.id);

      return {
        success: true,
        data: result.map((r) => ({
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
  .handler(async ({ data }): Promise<OperationResult<GameListItem[]>> => {
    try {
      const { getDb } = await import("~/db/server-helpers");
      const { games, user, gameSystems, gameParticipants } = await import("~/db/schema");
      const { and, eq, ilike, sql } = await import("drizzle-orm");

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
        .leftJoin(user, eq(games.ownerId, user.id))
        .leftJoin(gameSystems, eq(games.gameSystemId, gameSystems.id))
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
        data: result.map((r) => ({
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
        const { getDb } = await import("~/db/server-helpers");
        const { user } = await import("~/db/schema");
        const { ilike, or } = await import("drizzle-orm");

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
      const { getCurrentUser } = await import("~/features/auth/auth.queries");

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
