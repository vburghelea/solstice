import { redirect } from "@tanstack/react-router";
import type { User } from "~/lib/auth/types";
import type { SupportedLanguage } from "~/lib/i18n/config";
import { resolveLocalizedPath } from "~/lib/i18n/redirects";

/**
 * Route guard that ensures user has completed their profile.
 * Redirects to onboarding if profile is incomplete.
 *
 * @param user - The authenticated user object
 * @throws Redirect to /player/onboarding if profile is incomplete
 */
export function requireCompleteProfile(
  user: User | null | undefined,
  options?: {
    language?: SupportedLanguage | null | undefined;
    currentPath?: string | undefined;
  },
) {
  const { language, currentPath } = options ?? {};

  if (!user) {
    const localizedLoginPath = resolveLocalizedPath({
      targetPath: "/auth/login",
      language,
      currentPath,
    });
    throw redirect({ to: localizedLoginPath } as never);
  }

  if (!user.profileComplete) {
    const localizedOnboardingPath = resolveLocalizedPath({
      targetPath: "/player/onboarding",
      language,
      currentPath,
    });
    throw redirect({ to: localizedOnboardingPath } as never);
  }
}

/**
 * Check if a user needs to complete their profile
 */
export function needsProfileCompletion(user: User | null | undefined): boolean {
  return !!user && !user.profileComplete;
}
