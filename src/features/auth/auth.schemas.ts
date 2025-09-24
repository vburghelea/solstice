import { z } from "zod";

/**
 * Login form validation schema
 */
export const loginFormSchema = z.object({
  email: z.email("Please enter a valid email").min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginFormData = z.infer<typeof loginFormSchema>;

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
    .min(8, "Password must be at least 8 characters"),
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
      return undefined;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return error.issues[0]?.message || "Invalid password";
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
