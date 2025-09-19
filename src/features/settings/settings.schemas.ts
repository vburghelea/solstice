import { z } from "zod";
import { PASSWORD_CONFIG } from "~/lib/security/password-config";

const passwordRequirements = z
  .string({ required_error: "Password is required" })
  .min(
    PASSWORD_CONFIG.minLength,
    `Password must be at least ${PASSWORD_CONFIG.minLength} characters long`,
  )
  .superRefine((value, ctx) => {
    if (PASSWORD_CONFIG.requireUppercase && !/[A-Z]/.test(value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Password must include at least one uppercase letter",
      });
    }

    if (PASSWORD_CONFIG.requireLowercase && !/[a-z]/.test(value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Password must include at least one lowercase letter",
      });
    }

    if (PASSWORD_CONFIG.requireNumbers && !/\d/.test(value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Password must include at least one number",
      });
    }

    if (PASSWORD_CONFIG.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Password must include at least one special character",
      });
    }
  });

export const changePasswordInputSchema = z.object({
  currentPassword: z
    .string({ required_error: "Current password is required" })
    .min(1, "Current password is required"),
  newPassword: passwordRequirements,
  revokeOtherSessions: z.boolean().optional(),
});

export const revokeSessionInputSchema = z.object({
  token: z.string({ required_error: "Session token is required" }).min(1),
});

export const unlinkAccountInputSchema = z.object({
  providerId: z
    .string({ required_error: "Provider is required" })
    .min(1, "Provider is required"),
  accountId: z.string().optional(),
});
