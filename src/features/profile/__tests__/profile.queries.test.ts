import { describe, expect, it } from "vitest";
import type { UserProfile } from "../profile.types";
import { isProfileComplete } from "../profile.utils";

describe("Profile Queries", () => {
  describe("isProfileComplete", () => {
    const baseProfile: UserProfile = {
      id: "user-123",
      name: "Test User",
      email: "test@example.com",
      profileComplete: false,
      profileVersion: 1,
    };

    it("returns true when all required fields are present", () => {
      const profile: UserProfile = {
        ...baseProfile,
      };

      expect(isProfileComplete(profile)).toBe(true);
    });

    it("ignores optional fields when determining completion", () => {
      const profile: UserProfile = {
        ...baseProfile,
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
