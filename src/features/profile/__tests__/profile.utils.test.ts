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
      privacySettings: {
        showEmail: true,
        showPhone: false,
        showLocation: false,
        showLanguages: false,
        showGamePreferences: false,
        allowTeamInvitations: true,
        allowFollows: true,
      },
      // Add missing required properties with default values
      languages: ["en", "es"],
      identityTags: ["LGBTQ+", "Artist"],
      preferredGameThemes: ["Fantasy", "Scifi"],
      isGM: true,
      gamesHosted: 0,
      responseRate: 0,
      overallExperienceLevel: "intermediate",
      city: "Test City",
      country: "Test Country",
      gmStyle: "Narrative",
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
      // Add missing required properties with default values
      languages: ["en", "es"],
      identityTags: ["LGBTQ+", "Artist"],
      preferredGameThemes: ["Fantasy", "Scifi"],
      isGM: true,
      gamesHosted: 0,
      responseRate: 0,
      overallExperienceLevel: "intermediate",
      city: "Test City",
      country: "Test Country",
      gmStyle: "Narrative",
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
      // Add missing required properties with default values
      languages: ["en", "es"],
      identityTags: ["LGBTQ+", "Artist"],
      preferredGameThemes: ["Fantasy", "Scifi"],
      isGM: true,
      gamesHosted: 0,
      responseRate: 0,
      overallExperienceLevel: "intermediate",
      city: "Test City",
      country: "Test Country",
      gmStyle: "Narrative",
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
      privacySettings: {
        showEmail: true,
        showPhone: false,
        showLocation: false,
        showLanguages: false,
        showGamePreferences: false,
        allowTeamInvitations: true,
        allowFollows: true,
      },
      // Add missing required properties with default values
      languages: ["en", "es"],
      identityTags: ["LGBTQ+", "Artist"],
      preferredGameThemes: ["Fantasy", "Scifi"],
      isGM: true,
      gamesHosted: 0,
      responseRate: 0,
      overallExperienceLevel: "intermediate",
      city: "Test City",
      country: "Test Country",
      gmStyle: "Narrative",
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
      // Add missing required properties with default values
      languages: ["en", "es"],
      identityTags: ["LGBTQ+", "Artist"],
      preferredGameThemes: ["Fantasy", "Scifi"],
      isGM: true,
      gamesHosted: 0,
      responseRate: 0,
      overallExperienceLevel: "intermediate",
      city: "Test City",
      country: "Test Country",
      gmStyle: "Narrative",
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
      privacySettings: {
        showEmail: true,
        showPhone: false,
        showLocation: false,
        showLanguages: false,
        showGamePreferences: false,
        allowTeamInvitations: true,
        allowFollows: true,
      },
      // Add missing required properties with default values
      languages: [],
      identityTags: [],
      preferredGameThemes: [],
      isGM: false,
      gamesHosted: 0,
      responseRate: 0,
    };
    expect(isProfileComplete(profile)).toBe(true);
  });
});
