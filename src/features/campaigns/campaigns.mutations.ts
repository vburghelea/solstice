import { createServerFn } from "@tanstack/react-start";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { campaignApplications, campaignParticipants, campaigns } from "~/db/schema";
import {
  findCampaignApplicationById,
  findCampaignById,
  findCampaignParticipantByCampaignAndUserId,
  findCampaignParticipantById,
  findUserByEmail,
} from "./campaigns.repository";
import {
  addCampaignParticipantInputSchema,
  applyToCampaignInputSchema,
  createCampaignInputSchema,
  getCampaignSchema,
  inviteToCampaignInputSchema,
  removeCampaignParticipantInputSchema,
  respondToCampaignApplicationSchema,
  updateCampaignInputSchema,
  updateCampaignParticipantInputSchema,
} from "./campaigns.schemas";
import type {
  CampaignApplication,
  CampaignParticipant,
  CampaignWithDetails,
  OperationResult,
} from "./campaigns.types";

export const createCampaign = createServerFn({ method: "POST" })
  .validator(createCampaignInputSchema.parse)
  .handler(async ({ data }): Promise<OperationResult<CampaignWithDetails>> => {
    try {
      const { getDb } = await import("~/db/server-helpers");
      const { getCurrentUser } = await import("~/features/auth/auth.queries");

      const currentUser = await getCurrentUser();
      if (!currentUser) {
        return {
          success: false,
          errors: [{ code: "AUTH_ERROR", message: "Not authenticated" }],
        };
      }

      const db = await getDb();

      const [newCampaign] = await db
        .insert(campaigns)
        .values({
          ownerId: currentUser.id,
          gameSystemId: data.gameSystemId,
          name: data.name,
          description: data.description,
          images: data.images,
          recurrence: data.recurrence,
          timeOfDay: data.timeOfDay,
          sessionDuration: data.sessionDuration,
          pricePerSession: data.pricePerSession || null,
          language: data.language,
          location: data.location,
          status: "active",
          minimumRequirements: data.minimumRequirements,
          visibility: data.visibility,
          safetyRules: data.safetyRules,
        })
        .returning();

      if (!newCampaign) {
        return {
          success: false,
          errors: [{ code: "DATABASE_ERROR", message: "Failed to create campaign" }],
        };
      }

      // Add owner as a participant
      const [ownerParticipant] = await db
        .insert(campaignParticipants)
        .values({
          campaignId: newCampaign.id,
          userId: currentUser.id,
          role: "player",
          status: "approved",
        })
        .returning();

      if (!ownerParticipant) {
        return {
          success: false,
          errors: [
            { code: "DATABASE_ERROR", message: "Failed to add owner as participant" },
          ],
        };
      }

      const campaignWithDetails = await findCampaignById(newCampaign.id);

      if (!campaignWithDetails) {
        return {
          success: false,
          errors: [
            { code: "DATABASE_ERROR", message: "Failed to fetch created campaign" },
          ],
        };
      }

      return {
        success: true,
        data: campaignWithDetails as CampaignWithDetails,
      };
    } catch (error) {
      console.error("Error creating campaign:", error);
      return {
        success: false,
        errors: [{ code: "SERVER_ERROR", message: "Failed to create campaign" }],
      };
    }
  });

export const updateCampaign = createServerFn({ method: "POST" })
  .validator(updateCampaignInputSchema.parse)
  .handler(async ({ data }): Promise<OperationResult<CampaignWithDetails>> => {
    try {
      const { getDb } = await import("~/db/server-helpers");
      const { getCurrentUser } = await import("~/features/auth/auth.queries");

      const currentUser = await getCurrentUser();
      if (!currentUser) {
        return {
          success: false,
          errors: [{ code: "AUTH_ERROR", message: "Not authenticated" }],
        };
      }

      const db = await getDb();

      const existingCampaign = await findCampaignById(data.id);

      if (!existingCampaign || existingCampaign.ownerId !== currentUser.id) {
        return {
          success: false,
          errors: [
            { code: "AUTH_ERROR", message: "Not authorized to update this campaign" },
          ],
        };
      }

      const [updatedCampaign] = await db
        .update(campaigns)
        .set({
          ...data,
          pricePerSession: data.pricePerSession || null,
          updatedAt: new Date(),
        })
        .where(eq(campaigns.id, data.id))
        .returning();

      if (!updatedCampaign) {
        return {
          success: false,
          errors: [{ code: "DATABASE_ERROR", message: "Failed to update campaign" }],
        };
      }

      const campaignWithDetails = await findCampaignById(updatedCampaign.id);

      if (!campaignWithDetails) {
        return {
          success: false,
          errors: [
            { code: "DATABASE_ERROR", message: "Failed to fetch updated campaign" },
          ],
        };
      }

      return {
        success: true,
        data: campaignWithDetails as CampaignWithDetails,
      };
    } catch (error) {
      console.error("Error updating campaign:", error);
      return {
        success: false,
        errors: [{ code: "SERVER_ERROR", message: "Failed to update campaign" }],
      };
    }
  });

