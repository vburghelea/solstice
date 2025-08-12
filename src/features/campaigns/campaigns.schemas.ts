import { z } from "zod";
import { campaignRecurrenceEnum, campaignStatusEnum } from "~/db/schema/campaigns.schema"; // Removed campaignVisibilityEnum
import {
  applicationStatusEnum,
  participantRoleEnum,
  participantStatusEnum,
  visibilityEnum,
} from "~/db/schema/shared.schema"; // Added applicationStatusEnum

import {
  locationSchema,
  minimumRequirementsSchema,
  safetyRulesSchema,
} from "~/shared/schemas/common";

export const createCampaignInputSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  description: z.string().min(1, "Description is required"),
  images: z.array(z.string()).nullable().optional(),
  gameSystemId: z.number().int().positive(),
  ownerId: z.string().optional(),
  recurrence: z.enum(campaignRecurrenceEnum.enumValues),
  timeOfDay: z.string(),
  sessionDuration: z.number().positive(),
  pricePerSession: z.number().nullable().optional(),
  language: z.string().min(1, "Language is required"),
  location: locationSchema.optional(),
  minimumRequirements: minimumRequirementsSchema.optional(),
  visibility: z.enum(visibilityEnum.enumValues), // Changed to visibilityEnum
  safetyRules: safetyRulesSchema.optional(),
});

export const addCampaignParticipantInputSchema = z.object({
  campaignId: z.string().min(1),
  userId: z.string().min(1),
  role: z.enum(participantRoleEnum.enumValues),
  status: z.enum(participantStatusEnum.enumValues),
});

export const updateCampaignInputSchema = createCampaignInputSchema.partial().extend({
  id: z.string().min(1),
  gameSystemId: z.number().int().optional(),
  status: z.enum(campaignStatusEnum.enumValues).optional(),
});

export const getCampaignSchema = z.object({
  id: z.string().min(1),
});

export const listCampaignsSchema = z
  .object({
    filters: z
      .object({
        status: z.enum(campaignStatusEnum.enumValues).optional(),
        visibility: z.enum(visibilityEnum.enumValues).optional(), // Changed to visibilityEnum
        ownerId: z.string().optional(),
        participantId: z.string().optional(),
        searchTerm: z.string().optional(),
      })
      .optional(),
  })
  .nullable()
  .transform((val) => (val === null ? {} : val))
  .default({});

export const applyToCampaignInputSchema = z.object({
  campaignId: z.string().min(1),
  message: z.string().optional(),
});

export const inviteToCampaignInputSchema = z
  .object({
    campaignId: z.string().min(1),
    userId: z.string().min(1).optional(),
    email: z.string().email().optional(),
  })
  .refine((data) => data.userId || data.email, {
    message: "Either userId or email must be provided",
  });

export const respondToCampaignApplicationSchema = z.object({
  applicationId: z.string().min(1),
  status: z.enum(applicationStatusEnum.enumValues),
});

export const searchUsersForInvitationSchema = z.object({
  query: z.string().min(1, "Search query cannot be empty"),
});

export const updateCampaignParticipantInputSchema = z.object({
  participantId: z.string().min(1),
  role: z.enum(participantRoleEnum.enumValues).optional(),
  status: z.enum(participantStatusEnum.enumValues).optional(),
});

export const removeCampaignParticipantInputSchema = z.object({
  participantId: z.string().min(1),
});

export const getCampaignApplicationForUserInputSchema = z.object({
  campaignId: z.string().min(1),
  userId: z.string().min(1),
});

export type GetCampaignApplicationForUserInput = z.infer<
  typeof getCampaignApplicationForUserInputSchema
>;
