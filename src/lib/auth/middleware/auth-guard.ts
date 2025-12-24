import { createMiddleware } from "@tanstack/react-start";
import type { AuthUser } from "~/lib/auth/types";
import { resolveRequestId } from "~/lib/server/request-id";

export type AuthedRequestContext = {
  user: NonNullable<AuthUser>;
  requestId: string;
  organizationId?: string | null;
  organizationRole?: string | null;
};

/**
 * Middleware to force authentication on a server function, and add the user to the context.
 */
export const authMiddleware = createMiddleware({ type: "function" }).server(
  async ({ next, context }) => {
    const { getRequest, setResponseHeader, setResponseStatus } =
      await import("@tanstack/react-start/server");
    const { getAuth } = await import("~/lib/auth/server-helpers");
    const auth = await getAuth();
    const request = getRequest();
    const headers = request.headers;

    const requestId =
      (context as { requestId?: string } | undefined)?.requestId ??
      resolveRequestId(headers);
    setResponseHeader("x-request-id", requestId);

    const session = await auth.api.getSession({
      headers,
      query: {
        disableCookieCache: true,
      },
    });

    const user = session?.user;

    if (!user) {
      setResponseStatus(401);
      const { unauthorized } = await import("~/lib/server/errors");
      throw unauthorized();
    }

    const { isAccountLocked } = await import("~/lib/security/lockout");
    const lock = await isAccountLocked(user.id);
    if (lock) {
      setResponseStatus(423);
      const { forbidden } = await import("~/lib/server/errors");
      throw forbidden("Account locked");
    }

    const authed: AuthedRequestContext = {
      user: user as NonNullable<AuthUser>,
      requestId,
    };

    const organizationId = headers.get("x-organization-id");
    if (organizationId) {
      const { getOrganizationMembership } = await import("~/lib/auth/guards/org-guard");
      const membership = await getOrganizationMembership({
        userId: user.id,
        organizationId,
      });

      if (membership) {
        authed.organizationId = membership.organizationId;
        authed.organizationRole = membership.role;
      }
    }

    const mergedContext = {
      ...(context as Record<string, unknown> | undefined),
      ...authed,
    } as AuthedRequestContext;

    return next({ context: mergedContext });
  },
);