export const deleteCampaign = createServerFn({ method: "POST" })
  .validator(getCampaignSchema.parse)
  .handler(async ({ data }): Promise<OperationResult<boolean>> => {
    try {
      const { getDb } = await import("~/db/server-helpers");
      const { getCurrentUser } = await import("~/features/auth/auth.queries");

      const currentUser = await getCurrentUser();
      if (!currentUser) {
        return {
          success: false,
          errors: [{ code: "AUTH_ERROR", message: "Not authenticated" }],
        };
      }

      const db = await getDb();

      const existingCampaign = await findCampaignById(data.id);

      if (!existingCampaign || existingCampaign.ownerId !== currentUser.id) {
        return {
          success: false,
          errors: [
            { code: "AUTH_ERROR", message: "Not authorized to delete this campaign" },
          ],
        };
      }

      await db.delete(campaigns).where(eq(campaigns.id, data.id));

      return { success: true, data: true };
    } catch (error) {
      console.error("Error deleting campaign:", error);
      return {
        success: false,
        errors: [{ code: "SERVER_ERROR", message: "Failed to delete campaign" }],
      };
    }
  });

export const addCampaignParticipant = createServerFn({ method: "POST" })
  .validator(addCampaignParticipantInputSchema.parse)
  .handler(
    async ({
      data,
    }: {
      data: z.infer<typeof addCampaignParticipantInputSchema>;
    }): Promise<OperationResult<CampaignParticipant>> => {
      try {
        const { getDb } = await import("~/db/server-helpers");
        const { getCurrentUser } = await import("~/features/auth/auth.queries");

        const currentUser = await getCurrentUser();
        if (!currentUser) {
          return {
            success: false,
            errors: [{ code: "AUTH_ERROR", message: "Not authenticated" }],
          };
        }

        const db = await getDb();

        const campaign = await findCampaignById(data.campaignId);

        if (!campaign || campaign.ownerId !== currentUser.id) {
          return {
            success: false,
            errors: [
              { code: "AUTH_ERROR", message: "Not authorized to add participants" },
            ],
          };
        }

        const [newParticipant] = await db
          .insert(campaignParticipants)
          .values(data as typeof campaignParticipants.$inferInsert)
          .returning();

        if (!newParticipant) {
          return {
            success: false,
            errors: [{ code: "DATABASE_ERROR", message: "Failed to add participant" }],
          };
        }

        const participantWithUser = await findCampaignParticipantById(newParticipant.id);

        if (!participantWithUser) {
          return {
            success: false,
            errors: [
              { code: "DATABASE_ERROR", message: "Failed to fetch new participant" },
            ],
          };
        }

        return { success: true, data: participantWithUser as CampaignParticipant };
      } catch (error) {
        console.error("Error adding participant:", error);
        return {
          success: false,
          errors: [{ code: "SERVER_ERROR", message: "Failed to add participant" }],
        };
      }
    },
  );

export const updateCampaignParticipant = createServerFn({ method: "POST" })
  .validator(updateCampaignParticipantInputSchema.parse)
  .handler(
    async ({
      data,
    }: {
      data: z.infer<typeof updateCampaignParticipantInputSchema>;
    }): Promise<OperationResult<CampaignParticipant>> => {
      try {
        const { getDb } = await import("~/db/server-helpers");
        const { getCurrentUser } = await import("~/features/auth/auth.queries");

        const currentUser = await getCurrentUser();
        if (!currentUser) {
          return {
            success: false,
            errors: [{ code: "AUTH_ERROR", message: "Not authenticated" }],
          };
        }

        const db = await getDb();

        const existingParticipant = await findCampaignParticipantById(data.participantId);

        if (
          !existingParticipant ||
          (existingParticipant.campaign.ownerId !== currentUser.id &&
            existingParticipant.userId !== currentUser.id)
        ) {
          return {
            success: false,
            errors: [
              {
                code: "AUTH_ERROR",
                message: "Not authorized to update this participant",
              },
            ],
          };
        }

        const [updatedParticipant] = await db
          .update(campaignParticipants)
          .set({
            status: data.status,
            role: data.role,
            updatedAt: new Date(),
          })
          .where(eq(campaignParticipants.id, data.participantId))
          .returning();

        if (!updatedParticipant) {
          return {
            success: false,
            errors: [{ code: "DATABASE_ERROR", message: "Failed to update participant" }],
          };
        }

        const participantWithUser = await findCampaignParticipantById(
          updatedParticipant.id,
        );

        if (!participantWithUser) {
          return {
            success: false,
            errors: [
              { code: "DATABASE_ERROR", message: "Failed to fetch updated participant" },
            ],
          };
        }

        return { success: true, data: participantWithUser as CampaignParticipant };
      } catch (error) {
        console.error("Error updating participant:", error);
        return {
          success: false,
          errors: [{ code: "SERVER_ERROR", message: "Failed to update participant" }],
        };
      }
    },
  );

