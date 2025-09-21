import type { AuthUser } from "~/lib/auth/types";
import { authMiddleware, type AuthedRequestContext } from "~/lib/auth/middleware/auth-guard";
import { unauthorized } from "~/lib/server/errors";

// Middleware for authenticated server functions
// Each file must call createServerFn directly with this middleware
// to satisfy TanStack Start's build requirements
export const getAuthMiddleware = () => [authMiddleware];

export const requireUser = (context: unknown): NonNullable<AuthUser> => {
  const user = (context as AuthedRequestContext | undefined)?.user;
  if (!user) {
    throw unauthorized();
  }
  return user;
};
