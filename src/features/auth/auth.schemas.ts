import { z } from "zod";
import { PASSWORD_CONFIG } from "~/lib/security/password-config";
import { validatePassword } from "~/lib/security/utils/password-validator";

/**
 * Login form validation schema
 */
export const loginFormSchema = z.object({
  email: z.email("Please enter a valid email").min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginFormData = z.infer<typeof loginFormSchema>;

/**
 * Forgot password form validation schema
 */
export const forgotPasswordFormSchema = z.object({
  email: z.email("Please enter a valid email").min(1, "Email is required"),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordFormSchema>;

/**
 * Reset password form validation schema
 */
export const resetPasswordFormSchema = z.object({
  newPassword: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
});

export type ResetPasswordFormData = z.infer<typeof resetPasswordFormSchema>;

/**
 * Base signup form field schemas
 */
export const signupFormFieldSchemas = {
  name: z
    .string()
    .min(1, "Name is required")
    .min(2, "Name must be at least 2 characters"),
  email: z.email("Please enter a valid email").min(1, "Email is required"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(
      PASSWORD_CONFIG.minLength,
      `Password must be at least ${PASSWORD_CONFIG.minLength} characters`,
    ),
  confirmPassword: z.string().min(1, "Please confirm your password"),
};

/**
 * Signup form field validators for TanStack Form
 */
export const signupFormFields = {
  name: ({ value }: { value: string }) => {
    try {
      signupFormFieldSchemas.name.parse(value);
      return undefined;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return error.issues[0]?.message || "Invalid name";
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
        return error.issues[0]?.message || "Invalid email";
      }
      return "Invalid email";
    }
  },
  password: ({ value }: { value: string }) => {
    try {
      signupFormFieldSchemas.password.parse(value);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return error.issues[0]?.message || "Invalid password";
      }
      return "Invalid password";
    }

    const validation = validatePassword(value);
    if (!validation.isValid) {
      return validation.errors[0] ?? "Password does not meet requirements";
    }

    return undefined;
  },
  confirmPassword: ({ value }: { value: string }) => {
    try {
      signupFormFieldSchemas.confirmPassword.parse(value);
      return undefined;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return error.issues[0]?.message || "Please confirm your password";
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
    path: ["confirmPassword"],
    error: "Passwords do not match",
  });

export type SignupFormData = z.infer<typeof signupFormSchema>;
