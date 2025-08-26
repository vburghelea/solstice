import { createServerFn } from "@tanstack/react-start";
import { OperationResult } from "~/shared/types/common";
import { passwordResetRequestSchema, resetPasswordSchema } from "./auth.schemas";

export const requestPasswordReset = createServerFn({ method: "POST" })
  .validator(passwordResetRequestSchema.parse)
  .handler(async ({ data }): Promise<OperationResult<boolean>> => {
    try {
      const { getAuth } = await import("~/lib/auth/server-helpers");
      const auth = await getAuth();

      console.log("Attempting to send password reset email for:", data.email);
      await auth.api.forgetPassword({ body: { email: data.email } });

      return { success: true, data: true };
    } catch (error) {
      console.error("Error requesting password reset:", error);
      return {
        success: false,
        errors: [
          {
            code: "SERVER_ERROR",
            message: (error as Error).message || "Failed to send password reset email",
          },
        ],
      };
    }
  });

export const resetPassword = createServerFn({ method: "POST" })
  .validator(resetPasswordSchema.parse)
  .handler(async ({ data }): Promise<OperationResult<boolean>> => {
    try {
      const { getAuth } = await import("~/lib/auth/server-helpers");
      const auth = await getAuth();

      await auth.api.resetPassword({
        body: { token: data.token, newPassword: data.password },
      });

      return { success: true, data: true };
    } catch (error) {
      console.error("Error resetting password:", error);
      return {
        success: false,
        errors: [
          {
            code: "SERVER_ERROR",
            message: (error as Error).message || "Failed to reset password",
          },
        ],
      };
    }
  });
