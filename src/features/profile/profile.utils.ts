import type { UserProfile } from "./profile.types";

export function isProfileComplete(profile: UserProfile): boolean {
  return !!(
    profile.dateOfBirth &&
    profile.emergencyContact?.name &&
    profile.emergencyContact?.relationship &&
    (profile.emergencyContact?.phone || profile.emergencyContact?.email)
  );
}
