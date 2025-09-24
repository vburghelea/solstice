import { z } from "zod";
import { experienceLevelOptions } from "~/shared/types/common";

export const profileNameSchema = z
  .string()
  .trim()
  .min(3, "Profile name must be at least 3 characters")
  .max(30, "Profile name must be 30 characters or less")
  .regex(
    /^[A-Za-z0-9._-]+$/,
    "Profile name can only contain letters, numbers, periods, underscores, and hyphens",
  );

export const privacySettingsSchema = z.object({
  showEmail: z.boolean(),
  showPhone: z.boolean(),
  showLocation: z.boolean(),
  showLanguages: z.boolean(),
  showGamePreferences: z.boolean(),
  allowTeamInvitations: z.boolean(),
  allowFollows: z.boolean(),
  allowInvitesOnlyFromConnections: z.boolean().optional(),
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
  name: profileNameSchema.optional(),
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
  notificationPreferences: z
    .object({
      gameReminders: z.boolean(),
      gameUpdates: z.boolean(),
      campaignDigests: z.boolean(),
      campaignUpdates: z.boolean(),
      reviewReminders: z.boolean(),
      socialNotifications: z.boolean(),
    })
    .optional(),
  isGM: z.boolean().optional(),
  gmStyle: z.string().optional(),
});

export const completeProfileInputSchema = profileInputSchema.extend({
  name: profileNameSchema,
  gender: z.string(),
  pronouns: z.string(),
  phone: z.string(),
  privacySettings: privacySettingsSchema,
});

export const partialProfileInputSchema = profileInputSchema.partial();

export type ProfileInputType = z.infer<typeof profileInputSchema>;
export type CompleteProfileInputType = z.infer<typeof completeProfileInputSchema>;
export type PartialProfileInputType = z.infer<typeof partialProfileInputSchema>;

// Server function input schemas
export const updateUserProfileInputSchema = partialProfileInputSchema;

export const completeUserProfileInputSchema = z.object({
  data: completeProfileInputSchema,
});

export const updatePrivacySettingsInputSchema = z.object({
  data: privacySettingsSchema,
});

export const listUserLocationsSchema = z
  .object({
    limitPerCountry: z.number().int().min(1).max(50).optional(),
  })
  .optional();

export type ListUserLocationsInput = z.infer<typeof listUserLocationsSchema>;
