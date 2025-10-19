import { z } from "zod";
import { tCommon } from "~/lib/i18n/server-translations";
import { PASSWORD_CONFIG } from "~/lib/security/password-config";

/**
 * Translation function type for form validators
 */
export type TranslationFunction = (
  key: string,
  options?: Record<string, unknown>,
) => string;

const passwordRequirements = z
  .string({ required_error: tCommon("validation.password_required") })
  .min(PASSWORD_CONFIG.minLength, tCommon("validation.password_too_short"))
  .superRefine((value, ctx) => {
    if (PASSWORD_CONFIG.requireUppercase && !/[A-Z]/.test(value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: tCommon("validation.password_uppercase_required"),
      });
    }

    if (PASSWORD_CONFIG.requireLowercase && !/[a-z]/.test(value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: tCommon("validation.password_lowercase_required"),
      });
    }

    if (PASSWORD_CONFIG.requireNumbers && !/\d/.test(value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: tCommon("validation.password_number_required"),
      });
    }

    if (PASSWORD_CONFIG.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: tCommon("validation.password_special_required"),
      });
    }
  });

export const changePasswordInputSchema = z.object({
  currentPassword: z
    .string({ required_error: tCommon("validation.current_password_required") })
    .min(1, tCommon("validation.current_password_required")),
  newPassword: passwordRequirements,
  revokeOtherSessions: z.boolean().optional(),
});

export const notificationPreferencesSchema = z.object({
  gameReminders: z.boolean(),
  gameUpdates: z.boolean(),
  campaignDigests: z.boolean(),
  campaignUpdates: z.boolean(),
  reviewReminders: z.boolean(),
  socialNotifications: z.boolean(),
});

export const defaultNotificationPreferences: z.infer<
  typeof notificationPreferencesSchema
> = {
  gameReminders: true,
  gameUpdates: true,
  campaignDigests: true,
  campaignUpdates: true,
  reviewReminders: true,
  socialNotifications: false,
};

export const revokeSessionInputSchema = z.object({
  token: z.string({ required_error: "Session token is required" }).min(1),
});

export const unlinkAccountInputSchema = z.object({
  providerId: z
    .string({ required_error: tCommon("validation.provider_required") })
    .min(1, tCommon("validation.provider_required")),
  accountId: z.string().optional(),
});

/**
 * Base password requirements schema (kept with hardcoded messages for server-side compatibility)
 */
const basePasswordRequirements = z
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

/**
 * Base change password input schema (kept with hardcoded messages for server-side compatibility)
 */
export const baseChangePasswordInputSchema = z.object({
  currentPassword: z
    .string({ required_error: tCommon("validation.current_password_required") })
    .min(1, tCommon("validation.current_password_required")),
  newPassword: basePasswordRequirements,
  revokeOtherSessions: z.boolean().optional(),
});

/**
 * Create change password field validators with translation support
 */
export const createChangePasswordFields = (t: TranslationFunction) => ({
  currentPassword: ({ value }: { value: string }) => {
    try {
      baseChangePasswordInputSchema.shape.currentPassword.parse(value);
      return undefined;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.errors?.[0]?.message;
        if (errorMessage?.includes("Current password is required")) {
          return t("common.validation.current_password_required");
        }
        return t("common.validation.required");
      }
      return t("common.validation.required");
    }
  },
  newPassword: ({ value }: { value: string }) => {
    try {
      basePasswordRequirements.parse(value);
      return undefined;
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Check each validation rule
        if (value.length < PASSWORD_CONFIG.minLength) {
          return t("common.validation.password_too_short");
        }

        if (PASSWORD_CONFIG.requireUppercase && !/[A-Z]/.test(value)) {
          return t("common.validation.password_uppercase_required");
        }

        if (PASSWORD_CONFIG.requireLowercase && !/[a-z]/.test(value)) {
          return t("common.validation.password_lowercase_required");
        }

        if (PASSWORD_CONFIG.requireNumbers && !/\d/.test(value)) {
          return t("common.validation.password_number_required");
        }

        if (
          PASSWORD_CONFIG.requireSpecialChars &&
          !/[!@#$%^&*(),.?":{}|<>]/.test(value)
        ) {
          return t("common.validation.password_special_required");
        }

        return t("common.validation.weak_password");
      }
      return t("common.validation.weak_password");
    }
  },
});

/**
 * Create change password schema with translation support
 */
export const createChangePasswordSchema = (t: TranslationFunction) =>
  z.object({
    currentPassword: z
      .string({ required_error: t("common.validation.current_password_required") })
      .min(1, t("common.validation.current_password_required")),
    newPassword: z
      .string({ required_error: t("common.validation.password_required") })
      .min(PASSWORD_CONFIG.minLength, t("common.validation.password_too_short"))
      .superRefine((value, ctx) => {
        if (PASSWORD_CONFIG.requireUppercase && !/[A-Z]/.test(value)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t("common.validation.password_uppercase_required"),
          });
        }

        if (PASSWORD_CONFIG.requireLowercase && !/[a-z]/.test(value)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t("common.validation.password_lowercase_required"),
          });
        }

        if (PASSWORD_CONFIG.requireNumbers && !/\d/.test(value)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t("common.validation.password_number_required"),
          });
        }

        if (
          PASSWORD_CONFIG.requireSpecialChars &&
          !/[!@#$%^&*(),.?":{}|<>]/.test(value)
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t("common.validation.password_special_required"),
          });
        }
      }),
    revokeOtherSessions: z.boolean().optional(),
  });
