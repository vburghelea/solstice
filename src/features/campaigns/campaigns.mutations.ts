import { createServerFn } from "@tanstack/react-start";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { campaignApplications, campaignParticipants, campaigns } from "~/db/schema";
import { canInvite, getRelationship } from "~/features/social/relationship.server";
import { OperationResult } from "~/shared/types/common";
import {
  findCampaignApplicationById,
  findCampaignById,
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
  respondToCampaignInvitationSchema,
  updateCampaignInputSchema,
  updateCampaignParticipantInputSchema,
} from "./campaigns.schemas";
import {
  CampaignApplication,
  CampaignParticipant,
  CampaignStatus,
  CampaignVisibility,
  CampaignWithDetails,
} from "./campaigns.types";

interface CampaignSummary {
  ownerId: string;
  name: string;
  description?: string | null;
  visibility: CampaignVisibility;
  status: CampaignStatus;
  gameSystem?: { name?: string } | null;
}

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
          visibility: (data as z.infer<typeof createCampaignInputSchema>).visibility,
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

      // Extract session zero data and other derived fields
      const sessionZeroData = data.sessionZeroData;
      // Prefer explicit safetyRules from the form; fallback to session zero safety tools, then existing
      const providedSafetyRules = (data as { safetyRules?: unknown }).safetyRules;
      const safetyRules =
        providedSafetyRules !== undefined
          ? providedSafetyRules
          : (sessionZeroData?.safetyTools ?? existingCampaign.safetyRules ?? null);
      const campaignExpectations = sessionZeroData?.campaignExpectations || null;
      const tableExpectations = sessionZeroData?.tableExpectations || null;
      const characterCreationOutcome = data.characterCreationOutcome || null;

      const [updatedCampaign] = await db
        .update(campaigns)
        .set({
          ...data,
          pricePerSession: data.pricePerSession || null,
          safetyRules: safetyRules,
          sessionZeroData: sessionZeroData, // Store the full session zero data
          campaignExpectations: campaignExpectations, // Store campaign expectations
          tableExpectations: tableExpectations, // Store table expectations
          characterCreationOutcome: characterCreationOutcome, // Store character creation outcome
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

      // Revoke pending invitations if campaign is canceled or completed
      if (
        typeof data.status !== "undefined" &&
        data.status !== existingCampaign.status &&
        (data.status === "canceled" || data.status === "completed")
      ) {
        await db
          .update(campaignParticipants)
          .set({ status: "rejected", updatedAt: new Date() })
          .where(
            and(
              eq(campaignParticipants.campaignId, data.id),
              eq(campaignParticipants.status, "pending"),
            ),
          );
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
        const [{ canInvite, getRelationship }] = await Promise.all([
          import("~/features/social/relationship.server"),
        ]);

        const currentUser = await getCurrentUser();
        if (!currentUser) {
          return {
            success: false,
            errors: [{ code: "AUTH_ERROR", message: "Not authenticated" }],
          };
        }

        const db = await getDb();

        const campaign = (await findCampaignById(
          data.campaignId,
        )) as CampaignSummary | null;

        if (!campaign || campaign.ownerId !== currentUser.id) {
          return {
            success: false,
            errors: [
              { code: "AUTH_ERROR", message: "Not authorized to add participants" },
            ],
          };
        }

        // Respect blocklist and invitee privacy for owner → target actions
        if (data.userId !== currentUser.id) {
          const rel = await getRelationship(currentUser.id, data.userId);
          if (rel.blocked || rel.blockedBy) {
            return {
              success: false,
              errors: [{ code: "FORBIDDEN", message: "You cannot add this user" }],
            };
          }
          const ok = await canInvite(currentUser.id, data.userId);
          if (!ok) {
            return {
              success: false,
              errors: [
                {
                  code: "FORBIDDEN",
                  message: "This user only accepts invites from connections",
                },
              ],
            };
          }
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
          ((existingParticipant.campaign as CampaignSummary).ownerId !== currentUser.id &&
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
          ((existingParticipant.campaign as CampaignSummary).ownerId !== currentUser.id &&
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

      const campaign = (await findCampaignById(
        data.campaignId,
      )) as CampaignSummary | null;
      if (!campaign) {
        return {
          success: false,
          errors: [{ code: "NOT_FOUND", message: "Campaign not found" }],
        };
      }

      // Blocklist restrictions (symmetric): cannot apply if either side has blocked
      const rel = await getRelationship(currentUser.id, campaign.ownerId);
      if (rel.blocked || rel.blockedBy) {
        return {
          success: false,
          errors: [
            { code: "FORBIDDEN", message: "You cannot interact with this organizer" },
          ],
        };
      }

      // Connections & teammates gate for protected campaigns
      if (campaign.visibility === "protected" && !rel.isConnection) {
        return {
          success: false,
          errors: [
            { code: "FORBIDDEN", message: "Not eligible to apply to this campaign" },
          ],
        };
      }

      // Check if user has a rejected participant entry for this campaign
      const existingRejectedParticipant = await db.query.campaignParticipants.findFirst({
        where: and(
          eq(campaignParticipants.campaignId, data.campaignId),
          eq(campaignParticipants.userId, currentUser.id),
          eq(campaignParticipants.status, "rejected"),
        ),
      });

      if (existingRejectedParticipant) {
        return {
          success: false,
          errors: [
            {
              code: "CONFLICT",
              message:
                "You cannot apply to this campaign as you were previously rejected.",
            },
          ],
        };
      }

      // Check if campaign is open for applications (e.g., not canceled or completed)
      if (campaign.status === "canceled" || campaign.status === "completed") {
        return {
          success: false,
          errors: [
            { code: "CONFLICT", message: "This campaign is not open for applications." },
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
          errors: [{ code: "DATABASE_ERROR", message: "Failed to submit application" }],
        };
      }

      const applicationWithUser = await findCampaignApplicationById(newApplication.id);

      if (!applicationWithUser) {
        return {
          success: false,
          errors: [
            { code: "DATABASE_ERROR", message: "Failed to fetch submitted application" },
          ],
        };
      }

      return {
        success: true,
        data: applicationWithUser as unknown as CampaignApplication,
      };
    } catch (error) {
      console.error("Error applying to campaign:", error);
      return {
        success: false,
        errors: [{ code: "SERVER_ERROR", message: "Failed to apply to campaign" }],
      };
    }
  });

export const respondToCampaignApplication = createServerFn({ method: "POST" })
  .validator(respondToCampaignApplicationSchema.parse)
  .handler(
    async ({
      data,
    }: {
      data: z.infer<typeof respondToCampaignApplicationSchema>;
    }): Promise<OperationResult<CampaignApplication | boolean>> => {
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

        const existingApplication = await findCampaignApplicationById(data.applicationId);

        if (
          !existingApplication ||
          (existingApplication.campaign as CampaignSummary).ownerId !== currentUser.id
        ) {
          return {
            success: false,
            errors: [
              {
                code: "AUTH_ERROR",
                message: "Not authorized to respond to this application",
              },
            ],
          };
        }

        const [updatedApplication] = await db
          .update(campaignApplications)
          .set({
            status: data.status,
            updatedAt: new Date(),
          })
          .where(eq(campaignApplications.id, data.applicationId))
          .returning();

        if (!updatedApplication) {
          return {
            success: false,
            errors: [{ code: "DATABASE_ERROR", message: "Failed to update application" }],
          };
        }

        if (data.status === "approved") {
          // Create participant entry
          const [newParticipant] = await db
            .insert(campaignParticipants)
            .values({
              campaignId: existingApplication.campaignId,
              userId: existingApplication.userId,
              role: "player",
              status: "approved",
            })
            .returning();

          if (!newParticipant) {
            return {
              success: false,
              errors: [
                { code: "DATABASE_ERROR", message: "Failed to create participant entry" },
              ],
            };
          }

          return { success: true, data: true };
        }

        const applicationWithUser = await findCampaignApplicationById(
          updatedApplication.id,
        );

        if (!applicationWithUser) {
          return {
            success: false,
            errors: [
              { code: "DATABASE_ERROR", message: "Failed to fetch updated application" },
            ],
          };
        }

        return {
          success: true,
          data: applicationWithUser as unknown as CampaignApplication,
        };
      } catch (error) {
        console.error("Error responding to application:", error);
        return {
          success: false,
          errors: [{ code: "SERVER_ERROR", message: "Failed to respond to application" }],
        };
      }
    },
  );

export const inviteToCampaign = createServerFn({ method: "POST" })
  .validator(inviteToCampaignInputSchema.parse)
  .handler(async ({ data }): Promise<OperationResult<CampaignParticipant>> => {
    try {
      const { getDb } = await import("~/db/server-helpers");
      const { getCurrentUser } = await import("~/features/auth/auth.queries");
      const { getAuth } = await import("~/lib/auth/server-helpers");
      const auth = await getAuth();
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        return {
          success: false,
          errors: [{ code: "AUTH_ERROR", message: "Not authenticated" }],
        };
      }

      const db = await getDb();

      const campaign = (await findCampaignById(
        data.campaignId,
      )) as CampaignSummary | null;

      if (!campaign || campaign.ownerId !== currentUser.id) {
        return {
          success: false,
          errors: [
            { code: "AUTH_ERROR", message: "Not authorized to invite participants" },
          ],
        };
      }

      // Only active campaigns can accept invitations
      if (campaign.status !== "active") {
        return {
          success: false,
          errors: [
            {
              code: "CONFLICT",
              message: "Cannot invite players to a canceled or completed campaign",
            },
          ],
        };
      }

      // Check if user already exists
      if (!data.email) {
        return {
          success: false,
          errors: [{ code: "VALIDATION_ERROR", message: "Email is required" }],
        };
      }
      const invitedUser = await findUserByEmail(data.email);

      if (invitedUser) {
        // User exists, create participant entry
        // Blocklist restriction
        const rel = await getRelationship(currentUser.id, invitedUser.id);
        if (rel.blocked || rel.blockedBy) {
          return {
            success: false,
            errors: [{ code: "FORBIDDEN", message: "You cannot invite this user" }],
          };
        }
        // Invitee privacy
        const ok = await canInvite(currentUser.id, invitedUser.id);
        if (!ok) {
          return {
            success: false,
            errors: [
              {
                code: "FORBIDDEN",
                message: "This user only accepts invites from connections",
              },
            ],
          };
        }
        const [existingParticipant] = await db
          .select()
          .from(campaignParticipants)
          .where(
            and(
              eq(campaignParticipants.campaignId, data.campaignId),
              eq(campaignParticipants.userId, invitedUser.id),
            ),
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
                  { code: "DATABASE_ERROR", message: "Failed to update participant" },
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
                  { code: "DATABASE_ERROR", message: "Failed to fetch participant" },
                ],
              };
            }

            // Send (re)invitation email
            try {
              const [{ sendCampaignInvitation }] = await Promise.all([
                import("~/lib/email/resend"),
              ]);
              const { getBaseUrl } = await import("~/lib/env.server");
              const baseUrl = getBaseUrl();
              const inviteUrl = `${baseUrl}/campaigns/${data.campaignId}`;
              const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
              await sendCampaignInvitation({
                to: { email: invitedUser.email, name: invitedUser.name ?? undefined },
                inviterName: currentUser.name || "Campaign Owner",
                campaignName: campaign?.name ?? "",
                campaignDescription: campaign?.description ?? "",
                gameSystem: campaign?.gameSystem?.name || "",
                inviteUrl,
                expiresAt,
              });
            } catch (emailError) {
              console.error("Failed to send campaign (re)invitation email:", emailError);
            }

            return { success: true, data: participantWithUser as CampaignParticipant };
          } else {
            return {
              success: false,
              errors: [
                {
                  code: "CONFLICT",
                  message: "User is already participating in this campaign",
                },
              ],
            };
          }
        } else {
          const [newParticipant] = await db
            .insert(campaignParticipants)
            .values({
              campaignId: data.campaignId,
              userId: invitedUser.id,
              role: "player",
              status: "pending",
            })
            .returning();

          if (!newParticipant) {
            return {
              success: false,
              errors: [
                { code: "DATABASE_ERROR", message: "Failed to create participant" },
              ],
            };
          }

          const participantWithUser = await findCampaignParticipantById(
            newParticipant.id,
          );

          if (!participantWithUser) {
            return {
              success: false,
              errors: [
                { code: "DATABASE_ERROR", message: "Failed to fetch new participant" },
              ],
            };
          }

          // Send invitation email
          try {
            const [{ sendCampaignInvitation }] = await Promise.all([
              import("~/lib/email/resend"),
            ]);
            const { getBaseUrl } = await import("~/lib/env.server");
            const baseUrl = getBaseUrl();
            const inviteUrl = `${baseUrl}/campaigns/${data.campaignId}`;
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            await sendCampaignInvitation({
              to: { email: invitedUser.email, name: invitedUser.name ?? undefined },
              inviterName: currentUser.name || "Campaign Owner",
              campaignName: campaign?.name ?? "",
              campaignDescription: campaign?.description ?? "",
              gameSystem: campaign?.gameSystem?.name || "",
              inviteUrl,
              expiresAt,
            });
          } catch (emailError) {
            console.error("Failed to send campaign invitation email:", emailError);
          }

          return { success: true, data: participantWithUser as CampaignParticipant };
        }
      } else {
        // User doesn't exist, create invitation using Better Auth
        try {
          // Create a sign-up invitation
          const signUpData = await auth.api.signUpEmail({
            body: {
              email: data.email,
              name: data.name || "New User",
              password: Math.random().toString(36).slice(-12), // Temporary password
            },
          });

          if (signUpData.user) {
            const [newParticipant] = await db
              .insert(campaignParticipants)
              .values({
                campaignId: data.campaignId,
                userId: signUpData.user.id,
                role: "player",
                status: "pending",
              })
              .returning();

            if (!newParticipant) {
              return {
                success: false,
                errors: [
                  { code: "DATABASE_ERROR", message: "Failed to create participant" },
                ],
              };
            }

            const participantWithUser = await findCampaignParticipantById(
              newParticipant.id,
            );

            if (!participantWithUser) {
              return {
                success: false,
                errors: [
                  { code: "DATABASE_ERROR", message: "Failed to fetch new participant" },
                ],
              };
            }

            // Send invitation email
            try {
              const [{ sendCampaignInvitation }] = await Promise.all([
                import("~/lib/email/resend"),
              ]);
              const { getBaseUrl } = await import("~/lib/env.server");
              const baseUrl = getBaseUrl();
              const inviteUrl = `${baseUrl}/campaigns/${data.campaignId}`;
              const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
              await sendCampaignInvitation({
                to: { email: data.email, name: signUpData.user.name ?? undefined },
                inviterName: currentUser.name || "Campaign Owner",
                campaignName: campaign?.name ?? "",
                campaignDescription: campaign?.description ?? "",
                gameSystem: campaign?.gameSystem?.name || "",
                inviteUrl,
                expiresAt,
              });
            } catch (emailError) {
              console.error("Failed to send campaign invitation email:", emailError);
            }

            return { success: true, data: participantWithUser as CampaignParticipant };
          } else {
            return {
              success: false,
              errors: [
                { code: "AUTH_ERROR", message: "Failed to create user invitation" },
              ],
            };
          }
        } catch (signUpError) {
          console.error("Error creating user invitation:", signUpError);
          return {
            success: false,
            errors: [
              {
                code: "SERVER_ERROR",
                message: "Failed to create user invitation. Please try again.",
              },
            ],
          };
        }
      }
    } catch (error) {
      console.error("Error inviting to campaign:", error);
      return {
        success: false,
        errors: [{ code: "SERVER_ERROR", message: "Failed to send campaign invitation" }],
      };
    }
  });

