import { createServerFn } from "@tanstack/react-start";
import { getAuthMiddleware, requireUser } from "~/lib/server/auth";
import { zod$ } from "~/lib/server/fn-utils";
import { isProfileComplete } from "./profile.queries";
import {
  partialProfileInputSchema,
  privacySettingsSchema,
  profileInputSchema,
} from "./profile.schemas";
import type {
  EmergencyContact,
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

export const updateUserProfile = createServerFn({ method: "POST" })
  .middleware(getAuthMiddleware())
  .inputValidator(zod$(partialProfileInputSchema))
  .handler(async ({ data: inputData, context }): Promise<ProfileOperationResult> => {
    // Now inputData contains the actual profile data
    try {
      const [{ getDb }] = await Promise.all([import("~/db/server-helpers")]);
      const db = await getDb();
      const currentUser = requireUser(context);

      // Input is already validated by .inputValidator(), just check if it's empty
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

      if (inputData.dateOfBirth !== undefined) {
        // Convert string date to Date object if needed
        updateData["dateOfBirth"] =
          typeof inputData.dateOfBirth === "string"
            ? new Date(inputData.dateOfBirth)
            : inputData.dateOfBirth;
      }
      if (inputData.emergencyContact !== undefined) {
        updateData["emergencyContact"] = JSON.stringify(inputData.emergencyContact);
      }
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

      // Check if profile is now complete
      const profile = mapDbUserToProfile(updatedUser);
      const profileComplete = isProfileComplete(profile);

      if (profileComplete !== updatedUser.profileComplete) {
        const [finalUser] = await db
          .update(user)
          .set({ profileComplete })
          .where(eq(user.id, currentUser.id))
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
  .middleware(getAuthMiddleware())
  .inputValidator(zod$(profileInputSchema))
  .handler(async ({ data, context }): Promise<ProfileOperationResult> => {
    try {
      const [{ getDb }] = await Promise.all([import("~/db/server-helpers")]);
      const db = await getDb();
      const currentUser = requireUser(context);

      const { eq, sql } = await import("drizzle-orm");
      const { user } = await import("~/db/schema");

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
  .middleware(getAuthMiddleware())
  .inputValidator(zod$(privacySettingsSchema))
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
