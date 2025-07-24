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
    it("validates valid profile input", () => {
      const validInput = {
        gender: "Male",
        pronouns: "he/him",
        phone: "987-654-3210",
        privacySettings: {
          showEmail: true,
          showPhone: false,
          allowTeamInvitations: true,
        },
      };

      const result = profileInputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("validates profile input with only required fields", () => {
      const minimalInput = {};

      const result = profileInputSchema.safeParse(minimalInput);
      expect(result.success).toBe(true);
    });
  });
});
