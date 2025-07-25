import { createServerFn } from "@tanstack/react-start";
import { userGameSystemPreferences } from "~/db/schema/game-systems.schema";
import { isProfileComplete } from "./profile.queries";
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

export const updateUserProfile = createServerFn({ method: "POST" })
  .validator(partialProfileInputSchema.parse)
  .handler(async ({ data: inputData }): Promise<ProfileOperationResult> => {
    // Now inputData contains the actual profile data
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

      const db = await getDb();

      const [updatedUser] = await db
        .update(user)
        .set(updateData)
        .where(eq(user.id, session.user.id))
        .returning();

      if (!updatedUser) {
        return {
          success: false,
          errors: [{ code: "DATABASE_ERROR", message: "Failed to update profile" }],
        };
      }

      // Check if profile is now complete
      const profile = mapDbUserToProfile(updatedUser);
      const profileComplete = isProfileComplete(profile);

      if (profileComplete !== updatedUser.profileComplete) {
        const db = await getDb();
        const [finalUser] = await db
          .update(user)
          .set({ profileComplete })
          .where(eq(user.id, session.user.id))
          .returning();

        return {
          success: true,
          data: mapDbUserToProfile(finalUser),
        };
      }

      return {
        success: true,
        data: profile,
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

      // Input is already validated by .validator()

      // Import database dependencies inside handler
      const { eq, sql } = await import("drizzle-orm");
      const { user } = await import("~/db/schema");

      const updateData = {
        gender: data.gender || null,
        pronouns: data.pronouns || null,
        phone: data.phone || null,
        privacySettings: JSON.stringify(data.privacySettings || defaultPrivacySettings),
        profileComplete: true,
        profileUpdatedAt: new Date(),
        profileVersion: sql`${user.profileVersion} + 1`,
      };

      const db = await getDb();

      const [updatedUser] = await db
        .update(user)
        .set(updateData)
        .where(eq(user.id, session.user.id))
        .returning();

      if (!updatedUser) {
        return {
          success: false,
          errors: [{ code: "DATABASE_ERROR", message: "Failed to complete profile" }],
        };
      }

      if (data.gameSystemPreferences) {
        const preferencesToInsert = [];
        for (const gameSystemId of data.gameSystemPreferences.favorite) {
          preferencesToInsert.push({
            userId: session.user.id,
            gameSystemId,
            preferenceType: "favorite" as const,
          });
        }
        for (const gameSystemId of data.gameSystemPreferences.avoid) {
          preferencesToInsert.push({
            userId: session.user.id,
            gameSystemId,
            preferenceType: "avoid" as const,
          });
        }

        if (preferencesToInsert.length > 0) {
          await db()
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

      // Input is already validated by .validator()

      // Import database dependencies inside handler
      const { eq } = await import("drizzle-orm");
      const { user } = await import("~/db/schema");

      const db = await getDb();

      const [updatedUser] = await db
        .update(user)
        .set({
          privacySettings: JSON.stringify(data),
          profileUpdatedAt: new Date(),
        })
        .where(eq(user.id, session.user.id))
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
