import { createMiddleware } from "@tanstack/react-start";
import { getOrganizationMembership } from "./org-guard";

const getSessionUserId = async (headers: Headers) => {
  const { getAuth } = await import("~/lib/auth/server-helpers");
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers });
  return session?.user?.id ?? null;
};

export const orgContextMiddleware = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const { getRequest } = await import("@tanstack/react-start/server");
    const request = getRequest();
    const headers = request.headers;
    const organizationId = headers.get("x-organization-id");
    const userId = await getSessionUserId(headers);

    const membership =
      organizationId && userId
        ? await getOrganizationMembership({
            userId,
            organizationId,
          })
        : null;

    return next({
      context: {
        userId,
        organizationId,
        organizationMembership: membership,
      },
    });
  },
);
