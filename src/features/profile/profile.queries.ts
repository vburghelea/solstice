import { createServerFn } from "@tanstack/react-start";
import { eq, inArray } from "drizzle-orm";
import { z } from "zod";
import type { AvailabilityData } from "~/db/schema/auth.schema";
import { user as userTable } from "~/db/schema/auth.schema";
import { gameSystems, userGameSystemPreferences } from "~/db/schema/game-systems.schema";
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

function mapDbUserToProfile(
  dbUser: {
    id: string;
    name: string;
    email: string;
    profileComplete: boolean;
    gender: string | null;
    pronouns: string | null;
    phone: string | null;
    city: string | null;
    country: string | null;
    languages: string[] | null;
    identityTags: string[] | null;
    preferredGameThemes: string[] | null;
    overallExperienceLevel: "beginner" | "intermediate" | "advanced" | "expert" | null;
    calendarAvailability: unknown; // JSONB field from database
    isGM: boolean | null;
    gamesHosted: number | null;
    responseRate: number | null;
    averageResponseTime: number | null;
    gmStyle: string | null;
    gmRating: number | null;
    privacySettings: string | null;
    notificationPreferences: unknown; // JSONB
    profileVersion: number;
    profileUpdatedAt: Date | null;
    image: string | null;
    uploadedAvatarPath: string | null;
  },
  preferences?: {
    favorite: { id: number; name: string }[];
    avoid: { id: number; name: string }[];
  },
): UserProfile {
  // Create the UserProfile object directly
  const userProfile = {
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    profileComplete: dbUser.profileComplete,
    gender: dbUser.gender ?? undefined,
    pronouns: dbUser.pronouns ?? undefined,
    phone: dbUser.phone ?? undefined,
    city: dbUser.city ?? undefined,
    country: dbUser.country ?? undefined,
    languages: dbUser.languages ?? [],
    identityTags: dbUser.identityTags ?? [],
    preferredGameThemes: dbUser.preferredGameThemes ?? [],
    overallExperienceLevel: dbUser.overallExperienceLevel ?? undefined,
    calendarAvailability:
      dbUser.calendarAvailability && typeof dbUser.calendarAvailability === "object"
        ? (dbUser.calendarAvailability as AvailabilityData)
        : undefined,
    isGM: dbUser.isGM ?? false,
    gamesHosted: dbUser.gamesHosted ?? 0,
    responseRate: dbUser.responseRate ?? 0,
    averageResponseTime: dbUser.averageResponseTime ?? undefined,
    gmStyle: dbUser.gmStyle ?? undefined,
    gmRating: dbUser.gmRating ?? undefined,
    privacySettings: parseJsonField<PrivacySettings>(dbUser.privacySettings) ?? undefined,
    notificationPreferences:
      dbUser.notificationPreferences && typeof dbUser.notificationPreferences === "object"
        ? (dbUser.notificationPreferences as (typeof userTable.$inferSelect)["notificationPreferences"])
        : undefined,
    profileVersion: dbUser.profileVersion,
    profileUpdatedAt: dbUser.profileUpdatedAt ?? undefined,
    gameSystemPreferences: preferences ?? undefined,
    ...(dbUser.image !== null && { image: dbUser.image }),
    ...(dbUser.uploadedAvatarPath !== null && {
      uploadedAvatarPath: dbUser.uploadedAvatarPath,
    }),
  };

  return userProfile as UserProfile;
}

