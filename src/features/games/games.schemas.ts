import { z } from "zod";
import { gameStatusEnum } from "~/db/schema/games.schema";
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

export const createGameInputSchema = z.object({
  gameSystemId: z.number().int().positive(),
  ownerId: z.string().optional(),
  name: z.string().min(1, "Game session name is required"),
  dateTime: z.string().datetime(), // ISO string
  description: z.string().min(1, "Description is required"),
  expectedDuration: z.number().positive(), // in hours
  price: z.number().optional(),
  language: z.string().min(1, "Language is required"),
  location: locationSchema,
  minimumRequirements: minimumRequirementsSchema.optional(),
  visibility: z.enum(visibilityEnum.enumValues).default("public"), // Changed to visibilityEnum
  safetyRules: safetyRulesSchema.optional(),
  campaignId: z.string().optional(),
});

export const updateGameInputSchema = createGameInputSchema.partial().extend({
  id: z.string().min(1),
  status: z.enum(gameStatusEnum.enumValues).optional(),
});

export const getGameSchema = z.object({
  id: z.string().min(1),
});

export const listGamesSchema = z
  .object({
    filters: z
      .object({
        gameSystemId: z.number().int().positive().optional(),
        status: z.enum(gameStatusEnum.enumValues).optional(),
        visibility: z.enum(visibilityEnum.enumValues).optional(), // Changed to visibilityEnum
        ownerId: z.string().optional(),
        participantId: z.string().optional(),
        dateFrom: z.string().datetime().optional(),
        dateTo: z.string().datetime().optional(),
        searchTerm: z.string().optional(),
      })
      .optional(),
  })
  .nullable()
  .transform((val) => (val === null ? {} : val))
  .default({});

export const searchGamesSchema = z.object({
  query: z.string().min(3, "Search term must be at least 3 characters"),
});

export const addGameParticipantInputSchema = z.object({
  gameId: z.string().min(1),
  userId: z.string().min(1),
  role: z.enum(participantRoleEnum.enumValues),
  status: z.enum(participantStatusEnum.enumValues),
});

export const updateGameParticipantInputSchema = z.object({
  id: z.string().min(1), // Participant ID
  status: z.enum(participantStatusEnum.enumValues).optional(),
  role: z.enum(participantRoleEnum.enumValues).optional(),
});

export const removeGameParticipantInputSchema = z.object({
  id: z.string().min(1), // Participant ID
});

export const applyToGameInputSchema = z.object({
  gameId: z.string().min(1),
  message: z.string().optional(),
});

export const inviteToGameInputSchema = z
  .object({
    gameId: z.string().min(1),
    userId: z.string().min(1).optional(), // Either userId or email
    email: z.string().email().optional(),
    role: z.enum(participantRoleEnum.enumValues).default("invited"),
  })
  .refine((data) => data.userId || data.email, {
    message: "Either userId or email must be provided",
  });

export const respondToGameInvitationSchema = z.object({
  participantId: z.string().min(1),
  action: z.enum(["accept", "reject"]),
});

export type CreateGameInput = z.infer<typeof createGameInputSchema>;
export type UpdateGameInput = z.infer<typeof updateGameInputSchema>;
export type GetGameInput = z.infer<typeof getGameSchema>;
export type ListGamesInput = z.infer<typeof listGamesSchema>;
export type SearchGamesInput = z.infer<typeof searchGamesSchema>;
export type AddGameParticipantInput = z.infer<typeof addGameParticipantInputSchema>;
export type UpdateGameParticipantInput = z.infer<typeof updateGameParticipantInputSchema>;
export type RemoveGameParticipantInput = z.infer<typeof removeGameParticipantInputSchema>;
export type ApplyToGameInput = z.infer<typeof applyToGameInputSchema>;
export const searchUsersForInvitationSchema = z.object({
  query: z.string().min(4, "Search term must be at least 4 characters"),
});

export type InviteToGameInput = z.infer<typeof inviteToGameInputSchema>;
export type RespondToGameInvitationInput = z.infer<typeof respondToGameInvitationSchema>;
export const searchGameSystemsSchema = z.object({
  query: z.string().min(3, "Search term must be at least 3 characters"),
});

export const gameFormSchema = createGameInputSchema
  .extend({
    id: z.string().optional(),
    status: z.enum(gameStatusEnum.enumValues).optional(),
  })
  .partial()
  .extend({
    // For form validation, we want to allow empty values initially
    // but still validate the types when values are provided
    gameSystemId: z.number().int().positive().optional(),
    name: z.string().optional(),
    dateTime: z.string().optional(),
    description: z.string().optional(),
    expectedDuration: z.number().positive().optional(),
    price: z.number().min(0).optional(),
    language: z.string().optional(),
    location: locationSchema.optional(),
    minimumRequirements: minimumRequirementsSchema.optional(),
    visibility: z.enum(visibilityEnum.enumValues).optional(), // Changed to visibilityEnum
    safetyRules: safetyRulesSchema.optional(),
  });

export type SearchUsersForInvitationInput = z.infer<
  typeof searchUsersForInvitationSchema
>;
export type SearchGameSystemsInput = z.infer<typeof searchGameSystemsSchema>;

export const listGameSessionsByCampaignIdSchema = z.object({
  campaignId: z.string().min(1),
  status: z.enum(gameStatusEnum.enumValues).optional(),
});

export type ListGameSessionsByCampaignIdInput = z.infer<
  typeof listGameSessionsByCampaignIdSchema
>;

export const createGameSessionForCampaignInputSchema = createGameInputSchema.extend({
  campaignId: z.string().min(1),
});

export const updateGameSessionStatusInputSchema = z.object({
  gameId: z.string().min(1),
  status: z.enum(gameStatusEnum.enumValues),
});

export type CreateGameSessionForCampaignInput = z.infer<
  typeof createGameSessionForCampaignInputSchema
>;
export type UpdateGameSessionStatusInput = z.infer<
  typeof updateGameSessionStatusInputSchema
>;

export const respondToGameApplicationSchema = z.object({
  applicationId: z.string().min(1),
  status: z.enum(applicationStatusEnum.enumValues),
});

export type RespondToGameApplicationInput = z.infer<
  typeof respondToGameApplicationSchema
>;

export const getGameApplicationForUserInputSchema = z.object({
  gameId: z.string().min(1),
  userId: z.string().min(1),
});

export type GetGameApplicationForUserInput = z.infer<
  typeof getGameApplicationForUserInputSchema
>;
