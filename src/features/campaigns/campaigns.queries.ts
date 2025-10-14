import { createServerFn, serverOnly } from "@tanstack/react-start";
import { type SQL } from "drizzle-orm";
import type {
  campaigns as campaignsTable,
  gameSystems as gameSystemsTable,
} from "~/db/schema";

import { z } from "zod";
import {
  locationSchema,
  minimumRequirementsSchema,
  safetyRulesSchema,
} from "~/shared/schemas/common";
import { OperationResult } from "~/shared/types/common";
import {
  getCampaignApplicationForUserInputSchema,
  getCampaignSchema,
  listCampaignsSchema,
  searchUsersForInvitationSchema,
} from "./campaigns.schemas";
import {
  CampaignApplication,
  CampaignListItem,
  CampaignParticipant,
  CampaignWithDetails,
} from "./campaigns.types";

const getServerDeps = serverOnly(async () => {
  const [drizzle, schema, serverHelpers, authQueries, campaignRepo] = await Promise.all([
    import("drizzle-orm"),
    import("~/db/schema"),
    import("~/db/server-helpers"),
    import("~/features/auth/auth.queries"),
    import("./campaigns.repository"),
  ]);
  return { ...drizzle, ...schema, ...serverHelpers, ...authQueries, ...campaignRepo };
});

type DbJoinChain<R> = {
  innerJoin: (a: unknown, b: unknown) => DbJoinChain<R>;
  leftJoin: (a: unknown, b: unknown) => DbJoinChain<R>;
  where: (cond: unknown) => DbWhereChain<R>;
};
type DbWhereChain<R> = {
  groupBy: (...cols: unknown[]) => Promise<R[]>;
  execute?: () => Promise<R[]>;
} & Partial<{
  limit: (value: number) => DbWhereChain<R>;
  offset: (value: number) => DbWhereChain<R>;
}>;
type DbFromChain<R> = {
  from: (t: unknown) => DbJoinChain<R>;
};
interface DbLike {
  select: <R>(projection: unknown) => DbFromChain<R>;
}

type CampaignFilters = z.infer<typeof listCampaignsSchema>["filters"] | undefined;
type SqlExpr = SQL<unknown>;

export type CampaignQueryDependencies = Awaited<ReturnType<typeof getServerDeps>>;

async function loadCampaignDeps(): Promise<CampaignQueryDependencies> {
  return getServerDeps();
}

function createRelationshipVisibilitySql(
  deps: Pick<
    CampaignQueryDependencies,
    "sql" | "userFollows" | "userBlocks" | "teamMembers"
  >,
  currentUserId: string,
  targetUserIdColumn: unknown,
) {
  const { sql, userFollows, userBlocks, teamMembers } = deps;
  const isConnectionOrTeammateSql = sql<boolean>`(
    EXISTS (
      SELECT 1 FROM ${userFollows} uf
      WHERE uf.follower_id = ${currentUserId} AND uf.following_id = ${targetUserIdColumn}
    ) OR EXISTS (
      SELECT 1 FROM ${userFollows} uf2
      WHERE uf2.follower_id = ${targetUserIdColumn} AND uf2.following_id = ${currentUserId}
    ) OR EXISTS (
      SELECT 1
      FROM ${teamMembers} tm_self
      INNER JOIN ${teamMembers} tm_target ON tm_self.team_id = tm_target.team_id
      WHERE tm_self.user_id = ${currentUserId}
        AND tm_self.status = 'active'
        AND tm_target.user_id = ${targetUserIdColumn}
        AND tm_target.status = 'active'
    )
  )`;
  const isBlockedSql = sql<boolean>`EXISTS (
    SELECT 1 FROM ${userBlocks} ub
    WHERE (ub.blocker_id = ${currentUserId} AND ub.blockee_id = ${targetUserIdColumn})
       OR (ub.blocker_id = ${targetUserIdColumn} AND ub.blockee_id = ${currentUserId})
  )`;
  return { isConnectionOrTeammateSql, isBlockedSql };
}

