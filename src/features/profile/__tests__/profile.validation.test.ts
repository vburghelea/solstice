import { describe, expect, it } from "vitest";
import {
  completeUserProfileInputSchema,
  updatePrivacySettingsInputSchema,
  updateUserProfileInputSchema,
} from "../profile.schemas";

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

    it("validates with date of birth", () => {
      const validInput = {
        data: {
          dateOfBirth: new Date("1990-01-01"),
        },
      };

      const result = updateUserProfileInputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("fails with invalid date of birth (too young)", () => {
      const invalidInput = {
        data: {
          dateOfBirth: new Date("2020-01-01"),
        },
      };

      const result = updateUserProfileInputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain(
          "You must be between 13 and 120 years old",
        );
      }
    });

    it("validates with emergency contact", () => {
      const validInput = {
        data: {
          emergencyContact: {
            name: "John Doe",
            relationship: "Friend",
            phone: "123-456-7890",
          },
        },
      };

      const result = updateUserProfileInputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("fails with invalid emergency contact (missing contact method)", () => {
      const invalidInput = {
        data: {
          emergencyContact: {
            name: "John Doe",
            relationship: "Friend",
          },
        },
      };

      const result = updateUserProfileInputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it("validates with privacy settings", () => {
      const validInput = {
        data: {
          privacySettings: {
            showEmail: true,
            showPhone: false,
            showBirthYear: true,
            allowTeamInvitations: true,
          },
        },
      };

      const result = updateUserProfileInputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("fails with missing data wrapper", () => {
      const invalidInput = {
        gender: "Female",
      };

      const result = updateUserProfileInputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });
  });

  describe("completeUserProfileInputSchema", () => {
    it("validates complete profile data", () => {
      const validInput = {
        data: {
          dateOfBirth: new Date("1990-01-01"),
          emergencyContact: {
            name: "Jane Doe",
            relationship: "Mother",
            phone: "555-123-4567",
          },
          gender: "Female",
          pronouns: "she/her",
          phone: "555-987-6543",
          privacySettings: {
            showEmail: true,
            showPhone: false,
            showBirthYear: false,
            allowTeamInvitations: true,
          },
        },
      };

      const result = completeUserProfileInputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("validates minimal required data", () => {
      const validInput = {
        data: {
          dateOfBirth: new Date("1990-01-01"),
        },
      };

      const result = completeUserProfileInputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("fails without required dateOfBirth", () => {
      const invalidInput = {
        data: {
          gender: "Male",
        },
      };

      const result = completeUserProfileInputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it("fails with invalid date of birth", () => {
      const invalidInput = {
        data: {
          dateOfBirth: new Date("1800-01-01"),
        },
      };

      const result = completeUserProfileInputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain(
          "You must be between 13 and 120 years old",
        );
      }
    });
  });

  describe("updatePrivacySettingsInputSchema", () => {
    it("validates valid privacy settings", () => {
      const validInput = {
        data: {
          showEmail: false,
          showPhone: false,
          showBirthYear: false,
          allowTeamInvitations: false,
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
          // Missing showBirthYear and allowTeamInvitations
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
          showBirthYear: true,
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
        showBirthYear: true,
        allowTeamInvitations: true,
      };

      const result = updatePrivacySettingsInputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });
  });
});
