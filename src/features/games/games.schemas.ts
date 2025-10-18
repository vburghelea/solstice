import { z } from "zod";
import { gameStatusEnum } from "~/db/schema/games.schema";
import {
  applicationStatusEnum,
  participantRoleEnum,
  participantStatusEnum,
  visibilityEnum,
} from "~/db/schema/shared.schema"; // Added applicationStatusEnum

import { tCommon } from "~/lib/i18n/server-translations";
import {
  locationSchema,
  minimumRequirementsSchema,
  safetyRulesSchema,
} from "~/shared/schemas/common";

/**
 * Translation function type for form validators
 */
export type TranslationFunction = (
  key: string,
  options?: Record<string, unknown>,
) => string;

export const createGameInputSchema = z.object({
  gameSystemId: z.number().int().positive(),
  ownerId: z.string().optional(),
  name: z.string().min(1, tCommon("validation.game_name_required")),
  dateTime: z.string().datetime(), // ISO string
  description: z.string().min(1, tCommon("validation.description_required")),
  expectedDuration: z.number().positive(), // in hours
  price: z.number().optional(),
  language: z.string().min(1, tCommon("validation.language_required")),
  location: locationSchema,
  minimumRequirements: minimumRequirementsSchema.optional(),
  visibility: z.enum(visibilityEnum.enumValues).default("public"), // Changed to visibilityEnum
  safetyRules: safetyRulesSchema.optional(),
  campaignId: z.string().optional(),
});

export const updateGameInputSchema = createGameInputSchema.partial().extend({
  id: z.string().min(1, tCommon("validation.required")),
  status: z.enum(gameStatusEnum.enumValues).optional(),
});

export const getGameSchema = z.object({
  id: z.string().min(1, tCommon("validation.required")),
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
        userRole: z.enum(participantRoleEnum.enumValues).optional(),
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
  query: z.string().min(3, tCommon("validation.search_term_too_short", { count: 3 })),
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
    name: z.string().optional(),
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
  query: z.string().min(4, tCommon("validation.search_term_too_short", { count: 4 })),
});

export type InviteToGameInput = z.infer<typeof inviteToGameInputSchema>;
export type RespondToGameInvitationInput = z.infer<typeof respondToGameInvitationSchema>;

export const removeGameParticipantBanInputSchema = z.object({
  id: z.string().min(1), // Participant ID
});

export type RemoveGameParticipantBanInput = z.infer<
  typeof removeGameParticipantBanInputSchema
>;
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

/**
 * Base game form field schemas with server-side translations
 */
export const baseGameFormFieldSchemas = {
  gameSystemId: z.number().int().positive(),
  name: z.string().min(1, tCommon("validation.game_name_required")),
  dateTime: z.string().datetime(),
  description: z.string().min(1, tCommon("validation.description_required")),
  expectedDuration: z.number().positive(),
  price: z.number().optional(),
  language: z.string().min(1, tCommon("validation.language_required")),
  location: locationSchema,
  minimumRequirements: minimumRequirementsSchema.optional(),
  visibility: z.enum(visibilityEnum.enumValues).default("public"),
  safetyRules: safetyRulesSchema.optional(),
  campaignId: z.string().optional(),
};

/**
 * Create game form field validators with translation support
 */