function applyPagination<R>(
  chain: DbWhereChain<R>,
  pagination?: { limit?: number; offset?: number },
): DbWhereChain<R> {
  if (!pagination) {
    return chain;
  }

  let result: DbWhereChain<R> = chain;
  if (
    typeof pagination.offset === "number" &&
    pagination.offset >= 0 &&
    typeof (result as { offset?: (value: number) => DbWhereChain<R> }).offset ===
      "function"
  ) {
    result = (result as Required<DbWhereChain<R>>).offset!(pagination.offset);
  }
  if (
    typeof pagination.limit === "number" &&
    pagination.limit > 0 &&
    typeof (result as { limit?: (value: number) => DbWhereChain<R> }).limit === "function"
  ) {
    result = (result as Required<DbWhereChain<R>>).limit!(pagination.limit);
  }
  return result;
}

function createCampaignSelection<R>(
  db: unknown,
  deps: CampaignQueryDependencies,
  finalWhereClause: SqlExpr,
  projection: unknown,
): DbWhereChain<R> {
  const { campaigns, user, gameSystems, campaignParticipants, eq } = deps;
  return (db as DbLike)
    .select<R>(projection)
    .from(campaigns)
    .innerJoin(user, eq(campaigns.ownerId, user.id))
    .innerJoin(gameSystems, eq(campaigns.gameSystemId, gameSystems.id))
    .leftJoin(campaignParticipants, eq(campaignParticipants.campaignId, campaigns.id))
    .where(finalWhereClause);
}

function buildCampaignWhereClause(
  deps: CampaignQueryDependencies,
  db: unknown,
  currentUserId: string | null | undefined,
  filters: CampaignFilters,
): SqlExpr {
  const { and, eq, ilike, or, sql, campaigns, campaignParticipants } = deps;

  const baseConditions: SqlExpr[] = [];
  if (filters?.status) {
    baseConditions.push(eq(campaigns.status, filters.status));
  }
  if (filters?.searchTerm) {
    const searchTerm = `%${filters.searchTerm.toLowerCase()}%`;
    baseConditions.push(
      or(
        ilike(campaigns.name, searchTerm),
        ilike(campaigns.description, searchTerm),
      ) as SqlExpr,
    );
  }

  if (filters?.userRole && currentUserId) {
    if (filters.userRole === "owner") {
      baseConditions.push(eq(campaigns.ownerId, currentUserId) as SqlExpr);
    } else {
      baseConditions.push(
        sql`EXISTS (
          SELECT 1 FROM ${campaignParticipants} cp
          WHERE cp.campaign_id = ${campaigns.id}
          AND cp.user_id = ${currentUserId}
          AND cp.role = ${filters.userRole}
        )` as SqlExpr,
      );
    }
  }

  const visibilityConditions: SqlExpr[] = [eq(campaigns.visibility, "public")];

  if (currentUserId) {
    const userCampaigns = (db as DbLike)
      .select({ campaignId: campaignParticipants.campaignId })
      .from(campaignParticipants)
      .where(eq(campaignParticipants.userId, currentUserId));

    visibilityConditions.push(eq(campaigns.ownerId, currentUserId));
    visibilityConditions.push(
      and(
        eq(campaigns.visibility, "private"),
        sql`${campaigns.id} IN ${userCampaigns}` as SqlExpr,
      ) as SqlExpr,
    );

    const { isConnectionOrTeammateSql, isBlockedSql } = createRelationshipVisibilitySql(
      deps,
      currentUserId,
      campaigns.ownerId,
    );
    visibilityConditions.push(
      and(
        eq(campaigns.visibility, "protected"),
        sql`${isConnectionOrTeammateSql} AND NOT (${isBlockedSql})` as SqlExpr,
      ) as SqlExpr,
    );
  }

  const visibilityClause = or(...visibilityConditions) as SqlExpr;
  const combinedConditions =
    baseConditions.length > 0 ? baseConditions : [sql`true` as SqlExpr];
  combinedConditions.push(visibilityClause);
  return and(...combinedConditions) as SqlExpr;
}

