import { describe, expect, it } from "vitest";
import {
  emergencyContactSchema,
  privacySettingsSchema,
  profileInputSchema,
} from "../profile.schemas";

describe("Profile Schemas", () => {
  describe("emergencyContactSchema", () => {
    it("validates valid emergency contact with phone", () => {
      const validContact = {
        name: "John Doe",
        relationship: "Friend",
        phone: "123-456-7890",
      };

      const result = emergencyContactSchema.safeParse(validContact);
      expect(result.success).toBe(true);
    });

    it("validates valid emergency contact with email", () => {
      const validContact = {
        name: "Jane Doe",
        relationship: "Mother",
        email: "jane@example.com",
      };

      const result = emergencyContactSchema.safeParse(validContact);
      expect(result.success).toBe(true);
    });

    it("validates valid emergency contact with both phone and email", () => {
      const validContact = {
        name: "John Doe",
        relationship: "Friend",
        phone: "123-456-7890",
        email: "john@example.com",
      };

      const result = emergencyContactSchema.safeParse(validContact);
      expect(result.success).toBe(true);
    });

    it("fails when name is missing", () => {
      const invalidContact = {
        relationship: "Friend",
        phone: "123-456-7890",
      };

      const result = emergencyContactSchema.safeParse(invalidContact);
      expect(result.success).toBe(false);
    });

    it("fails when relationship is missing", () => {
      const invalidContact = {
        name: "John Doe",
        phone: "123-456-7890",
      };

      const result = emergencyContactSchema.safeParse(invalidContact);
      expect(result.success).toBe(false);
    });

    it("fails when neither phone nor email is provided", () => {
      const invalidContact = {
        name: "John Doe",
        relationship: "Friend",
      };

      const result = emergencyContactSchema.safeParse(invalidContact);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Either phone or email is required for emergency contact",
        );
      }
    });

    it("fails with invalid email format", () => {
      const invalidContact = {
        name: "John Doe",
        relationship: "Friend",
        email: "not-an-email",
      };

      const result = emergencyContactSchema.safeParse(invalidContact);
      expect(result.success).toBe(false);
    });
  });

  describe("privacySettingsSchema", () => {
    it("validates valid privacy settings", () => {
      const validSettings = {
        showEmail: true,
        showPhone: false,
        showBirthYear: true,
        allowTeamInvitations: true,
      };

      const result = privacySettingsSchema.safeParse(validSettings);
      expect(result.success).toBe(true);
    });

    it("fails when missing required fields", () => {
      const invalidSettings = {
        showEmail: true,
        showPhone: false,
        // Missing showBirthYear and allowTeamInvitations
      };

      const result = privacySettingsSchema.safeParse(invalidSettings);
      expect(result.success).toBe(false);
    });
  });

  describe("profileInputSchema", () => {
    it("validates valid profile input", () => {
      const validInput = {
        dateOfBirth: new Date("1990-01-01"),
        emergencyContact: {
          name: "John Doe",
          relationship: "Friend",
          phone: "123-456-7890",
        },
        gender: "Male",
        pronouns: "he/him",
        phone: "987-654-3210",
        privacySettings: {
          showEmail: true,
          showPhone: false,
          showBirthYear: true,
          allowTeamInvitations: true,
        },
      };

      const result = profileInputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("validates profile input with only required fields", () => {
      const minimalInput = {
        dateOfBirth: new Date("1990-01-01"),
        emergencyContact: {
          name: "John Doe",
          relationship: "Friend",
          phone: "123-456-7890",
        },
      };

      const result = profileInputSchema.safeParse(minimalInput);
      expect(result.success).toBe(true);
    });

    it("fails with age less than 13", () => {
      const tooYoung = new Date();
      tooYoung.setFullYear(tooYoung.getFullYear() - 10);

      const invalidInput = {
        dateOfBirth: tooYoung,
        emergencyContact: {
          name: "John Doe",
          relationship: "Parent",
          phone: "123-456-7890",
        },
      };

      const result = profileInputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Age must be between 13 and 120 years",
        );
      }
    });

    it("fails with age greater than 120", () => {
      const tooOld = new Date("1800-01-01");

      const invalidInput = {
        dateOfBirth: tooOld,
        emergencyContact: {
          name: "John Doe",
          relationship: "Descendant",
          phone: "123-456-7890",
        },
      };

      const result = profileInputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Age must be between 13 and 120 years",
        );
      }
    });

    it("fails with invalid emergency contact", () => {
      const invalidInput = {
        dateOfBirth: new Date("1990-01-01"),
        emergencyContact: {
          name: "John Doe",
          relationship: "Friend",
          // Missing phone and email
        },
      };

      const result = profileInputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });
  });
});