export const createGameFormFields = (t: TranslationFunction) => ({
  gameSystemId: ({ value }: { value: number }) => {
    try {
      baseGameFormFieldSchemas.gameSystemId.parse(value);
      return undefined;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.errors?.[0]?.message;
        if (errorMessage?.includes("positive")) {
          return t("common.validation.positive_number");
        }
        if (errorMessage?.includes("integer")) {
          return t("common.validation.invalid_number");
        }
        return t("common.validation.invalid_format");
      }
      return t("common.validation.invalid_format");
    }
  },
  name: ({ value }: { value: string }) => {
    try {
      baseGameFormFieldSchemas.name.parse(value);
      return undefined;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.errors?.[0]?.message;
        if (errorMessage?.includes("Game session name is required")) {
          return t("common.validation.game_name_required");
        }
        return t("common.validation.required");
      }
      return t("common.validation.required");
    }
  },
  dateTime: ({ value }: { value: string }) => {
    try {
      baseGameFormFieldSchemas.dateTime.parse(value);
      return undefined;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return t("common.validation.invalid_date");
      }
      return t("common.validation.invalid_date");
    }
  },
  description: ({ value }: { value: string }) => {
    try {
      baseGameFormFieldSchemas.description.parse(value);
      return undefined;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.errors?.[0]?.message;
        if (errorMessage?.includes("Description is required")) {
          return t("common.validation.description_required");
        }
        return t("common.validation.required");
      }
      return t("common.validation.required");
    }
  },
  expectedDuration: ({ value }: { value: number }) => {
    try {
      baseGameFormFieldSchemas.expectedDuration.parse(value);
      return undefined;
    } catch (error) {
      if (error instanceof z.ZodError) {
        if (value <= 0) {
          return t("common.validation.positive_number");
        }
        return t("common.validation.invalid_number");
      }
      return t("common.validation.invalid_number");
    }
  },
  language: ({ value }: { value: string }) => {
    try {
      baseGameFormFieldSchemas.language.parse(value);
      return undefined;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.errors?.[0]?.message;
        if (errorMessage?.includes("Language is required")) {
          return t("common.validation.language_required");
        }
        return t("common.validation.required");
      }
      return t("common.validation.required");
    }
  },
  location: ({ value }: { value: unknown }) => {
    if (!value || typeof value !== "object") {
      return t("common.validation.invalid_format");
    }
    return undefined;
  },
});

/**
 * Create search games field validators with translation support
 */
export const createSearchGamesFields = (t: TranslationFunction) => ({
  query: ({ value }: { value: string }) => {
    try {
      searchGamesSchema.shape.query.parse(value);
      return undefined;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.errors?.[0]?.message;
        if (errorMessage?.includes("at least 3 characters")) {
          return t("common.validation.search_term_too_short", { count: 3 });
        }
        return t("common.validation.min_length", { count: 3 });
      }
      return t("common.validation.min_length", { count: 3 });
    }
  },
});

/**
 * Create invite to game field validators with translation support
 */
export const createInviteToGameFields = (t: TranslationFunction) => ({
  gameId: ({ value }: { value: string }) => {
    if (!value || value.trim() === "") {
      return t("common.validation.required");
    }
    return undefined;
  },
  userId: ({ value }: { value: string }) => {
    if (!value) {
      // Check if email is provided instead
      return undefined; // Will be handled by refine
    }
    return undefined;
  },
  email: ({ value }: { value: string }) => {
    if (!value) {
      // Check if userId is provided instead
      return undefined; // Will be handled by refine
    }
    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return t("common.validation.invalid_email");
    }
    return undefined;
  },
  name: () => {
    return undefined; // Optional field
  },
  role: ({ value }: { value: string }) => {
    if (
      !value ||
      !participantRoleEnum.enumValues.includes(
        value as (typeof participantRoleEnum.enumValues)[number],
      )
    ) {
      return t("common.validation.invalid_format");
    }
    return undefined;
  },
});

/**
 * Create invite to game schema with translation support
 */
export const createInviteToGameSchema = (t: TranslationFunction) =>
  z
    .object({
      gameId: z.string().min(1),
      userId: z.string().min(1).optional(),
      email: z.string().email().optional(),
      name: z.string().optional(),
      role: z.enum(participantRoleEnum.enumValues).default("invited"),
    })
    .refine((data) => data.userId || data.email, {
      message: t("common.validation.either_user_email_required"),
    });

/**
 * Create search users for invitation field validators with translation support
 */
export const createSearchUsersForInvitationFields = (t: TranslationFunction) => ({
  query: ({ value }: { value: string }) => {
    try {
      searchUsersForInvitationSchema.shape.query.parse(value);
      return undefined;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.errors?.[0]?.message;
        if (errorMessage?.includes("at least 4 characters")) {
          return t("common.validation.search_term_too_short", { count: 4 });
        }
        return t("common.validation.min_length", { count: 4 });
      }
      return t("common.validation.min_length", { count: 4 });
    }
  },
});
