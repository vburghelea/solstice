import { profileNameSchema } from "./profile.schemas";
import type { UserProfile } from "./profile.types";

const PROFILE_NAME_ALLOWED_PATTERN = /[^A-Za-z0-9._-]+/g;

export function sanitizeProfileName(rawName: string): string {
  if (!rawName) {
    return "";
  }

  return rawName.replace(PROFILE_NAME_ALLOWED_PATTERN, "").trim().slice(0, 30);
}

export type ProfileNameValidationResult =
  | { success: true; value: string }
  | { success: false; error: string };

export function validateProfileNameValue(rawName: string): ProfileNameValidationResult {
  const sanitizedName = sanitizeProfileName(rawName);
  const parsed = profileNameSchema.safeParse(sanitizedName);

  if (parsed.success) {
    return { success: true, value: parsed.data };
  }

  const message = parsed.error.issues[0]?.message ?? "Invalid profile name";
  return { success: false, error: message };
}

export function normalizeProfileName(rawName: string): string {
  return sanitizeProfileName(rawName).toLowerCase();
}

export function isProfileComplete(profile: UserProfile): boolean {
  return (
    profile.gender !== undefined &&
    profile.pronouns !== undefined &&
    profile.phone !== undefined &&
    profile.privacySettings !== undefined
  );
}
