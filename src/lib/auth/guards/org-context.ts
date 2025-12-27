import { createMiddleware } from "@tanstack/react-start";

const getSessionUserId = async (headers: Headers) => {
  const { getAuth } = await import("~/lib/auth/server-helpers");
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers });
  return session?.user?.id ?? null;
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

export const orgContextMiddleware = createMiddleware({ type: "function" })
  .client(async ({ next }) => {
    const activeOrganizationId =
      typeof window === "undefined"
        ? undefined
        : (window.localStorage.getItem("active_org_id") ?? undefined);
    return next({
      sendContext: {
        activeOrganizationId,
      },
    });
  })
  .server(async ({ next, context }) => {
    const { getRequest } = await import("@tanstack/react-start/server");
    const request = getRequest();
    const headers = request.headers;
    const userId = await getSessionUserId(headers);

    const contextOrgId = (context as { activeOrganizationId?: string } | undefined)
      ?.activeOrganizationId;
    const headerOrgId = headers.get("x-organization-id");
    const cookieOrgId = getCookieValue(headers, "active_org_id");
    const requestedOrgId = headerOrgId ?? contextOrgId ?? cookieOrgId ?? null;

    let resolvedOrgId: string | null = null;
    let resolvedRole: string | null = null;

    if (requestedOrgId && userId) {
      const { resolveOrganizationAccess } =
        await import("~/features/organizations/organizations.access");
      const access = await resolveOrganizationAccess({
        userId,
        organizationId: requestedOrgId,
      });
      if (access) {
        resolvedOrgId = access.organizationId;
        resolvedRole = access.role;
      }
    }

    return next({
      context: {
        ...(context as Record<string, unknown> | undefined),
        userId,
        organizationId: resolvedOrgId,
        organizationRole: resolvedRole,
      },
    });
  });
