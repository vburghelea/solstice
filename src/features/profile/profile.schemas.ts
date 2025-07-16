import { z } from "zod";

export const emergencyContactSchema = z
  .object({
    name: z.string().min(1, "Emergency contact name is required"),
    relationship: z.string().min(1, "Relationship is required"),
    phone: z.string().optional(),
    email: z.string().email().optional(),
  })
  .refine(
    (data) => data.phone || data.email,
    "Either phone or email is required for emergency contact",
  );

export const privacySettingsSchema = z.object({
  showEmail: z.boolean(),
  showPhone: z.boolean(),
  showBirthYear: z.boolean(),
  allowTeamInvitations: z.boolean(),
});

export const profileInputSchema = z.object({
  dateOfBirth: z.date().refine(
    (date) => {
      const age = new Date().getFullYear() - date.getFullYear();
      return age >= 13 && age <= 120;
    },
    { message: "Age must be between 13 and 120 years" },
  ),
  emergencyContact: emergencyContactSchema,
  gender: z.string().optional(),
  pronouns: z.string().optional(),
  phone: z.string().optional(),
  privacySettings: privacySettingsSchema.optional(),
});

export const partialProfileInputSchema = profileInputSchema.partial();

export type ProfileInputType = z.infer<typeof profileInputSchema>;
export type PartialProfileInputType = z.infer<typeof partialProfileInputSchema>;
