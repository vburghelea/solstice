import { z } from "zod";
import { experienceLevelOptions } from "~/shared/types/common";

export const privacySettingsSchema = z.object({
  showEmail: z.boolean(),
  showPhone: z.boolean(),
  showLocation: z.boolean(),
  showLanguages: z.boolean(),
  showGamePreferences: z.boolean(),
  allowTeamInvitations: z.boolean(),
  allowFollows: z.boolean(),
});

export const dayAvailabilitySchema = z.array(z.boolean()).length(96);
export const availabilityDataSchema = z.object({
  monday: dayAvailabilitySchema,
  tuesday: dayAvailabilitySchema,
  wednesday: dayAvailabilitySchema,
  thursday: dayAvailabilitySchema,
  friday: dayAvailabilitySchema,
  saturday: dayAvailabilitySchema,
  sunday: dayAvailabilitySchema,
});

export const profileInputSchema = z.object({
  gender: z.string().optional(),
  pronouns: z.string().optional(),
  phone: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  languages: z.array(z.string()).optional(),
  identityTags: z.array(z.string()).optional(),
  preferredGameThemes: z.array(z.string()).optional(),
  overallExperienceLevel: z.enum(experienceLevelOptions).optional(),
  gameSystemPreferences: z
    .object({
      favorite: z.array(z.object({ id: z.number(), name: z.string() })),
      avoid: z.array(z.object({ id: z.number(), name: z.string() })),
    })
    .optional(),
  calendarAvailability: availabilityDataSchema.optional(),
  privacySettings: privacySettingsSchema.optional(),
  isGM: z.boolean().optional(),
  gmStyle: z.string().optional(),
});

export const completeProfileInputSchema = z.object({
  gender: z.string(),
  pronouns: z.string(),
  phone: z.string(),
  city: z.string().optional(),
  country: z.string().optional(),
  languages: z.array(z.string()).optional(),
  identityTags: z.array(z.string()).optional(),
  preferredGameThemes: z.array(z.string()).optional(),
  overallExperienceLevel: z.enum(experienceLevelOptions).optional(),
  gameSystemPreferences: z
    .object({
      favorite: z.array(z.object({ id: z.number(), name: z.string() })),
      avoid: z.array(z.object({ id: z.number(), name: z.string() })),
    })
    .optional(),
  calendarAvailability: availabilityDataSchema.optional(),
  privacySettings: privacySettingsSchema,
  isGM: z.boolean().optional(),
  gmStyle: z.string().optional(),
});

export const partialProfileInputSchema = profileInputSchema.partial();

export type ProfileInputType = z.infer<typeof profileInputSchema>;
export type CompleteProfileInputType = z.infer<typeof completeProfileInputSchema>;
export type PartialProfileInputType = z.infer<typeof partialProfileInputSchema>;

// Server function input schemas
export const updateUserProfileInputSchema = partialProfileInputSchema;

export const completeUserProfileInputSchema = z.object({
  data: profileInputSchema,
});

export const updatePrivacySettingsInputSchema = z.object({
  data: privacySettingsSchema,
});
