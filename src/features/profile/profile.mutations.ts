import { createServerFn } from "@tanstack/react-start";
import type { z } from "zod";
import { defaultAvailabilityData } from "~/db/schema/auth.schema";
import { userGameSystemPreferences } from "~/db/schema/game-systems.schema";
import {
  partialProfileInputSchema,
  privacySettingsSchema,
  profileInputSchema,
} from "./profile.schemas";
import type {
  PrivacySettings,
  ProfileOperationResult,
  UserProfile,
} from "./profile.types";
import { defaultPrivacySettings } from "./profile.types";
import { isProfileComplete } from "./profile.utils";

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
    privacySettings: string | null;
    profileVersion: number;
    profileUpdatedAt: Date | null;
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
    // Handle optional properties that may be null in the database
    gender: dbUser.gender ?? undefined,
    pronouns: dbUser.pronouns ?? undefined,
    phone: dbUser.phone ?? undefined,
    privacySettings: parseJsonField<PrivacySettings>(dbUser.privacySettings) ?? undefined,
    profileVersion: dbUser.profileVersion,
    profileUpdatedAt: dbUser.profileUpdatedAt ?? undefined,
    gameSystemPreferences: preferences ?? undefined,
    // Add missing required properties with default values
    languages: [],
    identityTags: [],
    preferredGameThemes: [],
    isGM: false,
    gamesHosted: 0,
    responseRate: 0,
    // Add other optional properties with undefined values

    city: undefined,
    country: undefined,
    overallExperienceLevel: undefined,
    calendarAvailability: undefined,
    averageResponseTime: undefined,
    gmStyle: undefined,
    gmRating: undefined,
  };

  return userProfile as unknown as UserProfile;
}

export const updateUserProfile = createServerFn({ method: "POST" })
  .validator(partialProfileInputSchema.parse)
  .handler(async ({ data: inputData }): Promise<ProfileOperationResult> => {
    // Now inputData contains the actual profile data
    try {
      const { getCurrentUser } = await import("~/features/auth/auth.queries");

      const currentUser = await getCurrentUser();
      if (!currentUser) {
        return {
          success: false,
          errors: [{ code: "AUTH_ERROR", message: "Not authenticated" }],
        };
      }

      // Input is already validated by .validator(), just check if it's empty
      if (!inputData || Object.keys(inputData).length === 0) {
        return {
          success: false,
          errors: [{ code: "VALIDATION_ERROR", message: "No data provided" }],
        };
      }

      // Import database dependencies inside handler
      const { eq, sql } = await import("drizzle-orm");
      const { user } = await import("~/db/schema");

      const updateData: Record<string, unknown> = {
        profileUpdatedAt: new Date(),
        profileVersion: sql`${user.profileVersion} + 1`,
      };

      if (inputData.gender !== undefined) {
        updateData["gender"] = inputData.gender;
      }
      if (inputData.pronouns !== undefined) {
        updateData["pronouns"] = inputData.pronouns;
      }
      if (inputData.phone !== undefined) {
        updateData["phone"] = inputData.phone;
      }
      if (inputData.privacySettings !== undefined) {
        updateData["privacySettings"] = JSON.stringify(inputData.privacySettings);
      }
      if (inputData.city !== undefined) {
        updateData["city"] = inputData.city;
      }
      if (inputData.country !== undefined) {
        updateData["country"] = inputData.country;
      }
      if (inputData.overallExperienceLevel !== undefined) {
        updateData["overallExperienceLevel"] = inputData.overallExperienceLevel;
      }
      if (inputData.languages !== undefined) {
        updateData["languages"] = inputData.languages;
      }
      if (inputData.identityTags !== undefined) {
        updateData["identityTags"] = inputData.identityTags;
      }
      if (inputData.preferredGameThemes !== undefined) {
        updateData["preferredGameThemes"] = inputData.preferredGameThemes;
      }
      if (inputData.calendarAvailability !== undefined) {
        updateData["calendarAvailability"] = inputData.calendarAvailability;
      }

      // Import server-only modules inside the handler
      const { getDb } = await import("~/db/server-helpers");
      const db = await getDb();

      const [updatedUser] = await db
        .update(user)
        .set(updateData)
        .where(eq(user.id, currentUser.id))
        .returning();

      if (!updatedUser) {
        return {
          success: false,
          errors: [{ code: "DATABASE_ERROR", message: "Failed to update profile" }],
        };
      }

      let finalGameSystemPreferences = undefined;

      if (inputData.gameSystemPreferences) {
        // Delete existing preferences
        await db
          .delete(userGameSystemPreferences)
          .where(eq(userGameSystemPreferences.userId, currentUser.id));

        const preferencesToInsert = [];
        for (const gameSystem of inputData.gameSystemPreferences.favorite) {
          preferencesToInsert.push({
            userId: currentUser.id,
            gameSystemId: gameSystem.id,
            preferenceType: "favorite" as const,
          });
        }
        for (const gameSystem of inputData.gameSystemPreferences.avoid) {
          preferencesToInsert.push({
            userId: currentUser.id,
            gameSystemId: gameSystem.id,
            preferenceType: "avoid" as const,
          });
        }

        if (preferencesToInsert.length > 0) {
          await db
            .insert(userGameSystemPreferences)
            .values(preferencesToInsert)
            .onConflictDoNothing();
        }
        finalGameSystemPreferences = inputData.gameSystemPreferences;
      }

      // Check if profile is now complete
      const profile = mapDbUserToProfile(updatedUser, finalGameSystemPreferences);
      const profileComplete = isProfileComplete(profile);

      if (profileComplete !== updatedUser.profileComplete) {
        const { getDb } = await import("~/db/server-helpers");
        const db = await getDb();
        const [finalUser] = await db
          .update(user)
          .set({ profileComplete })
          .where(eq(user.id, currentUser.id))
          .returning();

        return {
          success: true,
          data: mapDbUserToProfile(finalUser, finalGameSystemPreferences),
        };
      }

      return {
        success: true,
        data: mapDbUserToProfile(updatedUser, finalGameSystemPreferences),
      };
    } catch (error) {
      console.error("Error updating user profile:", error);
      return {
        success: false,
        errors: [
          {
            code: "DATABASE_ERROR",
            message: "Failed to update profile",
          },
        ],
      };
    }
  });

