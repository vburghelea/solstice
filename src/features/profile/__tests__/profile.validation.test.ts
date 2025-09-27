import { describe, expect, it } from "vitest";
import {
  completeUserProfileInputSchema,
  updatePrivacySettingsInputSchema,
  updateUserProfileInputSchema,
} from "../profile.schemas";
import { defaultNotificationPreferences, defaultPrivacySettings } from "../profile.types";

const validCompleteProfileData = {
  name: "player-one",
  gender: "Female",
  pronouns: "she/her",
  phone: "+4915123456789",
  privacySettings: {
    ...defaultPrivacySettings,
    showEmail: true,
    allowTeamInvitations: true,
  },
};

describe("Profile validation", () => {
  describe("updateUserProfileInputSchema", () => {
    it("accepts valid partial profile data", () => {
      const result = updateUserProfileInputSchema.safeParse({
        ...validCompleteProfileData,
        notificationPreferences: defaultNotificationPreferences,
      });

      expect(result.success).toBe(true);
    });

    it("rejects invalid profile names", () => {
      const result = updateUserProfileInputSchema.safeParse({
        name: "invalid name!",
      });

      expect(result.success).toBe(false);
    });

    it("allows empty payloads", () => {
      const result = updateUserProfileInputSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe("completeUserProfileInputSchema", () => {
    it("accepts fully populated profile data", () => {
      const result = completeUserProfileInputSchema.safeParse({
        data: validCompleteProfileData,
      });

      expect(result.success).toBe(true);
    });

    it("requires a valid profile name", () => {
      const result = completeUserProfileInputSchema.safeParse({
        data: {
          ...validCompleteProfileData,
          name: "Invalid Name",
        },
      });

      expect(result.success).toBe(false);
    });

    it("requires mandatory fields", () => {
      const incompleteProfile = { ...validCompleteProfileData } as Record<
        string,
        unknown
      >;
      delete incompleteProfile["name"];
      const result = completeUserProfileInputSchema.safeParse({
        data: incompleteProfile,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("updatePrivacySettingsInputSchema", () => {
    it("accepts valid privacy settings", () => {
      const result = updatePrivacySettingsInputSchema.safeParse({
        data: {
          ...defaultPrivacySettings,
          showEmail: false,
        },
      });

      expect(result.success).toBe(true);
    });

    it("rejects missing fields", () => {
      const result = updatePrivacySettingsInputSchema.safeParse({
        data: {
          showEmail: true,
          showPhone: false,
          allowFollows: true,
          // missing allowTeamInvitations
        },
      });

      expect(result.success).toBe(false);
    });
  });
});
