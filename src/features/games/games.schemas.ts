import { z } from "zod";
import { gameStatusEnum, gameVisibilityEnum } from "~/db/schema/games.schema";

export const gameLocationSchema = z.object({
  address: z.string().min(1, "Address is required"),
  lat: z.number().min(-90).max(90), // Latitude
  lng: z.number().min(-180).max(180), // Longitude
  placeId: z.string().optional(), // Google Maps Place ID
});

export const minimumRequirementsSchema = z.object({
  languageLevel: z.enum(["beginner", "intermediate", "advanced", "fluent"]).optional(),
  minPlayers: z.number().int().positive().optional(),
  maxPlayers: z.number().int().positive().optional(),
  playerRadiusKm: z.number().int().min(1).max(10).optional(), // Radius in kilometers
  // Add more as needed
});

export const safetyRulesSchema = z.record(z.boolean()).optional(); // e.g., { "no-alcohol": true, "safe-word": false }

export const createGameInputSchema = z.object({
  gameSystemId: z.number().int().positive(),
  name: z.string().min(1, "Game session name is required"),
  dateTime: z.string().datetime(), // ISO string
  description: z.string().min(1, "Description is required"),
  expectedDuration: z.number().positive(), // in hours
  price: z.number().min(0).optional(),
  language: z.string().min(1, "Language is required"),
  location: gameLocationSchema,
  minimumRequirements: minimumRequirementsSchema.optional(),
  visibility: z.enum(gameVisibilityEnum.enumValues).default("public"),
  safetyRules: safetyRulesSchema.optional(),
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
        visibility: z.enum(gameVisibilityEnum.enumValues).optional(),
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
  role: z.enum(["player", "invited", "applicant"]), // Specific roles for adding
  status: z.enum(["approved", "rejected", "pending"]), // Specific statuses for adding
});

export const updateGameParticipantInputSchema = z.object({
  id: z.string().min(1), // Participant ID
  status: z.enum(["approved", "rejected", "pending"]).optional(),
  role: z.enum(["player", "invited", "applicant"]).optional(),
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
    role: z.enum(["player", "invited"]).default("invited"),
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
    location: gameLocationSchema.optional(),
    minimumRequirements: minimumRequirementsSchema.optional(),
    visibility: z.enum(gameVisibilityEnum.enumValues).optional(),
    safetyRules: safetyRulesSchema.optional(),
  });

export type SearchUsersForInvitationInput = z.infer<
  typeof searchUsersForInvitationSchema
>;
export type SearchGameSystemsInput = z.infer<typeof searchGameSystemsSchema>;
