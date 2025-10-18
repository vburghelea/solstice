import { z } from "zod";
import { tCommon } from "~/lib/i18n/server-translations";
import { experienceLevelOptions } from "~/shared/types/common";

/**
 * Translation function type for form validators
 */
export type TranslationFunction = (
  key: string,
  options?: Record<string, unknown>,
) => string;

/**
 * Base profile name schema with server-side translations
 */
export const baseProfileNameSchema = z
  .string()
  .trim()
  .min(3, tCommon("validation.profile_name_too_short"))
  .max(30, tCommon("validation.profile_name_too_long"))
  .regex(/^[A-Za-z0-9._-]+$/, tCommon("validation.profile_name_invalid_chars"));

export const profileNameSchema = baseProfileNameSchema;

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

/**
 * Create profile name field validators with translation support
 */
export const createProfileNameFields = (t: TranslationFunction) => ({
  name: ({ value }: { value: string }) => {
    try {
      baseProfileNameSchema.parse(value);
      return undefined;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.errors?.[0]?.message;
        if (errorMessage?.includes("at least 3 characters")) {
          return t("common.validation.profile_name_too_short");
        }
        if (errorMessage?.includes("30 characters or less")) {
          return t("common.validation.profile_name_too_long");
        }
        if (errorMessage?.includes("can only contain")) {
          return t("common.validation.profile_name_invalid_chars");
        }
        return t("common.validation.invalid_format");
      }
      return t("common.validation.invalid_format");
    }
  },
});

/**
 * Create profile name schema with translation support
 */
export const createProfileNameSchema = (t: TranslationFunction) =>
  z
    .string()
    .trim()
    .min(3, t("common.validation.profile_name_too_short"))
    .max(30, t("common.validation.profile_name_too_long"))
    .regex(/^[A-Za-z0-9._-]+$/, t("common.validation.profile_name_invalid_chars"));
