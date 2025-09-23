import { describe, expect, it } from "vitest";
import {
  experienceLevelOptions,
  gameThemeOptions,
  identityTagOptions,
} from "~/shared/types/common";
import { privacySettingsSchema, profileInputSchema } from "../profile.schemas";
import { defaultPrivacySettings } from "../profile.types";

describe("Profile Schemas", () => {
  describe("privacySettingsSchema", () => {
    it("validates valid privacy settings", () => {
      const validSettings = {
        ...defaultPrivacySettings,
        showEmail: true,
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
          ...defaultPrivacySettings,
          showEmail: true,
          allowTeamInvitations: true,
        },
        overallExperienceLevel: "intermediate",
        identityTags: ["LGBTQ+", "Artist"],
        preferredGameThemes: ["Fantasy", "Scifi"],
        languages: ["en", "es"],
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

    it("validates valid experience level", () => {
      const validInput = {
        overallExperienceLevel: "advanced",
      };

      const result = profileInputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("fails with invalid experience level", () => {
      const invalidInput = {
        overallExperienceLevel: "invalid-level",
      };

      const result = profileInputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it("validates valid identity tags", () => {
      const validInput = {
        identityTags: ["LGBTQ+", "Artist"],
      };

      const result = profileInputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("allows any identity tags (no validation on contents)", () => {
      const validInput = {
        identityTags: ["InvalidTag"],
      };

      const result = profileInputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("validates valid preferred game themes", () => {
      const validInput = {
        preferredGameThemes: ["Fantasy", "Scifi"],
      };

      const result = profileInputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("allows any preferred game themes (no validation on contents)", () => {
      const validInput = {
        preferredGameThemes: ["InvalidTheme"],
      };

      const result = profileInputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("validates valid languages", () => {
      const validInput = {
        languages: ["en", "es"],
      };

      const result = profileInputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("validates valid city and country", () => {
      const validInput = {
        city: "Test City",
        country: "Test Country",
      };

      const result = profileInputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("validates GM-specific fields", () => {
      const validInput = {
        isGM: true,
        gmStyle: "Narrative",
      };

      const result = profileInputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("validates calendar availability", () => {
      const validInput = {
        calendarAvailability: {
          monday: Array(96).fill(false),
          tuesday: Array(96).fill(false),
          wednesday: Array(96).fill(false),
          thursday: Array(96).fill(false),
          friday: Array(96).fill(false),
          saturday: Array(96).fill(false),
          sunday: Array(96).fill(false),
        },
      };

      const result = profileInputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });
  });

  describe("Experience Level Validation", () => {
    it("validates all valid experience levels", () => {
      experienceLevelOptions.forEach((level) => {
        const validInput = {
          overallExperienceLevel: level,
        };

        const result = profileInputSchema.safeParse(validInput);
        expect(result.success).toBe(true);
      });

      describe("Complete Profile Validation", () => {
        it("validates complete profile with all required fields", () => {
          const validInput = {
            gender: "Male",
            pronouns: "he/him",
            phone: "1234567890",
            privacySettings: {
              showEmail: true,
              showPhone: false,
              showLocation: false,
              showLanguages: false,
              showGamePreferences: false,
              allowTeamInvitations: true,
              allowFollows: true,
            },
            overallExperienceLevel: "intermediate",
            identityTags: ["LGBTQ+", "Artist"],
            preferredGameThemes: ["Fantasy", "Scifi"],
            languages: ["en", "es"],
            city: "Test City",
            country: "Test Country",
            isGM: true,
            gmStyle: "Narrative",
          };

          const result = profileInputSchema.safeParse(validInput);
          expect(result.success).toBe(true);
        });
      });
    });
  });

  describe("Identity Tags Validation", () => {
    it("validates all valid identity tags", () => {
      // Test a few identity tags
      const validTags = identityTagOptions.slice(0, 3);
      validTags.forEach((tag) => {
        const validInput = {
          identityTags: [tag],
        };

        const result = profileInputSchema.safeParse(validInput);
        expect(result.success).toBe(true);
      });
    });
  });

  describe("Game Themes Validation", () => {
    it("validates all valid game themes", () => {
      // Test a few game themes
      const validThemes = gameThemeOptions.slice(0, 3);
      validThemes.forEach((theme) => {
        const validInput = {
          preferredGameThemes: [theme],
        };

        const result = profileInputSchema.safeParse(validInput);
        expect(result.success).toBe(true);
      });
    });
  });
});
