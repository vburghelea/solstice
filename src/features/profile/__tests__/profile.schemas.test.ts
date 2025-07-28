import { describe, expect, it } from "vitest";
import { privacySettingsSchema, profileInputSchema } from "../profile.schemas";

describe("Profile Schemas", () => {
  describe("privacySettingsSchema", () => {
    it("validates valid privacy settings", () => {
      const validSettings = {
        showEmail: true,
        showPhone: false,
        allowTeamInvitations: true,
      };

      const result = privacySettingsSchema.safeParse(validSettings);
      expect(result.success).toBe(true);
    });

    it("fails when missing required fields", () => {
      const invalidSettings = {
        showEmail: true,
        showPhone: false,
      };

      const result = privacySettingsSchema.safeParse(invalidSettings);
      expect(result.success).toBe(false);
    });
  });

  describe("profileInputSchema", () => {
    it("validates valid profile input with all fields including gameSystemPreferences", () => {
      const validInput = {
        gender: "Male",
        pronouns: "he/him",
        phone: "987-654-3210",
        gameSystemPreferences: {
          favorite: [1, 2],
          avoid: [3],
        },
        privacySettings: {
          showEmail: true,
          showPhone: false,
          allowTeamInvitations: true,
        },
      };

      const result = profileInputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("validates profile input with only gameSystemPreferences", () => {
      const validInput = {
        gameSystemPreferences: {
          favorite: [10],
          avoid: [20, 30],
        },
      };

      const result = profileInputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("fails when gameSystemPreferences contains non-numeric IDs", () => {
      const invalidInput = {
        gameSystemPreferences: {
          favorite: [1, "invalid"],
          avoid: [3],
        },
      };

      const result = profileInputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain(
        "Expected number, received string",
      );
    });

    it("validates profile input with only required fields", () => {
      const minimalInput = {};

      const result = profileInputSchema.safeParse(minimalInput);
      expect(result.success).toBe(true);
    });
  });
});
