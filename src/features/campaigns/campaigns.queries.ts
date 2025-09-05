import { createServerFn } from "@tanstack/react-start";
import { and, eq, ilike, or, sql } from "drizzle-orm";
import {
  campaignApplications,
  campaignParticipants,
  campaigns,
  gameSystems,
  user,
} from "~/db/schema";
import { getDb } from "~/db/server-helpers";
import { getCurrentUser } from "~/features/auth/auth.queries";
import { OperationResult } from "~/shared/types/common";
import {
  findCampaignById,
  findCampaignParticipantsByCampaignId,
  findPendingCampaignApplicationsByCampaignId,
} from "./campaigns.repository";
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

export const getCampaign = createServerFn({ method: "POST" })
  .validator(getCampaignSchema.parse)
  .handler(async ({ data }): Promise<OperationResult<CampaignWithDetails | null>> => {
    try {
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

export const listCampaigns = createServerFn({ method: "POST" })
  .validator(listCampaignsSchema.parse)
  .handler(async ({ data = {} }): Promise<OperationResult<CampaignListItem[]>> => {
    console.log("listCampaigns received filters:", data.filters);
    try {
      const db = await getDb();
      const currentUser = await getCurrentUser();
      const currentUserId = currentUser?.id;

      const statusFilterCondition = data.filters?.status
        ? eq(campaigns.status, data.filters.status)
        : null;

      const otherBaseConditions = [];
      if (data.filters?.searchTerm) {
        const searchTerm = `%${data.filters.searchTerm.toLowerCase()}%`;
        otherBaseConditions.push(
          or(ilike(campaigns.name, searchTerm), ilike(campaigns.description, searchTerm)),
        );
      }

      const visibilityConditionsForOr = [];
      visibilityConditionsForOr.push(eq(campaigns.visibility, "public"));

      if (currentUserId) {
        const { userFollows, userBlocks } = await import("~/db/schema");
        const userCampaigns = db
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

        // Protected (connections-only) where viewer and owner are connected and not blocked
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

      const result = await db
        .select({
          campaign: campaigns,
          owner: { id: user.id, name: user.name, email: user.email },
          participantCount: sql<number>`count(distinct ${campaignParticipants.userId})::int`,
          gameSystem: gameSystems, // Include gameSystem in the select
        })
        .from(campaigns)
        .innerJoin(user, eq(campaigns.ownerId, user.id))
        .innerJoin(gameSystems, eq(campaigns.gameSystemId, gameSystems.id)) // Join with gameSystems
        .leftJoin(campaignParticipants, eq(campaignParticipants.campaignId, campaigns.id))
        .where(finalWhereClause)
        .groupBy(campaigns.id, user.id, gameSystems.id); // Add gameSystems.id to groupBy

      return {
        success: true,
        data: result.map((r) => ({
          ...r.campaign,
          owner: r.owner,
          participantCount: r.participantCount,
          gameSystem: r.gameSystem, // Include gameSystem in the mapped object
          // Explicitly set new fields to undefined if null from DB
          sessionZeroData: r.campaign.sessionZeroData ?? undefined,
          campaignExpectations: r.campaign.campaignExpectations ?? undefined,
          tableExpectations: r.campaign.tableExpectations ?? undefined,
          characterCreationOutcome: r.campaign.characterCreationOutcome ?? undefined,
        })) as CampaignListItem[],
      };
    } catch (error) {
      console.error("Error listing campaigns:", error);
      return {
        success: false,
        errors: [{ code: "DATABASE_ERROR", message: "Failed to list campaigns" }],
      };
    }
  });

export const getCampaignApplications = createServerFn({ method: "POST" })
  .validator(getCampaignSchema.parse)
  .handler(async ({ data }): Promise<OperationResult<CampaignApplication[]>> => {
    try {
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