async function resolveCampaignQueryContext(
  db: unknown,
  currentUserId: string | null | undefined,
  filters: CampaignFilters,
) {
  const deps = await loadCampaignDeps();
  const finalWhereClause = buildCampaignWhereClause(deps, db, currentUserId, filters);
  return { deps, finalWhereClause };
}

function mapCampaignRowToListItem(
  row: CampaignQueryResultRow,
  currentUserId?: string | null,
): CampaignListItem {
  return {
    ...row.campaign,
    owner: row.owner,
    participantCount: row.participantCount,
    gameSystem: row.gameSystem,
    location: row.campaign.location as z.infer<typeof locationSchema>,
    minimumRequirements: row.campaign.minimumRequirements as z.infer<
      typeof minimumRequirementsSchema
    >,
    safetyRules: row.campaign.safetyRules as z.infer<typeof safetyRulesSchema>,
    sessionZeroData: row.campaign.sessionZeroData ?? null,
    campaignExpectations: row.campaign.campaignExpectations ?? null,
    tableExpectations: row.campaign.tableExpectations ?? null,
    characterCreationOutcome: row.campaign.characterCreationOutcome ?? null,
    userRole:
      currentUserId && row.campaign.ownerId === currentUserId
        ? { role: "owner", status: "approved" as const }
        : null,
  };
}

async function fetchCampaignRows(
  db: unknown,
  deps: CampaignQueryDependencies,
  finalWhereClause: SqlExpr,
  pagination?: { limit?: number; offset?: number },
) {
  const { campaigns, user, campaignParticipants, gameSystems, sql } = deps;
  const selection = {
    campaign: campaigns,
    owner: {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      uploadedAvatarPath: user.uploadedAvatarPath,
      gmRating: user.gmRating,
    },
    participantCount: sql<number>`count(distinct ${campaignParticipants.userId})::int`,
    gameSystem: gameSystems,
  };

  const rows = await applyPagination(
    createCampaignSelection<CampaignQueryResultRow>(
      db,
      deps,
      finalWhereClause,
      selection,
    ),
    pagination,
  ).groupBy(campaigns.id, user.id, gameSystems.id);

  return rows as unknown as CampaignQueryResultRow[];
}

async function fetchCampaignCount(
  db: unknown,
  deps: CampaignQueryDependencies,
  finalWhereClause: SqlExpr,
) {
  const { campaigns, sql } = deps;
  const countSelection = (db as DbLike)
    .select<{ totalCount: number }>({
      totalCount: sql<number>`count(distinct ${campaigns.id})::int`,
    })
    .from(campaigns)
    .where(finalWhereClause);

  const countQuery = countSelection as
    | { execute: () => Promise<{ totalCount: number }[]> }
    | { groupBy: (...args: unknown[]) => Promise<{ totalCount: number }[]> }
    | Promise<{ totalCount: number }[]>;

  let countResult: { totalCount: number }[] | undefined;

  if ("execute" in countQuery && typeof countQuery.execute === "function") {
    countResult = await countQuery.execute();
  } else if ("groupBy" in countQuery && typeof countQuery.groupBy === "function") {
    countResult = await countQuery.groupBy();
  } else {
    countResult = await (countQuery as Promise<{ totalCount: number }[]>);
  }

  const [{ totalCount } = { totalCount: 0 }] = countResult ?? [{ totalCount: 0 }];

  return totalCount ?? 0;
}

export const getCampaign = createServerFn({ method: "POST" })
  .validator(getCampaignSchema.parse)
  .handler(async ({ data }): Promise<OperationResult<CampaignWithDetails | null>> => {
    try {
      const { findCampaignById } = await loadCampaignDeps();
      const campaign = await findCampaignById(data.id);

      if (!campaign) {
        return {
          success: false,
          errors: [{ code: "NOT_FOUND", message: "Campaign not found" }],
        };
      }

      return {
        success: true,
        data: campaign as CampaignWithDetails,
      };
    } catch (error) {
      console.error("Error fetching campaign:", error);
      return {
        success: false,
        errors: [{ code: "DATABASE_ERROR", message: "Failed to fetch campaign" }],
      };
    }
  });

