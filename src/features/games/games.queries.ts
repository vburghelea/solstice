import { createServerFn } from "@tanstack/react-start";
import {
  getGameSchema,
  listGameSessionsByCampaignIdSchema,
  listGamesSchema,
  searchGamesSchema,
  searchGameSystemsSchema,
  searchUsersForInvitationSchema,
} from "./games.schemas";

import { z } from "zod";
import {
  locationSchema,
  minimumRequirementsSchema,
  safetyRulesSchema,
} from "~/shared/schemas/common";
import { OperationResult } from "~/shared/types/common";
import { GameListItem, GameParticipant, GameWithDetails } from "./games.types";

import { and, eq, gte, ilike, lte, or, sql } from "drizzle-orm";
import { gameParticipants, games, gameSystems, user } from "~/db/schema";
import { getDb } from "~/db/server-helpers";
import { getCurrentUser } from "~/features/auth/auth.queries";
import {
  findGameById,
  findGameParticipantsByGameId,
  findPendingGameApplicationsByGameId,
} from "./games.repository";

interface GameQueryResultRow {
  id: typeof games.$inferSelect.id;
  ownerId: typeof games.$inferSelect.ownerId;
  campaignId: typeof games.$inferSelect.campaignId;
  gameSystemId: typeof games.$inferSelect.gameSystemId;
  name: typeof games.$inferSelect.name;
  dateTime: typeof games.$inferSelect.dateTime;
  description: typeof games.$inferSelect.description;
  expectedDuration: typeof games.$inferSelect.expectedDuration;
  price: typeof games.$inferSelect.price;
  language: typeof games.$inferSelect.language;
  location: z.infer<typeof locationSchema>;
  status: typeof games.$inferSelect.status;
  minimumRequirements: z.infer<typeof minimumRequirementsSchema>;
  visibility: typeof games.$inferSelect.visibility;
  safetyRules: z.infer<typeof safetyRulesSchema>;
  createdAt: typeof games.$inferSelect.createdAt;
  updatedAt: typeof games.$inferSelect.updatedAt;
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

export const getGameSystem = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.number() }).parse)
  .handler(async ({ data }) => {
    const db = await getDb();
    const result = await db.query.gameSystems.findFirst({
      where: eq(gameSystems.id, data.id),
    });
    return { success: true, data: result };
  });

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
          location: game.location,
          owner: game.owner,
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
    console.log("listGames received filters:", data.filters);
    try {
      const db = await getDb();

      const currentUser = await getCurrentUser();
      const currentUserId = currentUser?.id;

      const statusFilterCondition = data.filters?.status
        ? eq(games.status, data.filters.status)
        : null;

      const otherBaseConditions = [];
      if (data.filters?.gameSystemId) {
        otherBaseConditions.push(eq(games.gameSystemId, data.filters.gameSystemId));
      }
      if (data.filters?.dateFrom) {
        otherBaseConditions.push(gte(games.dateTime, new Date(data.filters.dateFrom)));
      }
      if (data.filters?.dateTo) {
        otherBaseConditions.push(lte(games.dateTime, new Date(data.filters.dateTo)));
      }
      if (data.filters?.searchTerm) {
        const searchTerm = `%${data.filters.searchTerm.toLowerCase()}%`;
        otherBaseConditions.push(
          or(
            sql`lower(${games.description}) LIKE ${searchTerm}`,
            sql`lower(${games.language}) LIKE ${searchTerm}`,
          ),
        );
      }

      const visibilityConditionsForOr = [];

      // Rule 1: All public games
      visibilityConditionsForOr.push(eq(games.visibility, "public"));

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

        visibilityConditionsForOr.push(
          and(eq(games.visibility, "private"), sql`${games.id} IN ${userGames}`),
        );

        // Rule 3: All games they own
        visibilityConditionsForOr.push(eq(games.ownerId, currentUserId));

        // Rule 4: Protected games where user meets minimum requirements (placeholder)
        // This would involve checking the user's profile against games.minimumRequirements
        // For now, we'll just include games where the user is an owner or participant/invited
        // and the game is protected. A more robust check would be needed here.
        visibilityConditionsForOr.push(
          and(
            eq(games.visibility, "protected"),
            or(eq(games.ownerId, currentUserId), sql`${games.id} IN ${userGames}`),
            // TODO: Add actual minimum requirements check here
          ),
        );
      }

      // Build visibility conditions, ensuring each one is ANDed with the status filter if it exists
      const visibilityConditionsForOrWithStatus = visibilityConditionsForOr.map(
        (condition) => {
          if (statusFilterCondition) {
            return and(statusFilterCondition, condition);
          }
          return condition;
        },
      );

      // Combine all conditions: otherBaseConditions AND (OR of visibility conditions with status)
      const finalWhereClause = and(
        ...(otherBaseConditions.length > 0 ? otherBaseConditions : [sql`true`]),
        or(...visibilityConditionsForOrWithStatus),
      );

      const result: GameQueryResultRow[] = await db
        .select({
          id: games.id,
          ownerId: games.ownerId,
          campaignId: games.campaignId,
          gameSystemId: games.gameSystemId,
          name: games.name,
          dateTime: games.dateTime,
          description: games.description,
          expectedDuration: games.expectedDuration,
          price: games.price,
          language: games.language,
          location: sql<z.infer<typeof locationSchema>>`${games.location}`,
          status: games.status,
          minimumRequirements: sql<
            z.infer<typeof minimumRequirementsSchema>
          >`${games.minimumRequirements}`,
          visibility: games.visibility,
          safetyRules: sql<z.infer<typeof safetyRulesSchema>>`${games.safetyRules}`,
          createdAt: games.createdAt,
          updatedAt: games.updatedAt,
          owner: { id: user.id, name: user.name, email: user.email },
          gameSystem: { id: gameSystems.id, name: gameSystems.name },
          participantCount: sql<number>`count(distinct ${gameParticipants.userId})::int`,
        })
        .from(games)
        .innerJoin(user, eq(games.ownerId, user.id))
        .innerJoin(gameSystems, eq(games.gameSystemId, gameSystems.id))
        .leftJoin(gameParticipants, eq(gameParticipants.gameId, games.id))
        .where(finalWhereClause)
        .groupBy(games.id, user.id, gameSystems.id);

      return {
        success: true,
        data: result.map((r) => ({
          ...r,
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

      const result: GameQueryResultRow[] = await db
        .select({
          id: games.id,
          ownerId: games.ownerId,
          campaignId: games.campaignId,
          gameSystemId: games.gameSystemId,
          name: games.name,
          dateTime: games.dateTime,
          description: games.description,
          expectedDuration: games.expectedDuration,
          price: games.price,
          language: games.language,
          location: sql<z.infer<typeof locationSchema>>`${games.location}`,
          status: games.status,
          minimumRequirements: sql<
            z.infer<typeof minimumRequirementsSchema>
          >`${games.minimumRequirements}`,
          visibility: games.visibility,
          safetyRules: sql<z.infer<typeof safetyRulesSchema>>`${games.safetyRules}`,
          createdAt: games.createdAt,
          updatedAt: games.updatedAt,
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
        data: result.map((r) => ({
          ...r,
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
 * List game sessions by campaign ID
 */
export const listGameSessionsByCampaignId = createServerFn({ method: "POST" })
  .validator(listGameSessionsByCampaignIdSchema.parse)
  .handler(async ({ data }): Promise<OperationResult<GameListItem[]>> => {
    try {
      const db = await getDb();

      const conditions = [eq(games.campaignId, data.campaignId)];

      if (data.status) {
        conditions.push(eq(games.status, data.status));
      }

      const result: GameQueryResultRow[] = await db
        .select({
          id: games.id,
          ownerId: games.ownerId,
          campaignId: games.campaignId,
          gameSystemId: games.gameSystemId,
          name: games.name,
          dateTime: games.dateTime,
          description: games.description,
          expectedDuration: games.expectedDuration,
          price: games.price,
          language: games.language,
          location: sql<z.infer<typeof locationSchema>>`${games.location}`,
          status: games.status,
          minimumRequirements: sql<
            z.infer<typeof minimumRequirementsSchema>
          >`${games.minimumRequirements}`,
          visibility: games.visibility,
          safetyRules: sql<z.infer<typeof safetyRulesSchema>>`${games.safetyRules}`,
          createdAt: games.createdAt,
          updatedAt: games.updatedAt,
          owner: { id: user.id, name: user.name, email: user.email },
          gameSystem: { id: gameSystems.id, name: gameSystems.name },
          participantCount: sql<number>`count(distinct ${gameParticipants.userId})::int`,
        })
        .from(games)
        .innerJoin(user, eq(games.ownerId, user.id))
        .innerJoin(gameSystems, eq(games.gameSystemId, gameSystems.id))
        .leftJoin(gameParticipants, eq(gameParticipants.gameId, games.id))
        .where(and(...conditions))
        .groupBy(games.id, user.id, gameSystems.id);

      return {
        success: true,
        data: result.map((r) => ({
          ...r,
        })),
      };
    } catch (error) {
      console.error("Error listing game sessions by campaign ID:", error);
      return {
        success: false,
        errors: [{ code: "DATABASE_ERROR", message: "Failed to list game sessions" }],
      };
    }
  });

import { GameApplication } from "./games.types"; // Import GameApplication type

/**
 * Get pending applications for a specific game
 */
export const getGameApplications = createServerFn({ method: "POST" })
  .validator(getGameSchema.parse)
  .handler(async ({ data }): Promise<OperationResult<GameApplication[]>> => {
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

      return { success: true, data: applications as GameApplication[] };
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
