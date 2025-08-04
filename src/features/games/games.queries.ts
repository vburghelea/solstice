import { createServerFn } from "@tanstack/react-start";
import { getGameSchema, listGamesSchema, searchGamesSchema } from "./games.schemas";
import type {
  GameListItem,
  GameLocation,
  GameWithDetails,
  MinimumRequirements,
  OperationResult,
  SafetyRules,
} from "./games.types";

/**
 * Get a single game by ID with all details
 */
export const getGame = createServerFn({ method: "POST" })
  .validator(getGameSchema.parse)
  .handler(async ({ data }): Promise<OperationResult<GameWithDetails | null>> => {
    try {
      const { getDb } = await import("~/db/server-helpers");
      const { games } = await import("~/db/schema");
      const { eq } = await import("drizzle-orm");

      const db = await getDb();

      const game = await db().query.games.findFirst({
        where: eq(games.id, data.id),
        with: {
          owner: true,
          gameSystem: true,
          participants: {
            with: { user: true },
          },
        },
      });

      if (!game) {
        return {
          success: false,
          errors: [{ code: "NOT_FOUND", message: "Game not found" }],
        };
      }

      return {
        success: true,
        data: { ...game, location: game.location as GameLocation } as GameWithDetails,
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
        const participantGames = await db()
          .select({ gameId: gameParticipants.gameId })
          .from(gameParticipants)
          .where(eq(gameParticipants.userId, data.filters.participantId));
        const gameIds = participantGames.map((p) => p.gameId);
        conditions.push(sql`${games.id} IN ${gameIds}`);
      }

      const result = await db()
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
          owner: r.owner,
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

      const result = await db()
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
          owner: r.owner,
          gameSystem: r.gameSystem,
          participantCount: r.participantCount,
        })),
      };
    } catch (error) {
      console.error("Error searching games:", error);
      return {
        success: false,
        errors: [{ code: "DATABASE_ERROR", message: "Failed to search games" }],
      };
    }
  });
