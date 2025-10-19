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

import { and, type SQL } from "drizzle-orm";
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
  gameParticipants as participantsTable,
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

type DbQueryResult<R> = Promise<R[]> & {
  limit: (n: number) => DbQueryResult<R>;
  offset: (n: number) => DbQueryResult<R>;
};
type DbOrderable<R> = { orderBy: (...args: unknown[]) => DbQueryResult<R> };
type DbGroupChain<R> = { groupBy: (...cols: unknown[]) => DbOrderable<R> };
type DbWhereResult<R> = DbGroupChain<R> & Promise<R[]>;
type DbWhereChain<R> = {
  where: (cond: unknown) => DbWhereResult<R>;
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
  // User's role in this game
  userRole: typeof participantsTable.$inferSelect.role | null;
  userStatus: typeof participantsTable.$inferSelect.status | null;
}

function mapGameRowToListItem(
  row: GameQueryResultRow,
  currentUserId?: string | null,
): GameListItem {
  const {
    gameSystemName,
    gameSystemSlug,
    gameSystemAveragePlayTime,
    gameSystemMinPlayers,
    gameSystemMaxPlayers,
    systemHeroUrl,
    systemCategories,
    userRole,
    userStatus,
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
    userRole:
      currentUserId && row.ownerId === currentUserId
        ? { role: "owner", status: "approved" as const }
        : userRole && userStatus
          ? { role: userRole, status: userStatus }
          : null,
  };
}

type GameListVisibilityScope = "allAccessible" | "publicOnly";

interface GameListQueryOptions {
  visibilityScope?: GameListVisibilityScope;
  limit?: number;
}

async function createGameListQueryContext(
  db: unknown,
  currentUserId: string | null | undefined,
  filters: z.infer<typeof listGamesSchema>["filters"] | undefined,
  options: GameListQueryOptions = {},
) {
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
  const currentUserParticipant = alias(gameParticipants, "currentUserParticipant");
  const allParticipants = alias(gameParticipants, "allParticipants");

  const visibilityScope = options.visibilityScope ?? "allAccessible";
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

  if (filters?.userRole && currentUserId) {
    if (filters.userRole === "owner") {
      otherBaseConditions.push(eq(games.ownerId, currentUserId) as SqlExpr);
    } else {
      otherBaseConditions.push(
        sql`EXISTS (
          SELECT 1 FROM ${gameParticipants} gp
          WHERE gp.game_id = ${games.id}
          AND gp.user_id = ${currentUserId}
          AND gp.role = ${filters.userRole}
        )` as SqlExpr,
      );
    }
  }

  const visibilityConditions: SqlExpr[] = [eq(games.visibility, "public") as SqlExpr];

  if (currentUserId) {
    const { userFollows, userBlocks, teamMembers } = await import("~/db/schema");

    const isBlockedSql = sql<boolean>`EXISTS (
      SELECT 1 FROM ${userBlocks} ub
      WHERE (ub.blocker_id = ${currentUserId} AND ub.blockee_id = ${games.ownerId})
         OR (ub.blocker_id = ${games.ownerId} AND ub.blockee_id = ${currentUserId})
    )`;

    if (visibilityScope !== "publicOnly") {
      const userGames = (db as DbLike)
        .select({ gameId: gameParticipants.gameId })
        .from(gameParticipants)
        .where(
          and(
            eq(gameParticipants.userId, currentUserId),
            or(eq(gameParticipants.role, "player"), eq(gameParticipants.role, "invited")),
          ),
        );

      visibilityConditions.push(
        and(eq(games.visibility, "private"), sql`${games.id} IN ${userGames}`) as SqlExpr,
      );
      visibilityConditions.push(eq(games.ownerId, currentUserId) as SqlExpr);

      const isConnectionOrTeammateSql = sql<boolean>`(
        EXISTS (
          SELECT 1 FROM ${userFollows} uf
          WHERE uf.follower_id = ${currentUserId} AND uf.following_id = ${games.ownerId}
        ) OR EXISTS (
          SELECT 1 FROM ${userFollows} uf2
          WHERE uf2.follower_id = ${games.ownerId} AND uf2.following_id = ${currentUserId}
        ) OR EXISTS (
          SELECT 1
          FROM ${teamMembers} tm_self
          INNER JOIN ${teamMembers} tm_target ON tm_self.team_id = tm_target.team_id
          WHERE tm_self.user_id = ${currentUserId}
            AND tm_self.status = 'active'
            AND tm_target.user_id = ${games.ownerId}
            AND tm_target.status = 'active'
        )
      )`;

      visibilityConditions.push(
        and(
          eq(games.visibility, "protected"),
          sql`${isConnectionOrTeammateSql} AND NOT (${isBlockedSql})`,
        ) as SqlExpr,
      );
    }

    otherBaseConditions.push(sql`NOT (${isBlockedSql})` as SqlExpr);
  }

  const visibilityConditionsWithStatus = visibilityConditions.map((condition) =>
    statusFilterCondition
      ? (and(statusFilterCondition, condition) as SqlExpr)
      : condition,
  );

  const finalWhereClause = and(
    ...(otherBaseConditions.length > 0 ? otherBaseConditions : [sql`true`]),
    or(...visibilityConditionsWithStatus),
  );

  return {
    db: db as DbLike,
    games,
    user,
    gameSystems,
    gameParticipants,
    currentUserParticipant,
    allParticipants,
    heroImage,
    systemCategoryLink,
    category,
    finalWhereClause,
    currentUserId,
    eq,
    sql,
  };
}

