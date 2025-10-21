import { redirect } from "@tanstack/react-router";
import type { User } from "better-auth";
import { requireCompleteProfile } from "~/features/profile/profile-guard";
import type { User as ExtendedUser } from "~/lib/auth/types";
import type { SupportedLanguage } from "~/lib/i18n/config";
import { resolveLocalizedPath } from "~/lib/i18n/redirects";

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
  language,
}: {
  user: User | null;
  location: { pathname: string };
  redirectTo?: string;
  language?: SupportedLanguage | null | undefined;
}) {
  if (!user) {
    const localizedRedirect = resolveLocalizedPath({
      targetPath: redirectTo,
      language,
      currentPath: location.pathname,
    });

    throw redirect({
      to: localizedRedirect,
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
  redirectTo = "/player",
  language,
}: {
  user: User | null;
  redirectTo?: string;
  language?: SupportedLanguage | null | undefined;
}) {
  if (user) {
    throw redirect({
      to: resolveLocalizedPath({ targetPath: redirectTo, language }),
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
  language,
}: {
  user: ExtendedUser | null;
  location: { pathname: string };
  language?: SupportedLanguage | null | undefined;
}) {
  // First check auth (will throw if user is null)
  requireAuth({ user, location, language });

  // Then check profile completion
  // The type assertion is safe because requireAuth would have thrown if user was null
  requireCompleteProfile(user as ExtendedUser, {
    language,
    currentPath: location.pathname,
  });
}
