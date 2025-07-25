import { z } from "zod";

export const privacySettingsSchema = z.object({
  showEmail: z.boolean(),
  showPhone: z.boolean(),
  allowTeamInvitations: z.boolean(),
});

export const profileInputSchema = z
  .object({
    gender: z.string().optional(),
    pronouns: z.string().optional(),
    phone: z.string().optional(),
    gameSystemPreferences: z
      .object({
        favorite: z.array(z.number()),
        avoid: z.array(z.number()),
      })
      .optional(),
    privacySettings: privacySettingsSchema.optional(),
  })
  .partial();

export const partialProfileInputSchema = profileInputSchema.partial();

export type ProfileInputType = z.infer<typeof profileInputSchema>;
export type PartialProfileInputType = z.infer<typeof partialProfileInputSchema>;

// Server function input schemas
export const updateUserProfileInputSchema = z.object({
  data: partialProfileInputSchema,
});

export const completeUserProfileInputSchema = z.object({
  data: profileInputSchema,
});

export const updatePrivacySettingsInputSchema = z.object({
  data: privacySettingsSchema,
});
