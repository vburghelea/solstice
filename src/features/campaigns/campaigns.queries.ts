import { createServerFn, serverOnly } from "@tanstack/react-start";
import type { and } from "drizzle-orm";
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
  where: (cond: unknown) => DbGroupChain<R>;
};
type DbGroupChain<R> = {
  groupBy: (...cols: unknown[]) => Promise<R[]>;
};
type DbFromChain<R> = {
  from: (t: unknown) => {
    innerJoin: (a: unknown, b: unknown) => DbJoinChain<R>;
    leftJoin: (a: unknown, b: unknown) => DbJoinChain<R>;
    where: (cond: unknown) => DbGroupChain<R>;
  };
};
interface DbLike {
  select: <R>(projection: unknown) => DbFromChain<R>;
}

type SqlExpr = ReturnType<typeof and>;

export const getCampaign = createServerFn({ method: "POST" })
  .validator(getCampaignSchema.parse)
  .handler(async ({ data }): Promise<OperationResult<CampaignWithDetails | null>> => {
    try {
      const { findCampaignById } = await getServerDeps();
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
  filters: z.infer<typeof listCampaignsSchema>["filters"] | undefined,
): Promise<OperationResult<CampaignListItem[]>> {
  try {
    const {
      and,
      eq,
      ilike,
      or,
      sql,
      campaignParticipants,
      campaigns,
      gameSystems,
      user,
      userFollows,
      userBlocks,
    } = await getServerDeps();
    const statusFilterCondition = filters?.status
      ? eq(campaigns.status, filters.status)
      : null;

    const otherBaseConditions: SqlExpr[] = [];
    if (filters?.searchTerm) {
      const searchTerm = `%${filters.searchTerm.toLowerCase()}%`;
      otherBaseConditions.push(
        or(ilike(campaigns.name, searchTerm), ilike(campaigns.description, searchTerm)),
      );
    }

    const visibilityConditionsForOr: SqlExpr[] = [];
    visibilityConditionsForOr.push(eq(campaigns.visibility, "public"));

    if (currentUserId) {
      const userCampaigns = (db as DbLike)
        .select({ campaignId: campaignParticipants.campaignId })
        .from(campaignParticipants)
        .where(eq(campaignParticipants.userId, currentUserId));

      visibilityConditionsForOr.push(
        and(
          eq(campaigns.visibility, "private"),
          sql`${campaigns.id} IN ${userCampaigns}`,
        ),
      );
      visibilityConditionsForOr.push(eq(campaigns.ownerId, currentUserId));

      const isConnectedSql = sql<boolean>`(
        EXISTS (
          SELECT 1 FROM ${userFollows} uf
          WHERE uf.follower_id = ${currentUserId} AND uf.following_id = ${campaigns.ownerId}
        ) OR EXISTS (
          SELECT 1 FROM ${userFollows} uf2
          WHERE uf2.follower_id = ${campaigns.ownerId} AND uf2.following_id = ${currentUserId}
        )
      )`;
      const isBlockedSql = sql<boolean>`EXISTS (
        SELECT 1 FROM ${userBlocks} ub
        WHERE (ub.blocker_id = ${currentUserId} AND ub.blockee_id = ${campaigns.ownerId})
           OR (ub.blocker_id = ${campaigns.ownerId} AND ub.blockee_id = ${currentUserId})
      )`;
      visibilityConditionsForOr.push(
        and(
          eq(campaigns.visibility, "protected"),
          sql`${isConnectedSql} AND NOT (${isBlockedSql})`,
        ),
      );
    }

    const visibilityConditionsForOrWithStatus = visibilityConditionsForOr.map(
      (condition) =>
        statusFilterCondition ? and(statusFilterCondition, condition) : condition,
    );

    const finalWhereClause = and(
      ...(otherBaseConditions.length > 0 ? otherBaseConditions : [sql`true`]),
      or(...visibilityConditionsForOrWithStatus),
    );

    const rows = await (db as DbLike)
      .select<CampaignQueryResultRow>({
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
      })
      .from(campaigns)
      .innerJoin(user, eq(campaigns.ownerId, user.id))
      .innerJoin(gameSystems, eq(campaigns.gameSystemId, gameSystems.id))
      .leftJoin(campaignParticipants, eq(campaignParticipants.campaignId, campaigns.id))
      .where(finalWhereClause)
      .groupBy(campaigns.id, user.id, gameSystems.id);

    return {
      success: true,
      data: rows.map((r: CampaignQueryResultRow) => ({
        ...r.campaign,
        owner: r.owner,
        participantCount: r.participantCount,
        gameSystem: r.gameSystem,
        sessionZeroData: r.campaign.sessionZeroData ?? null,
        campaignExpectations: r.campaign.campaignExpectations ?? null,
        tableExpectations: r.campaign.tableExpectations ?? null,
        characterCreationOutcome: r.campaign.characterCreationOutcome ?? null,
      })) as CampaignListItem[],
    };
  } catch (error) {
    console.error("Error listing campaigns:", error);
    return {
      success: false,
      errors: [{ code: "DATABASE_ERROR", message: "Failed to list campaigns" }],
    };
  }
}

export const listCampaigns = createServerFn({ method: "POST" })
  .validator(listCampaignsSchema.parse)
  .handler(async ({ data = {} }): Promise<OperationResult<CampaignListItem[]>> => {
    return listCampaignsInternal(data);
  });

export async function listCampaignsInternal(
  data:
    | { filters?: z.infer<typeof listCampaignsSchema>["filters"] | undefined }
    | undefined,
): Promise<OperationResult<CampaignListItem[]>> {
  const { getDb, getCurrentUser } = await getServerDeps();
  const db = await getDb();
  const currentUser = await getCurrentUser();
  return listCampaignsImpl(db, currentUser?.id, data?.filters);
}

export async function listCampaignsWithCountImpl(
  db: unknown,
  currentUserId: string | null | undefined,
  filters: z.infer<typeof listCampaignsSchema>["filters"] | undefined,
  page = 1,
  pageSize = 20,
): Promise<OperationResult<{ items: CampaignListItem[]; totalCount: number }>> {
  try {
    const {
      and,
      eq,
      or,
      sql,
      campaignParticipants,
      campaigns,
      gameSystems,
      user,
      userFollows,
      userBlocks,
    } = await getServerDeps();
    const statusFilterCondition = filters?.status
      ? eq(campaigns.status, filters.status)
      : null;

    const otherBaseConditions: SqlExpr[] = [];
    // gameSystemId filter not currently exposed in schema; skip to align with types
    if (filters?.searchTerm) {
      const searchTerm = `%${(filters.searchTerm || "").toLowerCase()}%`;
      otherBaseConditions.push(sql`lower(${campaigns.description}) LIKE ${searchTerm}`);
    }

    const visibilityConditionsForOr: SqlExpr[] = [];
    visibilityConditionsForOr.push(eq(campaigns.visibility, "public"));

    if (currentUserId) {
      visibilityConditionsForOr.push(eq(campaigns.ownerId, currentUserId));

      const isConnectedSql = sql<boolean>`(
        EXISTS (
          SELECT 1 FROM ${userFollows} uf
          WHERE uf.follower_id = ${currentUserId} AND uf.following_id = ${campaigns.ownerId}
        ) OR EXISTS (
          SELECT 1 FROM ${userFollows} uf2
          WHERE uf2.follower_id = ${campaigns.ownerId} AND uf2.following_id = ${currentUserId}
        )
      )`;
      const isBlockedSql = sql<boolean>`EXISTS (
        SELECT 1 FROM ${userBlocks} ub
        WHERE (ub.blocker_id = ${currentUserId} AND ub.blockee_id = ${campaigns.ownerId})
           OR (ub.blocker_id = ${campaigns.ownerId} AND ub.blockee_id = ${currentUserId})
      )`;
      visibilityConditionsForOr.push(
        and(
          eq(campaigns.visibility, "protected"),
          sql`${isConnectedSql} AND NOT (${isBlockedSql})`,
        ),
      );
    }

    const visibilityConditionsForOrWithStatus = visibilityConditionsForOr.map(
      (condition) =>
        statusFilterCondition ? and(statusFilterCondition, condition) : condition,
    );

    const finalWhereClause = and(
      ...(otherBaseConditions.length > 0 ? otherBaseConditions : [sql`true`]),
      or(...visibilityConditionsForOrWithStatus),
    );

    const offset = Math.max(0, (Math.max(1, page) - 1) * Math.max(1, pageSize));

    const allRows = await (db as DbLike)
      .select<CampaignQueryResultRow>({
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
      })
      .from(campaigns)
      .innerJoin(user, eq(campaigns.ownerId, user.id))
      .innerJoin(gameSystems, eq(campaigns.gameSystemId, gameSystems.id))
      .leftJoin(campaignParticipants, eq(campaignParticipants.campaignId, campaigns.id))
      .where(finalWhereClause)
      .groupBy(campaigns.id, user.id, gameSystems.id)
      .then((rows) => rows as unknown as CampaignQueryResultRow[]);

    const count = allRows.length;
    const rows = allRows.slice(offset, offset + Math.max(1, pageSize));

    const items: CampaignListItem[] = rows.map((r) => ({
      ...r.campaign,
      owner: r.owner,
      participantCount: r.participantCount,
      gameSystem: r.gameSystem,
      // Ensure JSONB fields are typed correctly
      location: r.campaign.location as z.infer<typeof locationSchema>,
      minimumRequirements: r.campaign.minimumRequirements as z.infer<
        typeof minimumRequirementsSchema
      >,
      safetyRules: r.campaign.safetyRules as z.infer<typeof safetyRulesSchema>,
      sessionZeroData: r.campaign.sessionZeroData ?? null,
      campaignExpectations: r.campaign.campaignExpectations ?? null,
      tableExpectations: r.campaign.tableExpectations ?? null,
      characterCreationOutcome: r.campaign.characterCreationOutcome ?? null,
    }));

    return { success: true, data: { items, totalCount: count } };
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
      const { getDb, getCurrentUser } = await getServerDeps();
      const db = await getDb();
      const currentUser = await getCurrentUser();
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
      } = await getServerDeps();
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
      const { findCampaignParticipantsByCampaignId } = await getServerDeps();
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
      const { getDb, and, eq, campaignApplications } = await getServerDeps();
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
        const { getDb, user, or, ilike } = await getServerDeps();
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
