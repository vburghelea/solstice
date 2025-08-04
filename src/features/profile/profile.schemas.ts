import { z } from "zod";

export const privacySettingsSchema = z.object({
  showEmail: z.boolean(),
  showPhone: z.boolean(),
  allowTeamInvitations: z.boolean(),
});

export const profileInputSchema = z.object({
  gender: z.string().optional(),
  pronouns: z.string().optional(),
  phone: z.string().optional(),
  gameSystemPreferences: z
    .object({
      favorite: z.array(z.object({ id: z.number(), name: z.string() })),
      avoid: z.array(z.object({ id: z.number(), name: z.string() })),
    })
    .optional(),
  privacySettings: privacySettingsSchema.optional(),
});

export const completeProfileInputSchema = z.object({
  gender: z.string(),
  pronouns: z.string(),
  phone: z.string(),
  gameSystemPreferences: z
    .object({
      favorite: z.array(z.object({ id: z.number(), name: z.string() })),
      avoid: z.array(z.object({ id: z.number(), name: z.string() })),
    })
    .optional(),
  privacySettings: privacySettingsSchema,
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
