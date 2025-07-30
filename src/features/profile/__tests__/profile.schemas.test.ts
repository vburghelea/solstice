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
          favorite: [
            { id: 1, name: "System 1" },
            { id: 2, name: "System 2" },
          ],
          avoid: [{ id: 3, name: "System 3" }],
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
          favorite: [{ id: 10, name: "System 10" }],
          avoid: [
            { id: 20, name: "System 20" },
            { id: 30, name: "System 30" },
          ],
        },
      };

      const result = profileInputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("fails when gameSystemPreferences contains non-numeric IDs", () => {
      const invalidInput = {
        gameSystemPreferences: {
          favorite: [
            { id: 1, name: "System 1" },
            { id: "invalid", name: "Invalid System" },
          ],
          avoid: [{ id: 3, name: "System 3" }],
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