type GameListQueryContext = Awaited<ReturnType<typeof createGameListQueryContext>>;

function buildGameListQuery(
  context: GameListQueryContext,
): DbQueryResult<GameQueryResultRow> {
  const {
    db,
    games,
    user,
    gameSystems,
    allParticipants,
    currentUserParticipant,
    heroImage,
    systemCategoryLink,
    category,
    finalWhereClause,
    eq,
    sql,
  } = context;

  // Build base selection fields
  const baseFields = {
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
    minimumRequirements: sql<z.infer<typeof minimumRequirementsSchema>>`
      ${games.minimumRequirements}
    `,
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
    systemCategories: sql<string[]>`
      array_remove(array_agg(distinct ${category.name}), NULL)
    `,
    participantCount: sql<number>`count(distinct ${allParticipants.userId})::int`,
  };

  // Add user-specific fields only if we have a current user
  let selectFields: GameQueryResultRow;
  if (context.currentUserId) {
    selectFields = {
      ...baseFields,
      userRole: sql<typeof participantsTable.$inferSelect.role | null>`
        CASE
          WHEN ${games.ownerId} = ${context.currentUserId} THEN 'owner'
          ELSE ${currentUserParticipant.role}
        END
      `,
      userStatus: sql<typeof participantsTable.$inferSelect.status | null>`
        CASE
          WHEN ${games.ownerId} = ${context.currentUserId} THEN 'approved'
          ELSE ${currentUserParticipant.status}
        END
      `,
    } as unknown as GameQueryResultRow;
  } else {
    selectFields = {
      ...baseFields,
      userRole: sql<typeof participantsTable.$inferSelect.role | null>`null`,
      userStatus: sql<typeof participantsTable.$inferSelect.status | null>`null`,
    } as unknown as GameQueryResultRow;
  }

  return db
    .select<GameQueryResultRow>(selectFields)
    .from(games)
    .innerJoin(user, eq(games.ownerId, user.id))
    .innerJoin(gameSystems, eq(games.gameSystemId, gameSystems.id))
    .leftJoin(
      currentUserParticipant,
      and(
        eq(currentUserParticipant.gameId, games.id),
        context.currentUserId
          ? eq(currentUserParticipant.userId, sql`${context.currentUserId}`)
          : sql`false`,
      ),
    )
    .leftJoin(allParticipants, eq(allParticipants.gameId, games.id))
    .leftJoin(heroImage, eq(heroImage.id, gameSystems.heroImageId))
    .leftJoin(systemCategoryLink, eq(systemCategoryLink.gameSystemId, gameSystems.id))
    .leftJoin(category, eq(category.id, systemCategoryLink.categoryId))
    .where(finalWhereClause)
    .groupBy(
      games.id,
      user.id,
      gameSystems.id,
      heroImage.id,
      heroImage.secureUrl,
      currentUserParticipant.role,
      currentUserParticipant.status,
    )
    .orderBy(games.dateTime);
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
  options: GameListQueryOptions = {},
): Promise<OperationResult<GameListItem[]>> {
  try {
    const context = await createGameListQueryContext(db, currentUserId, filters, options);
    let query = buildGameListQuery(context);
    if (
      typeof options.limit === "number" &&
      Number.isFinite(options.limit) &&
      options.limit > 0
    ) {
      query = query.limit(Math.floor(options.limit));
    }
    const rows = await query;
    return {
      success: true,
      data: rows.map((row) => mapGameRowToListItem(row, currentUserId)),
    };
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
    const safePage = Math.max(1, page);
    const safePageSize = Math.max(1, Math.min(100, pageSize));
    const offset = (safePage - 1) * safePageSize;

    const context = await createGameListQueryContext(db, currentUserId, filters);
    const rows = await buildGameListQuery(context).limit(safePageSize).offset(offset);

    const countResult = (await context.db
      .select({ value: context.sql<number>`count(distinct ${context.games.id})::int` })
      .from(context.games)
      .where(context.finalWhereClause)) as Array<{ value: number }>;

    const totalCount = countResult[0]?.value ?? 0;

    return {
      success: true,
      data: {
        items: rows.map((row) => mapGameRowToListItem(row, currentUserId)),
        totalCount,
      },
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
export async function searchGamesImpl(
  db: unknown,
  currentUserId: string | null | undefined,
  query: string,
): Promise<OperationResult<GameListItem[]>> {
  try {
    const trimmedQuery = query.trim();
    if (trimmedQuery.length < 3) {
      return { success: true, data: [] };
    }

    const result = await listGamesImpl(
      db,
      currentUserId,
      { searchTerm: trimmedQuery },
      { visibilityScope: "publicOnly", limit: 20 },
    );

    if (!result.success) {
      return result;
    }

    return {
      success: true,
      data: result.data.filter((game) => game.visibility === "public").slice(0, 20),
    };
  } catch (error) {
    console.error("Error searching games:", error);
    return {
      success: false,
      errors: [{ code: "SERVER_ERROR", message: "Failed to search games" }],
    };
  }
}

export const searchGames = createServerFn({ method: "POST" })
  .validator(searchGamesSchema.parse)
  .handler(async ({ data }): Promise<OperationResult<GameListItem[]>> => {
    const { getDb, getCurrentUser } = await getServerDeps();
    const db = await getDb();
    const currentUser = await getCurrentUser();
    return searchGamesImpl(db, currentUser?.id, data.query);
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
        const {
          getDb,
          user,
          or,
          ilike,
          and,
          ne,
          sql,
          userFollows,
          userBlocks,
          teamMembers,
          getCurrentUser,
        } = await getServerDeps();
        const db = await getDb();
        const currentUser = await getCurrentUser();
        if (!currentUser?.id) {
          return { success: true, data: [] };
        }

        const searchTerm = `%${data.query}%`;

        const isConnectionOrTeammateSql = sql<boolean>`(
          EXISTS (
            SELECT 1 FROM ${userFollows} uf
            WHERE uf.follower_id = ${currentUser.id} AND uf.following_id = ${user.id}
          ) OR EXISTS (
            SELECT 1 FROM ${userFollows} uf2
            WHERE uf2.follower_id = ${user.id} AND uf2.following_id = ${currentUser.id}
          ) OR EXISTS (
            SELECT 1
            FROM ${teamMembers} tm_self
            INNER JOIN ${teamMembers} tm_target ON tm_self.team_id = tm_target.team_id
            WHERE tm_self.user_id = ${currentUser.id}
              AND tm_self.status = 'active'
              AND tm_target.user_id = ${user.id}
              AND tm_target.status = 'active'
          )
        )`;

        const isBlockedSql = sql<boolean>`EXISTS (
          SELECT 1 FROM ${userBlocks} ub
          WHERE (ub.blocker_id = ${currentUser.id} AND ub.blockee_id = ${user.id})
             OR (ub.blocker_id = ${user.id} AND ub.blockee_id = ${currentUser.id})
        )`;

        const users = await db
          .select({
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            uploadedAvatarPath: user.uploadedAvatarPath,
          })
          .from(user)
          .where(
            and(
              ne(user.id, currentUser.id),
              or(ilike(user.name, searchTerm), ilike(user.email, searchTerm)),
              sql`${isConnectionOrTeammateSql}`,
              sql`NOT (${isBlockedSql})`,
            ),
          )
          .orderBy(user.name)
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
        getCurrentUser,
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
      const [db, currentUser] = await Promise.all([getDb(), getCurrentUser()]);
      const currentUserId = currentUser?.id;
      const heroImage = alias(mediaAssets, "heroImage");
      const systemCategoryLink = alias(gameSystemToCategory, "systemCategoryLink");
      const category = alias(gameSystemCategories, "category");

      const conditions = [eq(games.campaignId, data.campaignId)];

      if (data.status) {
        conditions.push(eq(games.status, data.status));
      }

      const result: GameQueryResultRow[] = await (db as unknown as DbLike)
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
        data: result.map((row) => mapGameRowToListItem(row, currentUserId)),
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
