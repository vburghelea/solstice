import { createServerFn } from "@tanstack/react-start";
import { eq, sql } from "drizzle-orm";
import { db } from "~/db";
import { user } from "~/db/schema";
import { auth } from "~/lib/auth";
import { isProfileComplete } from "./profile.queries";
import {
  partialProfileInputSchema,
  privacySettingsSchema,
  profileInputSchema,
} from "./profile.schemas";
import type {
  EmergencyContact,
  PrivacySettings,
  ProfileInput,
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

export const updateUserProfile = createServerFn({ method: "POST" }).handler(
  async ({
    data,
  }: {
    data?: Partial<ProfileInput> | undefined;
  }): Promise<ProfileOperationResult> => {
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

      if (!data) {
        return {
          success: false,
          errors: [{ code: "VALIDATION_ERROR", message: "No data provided" }],
        };
      }

      // Validate input
      const validation = partialProfileInputSchema.safeParse(data);
      if (!validation.success) {
        return {
          success: false,
          errors: validation.error.errors.map((err) => ({
            code: "VALIDATION_ERROR" as const,
            field: err.path.join("."),
            message: err.message,
          })),
        };
      }

      const updateData: Record<string, unknown> = {
        profileUpdatedAt: new Date(),
        profileVersion: sql`${user.profileVersion} + 1`,
      };

      if (data.dateOfBirth !== undefined) {
        updateData["dateOfBirth"] = data.dateOfBirth;
      }
      if (data.emergencyContact !== undefined) {
        updateData["emergencyContact"] = JSON.stringify(data.emergencyContact);
      }
      if (data.gender !== undefined) {
        updateData["gender"] = data.gender;
      }
      if (data.pronouns !== undefined) {
        updateData["pronouns"] = data.pronouns;
      }
      if (data.phone !== undefined) {
        updateData["phone"] = data.phone;
      }
      if (data.privacySettings !== undefined) {
        updateData["privacySettings"] = JSON.stringify(data.privacySettings);
      }

      const [updatedUser] = await db()
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
        const [finalUser] = await db()
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
  },
);

export const completeUserProfile = createServerFn({ method: "POST" }).handler(
  async ({
    data,
  }: {
    data?: ProfileInput | undefined;
  }): Promise<ProfileOperationResult> => {
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

      if (!data) {
        return {
          success: false,
          errors: [{ code: "VALIDATION_ERROR", message: "No data provided" }],
        };
      }

      // Validate input
      const validation = profileInputSchema.safeParse(data);
      if (!validation.success) {
        return {
          success: false,
          errors: validation.error.errors.map((err) => ({
            code: "VALIDATION_ERROR" as const,
            field: err.path.join("."),
            message: err.message,
          })),
        };
      }

      const updateData = {
        dateOfBirth: data.dateOfBirth,
        emergencyContact: JSON.stringify(data.emergencyContact),
        gender: data.gender || null,
        pronouns: data.pronouns || null,
        phone: data.phone || null,
        privacySettings: JSON.stringify(data.privacySettings || defaultPrivacySettings),
        profileComplete: true,
        profileUpdatedAt: new Date(),
        profileVersion: sql`${user.profileVersion} + 1`,
      };

      const [updatedUser] = await db()
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
  },
);

export const updatePrivacySettings = createServerFn({ method: "POST" }).handler(
  async ({
    data,
  }: {
    data?: PrivacySettings | undefined;
  }): Promise<ProfileOperationResult> => {
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
          errors: validation.error.errors.map((err) => ({
            code: "VALIDATION_ERROR" as const,
            field: err.path.join("."),
            message: err.message,
          })),
        };
      }

      const [updatedUser] = await db()
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
  },
);
