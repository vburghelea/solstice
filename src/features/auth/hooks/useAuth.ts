import { useRouteContext } from "@tanstack/react-router";
import type { User } from "better-auth";

/**
 * Hook to access authentication state from route context
 *
 * @example
 * const { user, isAuthenticated } = useAuth();
 *
 * if (isAuthenticated) {
 *   // User is logged in
 * }
 */
export function useAuth() {
  const context = useRouteContext({ from: "__root__" });
  const user = context.user as User | null;

  return {
    user,
    isAuthenticated: !!user,
  };
}

/**
 * Hook that requires authentication and returns the user
 * Should only be used in components that are already protected by route guards
 *
 * @example
 * const user = useAuthenticatedUser(); // Will never be null
 */
export function useAuthenticatedUser(): User {
  const { user } = useAuth();

  if (!user) {
    throw new Error(
      "useAuthenticatedUser must be used within an authenticated route. " +
        "Make sure the route has proper auth guards in place.",
    );
  }

  return user;
}
