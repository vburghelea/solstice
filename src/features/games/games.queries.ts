import { createServerFn, serverOnly } from "@tanstack/react-start";
import {
  getGameApplicationForUserInputSchema,
  getGameSchema,
  listGameSessionsByCampaignIdSchema,
  listGamesSchema,
  searchGamesSchema,
  searchGameSystemsSchema,
  searchUsersForInvitationSchema,
} from "./games.schemas";

import type { SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { z } from "zod";
import {
  locationSchema,
  minimumRequirementsSchema,
  safetyRulesSchema,
} from "~/shared/schemas/common";
import { OperationResult } from "~/shared/types/common";
import {
  GameApplication,
  GameListItem,
  GameParticipant,
  GameWithDetails,
} from "./games.types";

import type {
  games as gamesTable,
  gameSystems as gameSystemsTable,
  user as userTable,
} from "~/db/schema";

const getServerDeps = serverOnly(async () => {
  const [drizzle, schema, serverHelpers, authQueries, gameRepo] = await Promise.all([
    import("drizzle-orm"),
    import("~/db/schema"),
    import("~/db/server-helpers"),
    import("~/features/auth/auth.queries"),
    import("./games.repository"),
  ]);
  return { ...drizzle, ...schema, ...serverHelpers, ...authQueries, ...gameRepo };
});

type DbLimitChain<R> = { limit: (n: number) => Promise<R[]> };
type DbOrderChain<R> = Promise<R[]> & DbLimitChain<R>;
type DbOrderable<R> = { orderBy: (...args: unknown[]) => DbOrderChain<R> };
type DbGroupChain<R> = { groupBy: (...cols: unknown[]) => DbOrderable<R> };
type DbWhereChain<R> = {
  where: (cond: unknown) => DbGroupChain<R>;
};
type DbJoinChain<R> = DbWhereChain<R> & {
  innerJoin: (a: unknown, b: unknown) => DbJoinChain<R>;
  leftJoin: (a: unknown, b: unknown) => DbJoinChain<R>;
};
type DbFromChain<R> = {
  from: (t: unknown) => DbJoinChain<R>;
};
interface DbLike {
  select: <R>(projection: unknown) => DbFromChain<R>;
}

type SqlExpr = SQL<unknown>;

type GameSystem = typeof gameSystemsTable.$inferSelect;

interface GameQueryResultRow {
  id: typeof gamesTable.$inferSelect.id;
  ownerId: typeof gamesTable.$inferSelect.ownerId;
  campaignId: typeof gamesTable.$inferSelect.campaignId;
  gameSystemId: typeof gamesTable.$inferSelect.gameSystemId;
  name: typeof gamesTable.$inferSelect.name;
  dateTime: typeof gamesTable.$inferSelect.dateTime;
  description: typeof gamesTable.$inferSelect.description;
  expectedDuration: typeof gamesTable.$inferSelect.expectedDuration;
  price: typeof gamesTable.$inferSelect.price;
  language: typeof gamesTable.$inferSelect.language;
  location: z.infer<typeof locationSchema>;
  status: typeof gamesTable.$inferSelect.status;
  minimumRequirements: z.infer<typeof minimumRequirementsSchema>;
  visibility: typeof gamesTable.$inferSelect.visibility;
  safetyRules: z.infer<typeof safetyRulesSchema>;
  createdAt: typeof gamesTable.$inferSelect.createdAt;
  updatedAt: typeof gamesTable.$inferSelect.updatedAt;
  owner: {
    id: typeof userTable.$inferSelect.id;
    name: typeof userTable.$inferSelect.name;
    email: typeof userTable.$inferSelect.email;
    image: typeof userTable.$inferSelect.image;
    uploadedAvatarPath: typeof userTable.$inferSelect.uploadedAvatarPath;
    gmRating: typeof userTable.$inferSelect.gmRating;
  };
  gameSystemName: typeof gameSystemsTable.$inferSelect.name;
  gameSystemSlug: typeof gameSystemsTable.$inferSelect.slug;
  gameSystemAveragePlayTime: typeof gameSystemsTable.$inferSelect.averagePlayTime;
  gameSystemMinPlayers: typeof gameSystemsTable.$inferSelect.minPlayers;
  gameSystemMaxPlayers: typeof gameSystemsTable.$inferSelect.maxPlayers;
  systemHeroUrl: string | null;
  systemCategories: string[] | null;
  participantCount: number;
}

function mapGameRowToListItem(row: GameQueryResultRow): GameListItem {
  const {
    gameSystemName,
    gameSystemSlug,
    gameSystemAveragePlayTime,
    gameSystemMinPlayers,
    gameSystemMaxPlayers,
    systemHeroUrl,
    systemCategories,
    ...rest
  } = row;

  const categories = Array.isArray(systemCategories)
    ? systemCategories.filter((name): name is string => typeof name === "string")
    : [];

  return {
    ...rest,
    heroImageUrl: systemHeroUrl ?? null,
    gameSystem: {
      id: row.gameSystemId,
      name: gameSystemName,
      slug: gameSystemSlug,
      averagePlayTime: gameSystemAveragePlayTime,
      minPlayers: gameSystemMinPlayers,
      maxPlayers: gameSystemMaxPlayers,
      categories,
    },
  };
}

export const getGameSystem = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.number() }).parse)
  .handler(async ({ data }): Promise<OperationResult<GameSystem | null>> => {
    try {
      const { getDb, eq, gameSystems } = await getServerDeps();
      const db = await getDb();
      const result = await db.query.gameSystems.findFirst({
        where: eq(gameSystems.id, data.id),
      });
      return { success: true, data: result ?? null };
    } catch (error) {
      console.error("Error fetching game system:", error);
      return {
        success: false,
        errors: [{ code: "SERVER_ERROR", message: "Failed to fetch game system" }],
      };
    }
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
        const { getDb, and, eq, ilike, gameSystems } = await getServerDeps();
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
          .where(
            and(ilike(gameSystems.name, searchTerm), eq(gameSystems.isPublished, true)),
          )
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

      const { findGameById } = await getServerDeps();
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
export async function listGamesImpl(
  db: unknown,
  currentUserId: string | null | undefined,
  filters: z.infer<typeof listGamesSchema>["filters"] | undefined,
): Promise<OperationResult<GameListItem[]>> {
  try {
    const {
      and,
      eq,
      gte,
      lte,
      or,
      sql,
      gameParticipants,
      games,
      gameSystems,
      user,
      mediaAssets,
      gameSystemToCategory,
      gameSystemCategories,
    } = await getServerDeps();
    const heroImage = alias(mediaAssets, "heroImage");
    const systemCategoryLink = alias(gameSystemToCategory, "systemCategoryLink");
    const category = alias(gameSystemCategories, "category");
    const statusFilterCondition: SqlExpr | null = filters?.status
      ? (eq(games.status, filters.status) as SqlExpr)
      : null;

    const otherBaseConditions: SqlExpr[] = [];
    if (filters?.gameSystemId)
      otherBaseConditions.push(eq(games.gameSystemId, filters.gameSystemId));
    if (filters?.dateFrom)
      otherBaseConditions.push(gte(games.dateTime, new Date(filters.dateFrom)));
    if (filters?.dateTo)
      otherBaseConditions.push(lte(games.dateTime, new Date(filters.dateTo)));
    if (filters?.searchTerm) {
      const searchTerm = `%${filters.searchTerm.toLowerCase()}%`;
      otherBaseConditions.push(
        or(
          sql`lower(${games.description}) LIKE ${searchTerm}`,
          sql`lower(${games.language}) LIKE ${searchTerm}`,
        ) as SqlExpr,
      );
    }

    const visibilityConditionsForOr: SqlExpr[] = [];
    visibilityConditionsForOr.push(eq(games.visibility, "public"));

    if (currentUserId) {
      const { userFollows, userBlocks } = await import("~/db/schema");
      const userGames = (db as DbLike)
        .select({ gameId: gameParticipants.gameId })
        .from(gameParticipants)
        .where(
          and(
            eq(gameParticipants.userId, currentUserId),
            or(eq(gameParticipants.role, "player"), eq(gameParticipants.role, "invited")),
          ),
        );

      visibilityConditionsForOr.push(
        and(eq(games.visibility, "private"), sql`${games.id} IN ${userGames}`) as SqlExpr,
      );
      visibilityConditionsForOr.push(eq(games.ownerId, currentUserId));

      const isConnectedSql = sql<boolean>`(
        EXISTS (
          SELECT 1 FROM ${userFollows} uf
          WHERE uf.follower_id = ${currentUserId} AND uf.following_id = ${games.ownerId}
        ) OR EXISTS (
          SELECT 1 FROM ${userFollows} uf2
          WHERE uf2.follower_id = ${games.ownerId} AND uf2.following_id = ${currentUserId}
        )
      )`;
      const isBlockedSql = sql<boolean>`EXISTS (
        SELECT 1 FROM ${userBlocks} ub
        WHERE (ub.blocker_id = ${currentUserId} AND ub.blockee_id = ${games.ownerId})
           OR (ub.blocker_id = ${games.ownerId} AND ub.blockee_id = ${currentUserId})
      )`;
      visibilityConditionsForOr.push(
        and(
          eq(games.visibility, "protected"),
          sql`${isConnectedSql} AND NOT (${isBlockedSql})`,
        ) as SqlExpr,
      );
    }

    const visibilityConditionsForOrWithStatus = visibilityConditionsForOr.map(
      (condition) =>
        statusFilterCondition
          ? (and(statusFilterCondition, condition) as SqlExpr)
          : condition,
    );

    const finalWhereClause = and(
      ...(otherBaseConditions.length > 0 ? otherBaseConditions : [sql`true`]),
      or(...visibilityConditionsForOrWithStatus),
    );

    const result: GameQueryResultRow[] = await (db as DbLike)
      .select<GameQueryResultRow>({
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
        owner: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          uploadedAvatarPath: user.uploadedAvatarPath,
          gmRating: user.gmRating,
        },
        gameSystemName: gameSystems.name,
        gameSystemSlug: gameSystems.slug,
        gameSystemAveragePlayTime: gameSystems.averagePlayTime,
        gameSystemMinPlayers: gameSystems.minPlayers,
        gameSystemMaxPlayers: gameSystems.maxPlayers,
        systemHeroUrl: heroImage.secureUrl,
        systemCategories: sql<
          string[]
        >`array_remove(array_agg(distinct ${category.name}), NULL)`,
        participantCount: sql<number>`count(distinct ${gameParticipants.userId})::int`,
      })
      .from(games)
      .innerJoin(user, eq(games.ownerId, user.id))
      .innerJoin(gameSystems, eq(games.gameSystemId, gameSystems.id))
      .leftJoin(gameParticipants, eq(gameParticipants.gameId, games.id))
      .leftJoin(heroImage, eq(heroImage.id, gameSystems.heroImageId))
      .leftJoin(systemCategoryLink, eq(systemCategoryLink.gameSystemId, gameSystems.id))
      .leftJoin(category, eq(category.id, systemCategoryLink.categoryId))
      .where(finalWhereClause)
      .groupBy(games.id, user.id, gameSystems.id, heroImage.id, heroImage.secureUrl)
      .orderBy(games.dateTime);

    return { success: true, data: result.map(mapGameRowToListItem) };
  } catch (error) {
    console.error("Error listing games:", error);
    return {
      success: false,
      errors: [{ code: "DATABASE_ERROR", message: "Failed to list games" }],
    };
  }
}

export const listGames = createServerFn({ method: "POST" })
  .validator(listGamesSchema.parse)
  .handler(async ({ data = {} }): Promise<OperationResult<GameListItem[]>> => {
    const { getDb, getCurrentUser } = await getServerDeps();
    const db = await getDb();
    const currentUser = await getCurrentUser();
    return listGamesImpl(db, currentUser?.id, data.filters);
  });

export const listGamesWithCount = createServerFn({ method: "POST" })
  .validator(
    z.object({
      // Accept filters without relying on transformed schema shape
      filters: z.any().optional(),
      page: z.coerce.number().int().min(1).optional(),
      pageSize: z.coerce.number().int().min(1).max(100).optional(),
    }).parse,
  )
  .handler(
    async ({
      data = {},
    }): Promise<OperationResult<{ items: GameListItem[]; totalCount: number }>> => {
      const { getDb, getCurrentUser } = await getServerDeps();
      const db = await getDb();
      const currentUser = await getCurrentUser();
      const page = Math.max(1, data.page ?? 1);
      const pageSize = Math.min(100, Math.max(1, data.pageSize ?? 20));
      return listGamesWithCountImpl(db, currentUser?.id, data.filters, page, pageSize);
    },
  );

/**
 * List games with pagination and total count (does not change existing listGames signature)
 */
export async function listGamesWithCountImpl(
  db: unknown,
  currentUserId: string | null | undefined,
  filters: z.infer<typeof listGamesSchema>["filters"] | undefined,
  page = 1,
  pageSize = 20,
): Promise<OperationResult<{ items: GameListItem[]; totalCount: number }>> {
  try {
    const {
      and,
      eq,
      gte,
      lte,
      or,
      sql,
      gameParticipants,
      games,
      gameSystems,
      user,
      mediaAssets,
      gameSystemToCategory,
      gameSystemCategories,
    } = await getServerDeps();
    const heroImage = alias(mediaAssets, "heroImage");
    const systemCategoryLink = alias(gameSystemToCategory, "systemCategoryLink");
    const category = alias(gameSystemCategories, "category");
    const statusFilterCondition: SqlExpr | null = filters?.status
      ? (eq(games.status, filters.status) as SqlExpr)
      : null;

    const otherBaseConditions: SqlExpr[] = [];
    if (filters?.gameSystemId)
      otherBaseConditions.push(eq(games.gameSystemId, filters.gameSystemId));
    if (filters?.dateFrom)
      otherBaseConditions.push(gte(games.dateTime, new Date(filters.dateFrom)));
    if (filters?.dateTo)
      otherBaseConditions.push(lte(games.dateTime, new Date(filters.dateTo)));
    if (filters?.searchTerm) {
      const searchTerm = `%${filters.searchTerm.toLowerCase()}%`;
      otherBaseConditions.push(
        or(
          sql`lower(${games.description}) LIKE ${searchTerm}`,
          sql`lower(${games.language}) LIKE ${searchTerm}`,
        ) as SqlExpr,
      );
    }

    const visibilityConditionsForOr: SqlExpr[] = [];
    visibilityConditionsForOr.push(eq(games.visibility, "public"));

    if (currentUserId) {
      const { userFollows, userBlocks } = await import("~/db/schema");
      const userGames = (db as DbLike)
        .select({ gameId: gameParticipants.gameId })
        .from(gameParticipants)
        .where(
          and(
            eq(gameParticipants.userId, currentUserId),
            or(eq(gameParticipants.role, "player"), eq(gameParticipants.role, "invited")),
          ),
        );

      visibilityConditionsForOr.push(
        and(eq(games.visibility, "private"), sql`${games.id} IN ${userGames}`) as SqlExpr,
      );
      visibilityConditionsForOr.push(eq(games.ownerId, currentUserId));

      const isConnectedSql = sql<boolean>`(
        EXISTS (
          SELECT 1 FROM ${userFollows} uf
          WHERE uf.follower_id = ${currentUserId} AND uf.following_id = ${games.ownerId}
        ) OR EXISTS (
          SELECT 1 FROM ${userFollows} uf2
          WHERE uf2.follower_id = ${games.ownerId} AND uf2.following_id = ${currentUserId}
        )
      )`;
      const isBlockedSql = sql<boolean>`EXISTS (
        SELECT 1 FROM ${userBlocks} ub
        WHERE (ub.blocker_id = ${currentUserId} AND ub.blockee_id = ${games.ownerId})
           OR (ub.blocker_id = ${games.ownerId} AND ub.blockee_id = ${currentUserId})
      )`;
      visibilityConditionsForOr.push(
        and(
          eq(games.visibility, "protected"),
          sql`${isConnectedSql} AND NOT (${isBlockedSql})`,
        ) as SqlExpr,
      );
    }

    const visibilityConditionsForOrWithStatus = visibilityConditionsForOr.map(
      (condition) =>
        statusFilterCondition
          ? (and(statusFilterCondition, condition) as SqlExpr)
          : condition,
    );

    const finalWhereClause = and(
      ...(otherBaseConditions.length > 0 ? otherBaseConditions : [sql`true`]),
      or(...visibilityConditionsForOrWithStatus),
    );

    const offset = Math.max(0, (Math.max(1, page) - 1) * Math.max(1, pageSize));

    // Fetch all matching rows, then compute count and slice to page
    const allRows: GameQueryResultRow[] = await (db as DbLike)
      .select<GameQueryResultRow>({
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
        owner: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          uploadedAvatarPath: user.uploadedAvatarPath,
          gmRating: user.gmRating,
        },
        gameSystemName: gameSystems.name,
        gameSystemSlug: gameSystems.slug,
        gameSystemAveragePlayTime: gameSystems.averagePlayTime,
        gameSystemMinPlayers: gameSystems.minPlayers,
        gameSystemMaxPlayers: gameSystems.maxPlayers,
        systemHeroUrl: heroImage.secureUrl,
        systemCategories: sql<
          string[]
        >`array_remove(array_agg(distinct ${category.name}), NULL)`,
        participantCount: sql<number>`count(distinct ${gameParticipants.userId})::int`,
      })
      .from(games)
      .innerJoin(user, eq(games.ownerId, user.id))
      .innerJoin(gameSystems, eq(games.gameSystemId, gameSystems.id))
      .leftJoin(gameParticipants, eq(gameParticipants.gameId, games.id))
      .leftJoin(heroImage, eq(heroImage.id, gameSystems.heroImageId))
      .leftJoin(systemCategoryLink, eq(systemCategoryLink.gameSystemId, gameSystems.id))
      .leftJoin(category, eq(category.id, systemCategoryLink.categoryId))
      .where(finalWhereClause)
      .groupBy(games.id, user.id, gameSystems.id, heroImage.id, heroImage.secureUrl)
      .orderBy(games.dateTime)
      .then((rows) => rows as unknown as GameQueryResultRow[]);

    const count = allRows.length;
    const paged = allRows.slice(offset, offset + Math.max(1, pageSize));
    return {
      success: true,
      data: { items: paged.map(mapGameRowToListItem), totalCount: count },
    };
  } catch (error) {
    console.error("Error listing games with count:", error);
    return {
      success: false,
      errors: [{ code: "DATABASE_ERROR", message: "Failed to list games" }],
    };
  }
}