export const removeCampaignParticipant = createServerFn({ method: "POST" })
  .validator(removeCampaignParticipantInputSchema.parse)
  .handler(
    async ({
      data,
    }: {
      data: z.infer<typeof removeCampaignParticipantInputSchema>;
    }): Promise<OperationResult<boolean>> => {
      try {
        const { getDb } = await import("~/db/server-helpers");
        const { getCurrentUser } = await import("~/features/auth/auth.queries");

        const currentUser = await getCurrentUser();
        if (!currentUser) {
          return {
            success: false,
            errors: [{ code: "AUTH_ERROR", message: "Not authenticated" }],
          };
        }

        const db = await getDb();

        const existingParticipant = await findCampaignParticipantById(data.participantId);

        if (
          !existingParticipant ||
          (existingParticipant.campaign.ownerId !== currentUser.id &&
            existingParticipant.userId !== currentUser.id)
        ) {
          return {
            success: false,
            errors: [
              {
                code: "AUTH_ERROR",
                message: "Not authorized to remove this participant",
              },
            ],
          };
        }

        await db
          .delete(campaignParticipants)
          .where(eq(campaignParticipants.id, data.participantId));

        return { success: true, data: true };
      } catch (error) {
        console.error("Error removing participant:", error);
        return {
          success: false,
          errors: [{ code: "SERVER_ERROR", message: "Failed to remove participant" }],
        };
      }
    },
  );

export const applyToCampaign = createServerFn({ method: "POST" })
  .validator(applyToCampaignInputSchema.parse)
  .handler(async ({ data }): Promise<OperationResult<CampaignApplication>> => {
    try {
      const { getDb } = await import("~/db/server-helpers");
      const { getCurrentUser } = await import("~/features/auth/auth.queries");

      const currentUser = await getCurrentUser();
      if (!currentUser) {
        return {
          success: false,
          errors: [{ code: "AUTH_ERROR", message: "Not authenticated" }],
        };
      }

      const db = await getDb();

      const existingApplication = await db.query.campaignApplications.findFirst({
        where: and(
          eq(campaignApplications.campaignId, data.campaignId),
          eq(campaignApplications.userId, currentUser.id),
        ),
      });

      if (existingApplication) {
        return {
          success: false,
          errors: [
            { code: "CONFLICT", message: "You have already applied to this campaign" },
          ],
        };
      }

      const [newApplication] = await db
        .insert(campaignApplications)
        .values({
          campaignId: data.campaignId,
          userId: currentUser.id,
          status: "pending",
        })
        .returning();

      if (!newApplication) {
        return {
          success: false,
          errors: [{ code: "DATABASE_ERROR", message: "Failed to apply to campaign" }],
        };
      }

      const applicationWithDetails = await findCampaignApplicationById(newApplication.id);

      if (!applicationWithDetails) {
        return {
          success: false,
          errors: [
            { code: "DATABASE_ERROR", message: "Failed to fetch new application" },
          ],
        };
      }

      return { success: true, data: applicationWithDetails as CampaignApplication };
    } catch (error) {
      console.error("Error applying to campaign:", error);
      return {
        success: false,
        errors: [{ code: "SERVER_ERROR", message: "Failed to apply to campaign" }],
      };
    }
  });

