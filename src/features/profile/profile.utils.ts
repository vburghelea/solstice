import type { UserProfile } from "./profile.types";

export function isProfileComplete(profile: UserProfile): boolean {
  return (
    profile.gender !== undefined &&
    profile.pronouns !== undefined &&
    profile.phone !== undefined &&
    profile.privacySettings !== undefined
  );
}