/**
 * Search games by name or description
 */
export const searchGames = createServerFn({ method: "POST" })
  .validator(searchGamesSchema.parse)
  .handler(async ({ data = {} }): Promise<OperationResult<GameListItem[]>> => {
    try {
      const {
        getDb,
        getCurrentUser,
        userBlocks,
        games,
        user,
        gameSystems,
        gameParticipants,
        and,
        eq,
        ilike,
        sql,
        mediaAssets,
        gameSystemToCategory,
        gameSystemCategories,
      } = await getServerDeps();
      const db = await getDb();
      const currentUser = await getCurrentUser();
      const currentUserId = currentUser?.id;
      const searchTerm = `%${data.query}%`;

      const heroImage = alias(mediaAssets, "heroImage");
      const systemCategoryLink = alias(gameSystemToCategory, "systemCategoryLink");
      const category = alias(gameSystemCategories, "category");

      const result: GameQueryResultRow[] = await (db as DbLike)
        .select<GameQueryResultRow>({
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
          owner: {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            uploadedAvatarPath: user.uploadedAvatarPath,
            gmRating: user.gmRating,
          },
          gameSystemName: gameSystems.name,
          gameSystemSlug: gameSystems.slug,
          gameSystemAveragePlayTime: gameSystems.averagePlayTime,
          gameSystemMinPlayers: gameSystems.minPlayers,
          gameSystemMaxPlayers: gameSystems.maxPlayers,
          systemHeroUrl: heroImage.secureUrl,
          systemCategories: sql<
            string[]
          >`array_remove(array_agg(distinct ${category.name}), NULL)`,
          participantCount: sql<number>`count(distinct ${gameParticipants.userId})::int`,
        })
        .from(games)
        .innerJoin(user, eq(games.ownerId, user.id))
        .innerJoin(gameSystems, eq(games.gameSystemId, gameSystems.id))
        .leftJoin(gameParticipants, eq(gameParticipants.gameId, games.id))
        .leftJoin(heroImage, eq(heroImage.id, gameSystems.heroImageId))
        .leftJoin(systemCategoryLink, eq(systemCategoryLink.gameSystemId, gameSystems.id))
        .leftJoin(category, eq(category.id, systemCategoryLink.categoryId))
        .where(() => {
          const base = and(
            eq(games.visibility, "public"),
            ilike(games.description, searchTerm),
          );
          if (!currentUserId) return base;
          const blockedSql = sql<boolean>`EXISTS (
            SELECT 1 FROM ${userBlocks} ub
            WHERE (ub.blocker_id = ${currentUserId} AND ub.blockee_id = ${games.ownerId})
               OR (ub.blocker_id = ${games.ownerId} AND ub.blockee_id = ${currentUserId})
          )`;
          return and(base, sql`NOT (${blockedSql})`);
        })
        .groupBy(games.id, user.id, gameSystems.id, heroImage.id, heroImage.secureUrl)
        .orderBy(games.dateTime)
        .limit(20);

      return {
        success: true,
        data: result.map(mapGameRowToListItem),
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
    }): Promise<
      OperationResult<
        Array<{
          id: string;
          name: string;
          email: string;
          image: string | null;
          uploadedAvatarPath: string | null;
        }>
      >
    > => {
      try {
        const { getDb, user, or, ilike } = await getServerDeps();
        const db = await getDb();
        const searchTerm = `%${data.query}%`;

        const users = await db
          .select({
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            uploadedAvatarPath: user.uploadedAvatarPath,
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
      const {
        getDb,
        eq,
        sql,
        and,
        gameParticipants,
        games,
        gameSystems,
        user,
        mediaAssets,
        gameSystemToCategory,
        gameSystemCategories,
      } = await getServerDeps();
      const db = await getDb();
      const heroImage = alias(mediaAssets, "heroImage");
      const systemCategoryLink = alias(gameSystemToCategory, "systemCategoryLink");
      const category = alias(gameSystemCategories, "category");

      const conditions = [eq(games.campaignId, data.campaignId)];

      if (data.status) {
        conditions.push(eq(games.status, data.status));
      }

      const result: GameQueryResultRow[] = await (db as DbLike)
        .select<GameQueryResultRow>({
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
          owner: {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            uploadedAvatarPath: user.uploadedAvatarPath,
            gmRating: user.gmRating,
          },
          gameSystemName: gameSystems.name,
          gameSystemSlug: gameSystems.slug,
          gameSystemAveragePlayTime: gameSystems.averagePlayTime,
          gameSystemMinPlayers: gameSystems.minPlayers,
          gameSystemMaxPlayers: gameSystems.maxPlayers,
          systemHeroUrl: heroImage.secureUrl,
          systemCategories: sql<
            string[]
          >`array_remove(array_agg(distinct ${category.name}), NULL)`,
          participantCount: sql<number>`count(distinct ${gameParticipants.userId})::int`,
        })
        .from(games)
        .innerJoin(user, eq(games.ownerId, user.id))
        .innerJoin(gameSystems, eq(games.gameSystemId, gameSystems.id))
        .leftJoin(gameParticipants, eq(gameParticipants.gameId, games.id))
        .leftJoin(heroImage, eq(heroImage.id, gameSystems.heroImageId))
        .leftJoin(systemCategoryLink, eq(systemCategoryLink.gameSystemId, gameSystems.id))
        .leftJoin(category, eq(category.id, systemCategoryLink.categoryId))
        .where(and(...conditions))
        .groupBy(games.id, user.id, gameSystems.id, heroImage.id, heroImage.secureUrl)
        .orderBy(games.dateTime);

      return {
        success: true,
        data: result.map(mapGameRowToListItem),
      };
    } catch (error) {
      console.error("Error listing game sessions by campaign ID:", error);
      return {
        success: false,
        errors: [{ code: "DATABASE_ERROR", message: "Failed to list game sessions" }],
      };
    }
  });

/**
 * Get pending applications for a specific game
 */
export const getGameApplications = createServerFn({ method: "POST" })
  .validator(getGameSchema.parse)
  .handler(async ({ data }): Promise<OperationResult<GameApplication[]>> => {
    try {
      const { getCurrentUser, findGameById, findPendingGameApplicationsByGameId } =
        await getServerDeps();
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
 * Get a single game application for a specific user
 */
export const getGameApplicationForUser = createServerFn({ method: "POST" })
  .validator(getGameApplicationForUserInputSchema.parse)
  .handler(async ({ data }): Promise<OperationResult<GameApplication | null>> => {
    try {
      const { getDb, and, eq, gameApplications } = await getServerDeps();
      const db = await getDb();
      const application = await db.query.gameApplications.findFirst({
        where: and(
          eq(gameApplications.gameId, data.gameId),
          eq(gameApplications.userId, data.userId),
        ),
        with: {
          user: { columns: { id: true, name: true, email: true } },
        },
      });

      return {
        success: true,
        data: application ? (application as GameApplication) : null,
      };
    } catch (error) {
      console.error("Error fetching game application for user:", error);
      return {
        success: false,
        errors: [{ code: "SERVER_ERROR", message: "Failed to fetch application" }],
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
      const { findGameParticipantsByGameId } = await getServerDeps();
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