export const inviteToCampaign = createServerFn({ method: "POST" })
  .validator(inviteToCampaignInputSchema.parse)
  .handler(async ({ data }): Promise<OperationResult<CampaignParticipant>> => {
    try {
      const { getDb } = await import("~/db/server-helpers");
      const { getCurrentUser } = await import("~/features/auth/auth.queries");

      const currentUser = await getCurrentUser();
      if (!currentUser) {
        return {
          success: false,
          errors: [{ code: "AUTH_ERROR", message: "Not authenticated" }],
        };
      }

      const db = await getDb();

      const campaign = await findCampaignById(data.campaignId);

      if (!campaign || campaign.ownerId !== currentUser.id) {
        return {
          success: false,
          errors: [
            { code: "AUTH_ERROR", message: "Not authorized to invite participants" },
          ],
        };
      }

      let targetUserId: string;

      if (data.userId) {
        targetUserId = data.userId;
      } else if (data.email) {
        const invitedUser = await findUserByEmail(data.email);
        if (!invitedUser) {
          return {
            success: false,
            errors: [{ code: "NOT_FOUND", message: "User with this email not found" }],
          };
        }
        targetUserId = invitedUser.id;
      } else {
        return {
          success: false,
          errors: [
            { code: "VALIDATION_ERROR", message: "User ID or email must be provided" },
          ],
        };
      }

      const existingParticipant = await findCampaignParticipantByCampaignAndUserId(
        data.campaignId,
        targetUserId,
      );

      if (existingParticipant) {
        if (existingParticipant.status === "rejected") {
          const [updatedParticipant] = await db
            .update(campaignParticipants)
            .set({
              status: "pending",
              updatedAt: new Date(),
            })
            .where(eq(campaignParticipants.id, existingParticipant.id))
            .returning();

          if (!updatedParticipant) {
            return {
              success: false,
              errors: [
                { code: "DATABASE_ERROR", message: "Failed to re-invite participant" },
              ],
            };
          }

          const participantWithUser = await findCampaignParticipantById(
            updatedParticipant.id,
          );

          if (!participantWithUser) {
            return {
              success: false,
              errors: [
                {
                  code: "DATABASE_ERROR",
                  message: "Failed to fetch re-invited participant",
                },
              ],
            };
          }
          return { success: true, data: participantWithUser as CampaignParticipant };
        } else {
          return {
            success: false,
            errors: [
              {
                code: "CONFLICT",
                message: "User is already a participant or has applied",
              },
            ],
          };
        }
      }

      const [newParticipant] = await db
        .insert(campaignParticipants)
        .values({
          campaignId: data.campaignId,
          userId: targetUserId,
          role: "invited",
          status: "pending",
        })
        .returning();

      if (!newParticipant) {
        return {
          success: false,
          errors: [{ code: "DATABASE_ERROR", message: "Failed to invite participant" }],
        };
      }

      const participantWithDetails = await findCampaignParticipantById(newParticipant.id);

      if (!participantWithDetails) {
        return {
          success: false,
          errors: [
            { code: "DATABASE_ERROR", message: "Failed to fetch new participant" },
          ],
        };
      }

      return { success: true, data: participantWithDetails as CampaignParticipant };
    } catch (error) {
      console.error("Error inviting participant:", error);
      return {
        success: false,
        errors: [{ code: "SERVER_ERROR", message: "Failed to invite participant" }],
      };
    }
  });

export const respondToApplication = createServerFn({ method: "POST" })
  .validator(respondToCampaignApplicationSchema.parse)
  .handler(async ({ data }): Promise<OperationResult<CampaignApplication | boolean>> => {
    try {
      const { getDb } = await import("~/db/server-helpers");
      const { getCurrentUser } = await import("~/features/auth/auth.queries");

      const currentUser = await getCurrentUser();
      if (!currentUser) {
        return {
          success: false,
          errors: [{ code: "AUTH_ERROR", message: "Not authenticated" }],
        };
      }

      const db = await getDb();

      const application = await findCampaignApplicationById(data.applicationId);

      if (!application || application.campaign.ownerId !== currentUser.id) {
        return {
          success: false,
          errors: [
            {
              code: "AUTH_ERROR",
              message: "Application not found or you are not the owner of the campaign",
            },
          ],
        };
      }

      if (data.status === "approved") {
        const [updatedApplication] = await db
          .update(campaignApplications)
          .set({ status: data.status, updatedAt: new Date() })
          .where(eq(campaignApplications.id, data.applicationId))
          .returning();

        if (!updatedApplication) {
          return {
            success: false,
            errors: [{ code: "DATABASE_ERROR", message: "Failed to update application" }],
          };
        }

        await db.insert(campaignParticipants).values({
          campaignId: application.campaignId,
          userId: application.userId,
          role: "player", // Default role for approved applicants
          status: "approved",
        });

        const applicationWithDetails = await findCampaignApplicationById(
          updatedApplication.id,
        );

        if (!applicationWithDetails) {
          return {
            success: false,
            errors: [
              { code: "DATABASE_ERROR", message: "Failed to fetch updated application" },
            ],
          };
        }

        return { success: true, data: applicationWithDetails as CampaignApplication };
      } else if (data.status === "rejected") {
        await db
          .delete(campaignApplications)
          .where(eq(campaignApplications.id, data.applicationId));
        return { success: true, data: true };
      }

      return {
        success: false,
        errors: [{ code: "VALIDATION_ERROR", message: "Invalid action" }],
      };
    } catch (error) {
      console.error("Error responding to application:", error);
      return {
        success: false,
        errors: [{ code: "SERVER_ERROR", message: "Failed to respond to application" }],
      };
    }
  });
