import { describe, expect, it } from "vitest";
import type { UserProfile } from "../profile.types";
import { isProfileComplete } from "../profile.utils";

describe("profile.utils", () => {
  it("returns true when all required fields are present", () => {
    const profile: UserProfile = {
      id: "user-123",
      name: "Test User",
      email: "test@example.com",
      profileComplete: false,
      profileVersion: 1,
      gender: "Male",
      pronouns: "he/him",
      phone: "1234567890",
      privacySettings: { showEmail: true, showPhone: false, allowTeamInvitations: true },
    };

    expect(isProfileComplete(profile)).toBe(true);
  });

  it("returns false when gender is missing", () => {
    const profile: UserProfile = {
      id: "user-123",
      name: "Test User",
      email: "test@example.com",
      profileComplete: false,
      profileVersion: 1,
      gender: undefined,
      pronouns: "he/him",
      phone: "1234567890",
      privacySettings: { showEmail: true, showPhone: false, allowTeamInvitations: true },
    };
    expect(isProfileComplete(profile)).toBe(false);
  });

  it("returns false when pronouns are missing", () => {
    const profile: UserProfile = {
      id: "user-123",
      name: "Test User",
      email: "test@example.com",
      profileComplete: false,
      profileVersion: 1,
      gender: "Male",
      pronouns: undefined,
      phone: "1234567890",
      privacySettings: { showEmail: true, showPhone: false, allowTeamInvitations: true },
    };
    expect(isProfileComplete(profile)).toBe(false);
  });

  it("returns false when phone is missing", () => {
    const profile: UserProfile = {
      id: "user-123",
      name: "Test User",
      email: "test@example.com",
      profileComplete: false,
      profileVersion: 1,
      gender: "Male",
      pronouns: "he/him",
      phone: undefined,
      privacySettings: { showEmail: true, showPhone: false, allowTeamInvitations: true },
    };
    expect(isProfileComplete(profile)).toBe(false);
  });

  it("returns false when privacySettings are missing", () => {
    const profile: UserProfile = {
      id: "user-123",
      name: "Test User",
      email: "test@example.com",
      profileComplete: false,
      profileVersion: 1,
      gender: "Male",
      pronouns: "he/him",
      phone: "1234567890",
      privacySettings: undefined,
    };
    expect(isProfileComplete(profile)).toBe(false);
  });

  it("returns true when optional fields are undefined", () => {
    const profile: UserProfile = {
      id: "user-123",
      name: "Test User",
      email: "test@example.com",
      profileComplete: false,
      profileVersion: 1,
      gender: "Male",
      pronouns: "he/him",
      phone: "1234567890",
      privacySettings: { showEmail: true, showPhone: false, allowTeamInvitations: true },
      gameSystemPreferences: undefined,
    };
    expect(isProfileComplete(profile)).toBe(true);
  });
});
