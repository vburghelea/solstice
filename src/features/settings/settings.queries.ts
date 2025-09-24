import { createServerFn } from "@tanstack/react-start";
import type {
  ApiResult,
  LinkedAccountsOverview,
  SessionsOverview,
} from "./settings.types";

const AVAILABLE_PROVIDERS = ["email", "google"] as const;

export const getSessionsOverview = createServerFn({ method: "GET" }).handler(
  async (): Promise<ApiResult<SessionsOverview>> => {
    try {
      const [{ getAuth }, { getRequest }] = await Promise.all([
        import("~/lib/auth/server-helpers"),
        import("@tanstack/react-start/server"),
      ]);

      const auth = await getAuth();
      const { headers } = getRequest();

      const [sessionResult, sessions] = await Promise.all([
        auth.api.getSession({ headers }),
        auth.api.listSessions({ headers }),
      ]);

      if (!sessionResult?.session?.token) {
        return {
          success: false,
          errors: [{ code: "UNAUTHENTICATED", message: "User not authenticated" }],
        };
      }

      const currentToken = sessionResult.session.token;

      const data: SessionsOverview = {
        currentSessionToken: currentToken,
        sessions: sessions.map((session) => ({
          id: session.id,
          token: session.token,
          createdAt: session.createdAt.toISOString(),
          updatedAt: session.updatedAt.toISOString(),
          expiresAt: session.expiresAt.toISOString(),
          ipAddress: session.ipAddress ?? null,
          userAgent: session.userAgent ?? null,
          isCurrent: session.token === currentToken,
        })),
      };

      return { success: true, data };
    } catch (error) {
      console.error("Failed to load sessions overview", error);
      return {
        success: false,
        errors: [
          {
            code: "UNKNOWN_ERROR",
            message: "Failed to load active sessions",
          },
        ],
      };
    }
  },
);

export const getAccountOverview = createServerFn({ method: "GET" }).handler(
  async (): Promise<
    ApiResult<
      LinkedAccountsOverview & {
        user: { id: string; name: string; email: string; emailVerified: boolean };
        hasPassword: boolean;
        availableProviders: string[];
      }
    >
  > => {
    try {
      const [{ getAuth }, { getRequest }] = await Promise.all([
        import("~/lib/auth/server-helpers"),
        import("@tanstack/react-start/server"),
      ]);

      const auth = await getAuth();
      const { headers } = getRequest();

      const sessionResult = await auth.api.getSession({ headers });
      if (!sessionResult?.user?.id) {
        return {
          success: false,
          errors: [{ code: "UNAUTHENTICATED", message: "User not authenticated" }],
        };
      }

      const accounts = await auth.api.listUserAccounts({ headers });

      const normalizedAccounts = accounts.map((account) => ({
        id: account.id,
        providerId: account.providerId,
        accountId: account.accountId,
        createdAt: account.createdAt.toISOString(),
        updatedAt: account.updatedAt.toISOString(),
        scopes: account.scopes ?? [],
      }));

      const hasPassword = normalizedAccounts.some(
        (account) => account.providerId.toLowerCase() === "email",
      );

      return {
        success: true,
        data: {
          user: {
            id: sessionResult.user.id,
            name: sessionResult.user.name,
            email: sessionResult.user.email,
            emailVerified: sessionResult.user.emailVerified ?? false,
          },
          accounts: normalizedAccounts,
          hasPassword,
          availableProviders: Array.from(AVAILABLE_PROVIDERS),
        },
      };
    } catch (error) {
      console.error("Failed to load account overview", error);
      return {
        success: false,
        errors: [
          {
            code: "UNKNOWN_ERROR",
            message: "Failed to load account settings",
          },
        ],
      };
    }
  },
);