type CampaignQueryResultRow = {
  campaign: typeof campaignsTable.$inferSelect;
  owner: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    uploadedAvatarPath: string | null;
    gmRating: number | null;
  };
  participantCount: number;
  gameSystem: typeof gameSystemsTable.$inferSelect;
};

export async function listCampaignsImpl(
  db: unknown,
  currentUserId: string | null | undefined,
  filters: CampaignFilters,
): Promise<OperationResult<CampaignListItem[]>> {
  try {
    const { deps, finalWhereClause } = await resolveCampaignQueryContext(
      db,
      currentUserId,
      filters,
    );

    const rows = await fetchCampaignRows(db, deps, finalWhereClause);

    return {
      success: true,
      data: rows.map((row) => mapCampaignRowToListItem(row, currentUserId)),
    };
  } catch (error) {
    console.error("Error listing campaigns:", error);
    return {
      success: false,
      errors: [{ code: "DATABASE_ERROR", message: "Failed to list campaigns" }],
    };
  }
}

export async function listCampaignsInternal(
  data:
    | { filters?: z.infer<typeof listCampaignsSchema>["filters"] | undefined }
    | undefined,
): Promise<OperationResult<CampaignListItem[]>> {
  const { getDb, getCurrentUser } = await loadCampaignDeps();
  const [db, currentUser] = await Promise.all([getDb(), getCurrentUser()]);
  return listCampaignsImpl(db, currentUser?.id, data?.filters);
}

export async function listCampaignsWithCountImpl(
  db: unknown,
  currentUserId: string | null | undefined,
  filters: CampaignFilters,
  page = 1,
  pageSize = 20,
): Promise<OperationResult<{ items: CampaignListItem[]; totalCount: number }>> {
  try {
    const { deps, finalWhereClause } = await resolveCampaignQueryContext(
      db,
      currentUserId,
      filters,
    );

    const safePage = Math.max(1, page);
    const safePageSize = Math.max(1, Math.min(100, pageSize));
    const offset = (safePage - 1) * safePageSize;

    const [rows, totalCount] = await Promise.all([
      fetchCampaignRows(db, deps, finalWhereClause, {
        offset,
        limit: safePageSize,
      }),
      fetchCampaignCount(db, deps, finalWhereClause),
    ]);

    const items = rows.map((row) => mapCampaignRowToListItem(row, currentUserId));

    return { success: true, data: { items, totalCount } };
  } catch (error) {
    console.error("Error listing campaigns with count:", error);
    return {
      success: false,
      errors: [{ code: "DATABASE_ERROR", message: "Failed to list campaigns" }],
    };
  }
}

export const listCampaignsWithCount = createServerFn({ method: "POST" })
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
    }): Promise<OperationResult<{ items: CampaignListItem[]; totalCount: number }>> => {
      const { getDb, getCurrentUser } = await loadCampaignDeps();
      const [db, currentUser] = await Promise.all([getDb(), getCurrentUser()]);
      const page = Math.max(1, data.page ?? 1);
      const pageSize = Math.min(100, Math.max(1, data.pageSize ?? 20));
      return listCampaignsWithCountImpl(
        db,
        currentUser?.id,
        data.filters,
        page,
        pageSize,
      );
    },
  );