export const getUserProfile = createServerFn({ method: "GET" })
  .validator((data: unknown) => {
    if (data === undefined || data === null) {
      return {}; // Default to empty object if no data is provided
    }
    return z.object({ userId: z.string().optional() }).parse(data);
  })
  .handler(async ({ data }): Promise<ProfileOperationResult> => {
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

      const targetUserId = data?.userId || session?.user?.id;

      if (!targetUserId) {
        return {
          success: false,
          errors: [{ code: "VALIDATION_ERROR", message: "User not authenticated" }],
        };
      }

      const { eq, inArray } = await import("drizzle-orm");
      const { user } = await import("~/db/schema");
      const { gameSystems, userGameSystemPreferences } = await import(
        "~/db/schema/game-systems.schema"
      );

      const db = await getDb();

      const [dbUser] = await db
        .select()
        .from(user)
        .where(eq(user.id, targetUserId))
        .limit(1);

      if (!dbUser) {
        return {
          success: false,
          errors: [{ code: "DATABASE_ERROR", message: "User not found" }],
        };
      }

      // Fetch user's game system preferences
      const preferencesResult = await (async () => {
        const preferences = await db
          .select()
          .from(userGameSystemPreferences)
          .where(eq(userGameSystemPreferences.userId, targetUserId));

        const favoriteIds: number[] = [];
        const avoidIds: number[] = [];

        for (const pref of preferences) {
          if (pref.preferenceType === "favorite") {
            favoriteIds.push(pref.gameSystemId);
          } else if (pref.preferenceType === "avoid") {
            avoidIds.push(pref.gameSystemId);
          }
        }

        const allPreferredIds = [...new Set([...favoriteIds, ...avoidIds])];

        let preferredGameSystems: { id: number; name: string }[] = [];
        if (allPreferredIds.length > 0) {
          preferredGameSystems = await db
            .select({ id: gameSystems.id, name: gameSystems.name })
            .from(gameSystems)
            .where(inArray(gameSystems.id, allPreferredIds));
        }

        const favorite: { id: number; name: string }[] = favoriteIds.map((id) => {
          const system = preferredGameSystems.find((gs) => gs.id === id);
          return { id, name: system?.name || "" };
        });

        const avoid: { id: number; name: string }[] = avoidIds.map((id) => {
          const system = preferredGameSystems.find((gs) => gs.id === id);
          return { id, name: system?.name || "" };
        });

        return { favorite, avoid };
      })();

      // If GM, compute top strengths from reviews
      let gmTopStrengths: string[] | undefined = undefined;
      if (dbUser.isGM) {
        const { gmReviews } = await import("~/db/schema");
        const { eq } = await import("drizzle-orm");
        const reviews = await db
          .select({ selectedStrengths: gmReviews.selectedStrengths })
          .from(gmReviews)
          .where(eq(gmReviews.gmId, targetUserId));

        const counts = new Map<string, number>();
        for (const r of reviews) {
          const arr = (r.selectedStrengths || []) as string[];
          for (const s of arr) {
            counts.set(s, (counts.get(s) || 0) + 1);
          }
        }
        gmTopStrengths = Array.from(counts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([k]) => k);
      }

      const base = mapDbUserToProfile(dbUser, preferencesResult);
      return {
        success: true,
        data: { ...base, ...(gmTopStrengths ? { gmTopStrengths } : {}) },
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
  });

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

export const getGameSystems = createServerFn({ method: "GET" })
  .validator((data: unknown) => {
    if (!data) return undefined;
    if (typeof data !== "object") return undefined;
    if (!("searchTerm" in data) || typeof data.searchTerm !== "string") return undefined;
    return { searchTerm: data.searchTerm };
  })
  .handler(async ({ data }) => {
    try {
      const { getDb } = await import("~/db/server-helpers");
      const db = await getDb();
      const { ilike } = await import("drizzle-orm");

      if (!data?.searchTerm || data.searchTerm.length < 3) {
        return {
          success: true,
          data: [],
        };
      }

      const systems = await db
        .select()
        .from(gameSystems)
        .where(ilike(gameSystems.name, `%${data.searchTerm}%`));
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
    data?: {
      favorite: { id: number; name: string }[];
      avoid: { id: number; name: string }[];
    };
    errors?: Array<{ code: string; message: string }>;
  }> => {
    try {
      const { getDb } = await import("~/db/server-helpers");
      const db = await getDb();

      const { getCurrentUser } = await import("~/features/auth/auth.queries");

      const currentUser = await getCurrentUser();
      if (!currentUser) {
        throw new Error("Not authenticated");
      }

      const preferences = await db
        .select()
        .from(userGameSystemPreferences)
        .where(eq(userGameSystemPreferences.userId, currentUser.id));

      const favoriteIds: number[] = [];
      const avoidIds: number[] = [];

      for (const pref of preferences) {
        if (pref.preferenceType === "favorite") {
          favoriteIds.push(pref.gameSystemId);
        } else if (pref.preferenceType === "avoid") {
          avoidIds.push(pref.gameSystemId);
        }
      }

      const allPreferredIds = [...new Set([...favoriteIds, ...avoidIds])];

      let preferredGameSystems: { id: number; name: string }[] = [];
      if (allPreferredIds.length > 0) {
        preferredGameSystems = await db
          .select({ id: gameSystems.id, name: gameSystems.name })
          .from(gameSystems)
          .where(inArray(gameSystems.id, allPreferredIds));
      }

      const favorite: { id: number; name: string }[] = favoriteIds.map((id) => {
        const system = preferredGameSystems.find((gs) => gs.id === id);
        return { id, name: system?.name || "" };
      });

      const avoid: { id: number; name: string }[] = avoidIds.map((id) => {
        const system = preferredGameSystems.find((gs) => gs.id === id);
        return { id, name: system?.name || "" };
      });

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
