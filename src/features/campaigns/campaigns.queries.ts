import { createServerFn } from "@tanstack/react-start";
import { and, eq, ilike, or, sql } from "drizzle-orm";
import { campaignParticipants, campaigns, user } from "~/db/schema";
import { getDb } from "~/db/server-helpers";
import { getCurrentUser } from "~/features/auth/auth.queries";
import { OperationResult } from "~/shared/types/common";
import {
  findCampaignById,
  findCampaignParticipantsByCampaignId,
  findPendingCampaignApplicationsByCampaignId,
} from "./campaigns.repository";
import {
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
    try {
      const db = await getDb();
      const currentUser = await getCurrentUser();
      const currentUserId = currentUser?.id;

      const baseConditions = [];
      if (data.filters?.status) {
        baseConditions.push(eq(campaigns.status, data.filters.status));
      }
      if (data.filters?.searchTerm) {
        const searchTerm = `%${data.filters.searchTerm.toLowerCase()}%`;
        baseConditions.push(
          or(ilike(campaigns.name, searchTerm), ilike(campaigns.description, searchTerm)),
        );
      }

      const visibilityConditions = [];
      visibilityConditions.push(eq(campaigns.visibility, "public"));

      if (currentUserId) {
        const userCampaigns = db
          .select({ campaignId: campaignParticipants.campaignId })
          .from(campaignParticipants)
          .where(eq(campaignParticipants.userId, currentUserId));

        visibilityConditions.push(
          and(
            eq(campaigns.visibility, "private"),
            sql`${campaigns.id} IN ${userCampaigns}`,
          ),
        );

        visibilityConditions.push(eq(campaigns.ownerId, currentUserId));

        visibilityConditions.push(
          and(
            eq(campaigns.visibility, "protected"),
            or(
              eq(campaigns.ownerId, currentUserId),
              sql`${campaigns.id} IN ${userCampaigns}`,
            ),
          ),
        );
      }

      const finalConditions = and(...baseConditions, or(...visibilityConditions));

      const result = await db
        .select({
          campaign: campaigns,
          owner: { id: user.id, name: user.name, email: user.email },
          participantCount: sql<number>`count(distinct ${campaignParticipants.userId})::int`,
        })
        .from(campaigns)
        .innerJoin(user, eq(campaigns.ownerId, user.id))
        .leftJoin(campaignParticipants, eq(campaignParticipants.campaignId, campaigns.id))
        .where(finalConditions)
        .groupBy(campaigns.id, user.id);

      return {
        success: true,
        data: result.map((r) => ({
          ...r.campaign,
          owner: r.owner,
          participantCount: r.participantCount,
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
