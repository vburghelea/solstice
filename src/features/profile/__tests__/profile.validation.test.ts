import { describe, expect, it } from "vitest";
import {
  completeUserProfileInputSchema,
  updatePrivacySettingsInputSchema,
  updateUserProfileInputSchema,
} from "../profile.schemas";
import { defaultPrivacySettings } from "../profile.types";

describe("Profile Server Function Input Schemas", () => {
  describe("updateUserProfileInputSchema", () => {
    it("validates valid partial profile data", () => {
      const validInput = {
        data: {
          gender: "Female",
          pronouns: "she/her",
        },
      };

      const result = updateUserProfileInputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("validates empty data object", () => {
      const validInput = {
        data: {},
      };

      const result = updateUserProfileInputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("validates with privacy settings", () => {
      const validInput = {
        data: {
          privacySettings: {
            ...defaultPrivacySettings,
            showEmail: true,
            showPhone: false,
            allowTeamInvitations: true,
          },
        },
      };

      const result = updateUserProfileInputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("fails with invalid gender type", () => {
      const invalidInput = {
        gender: 123, // Gender should be a string
      };

      const result = updateUserProfileInputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });
  });

  describe("completeUserProfileInputSchema", () => {
    it("validates complete profile data", () => {
      const validInput = {
        data: {
          gender: "Female",
          pronouns: "she/her",
          phone: "555-987-6543",
          privacySettings: {
            ...defaultPrivacySettings,
            showEmail: true,
            allowTeamInvitations: true,
          },
        },
      };

      const result = completeUserProfileInputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });
  });

  describe("updatePrivacySettingsInputSchema", () => {
    it("validates valid privacy settings", () => {
      const validInput = {
        data: {
          ...defaultPrivacySettings,
          showEmail: false,
          showPhone: false,
          allowTeamInvitations: false,
          allowFollows: true,
        },
      };

      const result = updatePrivacySettingsInputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("fails with missing required fields", () => {
      const invalidInput = {
        data: {
          showEmail: true,
          showPhone: true,
          // Missing allowTeamInvitations
        },
      };

      const result = updatePrivacySettingsInputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it("fails with invalid field types", () => {
      const invalidInput = {
        data: {
          showEmail: "yes", // Should be boolean
          showPhone: true,
          allowTeamInvitations: true,
        },
      };

      const result = updatePrivacySettingsInputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it("fails without data wrapper", () => {
      const invalidInput = {
        showEmail: true,
        showPhone: true,
        allowTeamInvitations: true,
      };

      const result = updatePrivacySettingsInputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });
  });
});