export const removeCampaignParticipantBan = createServerFn({ method: "POST" })
  .validator(removeCampaignParticipantInputSchema.parse)
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

      const existingParticipant = await findCampaignParticipantById(data.participantId);

      if (
        !existingParticipant ||
        (existingParticipant.campaign as CampaignSummary).ownerId !== currentUser.id
      ) {
        return {
          success: false,
          errors: [
            {
              code: "AUTH_ERROR",
              message: "Not authorized to remove ban from this participant",
            },
          ],
        };
      }

      const [updatedParticipant] = await db
        .update(campaignParticipants)
        .set({
          status: "pending",
          updatedAt: new Date(),
        })
        .where(eq(campaignParticipants.id, data.participantId))
        .returning();

      if (!updatedParticipant) {
        return {
          success: false,
          errors: [{ code: "DATABASE_ERROR", message: "Failed to remove ban" }],
        };
      }

      return { success: true, data: true };
    } catch (error) {
      console.error("Error removing participant ban:", error);
      return {
        success: false,
        errors: [{ code: "SERVER_ERROR", message: "Failed to remove participant ban" }],
      };
    }
  });

/**
 * Respond to a campaign invitation (accept or reject)
 */
export const respondToCampaignInvitation = createServerFn({ method: "POST" })
  .validator(respondToCampaignInvitationSchema.parse)
  .handler(async ({ data }): Promise<OperationResult<CampaignParticipant | boolean>> => {
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

      // Find the participant and validate ownership
      const existingParticipant = await findCampaignParticipantById(data.participantId);

      if (!existingParticipant) {
        return {
          success: false,
          errors: [{ code: "NOT_FOUND", message: "Invitation not found" }],
        };
      }

      // Only the invited user can respond to their invitation
      if (existingParticipant.userId !== currentUser.id) {
        return {
          success: false,
          errors: [
            {
              code: "AUTH_ERROR",
              message: "Not authorized to respond to this invitation",
            },
          ],
        };
      }

      // Check if the participant is in pending status (invited)
      if (existingParticipant.status !== "pending") {
        return {
          success: false,
          errors: [
            {
              code: "CONFLICT",
              message: "This invitation has already been responded to",
            },
          ],
        };
      }

      // Update participant status based on action
      if (data.action === "accept") {
        // Blocklist restriction: invitee cannot accept if blocked any direction with owner
        const rel = await getRelationship(
          currentUser.id,
          (existingParticipant.campaign as CampaignSummary).ownerId,
        );
        if (rel.blocked || rel.blockedBy) {
          return {
            success: false,
            errors: [{ code: "FORBIDDEN", message: "You cannot accept this invitation" }],
          };
        }
      }
      const newStatus = data.action === "accept" ? "approved" : "rejected";

      const [updatedParticipant] = await db
        .update(campaignParticipants)
        .set({
          status: newStatus,
          updatedAt: new Date(),
        })
        .where(eq(campaignParticipants.id, data.participantId))
        .returning();

      if (!updatedParticipant) {
        return {
          success: false,
          errors: [
            { code: "DATABASE_ERROR", message: "Failed to update invitation response" },
          ],
        };
      }

      // Fetch updated participant with user details
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

      // Notify campaign owner of response
      try {
        const campaignFull = await findCampaignById(existingParticipant.campaignId);
        const owner = campaignFull?.owner as {
          email?: string;
          name?: string;
          notificationPreferences?: { socialNotifications?: boolean };
        };
        if (
          owner?.email &&
          owner.notificationPreferences?.socialNotifications !== false
        ) {
          const [{ sendCampaignInviteResponse }] = await Promise.all([
            import("~/lib/email/resend"),
          ]);
          const { getBaseUrl } = await import("~/lib/env.server");
          const baseUrl = getBaseUrl();
          const detailsUrl = `${baseUrl}/dashboard/campaigns/${existingParticipant.campaignId}`;
          await sendCampaignInviteResponse({
            to: {
              email: owner.email,
              name: owner.name ?? undefined,
            },
            ownerName: owner.name || "Owner",
            inviterName: owner.name || "Owner",
            inviteeName: currentUser.name || "User",
            campaignName: campaignFull?.name || "",
            response: newStatus === "approved" ? "accepted" : "declined",
            time: new Date(),
            detailsUrl,
          });
        }
      } catch (notifyError) {
        console.error("Failed to notify owner of campaign invite response:", notifyError);
      }

      return {
        success: true,
        data: participantWithUser as unknown as CampaignParticipant,
      };
    } catch (error) {
      console.error("Error responding to campaign invitation:", error);
      return {
        success: false,
        errors: [{ code: "SERVER_ERROR", message: "Failed to respond to invitation" }],
      };
    }
  });
