import { z } from "zod";

/**
 * Login form validation schema
 */
export const loginFormSchema = z.object({
  email: z.string().min(1, "Email is required").email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export type LoginFormData = z.infer<typeof loginFormSchema>;

/**
 * Create login form field validators with translation support
 */
export const createLoginFormFields = (t: TranslationFunction) => ({
  email: ({ value }: { value: string }) => {
    try {
      loginFormSchema.shape.email.parse(value);
      return undefined;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.errors?.[0]?.message;
        // Map specific error messages to translation keys
        if (errorMessage?.includes("Email is required")) {
          return t("common.validation.email_required");
        }
        if (errorMessage?.includes("Please enter a valid email")) {
          return t("common.validation.invalid_email");
        }
        return t("common.validation.invalid_format");
      }
      return t("common.validation.invalid_format");
    }
  },
  password: ({ value }: { value: string }) => {
    try {
      loginFormSchema.shape.password.parse(value);
      return undefined;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.errors?.[0]?.message;
        // Map specific error messages to translation keys
        if (errorMessage?.includes("Password is required")) {
          return t("common.validation.password_required");
        }
        return t("common.validation.invalid_format");
      }
      return t("common.validation.invalid_format");
    }
  },
});

/**
 * Base signup form field schemas (kept with hardcoded messages for server-side compatibility)
 */
export const signupFormFieldSchemas = {
  name: z
    .string()
    .min(1, "Name is required")
    .min(2, "Name must be at least 2 characters"),
  email: z.string().min(1, "Email is required").email("Please enter a valid email"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
};

/**
 * Translation function type for form validators
 */
export type TranslationFunction = (
  key: string,
  options?: Record<string, unknown>,
) => string;

/**
 * Create signup form field validators with translation support
 */
export const createSignupFormFields = (t: TranslationFunction) => ({
  name: ({ value }: { value: string }) => {
    try {
      signupFormFieldSchemas.name.parse(value);
      return undefined;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.errors?.[0]?.message;
        // Map specific error messages to translation keys
        if (errorMessage?.includes("Name is required")) {
          return t("common.validation.name_required");
        }
        if (errorMessage?.includes("Name must be at least 2 characters")) {
          return t("common.validation.name_too_short");
        }
        return t("common.validation.invalid_format");
      }
      return t("common.validation.invalid_format");
    }
  },
  email: ({ value }: { value: string }) => {
    try {
      signupFormFieldSchemas.email.parse(value);
      return undefined;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.errors?.[0]?.message;
        // Map specific error messages to translation keys
        if (errorMessage?.includes("Email is required")) {
          return t("common.validation.email_required");
        }
        if (errorMessage?.includes("Please enter a valid email")) {
          return t("common.validation.invalid_email");
        }
        return t("common.validation.invalid_format");
      }
      return t("common.validation.invalid_format");
    }
  },
  password: ({ value }: { value: string }) => {
    try {
      signupFormFieldSchemas.password.parse(value);
      return undefined;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.errors?.[0]?.message;
        // Map specific error messages to translation keys
        if (errorMessage?.includes("Password is required")) {
          return t("common.validation.password_required");
        }
        if (errorMessage?.includes("Password must be at least 8 characters")) {
          return t("common.validation.password_too_short");
        }
        return t("common.validation.invalid_format");
      }
      return t("common.validation.invalid_format");
    }
  },
  confirmPassword: ({ value }: { value: string }) => {
    try {
      signupFormFieldSchemas.confirmPassword.parse(value);
      return undefined;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.errors?.[0]?.message;
        // Map specific error messages to translation keys
        if (errorMessage?.includes("Please confirm your password")) {
          return t("common.validation.confirm_password_required");
        }
        return t("common.validation.invalid_format");
      }
      return t("common.validation.confirm_password_required");
    }
  },
});

/**
 * Legacy signup form field validators (kept for backward compatibility)
 * @deprecated Use createSignupFormFields(t) instead
 */
