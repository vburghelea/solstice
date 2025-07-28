import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { db } from "~/db";
import { user } from "~/db/schema";
import { userGameSystemPreferences } from "~/db/schema/game-systems.schema";
import { auth } from "~/lib/auth";
import type {
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

function mapDbUserToProfile(dbUser: {
  id: string;
  name: string;
  email: string;
  profileComplete: boolean;
  dateOfBirth: Date | null;
  emergencyContact: string | null;
  gender: string | null;
  pronouns: string | null;
  phone: string | null;
  privacySettings: string | null;
  profileVersion: number;
  profileUpdatedAt: Date | null;
}): UserProfile {
  return {
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    profileComplete: dbUser.profileComplete,
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
      // Import server-only modules inside the handler
      const [{ getDb }, { getAuth }] = await Promise.all([
        import("~/db/server-helpers"),
        import("~/lib/auth/server-helpers"),
      ]);

      const auth = await getAuth();
      const { getWebRequest } = await import("@tanstack/react-start/server");
      const { headers } = getWebRequest();
      const session = await auth.api.getSession({ headers });

      if (!session?.user?.id) {
        return {
          success: false,
          errors: [{ code: "VALIDATION_ERROR", message: "User not authenticated" }],
        };
      }

      const { eq } = await import("drizzle-orm");
      const { user } = await import("~/db/schema");

      const db = await getDb();

      const [dbUser] = await db
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
      // Import server-only modules inside the handler
      const [{ getDb }, { getAuth }] = await Promise.all([
        import("~/db/server-helpers"),
        import("~/lib/auth/server-helpers"),
      ]);

      const auth = await getAuth();
      const { getWebRequest } = await import("@tanstack/react-start/server");
      const { headers } = getWebRequest();
      const session = await auth.api.getSession({ headers });

      if (!session?.user?.id) {
        throw new Error("User not authenticated");
      }

      const { eq } = await import("drizzle-orm");
      const { user } = await import("~/db/schema");

      const db = await getDb();

      const [dbUser] = await db
        .select()
        .from(user)
        .where(eq(user.id, session.user.id))
        .limit(1);

      if (!dbUser) {
        throw new Error("User not found");
      }

      const missingFields: string[] = [];

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

import { gameSystems } from "~/db/schema/game-systems.schema";

export const getGameSystems = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const systems = await db().select().from(gameSystems);
    return {
      success: true,
      data: systems,
    };
  } catch (error) {
    console.error("Error fetching game systems:", error);
    return {
      success: false,
      errors: [
        {
          code: "DATABASE_ERROR",
          message: "Failed to fetch game systems",
        },
      ],
    };
  }
});

/**
 * Get user's game system preferences
 */
export const getUserGameSystemPreferences = createServerFn({ method: "GET" }).handler(
  async (): Promise<{
    success: boolean;
    data?: { favorite: number[]; avoid: number[] };
    errors?: Array<{ code: string; message: string }>;
  }> => {
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

      const preferences = await db()
        .select()
        .from(userGameSystemPreferences)
        .where(eq(userGameSystemPreferences.userId, session.user.id));

      const favorite: number[] = [];
      const avoid: number[] = [];

      for (const pref of preferences) {
        if (pref.preferenceType === "favorite") {
          favorite.push(pref.gameSystemId);
        } else if (pref.preferenceType === "avoid") {
          avoid.push(pref.gameSystemId);
        }
      }

      return {
        success: true,
        data: { favorite, avoid },
      };
    } catch (error) {
      console.error("Error fetching user game system preferences:", error);
      return {
        success: false,
        errors: [
          {
            code: "DATABASE_ERROR",
            message: "Failed to fetch user game system preferences",
          },
        ],
      };
    }
  },
);

// Re-export utility function
export { isProfileComplete } from "./profile.utils";
