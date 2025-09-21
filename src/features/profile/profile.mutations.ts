import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { defaultAvailabilityData } from "~/db/schema/auth.schema";
import { userGameSystemPreferences } from "~/db/schema/game-systems.schema";
import { getAuthMiddleware, requireUser } from "~/lib/server/auth";
import { zod$ } from "~/lib/server/fn-utils";
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
  .middleware(getAuthMiddleware())
  .validator(zod$(partialProfileInputSchema))
  .handler(async ({ data: inputData, context }): Promise<ProfileOperationResult> => {
    // Now inputData contains the actual profile data
    try {
      const [{ getDb }] = await Promise.all([import("~/db/server-helpers")]);
      const db = await getDb();
      const currentUser = requireUser(context);

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
      if (inputData.notificationPreferences !== undefined) {
        updateData["notificationPreferences"] = inputData.notificationPreferences;
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
  .middleware(getAuthMiddleware())
  .validator(zod$(profileInputSchema))
  .handler(async ({ data, context }): Promise<ProfileOperationResult> => {
    try {
      const [{ getDb }] = await Promise.all([import("~/db/server-helpers")]);
      const db = await getDb();
      const currentUser = requireUser(context);

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
        calendarAvailability: data.calendarAvailability ?? defaultAvailabilityData,
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

// Avatar upload schemas and server functions
const uploadAvatarInputSchema = z.object({
  // Data URL or base64 string; we will accept both but prefer data URL
  imageData: z
    .string()
    .min(1)
    .refine((s) => s.startsWith("data:image/") || /^[A-Za-z0-9+/=]+$/.test(s), {
      message: "Invalid image data format",
    }),
  // Optional content type hint (e.g., image/webp, image/png)
  contentType: z.string().optional(),
});

export const uploadAvatar = createServerFn({ method: "POST" })
  .validator((data: unknown) => uploadAvatarInputSchema.parse(data))
  .handler(async ({ data }) => {
    const [{ getCurrentUser }, { getDb }] = await Promise.all([
      import("~/features/auth/auth.queries"),
      import("~/db/server-helpers"),
    ]);

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return {
        success: false,
        errors: [{ code: "AUTH_ERROR", message: "Not authenticated" }],
      } satisfies ProfileOperationResult;
    }

    try {
      // Extract raw base64 body from data URL or raw base64
      const isDataUrl = data.imageData.startsWith("data:image/");
      const base64 = isDataUrl ? data.imageData.split(",", 2)[1] : data.imageData;
      if (!base64) {
        return {
          success: false,
          errors: [{ code: "VALIDATION_ERROR", message: "Invalid image payload" }],
        } as ProfileOperationResult;
      }

      // Basic size guard (~1MB max)
      const approxBytes = Math.ceil((base64.length * 3) / 4);
      if (approxBytes > 1_000_000) {
        return {
          success: false,
          errors: [{ code: "VALIDATION_ERROR", message: "Image too large (max 1MB)" }],
        } as ProfileOperationResult;
      }

      // Persist via storage abstraction as .webp regardless of input
      const filename = `${currentUser.id}-${Date.now()}.webp`;
      const buf = Buffer.from(base64, "base64");
      const { saveAvatar } = await import("~/lib/storage/avatars");
      const stored = await saveAvatar(filename, buf);

      // Update DB: set uploadedAvatarPath to stored public path
      const [{ user }, { eq }] = await Promise.all([
        import("~/db/schema"),
        import("drizzle-orm"),
      ]);
      const db = await getDb();
      await db
        .update(user)
        .set({ uploadedAvatarPath: stored.path, profileUpdatedAt: new Date() })
        .where(eq(user.id, currentUser.id));

      // We don't need to return full profile; client will refetch.
      return { success: true } as ProfileOperationResult;
    } catch (error) {
      console.error("Avatar upload failed", error);
      return {
        success: false,
        errors: [{ code: "DATABASE_ERROR", message: "Failed to upload avatar" }],
      } satisfies ProfileOperationResult;
    }
  });

export const removeUploadedAvatar = createServerFn({ method: "POST" }).handler(
  async () => {
    const [{ getCurrentUser }, { getDb }] = await Promise.all([
      import("~/features/auth/auth.queries"),
      import("~/db/server-helpers"),
    ]);
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return {
        success: false,
        errors: [{ code: "AUTH_ERROR", message: "Not authenticated" }],
      } as ProfileOperationResult;
    }
    try {
      const [{ user }, { eq }] = await Promise.all([
        import("~/db/schema"),
        import("drizzle-orm"),
      ]);
      const db = await getDb();
      const [updated] = await db
        .update(user)
        .set({ uploadedAvatarPath: null, profileUpdatedAt: new Date() })
        .where(eq(user.id, currentUser.id))
        .returning();

      return {
        success: true,
        data: mapDbUserToProfile(updated),
      } as ProfileOperationResult;
    } catch (error) {
      console.error("Remove uploaded avatar failed", error);
      return {
        success: false,
        errors: [{ code: "DATABASE_ERROR", message: "Failed to remove avatar" }],
      } as ProfileOperationResult;
    }
  },
);

export const updatePrivacySettings = createServerFn({ method: "POST" })
  .middleware(getAuthMiddleware())
  .validator(zod$(privacySettingsSchema))
  .handler(async ({ data, context }): Promise<ProfileOperationResult> => {
    try {
      const [{ getDb }] = await Promise.all([import("~/db/server-helpers")]);
      const db = await getDb();
      const currentUser = requireUser(context);

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
