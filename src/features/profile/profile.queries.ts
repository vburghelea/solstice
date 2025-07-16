import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { db } from "~/db";
import { user } from "~/db/schema";
import { auth } from "~/lib/auth";
import type {
  EmergencyContact,
  PrivacySettings,
  ProfileOperationResult,
  UserProfile,
} from "./profile.types";

function parseJsonField<T>(value: string | null | undefined): T | undefined {
  if (!value) return undefined;
  try {
    return JSON.parse(value) as T;
  } catch {
    return undefined;
  }
}

function mapDbUserToProfile(dbUser: typeof user.$inferSelect): UserProfile {
  return {
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    profileComplete: dbUser.profileComplete,
    dateOfBirth: dbUser.dateOfBirth ?? undefined,
    emergencyContact: parseJsonField<EmergencyContact>(dbUser.emergencyContact),
    gender: dbUser.gender ?? undefined,
    pronouns: dbUser.pronouns ?? undefined,
    phone: dbUser.phone ?? undefined,
    privacySettings: parseJsonField<PrivacySettings>(dbUser.privacySettings),
    profileVersion: dbUser.profileVersion,
    profileUpdatedAt: dbUser.profileUpdatedAt ?? undefined,
  };
}

export const getUserProfile = createServerFn({ method: "GET" }).handler(
  async (): Promise<ProfileOperationResult> => {
    try {
      const { getWebRequest } = await import("@tanstack/react-start/server");
      const { headers } = getWebRequest();
      const session = await auth.api.getSession({ headers });

      if (!session?.user?.id) {
        return {
          success: false,
          errors: [{ code: "VALIDATION_ERROR", message: "User not authenticated" }],
        };
      }

      const [dbUser] = await db()
        .select()
        .from(user)
        .where(eq(user.id, session.user.id))
        .limit(1);

      if (!dbUser) {
        return {
          success: false,
          errors: [{ code: "DATABASE_ERROR", message: "User not found" }],
        };
      }

      return {
        success: true,
        data: mapDbUserToProfile(dbUser),
      };
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return {
        success: false,
        errors: [
          {
            code: "DATABASE_ERROR",
            message: "Failed to fetch user profile",
          },
        ],
      };
    }
  },
);

export const getProfileCompletionStatus = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ complete: boolean; missingFields: string[] }> => {
    try {
      const { getWebRequest } = await import("@tanstack/react-start/server");
      const { headers } = getWebRequest();
      const session = await auth.api.getSession({ headers });

      if (!session?.user?.id) {
        throw new Error("User not authenticated");
      }

      const [dbUser] = await db()
        .select()
        .from(user)
        .where(eq(user.id, session.user.id))
        .limit(1);

      if (!dbUser) {
        throw new Error("User not found");
      }

      const missingFields: string[] = [];

      if (!dbUser.dateOfBirth) {
        missingFields.push("dateOfBirth");
      }

      const emergencyContact = parseJsonField<EmergencyContact>(dbUser.emergencyContact);
      if (!emergencyContact?.name) {
        missingFields.push("emergencyContact.name");
      }
      if (!emergencyContact?.relationship) {
        missingFields.push("emergencyContact.relationship");
      }
      if (!emergencyContact?.phone && !emergencyContact?.email) {
        missingFields.push("emergencyContact.contact");
      }

      return {
        complete: dbUser.profileComplete,
        missingFields,
      };
    } catch (error) {
      console.error("Error checking profile completion:", error);
      throw error;
    }
  },
);

export function isProfileComplete(profile: UserProfile): boolean {
  return !!(
    profile.dateOfBirth &&
    profile.emergencyContact?.name &&
    profile.emergencyContact?.relationship &&
    (profile.emergencyContact?.phone || profile.emergencyContact?.email)
  );
}
