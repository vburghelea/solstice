import type { UserProfile } from "./profile.types";

export function isProfileComplete(profile: UserProfile): boolean {
  // placeholder for now
  return profile.profileVersion > 0;
}
