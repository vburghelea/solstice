import { createServerFn } from "@tanstack/react-start";
import { zod$ } from "~/lib/server/fn-utils";
import {
  changePasswordInputSchema,
  revokeSessionInputSchema,
  unlinkAccountInputSchema,
} from "./settings.schemas";
import type { ApiResult } from "./settings.types";

export const changePassword = createServerFn({ method: "POST" })
  .inputValidator(zod$(changePasswordInputSchema))
  .handler(async ({ data }) => {
    try {
      const [{ getAuth }, { getRequest }] = await Promise.all([
        import("~/lib/auth/server-helpers"),
        import("@tanstack/react-start/server"),
      ]);

      const auth = await getAuth();
      const { headers } = getRequest();

      await auth.api.changePassword({
        headers,
        body: {
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
          revokeOtherSessions: data.revokeOtherSessions ?? false,
        },
      });

      return {
        success: true,
      } satisfies ApiResult<null>;
    } catch (error) {
      console.error("Failed to change password", error);
      const message =
        error instanceof Error
          ? error.message
          : "Unable to update password. Please try again.";
      return {
        success: false,
        errors: [
          {
            code: "CHANGE_PASSWORD_FAILED",
            message,
          },
        ],
      } satisfies ApiResult<null>;
    }
  });

export const revokeSession = createServerFn({ method: "POST" })
  .inputValidator(zod$(revokeSessionInputSchema))
  .handler(async ({ data }) => {
    try {
      const [{ getAuth }, { getRequest }] = await Promise.all([
        import("~/lib/auth/server-helpers"),
        import("@tanstack/react-start/server"),
      ]);

      const auth = await getAuth();
      const { headers } = getRequest();

      await auth.api.revokeSession({
        headers,
        body: { token: data.token },
      });

      return {
        success: true,
      } satisfies ApiResult<null>;
    } catch (error) {
      console.error("Failed to revoke session", error);
      const message =
        error instanceof Error
          ? error.message
          : "Unable to revoke session. Please try again.";
      return {
        success: false,
        errors: [
          {
            code: "REVOKE_SESSION_FAILED",
            message,
          },
        ],
      } satisfies ApiResult<null>;
    }
  });

export const revokeOtherSessions = createServerFn({ method: "POST" }).handler(
  async () => {
    try {
      const [{ getAuth }, { getRequest }] = await Promise.all([
        import("~/lib/auth/server-helpers"),
        import("@tanstack/react-start/server"),
      ]);

      const auth = await getAuth();
      const { headers } = getRequest();

      await auth.api.revokeOtherSessions({ headers });

      return {
        success: true,
      } satisfies ApiResult<null>;
    } catch (error) {
      console.error("Failed to revoke other sessions", error);
      const message =
        error instanceof Error
          ? error.message
          : "Unable to revoke other sessions. Please try again.";
      return {
        success: false,
        errors: [
          {
            code: "REVOKE_OTHER_SESSIONS_FAILED",
            message,
          },
        ],
      } satisfies ApiResult<null>;
    }
  },
);

export const unlinkAccount = createServerFn({ method: "POST" })
  .inputValidator(zod$(unlinkAccountInputSchema))
  .handler(async ({ data }) => {
    try {
      const [{ getAuth }, { getRequest }] = await Promise.all([
        import("~/lib/auth/server-helpers"),
        import("@tanstack/react-start/server"),
      ]);

      const auth = await getAuth();
      const { headers } = getRequest();

      await auth.api.unlinkAccount({
        headers,
        body: {
          providerId: data.providerId,
          accountId: data.accountId,
        },
      });

      return {
        success: true,
      } satisfies ApiResult<null>;
    } catch (error) {
      console.error("Failed to unlink account", error);
      const message =
        error instanceof Error
          ? error.message
          : "Unable to unlink account. Please try again.";
      return {
        success: false,
        errors: [
          {
            code: "UNLINK_ACCOUNT_FAILED",
            message,
          },
        ],
      } satisfies ApiResult<null>;
    }
  });
