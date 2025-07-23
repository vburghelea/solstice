import type { UserProfile } from "./profile.types";

export function isProfileComplete(profile: UserProfile): boolean {
  // Only date of birth is required for profile completion
  return !!profile.dateOfBirth;
}
