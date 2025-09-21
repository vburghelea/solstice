import { createMiddleware } from "@tanstack/react-start";
import { getWebRequest, setResponseStatus } from "@tanstack/react-start/server";

import type { AuthUser } from "~/lib/auth/types";

export type AuthedRequestContext = {
  user: NonNullable<AuthUser>;
};

/**
 * Middleware to force authentication on a server function, and add the user to the context.
 */
export const authMiddleware = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const { getAuth } = await import("~/lib/auth/server-helpers");
    const auth = await getAuth();
    const { headers } = getWebRequest();

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

    const context: AuthedRequestContext = { user: user as NonNullable<AuthUser> };

    return next({ context });
  },
);
