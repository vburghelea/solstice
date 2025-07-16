import { describe, expect, it } from "vitest";
import { isProfileComplete } from "../profile.queries";
import type { UserProfile } from "../profile.types";

describe("Profile Queries", () => {
  describe("isProfileComplete", () => {
    const baseProfile: UserProfile = {
      id: "user-123",
      name: "Test User",
      email: "test@example.com",
      profileComplete: false,
      profileVersion: 1,
    };

    it("returns false when dateOfBirth is missing", () => {
      const profile: UserProfile = {
        ...baseProfile,
        emergencyContact: {
          name: "John Doe",
          relationship: "Friend",
          phone: "123-456-7890",
        },
      };

      expect(isProfileComplete(profile)).toBe(false);
    });

    it("returns false when emergency contact name is missing", () => {
      const profile: UserProfile = {
        ...baseProfile,
        dateOfBirth: new Date("1990-01-01"),
        emergencyContact: {
          name: "",
          relationship: "Friend",
          phone: "123-456-7890",
        },
      };

      expect(isProfileComplete(profile)).toBe(false);
    });

    it("returns false when emergency contact relationship is missing", () => {
      const profile: UserProfile = {
        ...baseProfile,
        dateOfBirth: new Date("1990-01-01"),
        emergencyContact: {
          name: "John Doe",
          relationship: "",
          phone: "123-456-7890",
        },
      };

      expect(isProfileComplete(profile)).toBe(false);
    });

    it("returns false when emergency contact has neither phone nor email", () => {
      const profile: UserProfile = {
        ...baseProfile,
        dateOfBirth: new Date("1990-01-01"),
        emergencyContact: {
          name: "John Doe",
          relationship: "Friend",
        },
      };

      expect(isProfileComplete(profile)).toBe(false);
    });

    it("returns true when all required fields are present with phone", () => {
      const profile: UserProfile = {
        ...baseProfile,
        dateOfBirth: new Date("1990-01-01"),
        emergencyContact: {
          name: "John Doe",
          relationship: "Friend",
          phone: "123-456-7890",
        },
      };

      expect(isProfileComplete(profile)).toBe(true);
    });

    it("returns true when all required fields are present with email", () => {
      const profile: UserProfile = {
        ...baseProfile,
        dateOfBirth: new Date("1990-01-01"),
        emergencyContact: {
          name: "John Doe",
          relationship: "Friend",
          email: "john@example.com",
        },
      };

      expect(isProfileComplete(profile)).toBe(true);
    });

    it("returns true when all required fields are present with both phone and email", () => {
      const profile: UserProfile = {
        ...baseProfile,
        dateOfBirth: new Date("1990-01-01"),
        emergencyContact: {
          name: "John Doe",
          relationship: "Friend",
          phone: "123-456-7890",
          email: "john@example.com",
        },
      };

      expect(isProfileComplete(profile)).toBe(true);
    });

    it("ignores optional fields when determining completion", () => {
      const profile: UserProfile = {
        ...baseProfile,
        dateOfBirth: new Date("1990-01-01"),
        emergencyContact: {
          name: "John Doe",
          relationship: "Friend",
          phone: "123-456-7890",
        },
        // Optional fields not set
        gender: undefined,
        pronouns: undefined,
        phone: undefined,
        privacySettings: undefined,
      };

      expect(isProfileComplete(profile)).toBe(true);
    });
  });
});
