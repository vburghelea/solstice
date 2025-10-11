import { redirect } from "@tanstack/react-router";
import type { User } from "~/lib/auth/types";

/**
 * Route guard that ensures user has completed their profile.
 * Redirects to onboarding if profile is incomplete.
 *
 * @param user - The authenticated user object
 * @throws Redirect to /player/onboarding if profile is incomplete
 */
export function requireCompleteProfile(user: User | null | undefined) {
  if (!user) {
    throw redirect({ to: "/auth/login" });
  }

  if (!user.profileComplete) {
    throw redirect({ to: "/player/onboarding" });
  }
}

/**
 * Check if a user needs to complete their profile
 */
export function needsProfileCompletion(user: User | null | undefined): boolean {
  return !!user && !user.profileComplete;
}