export const completeUserProfile = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    // The validator receives the raw data passed to the server function
    return profileInputSchema.parse(input);
  })
  .handler(async ({ data }): Promise<ProfileOperationResult> => {
    try {
      // Import server-only modules inside the handler
      const { getDb } = await import("~/db/server-helpers");
      const db = await getDb();

      const { getCurrentUser } = await import("~/features/auth/auth.queries");

      const currentUser = await getCurrentUser();
      if (!currentUser) {
        return {
          success: false,
          errors: [{ code: "AUTH_ERROR", message: "Not authenticated" }],
        };
      }

      // Input is already validated by .validator()

      // Import database dependencies inside handler
      const { eq, sql } = await import("drizzle-orm");
      const { user } = await import("~/db/schema");

      const updateData = {
        gender: data.gender || null,
        pronouns: data.pronouns || null,
        phone: data.phone || null,
        city: data.city || null,
        country: data.country || null,
        languages: data.languages || [],
        identityTags: data.identityTags || [],
        preferredGameThemes: data.preferredGameThemes || [],
        overallExperienceLevel: data.overallExperienceLevel || null,
        calendarAvailability: data.calendarAvailability || defaultAvailabilityData,
        isGM: false, // Set to false by default
        privacySettings: JSON.stringify(data.privacySettings || defaultPrivacySettings),
        profileComplete: true,
        profileUpdatedAt: new Date(),
        profileVersion: sql`${user.profileVersion} + 1`,
      };

      const [updatedUser] = await db
        .update(user)
        .set(updateData)
        .where(eq(user.id, currentUser.id))
        .returning();

      if (!updatedUser) {
        return {
          success: false,
          errors: [{ code: "DATABASE_ERROR", message: "Failed to complete profile" }],
        };
      }

      if (data.gameSystemPreferences) {
        const preferencesToInsert = [];
        for (const gameSystem of data.gameSystemPreferences.favorite) {
          preferencesToInsert.push({
            userId: currentUser.id,
            gameSystemId: gameSystem.id,
            preferenceType: "favorite" as const,
          });
        }
        for (const gameSystem of data.gameSystemPreferences.avoid) {
          preferencesToInsert.push({
            userId: currentUser.id,
            gameSystemId: gameSystem.id,
            preferenceType: "avoid" as const,
          });
        }

        if (preferencesToInsert.length > 0) {
          await db
            .insert(userGameSystemPreferences)
            .values(preferencesToInsert)
            .onConflictDoNothing();
        }
      }

      return {
        success: true,
        data: mapDbUserToProfile(updatedUser),
      };
    } catch (error) {
      console.error("Error completing user profile:", error);
      return {
        success: false,
        errors: [
          {
            code: "DATABASE_ERROR",
            message: "Failed to complete profile",
          },
        ],
      };
    }
  });

export const updatePrivacySettings = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    // The validator receives the raw data passed to the server function
    return privacySettingsSchema.parse(input);
  })
  .handler(async ({ data }): Promise<ProfileOperationResult> => {
    try {
      // Import server-only modules inside the handler
      const { getDb } = await import("~/db/server-helpers");
      const db = await getDb();

      const { getCurrentUser } = await import("~/features/auth/auth.queries");

      const currentUser = await getCurrentUser();
      if (!currentUser) {
        throw new Error("Not authenticated");
      }

      if (!data) {
        return {
          success: false,
          errors: [{ code: "VALIDATION_ERROR", message: "No data provided" }],
        };
      }

      // Validate input
      const validation = privacySettingsSchema.safeParse(data);
      if (!validation.success) {
        return {
          success: false,
          errors: validation.error.errors.map((err: z.ZodIssue) => ({
            code: "VALIDATION_ERROR" as const,
            field: err.path.join("."),
            message: err.message,
          })),
        };
      }

      // Import database dependencies inside handler
      const { eq } = await import("drizzle-orm");
      const { user } = await import("~/db/schema");

      const [updatedUser] = await db
        .update(user)
        .set({
          privacySettings: JSON.stringify(data),
          profileUpdatedAt: new Date(),
        })
        .where(eq(user.id, currentUser.id))
        .returning();

      if (!updatedUser) {
        return {
          success: false,
          errors: [
            { code: "DATABASE_ERROR", message: "Failed to update privacy settings" },
          ],
        };
      }

      return {
        success: true,
        data: mapDbUserToProfile(updatedUser),
      };
    } catch (error) {
      console.error("Error updating privacy settings:", error);
      return {
        success: false,
        errors: [
          {
            code: "DATABASE_ERROR",
            message: "Failed to update privacy settings",
          },
        ],
      };
    }
  });
