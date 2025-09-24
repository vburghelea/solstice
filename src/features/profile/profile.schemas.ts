import { z } from "zod";

export const emergencyContactSchema = z
  .object({
    name: z.string().min(1, "Emergency contact name is required"),
    relationship: z.string().min(1, "Relationship is required"),
    phone: z.string().optional(),
    email: z.email("Invalid emergency contact email").optional(),
  })
  .refine((data) => data.phone || data.email, {
    path: ["phone"], // This will show the error on the phone field
    error: "Please provide at least one contact method (phone or email)",
  });

export const privacySettingsSchema = z.object({
  showEmail: z.boolean(),
  showPhone: z.boolean(),
  showBirthYear: z.boolean(),
  allowTeamInvitations: z.boolean(),
});

export const profileInputSchema = z.object({
  dateOfBirth: z
    .preprocess((arg) => {
      if (typeof arg === "string" && !arg.includes("T")) {
        return new Date(`${arg}T00:00:00.000Z`);
      }
      return typeof arg === "string" ? new Date(arg) : arg;
    }, z.date())
    .refine(
      (date) => {
        const today = new Date();
        let age = today.getUTCFullYear() - date.getUTCFullYear();
        const m = today.getUTCMonth() - date.getUTCMonth();
        if (m < 0 || (m === 0 && today.getUTCDate() < date.getUTCDate())) {
          age--;
        }
        return age >= 13 && age <= 120;
      },
      {
        error: "You must be between 13 and 120 years old",
      },
    ),
  emergencyContact: emergencyContactSchema.optional(),
  gender: z.string().optional(),
  pronouns: z.string().optional(),
  phone: z.string().optional(),
  privacySettings: privacySettingsSchema.optional(),
});

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