export const signupFormFields = {
  name: ({ value }: { value: string }) => {
    try {
      signupFormFieldSchemas.name.parse(value);
      return undefined;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return error.errors?.[0]?.message || "Invalid name";
      }
      return "Invalid name";
    }
  },
  email: ({ value }: { value: string }) => {
    try {
      signupFormFieldSchemas.email.parse(value);
      return undefined;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return error.errors?.[0]?.message || "Invalid email";
      }
      return "Invalid email";
    }
  },
  password: ({ value }: { value: string }) => {
    try {
      signupFormFieldSchemas.password.parse(value);
      return undefined;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return error.errors?.[0]?.message || "Invalid password";
      }
      return "Invalid password";
    }
  },
  confirmPassword: ({ value }: { value: string }) => {
    try {
      signupFormFieldSchemas.confirmPassword.parse(value);
      return undefined;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return error.errors?.[0]?.message || "Please confirm your password";
      }
      return "Please confirm your password";
    }
  },
};

/**
 * Signup form validation schema
 */
export const signupFormSchema = z
  .object(signupFormFieldSchemas)
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type SignupFormData = z.infer<typeof signupFormSchema>;

/**
 * Create signup form validation schema with translation support
 */
export const createSignupFormSchema = (t: TranslationFunction) =>
  z
    .object(signupFormFieldSchemas)
    .refine((data) => data.password === data.confirmPassword, {
      message: t("common.validation.passwords_dont_match"),
      path: ["confirmPassword"],
    });

/**
 * Password reset request form validation schema
 */
export const passwordResetRequestSchema = z.object({
  email: z.string().min(1, "Email is required").email("Please enter a valid email"),
});

/**
 * Reset password form validation schema
 */
export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Reset token is required"),
    password: z
      .string()
      .min(1, "Password is required")
      .min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

/**
 * Create password reset request form field validators with translation support
 */
export const createPasswordResetRequestFields = (t: TranslationFunction) => ({
  email: ({ value }: { value: string }) => {
    try {
      passwordResetRequestSchema.shape.email.parse(value);
      return undefined;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.errors?.[0]?.message;
        // Map specific error messages to translation keys
        if (errorMessage?.includes("Email is required")) {
          return t("common.validation.email_required");
        }
        if (errorMessage?.includes("Please enter a valid email")) {
          return t("common.validation.invalid_email");
        }
        return t("common.validation.invalid_format");
      }
      return t("common.validation.invalid_format");
    }
  },
});

// Create base schema for field validation (without refine)
const baseResetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
});

/**
 * Create reset password form field validators with translation support
 */
export const createResetPasswordFields = (t: TranslationFunction) => ({
  token: ({ value }: { value: string }) => {
    try {
      baseResetPasswordSchema.shape.token.parse(value);
      return undefined;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.errors?.[0]?.message;
        // Map specific error messages to translation keys
        if (errorMessage?.includes("Reset token is required")) {
          return t("common.validation.reset_token_required");
        }
        return t("common.validation.invalid_format");
      }
      return t("common.validation.invalid_format");
    }
  },
  password: ({ value }: { value: string }) => {
    try {
      baseResetPasswordSchema.shape.password.parse(value);
      return undefined;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.errors?.[0]?.message;
        // Map specific error messages to translation keys
        if (errorMessage?.includes("Password is required")) {
          return t("common.validation.password_required");
        }
        if (errorMessage?.includes("Password must be at least 8 characters")) {
          return t("common.validation.password_too_short");
        }
        return t("common.validation.invalid_format");
      }
      return t("common.validation.invalid_format");
    }
  },
  confirmPassword: ({ value }: { value: string }) => {
    try {
      baseResetPasswordSchema.shape.confirmPassword.parse(value);
      return undefined;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.errors?.[0]?.message;
        // Map specific error messages to translation keys
        if (errorMessage?.includes("Please confirm your password")) {
          return t("common.validation.confirm_password_required");
        }
        return t("common.validation.invalid_format");
      }
      return t("common.validation.confirm_password_required");
    }
  },
});

/**
 * Create reset password form validation schema with translation support
 */
export const createResetPasswordSchema = (t: TranslationFunction) =>
  baseResetPasswordSchema.refine((data) => data.password === data.confirmPassword, {
    message: t("common.validation.passwords_dont_match"),
    path: ["confirmPassword"],
  });