export const getCampaignApplications = createServerFn({ method: "POST" })
  .validator(getCampaignSchema.parse)
  .handler(async ({ data }): Promise<OperationResult<CampaignApplication[]>> => {
    try {
      const {
        getCurrentUser,
        findCampaignById,
        findPendingCampaignApplicationsByCampaignId,
      } = await loadCampaignDeps();
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        return {
          success: false,
          errors: [{ code: "AUTH_ERROR", message: "Not authenticated" }],
        };
      }

      const campaign = await findCampaignById(data.id);

      if (!campaign || campaign.ownerId !== currentUser.id) {
        return {
          success: false,
          errors: [
            {
              code: "AUTH_ERROR",
              message: "Not authorized to view applications for this campaign",
            },
          ],
        };
      }

      const applications = await findPendingCampaignApplicationsByCampaignId(data.id);

      return { success: true, data: applications as CampaignApplication[] };
    } catch (error) {
      console.error("Error fetching campaign applications:", error);
      return {
        success: false,
        errors: [{ code: "SERVER_ERROR", message: "Failed to fetch applications" }],
      };
    }
  });

export const getCampaignParticipants = createServerFn({ method: "POST" })
  .validator(getCampaignSchema.parse)
  .handler(async ({ data }): Promise<OperationResult<CampaignParticipant[]>> => {
    try {
      const { findCampaignParticipantsByCampaignId } = await loadCampaignDeps();
      const participants = await findCampaignParticipantsByCampaignId(data.id);
      return { success: true, data: participants as CampaignParticipant[] };
    } catch (error) {
      console.error("Error fetching campaign participants:", error);
      return {
        success: false,
        errors: [{ code: "SERVER_ERROR", message: "Failed to fetch participants" }],
      };
    }
  });

/**
 * Get a single campaign application for a specific user
 */
export const getCampaignApplicationForUser = createServerFn({ method: "POST" })
  .validator(getCampaignApplicationForUserInputSchema.parse)
  .handler(async ({ data }): Promise<OperationResult<CampaignApplication | null>> => {
    try {
      const { getDb, and, eq, campaignApplications } = await loadCampaignDeps();
      const db = await getDb();
      const application = await db.query.campaignApplications.findFirst({
        where: and(
          eq(campaignApplications.campaignId, data.campaignId),
          eq(campaignApplications.userId, data.userId),
        ),
        with: {
          user: { columns: { id: true, name: true, email: true } },
        },
      });

      return {
        success: true,
        data: application ? (application as CampaignApplication) : null,
      };
    } catch (error) {
      console.error("Error fetching campaign application for user:", error);
      return {
        success: false,
        errors: [{ code: "SERVER_ERROR", message: "Failed to fetch application" }],
      };
    }
  });

export const searchUsersForInvitation = createServerFn({ method: "POST" })
  .validator(searchUsersForInvitationSchema.parse)
  .handler(
    async ({
      data,
    }): Promise<OperationResult<Array<{ id: string; name: string; email: string }>>> => {
      try {
        const deps = await loadCampaignDeps();
        return searchUsersForInvitationImpl(deps, data.query);
      } catch (error) {
        console.error("Error searching users for invitation:", error);
        return {
          success: false,
          errors: [{ code: "SERVER_ERROR", message: "Failed to search users" }],
        };
      }
    },
  );

type SearchInvitationDependencies = Pick<
  CampaignQueryDependencies,
  | "getDb"
  | "getCurrentUser"
  | "user"
  | "or"
  | "ilike"
  | "and"
  | "ne"
  | "sql"
  | "userFollows"
  | "userBlocks"
  | "teamMembers"
>;

export async function searchUsersForInvitationImpl(
  deps: SearchInvitationDependencies,
  query: string,
): Promise<OperationResult<Array<{ id: string; name: string; email: string }>>> {
  const {
    getDb,
    getCurrentUser,
    user,
    or,
    ilike,
    and,
    ne,
    sql,
    userFollows,
    userBlocks,
    teamMembers,
  } = deps;
  const [db, currentUser] = await Promise.all([getDb(), getCurrentUser()]);
  if (!currentUser?.id) {
    return { success: true, data: [] };
  }

  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return { success: true, data: [] };
  }

  const searchTerm = `%${trimmedQuery}%`;

  const { isConnectionOrTeammateSql, isBlockedSql } = createRelationshipVisibilitySql(
    { sql, userFollows, userBlocks, teamMembers },
    currentUser.id,
    user.id,
  );

  const users = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
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
}
