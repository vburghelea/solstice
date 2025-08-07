import { z } from "zod";
import {
  campaignParticipantRoleEnum,
  campaignParticipantStatusEnum,
  campaignRecurrenceEnum,
  campaignStatusEnum,
  campaignVisibilityEnum,
} from "~/db/schema/campaigns.schema";

export const campaignLocationSchema = z.object({
  address: z.string().min(1, "Address is required"),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  placeId: z.string().optional(),
});

export const minimumRequirementsSchema = z.object({
  languageLevel: z.enum(["beginner", "intermediate", "advanced", "fluent"]).optional(),
  minPlayers: z.number().int().positive().optional(),
  maxPlayers: z.number().int().positive().optional(),
  playerRadiusKm: z.number().int().min(1).max(10).optional(),
});

export const safetyRulesSchema = z.record(z.boolean()).optional();

export const createCampaignInputSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  description: z.string().min(1, "Description is required"),
  images: z.array(z.string()).nullable().optional(),
  gameSystemId: z.number().int().positive(),
  ownerId: z.string(),
  recurrence: z.enum(campaignRecurrenceEnum.enumValues),
  timeOfDay: z.string(),
  sessionDuration: z.number().positive(),
  pricePerSession: z.number().optional(),
  language: z.string().min(1, "Language is required"),
  location: campaignLocationSchema.optional(),
  minimumRequirements: minimumRequirementsSchema.optional(),
  visibility: z.enum(campaignVisibilityEnum.enumValues).default("public"),
  safetyRules: safetyRulesSchema.optional(),
});

export const addCampaignParticipantInputSchema = z.object({
  campaignId: z.string().min(1),
  userId: z.string().min(1),
  role: z.enum(campaignParticipantRoleEnum.enumValues),
  status: z.enum(campaignParticipantStatusEnum.enumValues),
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
        visibility: z.enum(campaignVisibilityEnum.enumValues).optional(),
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
  status: z.enum(["approved", "rejected"]),
});

export const searchUsersForInvitationSchema = z.object({
  query: z.string().min(1, "Search query cannot be empty"),
});

export const updateCampaignParticipantInputSchema = z.object({
  participantId: z.string().min(1),
  role: z.enum(campaignParticipantRoleEnum.enumValues).optional(),
  status: z.enum(campaignParticipantStatusEnum.enumValues).optional(),
});

export const removeCampaignParticipantInputSchema = z.object({
  participantId: z.string().min(1),
});
