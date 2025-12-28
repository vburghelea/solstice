import { createMiddleware } from "@tanstack/react-start";
import type { AuthUser } from "~/lib/auth/types";
import { resolveRequestId } from "~/lib/server/request-id";

export type AuthedRequestContext = {
  user: NonNullable<AuthUser>;
  requestId: string;
  organizationId?: string | null;
  organizationRole?: string | null;
};

const ADMIN_MAX_AGE_MS = 4 * 60 * 60 * 1000;
const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
const ACTIVITY_UPDATE_INTERVAL_MS = 5 * 60 * 1000;

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
    const { extractSessionTimes, getSessionFromHeaders } =
      await import("~/lib/auth/session");
    const request = getRequest();
    const headers = request.headers;

    const requestId =
      (context as { requestId?: string } | undefined)?.requestId ??
      resolveRequestId(headers);
    setResponseHeader("x-request-id", requestId);

    const session = await getSessionFromHeaders(headers);

    const user = session?.user;

    if (!user) {
      setResponseStatus(401);
      const { unauthorized } = await import("~/lib/server/errors");
      throw unauthorized();
    }

    const sessionRecord = session?.session ?? null;
    const sessionId = sessionRecord?.id ?? null;
    const sessionToken = sessionRecord?.token ?? null;

    const now = new Date();
    const nowMs = now.getTime();
    const { authenticatedAt } = extractSessionTimes(session ?? undefined);

    if (sessionId || sessionToken) {
      const { getDb } = await import("~/db/server-helpers");
      const { session: sessionTable } = await import("~/db/schema");
      const { eq } = await import("drizzle-orm");

      const db = await getDb();
      const [sessionRow] = await db
        .select({
          id: sessionTable.id,
          token: sessionTable.token,
          createdAt: sessionTable.createdAt,
          updatedAt: sessionTable.updatedAt,
          lastActivityAt: sessionTable.lastActivityAt,
        })
        .from(sessionTable)
        .where(
          sessionId
            ? eq(sessionTable.id, sessionId)
            : eq(sessionTable.token, sessionToken),
        )
        .limit(1);

      const sessionCreatedAt = sessionRow?.createdAt ?? authenticatedAt;
      const lastActivityAt =
        sessionRow?.lastActivityAt ?? sessionRow?.updatedAt ?? sessionCreatedAt;

      const idleAgeMs = lastActivityAt ? nowMs - lastActivityAt.getTime() : null;
      const isIdleExpired = idleAgeMs !== null && idleAgeMs > IDLE_TIMEOUT_MS;

      let isAdminExpired = false;
      if (!isIdleExpired) {
        if (!sessionCreatedAt) {
          const { isAdmin } = await import("~/lib/auth/utils/admin-check");
          isAdminExpired = await isAdmin(user.id);
        } else if (nowMs - sessionCreatedAt.getTime() > ADMIN_MAX_AGE_MS) {
          const { isAdmin } = await import("~/lib/auth/utils/admin-check");
          isAdminExpired = await isAdmin(user.id);
        }
      }

      if (isIdleExpired || isAdminExpired) {
        const deleteById = sessionRow?.id ?? sessionId;
        const deleteByToken = sessionRow?.token ?? sessionToken;
        if (deleteById) {
          await db.delete(sessionTable).where(eq(sessionTable.id, deleteById));
        } else if (deleteByToken) {
          await db.delete(sessionTable).where(eq(sessionTable.token, deleteByToken));
        }
        setResponseStatus(401);
        const { unauthorized } = await import("~/lib/server/errors");
        throw unauthorized("Session expired");
      }

      if (sessionRow) {
        const shouldTouchActivity =
          !lastActivityAt ||
          nowMs - lastActivityAt.getTime() > ACTIVITY_UPDATE_INTERVAL_MS;
        if (shouldTouchActivity) {
          await db
            .update(sessionTable)
            .set({ lastActivityAt: now })
            .where(eq(sessionTable.id, sessionRow.id));
        }
      }
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
