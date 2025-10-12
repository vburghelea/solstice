import { getUserProfile } from "~/features/profile/profile.queries";
import type { UserProfile } from "~/features/profile/profile.types";

export async function getCurrentUserProfileSafe(): Promise<UserProfile | null> {
  try {
    const result = await getUserProfile();

    if (result.success) {
      return result.data ?? null;
    }

    console.error("Failed to fetch profile:", result.errors);
  } catch (error) {
    console.error("Failed to fetch profile:", error);
  }

  return null;
}
