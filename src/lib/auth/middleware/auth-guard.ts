import { createMiddleware } from "@tanstack/react-start";
import type { AuthUser } from "~/lib/auth/types";
import { resolveRequestId } from "~/lib/server/request-id";

export type AuthedRequestContext = {
  user: NonNullable<AuthUser>;
  requestId: string;
  organizationId?: string | null;
  organizationRole?: string | null;
};

const getCookieValue = (headers: Headers, name: string) => {
  const cookieHeader = headers.get("cookie");
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(";").map((entry) => entry.trim());
  const prefix = `${name}=`;
  for (const cookie of cookies) {
    if (cookie.startsWith(prefix)) {
      return decodeURIComponent(cookie.slice(prefix.length));
    }
  }
  return null;
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

    const contextOrgId =
      (context as { organizationId?: string | null } | undefined)?.organizationId ?? null;
    const contextOrgRole =
      (context as { organizationRole?: string | null } | undefined)?.organizationRole ??
      null;
    const headerOrgId = headers.get("x-organization-id");
    const cookieOrgId = getCookieValue(headers, "active_org_id");
    const requestedOrgId = headerOrgId ?? contextOrgId ?? cookieOrgId ?? null;

    if (requestedOrgId) {
      if (contextOrgId === requestedOrgId && contextOrgRole) {
        authed.organizationId = contextOrgId;
        authed.organizationRole = contextOrgRole;
      } else {
        const { resolveOrganizationAccess } =
          await import("~/features/organizations/organizations.access");
        const access = await resolveOrganizationAccess({
          userId: user.id,
          organizationId: requestedOrgId,
        });

        if (access) {
          authed.organizationId = access.organizationId;
          authed.organizationRole = access.role;
        }
      }
    }

    const mergedContext = {
      ...(context as Record<string, unknown> | undefined),
      ...authed,
    } as AuthedRequestContext;

    return next({ context: mergedContext });
  },
);
