import { createServerFn } from "@tanstack/react-start";
import { zod$ } from "~/lib/server/fn-utils";
import {
  changePasswordInputSchema,
  notificationPreferencesSchema,
  revokeSessionInputSchema,
  unlinkAccountInputSchema,
} from "./settings.schemas";
import type { ApiResult, NotificationPreferences } from "./settings.types";

export const changePassword = createServerFn({ method: "POST" })
  .validator(zod$(changePasswordInputSchema))
  .handler(async ({ data }) => {
    try {
      const [{ getAuth }, { getWebRequest }] = await Promise.all([
        import("~/lib/auth/server-helpers"),
        import("@tanstack/react-start/server"),
      ]);

      const auth = await getAuth();
      const { headers } = getWebRequest();

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
  .validator(zod$(revokeSessionInputSchema))
  .handler(async ({ data }) => {
    try {
      const [{ getAuth }, { getWebRequest }] = await Promise.all([
        import("~/lib/auth/server-helpers"),
        import("@tanstack/react-start/server"),
      ]);

      const auth = await getAuth();
      const { headers } = getWebRequest();

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
      const [{ getAuth }, { getWebRequest }] = await Promise.all([
        import("~/lib/auth/server-helpers"),
        import("@tanstack/react-start/server"),
      ]);

      const auth = await getAuth();
      const { headers } = getWebRequest();

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
  .validator(zod$(unlinkAccountInputSchema))
  .handler(async ({ data }) => {
    try {
      const [{ getAuth }, { getWebRequest }] = await Promise.all([
        import("~/lib/auth/server-helpers"),
        import("@tanstack/react-start/server"),
      ]);

      const auth = await getAuth();
      const { headers } = getWebRequest();

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

export const updateNotificationPreferences = createServerFn({ method: "POST" })
  .validator(zod$(notificationPreferencesSchema))
  .handler(async ({ data }) => {
    try {
      const [{ getAuth }, { getWebRequest }] = await Promise.all([
        import("~/lib/auth/server-helpers"),
        import("@tanstack/react-start/server"),
      ]);

      const auth = await getAuth();
      const { headers } = getWebRequest();
      const session = await auth.api.getSession({ headers });

      if (!session?.user?.id) {
        return {
          success: false,
          errors: [{ code: "UNAUTHENTICATED", message: "User not authenticated" }],
        } satisfies ApiResult<NotificationPreferences>;
      }

      const [{ getDb }, { user }] = await Promise.all([
        import("~/db/server-helpers"),
        import("~/db/schema"),
      ]);
      const db = await getDb();
      const { eq } = await import("drizzle-orm");

      await db
        .update(user)
        .set({ notificationPreferences: data })
        .where(eq(user.id, session.user.id));

      return {
        success: true,
        data,
      } satisfies ApiResult<NotificationPreferences>;
    } catch (error) {
      console.error("Failed to update notification preferences", error);
      return {
        success: false,
        errors: [
          {
            code: "UNKNOWN_ERROR",
            message: "Failed to update notification preferences",
          },
        ],
      } satisfies ApiResult<NotificationPreferences>;
    }
  });
