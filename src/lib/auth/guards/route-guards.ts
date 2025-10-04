import { redirect } from "@tanstack/react-router";
import type { User } from "better-auth";
import { requireCompleteProfile } from "~/features/profile/profile-guard";
import type { User as ExtendedUser } from "~/lib/auth/types";

/**
 * Route guard that requires authentication
 * Redirects to login page if user is not authenticated
 *
 * @example
 * export const Route = createFileRoute("/protected")({
 *   beforeLoad: async ({ context, location }) => {
 *     requireAuth({ user: context.user, location });
 *   },
 * });
 */
export function requireAuth({
  user,
  location,
  redirectTo = "/auth/login",
}: {
  user: User | null;
  location: { pathname: string };
  redirectTo?: string;
}) {
  if (!user) {
    throw redirect({
      to: redirectTo,
      search: {
        redirect: location.pathname,
      },
    } as never);
  }
}

/**
 * Route guard that redirects authenticated users
 * Useful for login/signup pages
 *
 * @example
 * export const Route = createFileRoute("/auth/login")({
 *   beforeLoad: async ({ context }) => {
 *     redirectIfAuthenticated({ user: context.user });
 *   },
 * });
 */
export function redirectIfAuthenticated({
  user,
  redirectTo = "/dashboard",
}: {
  user: User | null;
  redirectTo?: string;
}) {
  if (user) {
    throw redirect({
      to: redirectTo,
    } as never);
  }
}

/**
 * Composite guard that checks both auth and profile completion
 * Note: This expects the ExtendedUser type from route context which includes profile fields
 *
 * @example
 * export const Route = createFileRoute("/app/feature")({
 *   beforeLoad: async ({ context, location }) => {
 *     requireAuthAndProfile({ user: context.user, location });
 *   },
 * });
 */
export function requireAuthAndProfile({
  user,
  location,
}: {
  user: ExtendedUser | null;
  location: { pathname: string };
}) {
  // First check auth (will throw if user is null)
  requireAuth({ user, location });

  // Then check profile completion
  // The type assertion is safe because requireAuth would have thrown if user was null
  requireCompleteProfile(user as ExtendedUser);
}
