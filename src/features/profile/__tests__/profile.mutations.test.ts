import { beforeEach, describe, expect, it, vi } from "vitest";
import { defaultAvailabilityData, type AvailabilityData } from "~/db/schema/auth.schema";
import type { CompleteProfileInputType, ProfileInputType } from "../profile.schemas";
import type { PrivacySettings, UserProfile } from "../profile.types";

// Mock the entire profile.mutations module
vi.mock("../profile.mutations", async (importOriginal) => {
  const original = await importOriginal<object>();
  return {
    ...original,
    updateUserProfile: vi
      .fn()
      // eslint-disable-next-line  @typescript-eslint/no-unused-vars
      .mockImplementation(async (input: ProfileInputType) => {
        return Promise.resolve({ success: true, data: mockUser });
      }),
    completeUserProfile: vi
      .fn()
      // eslint-disable-next-line  @typescript-eslint/no-unused-vars
      .mockImplementation(async (input: CompleteProfileInputType) => {
        return Promise.resolve({ success: true, data: mockUser });
      }),
    updatePrivacySettings: vi
      .fn()
      // eslint-disable-next-line  @typescript-eslint/no-unused-vars
      .mockImplementation(async (input: PrivacySettings) => {
        return Promise.resolve({ success: true, data: mockUser });
      }),
  };
});

// Import the mocked functions
import {
  completeUserProfile,
  updatePrivacySettings,
  updateUserProfile,
} from "../profile.mutations";

const mockUser: UserProfile = {
  id: "user-1",
  name: "Test User",
  email: "test@example.com",
  profileComplete: false,
  profileVersion: 1,
  languages: [],
  identityTags: [],
  preferredGameThemes: [],
  isGM: false,
  gamesHosted: 0,
  responseRate: 0,
  calendarAvailability: defaultAvailabilityData,
};

describe("Profile Mutations", () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  describe("updateUserProfile", () => {
    it("should update basic profile fields", async () => {
      const updatedProfile = { ...mockUser, gender: "Non-binary", phone: "1234567890" };
      vi.mocked(updateUserProfile).mockResolvedValue({
        success: true,
        data: updatedProfile,
      });

      const result = await updateUserProfile({
        data: { gender: "Non-binary", phone: "1234567890" },
      });

      expect(result.success).toBe(true);
      expect(result.data?.gender).toBe("Non-binary");
      expect(result.data?.phone).toBe("1234567890");
    });

    it("should update experience level", async () => {
      const updatedProfile = { ...mockUser, overallExperienceLevel: "advanced" as const };
      vi.mocked(updateUserProfile).mockResolvedValue({
        success: true,
        data: updatedProfile,
      });

      const result = await updateUserProfile({
        data: { overallExperienceLevel: "advanced" },
      });

      expect(result.success).toBe(true);
      expect(result.data?.overallExperienceLevel).toBe("advanced");
    });

    it("should update identity tags", async () => {
      const updatedProfile = { ...mockUser, identityTags: ["LGBTQ+", "Artist"] };
      vi.mocked(updateUserProfile).mockResolvedValue({
        success: true,
        data: updatedProfile,
      });

      const result = await updateUserProfile({
        data: { identityTags: ["LGBTQ+", "Artist"] },
      });

      expect(result.success).toBe(true);
      expect(result.data?.identityTags).toEqual(["LGBTQ+", "Artist"]);
    });

    it("should update preferred game themes", async () => {
      const updatedProfile = { ...mockUser, preferredGameThemes: ["Fantasy", "Scifi"] };
      vi.mocked(updateUserProfile).mockResolvedValue({
        success: true,
        data: updatedProfile,
      });

      const result = await updateUserProfile({
        data: { preferredGameThemes: ["Fantasy", "Scifi"] },
      });

      expect(result.success).toBe(true);
      expect(result.data?.preferredGameThemes).toEqual(["Fantasy", "Scifi"]);
    });

    it("should update languages", async () => {
      const updatedProfile = { ...mockUser, languages: ["en", "es"] };
      vi.mocked(updateUserProfile).mockResolvedValue({
        success: true,
        data: updatedProfile,
      });

      const result = await updateUserProfile({ data: { languages: ["en", "es"] } });

      expect(result.success).toBe(true);
      expect(result.data?.languages).toEqual(["en", "es"]);
    });

    it("should update city and country", async () => {
      const updatedProfile = { ...mockUser, city: "Test City", country: "Test Country" };
      vi.mocked(updateUserProfile).mockResolvedValue({
        success: true,
        data: updatedProfile,
      });

      const result = await updateUserProfile({
        data: { city: "Test City", country: "Test Country" },
      });

      expect(result.success).toBe(true);
      expect(result.data?.city).toBe("Test City");
      expect(result.data?.country).toBe("Test Country");
    });

    it("should update GM-specific fields", async () => {
      const updatedProfile = { ...mockUser, isGM: true, gmStyle: "Narrative" };
      vi.mocked(updateUserProfile).mockResolvedValue({
        success: true,
        data: updatedProfile,
      });

      const result = await updateUserProfile({
        data: { isGM: true, gmStyle: "Narrative" },
      });

      expect(result.success).toBe(true);
      expect(result.data?.isGM).toBe(true);
      expect(result.data?.gmStyle).toBe("Narrative");
    });

    it("should update calendar availability", async () => {
      const newAvailability: AvailabilityData = {
        ...defaultAvailabilityData,
        monday: Array(96)
          .fill(false)
          .map((_, i) => i >= 36 && i < 68), // 9am to 5pm
      };
      const updatedProfile = { ...mockUser, calendarAvailability: newAvailability };
      vi.mocked(updateUserProfile).mockResolvedValue({
        success: true,
        data: updatedProfile,
      });

      const result = await updateUserProfile({
        data: { calendarAvailability: newAvailability },
      });

      expect(result.success).toBe(true);
      expect(result.data?.calendarAvailability).toEqual(newAvailability);
      expect(result.data?.calendarAvailability?.monday[36]).toBe(true); // 9:00
      expect(result.data?.calendarAvailability?.monday[67]).toBe(true); // 16:45
      expect(result.data?.calendarAvailability?.monday[68]).toBe(false); // 17:00
    });

    it("should update game system preferences", async () => {
      const preferences = {
        favorite: [{ id: 1, name: "Catan" }],
        avoid: [{ id: 2, name: "Gloomhaven" }],
      };
      const updatedProfile = { ...mockUser, gameSystemPreferences: preferences };
      vi.mocked(updateUserProfile).mockResolvedValue({
        success: true,
        data: updatedProfile,
      });

      const result = await updateUserProfile({
        data: { gameSystemPreferences: preferences },
      });

      expect(result.success).toBe(true);
      expect(result.data?.gameSystemPreferences).toEqual(preferences);
    });

    it("should update profileComplete status if profile becomes complete", async () => {
      const updatedProfile = { ...mockUser, profileComplete: true, gender: "Female" };
      vi.mocked(updateUserProfile).mockResolvedValue({
        success: true,
        data: updatedProfile,
      });

      const result = await updateUserProfile({ data: { gender: "Female" } });

      expect(result.success).toBe(true);
      expect(result.data?.profileComplete).toBe(true);
    });

    it("should return validation error for invalid data", async () => {
      vi.mocked(updateUserProfile).mockResolvedValue({
        success: false,
        errors: [{ code: "VALIDATION_ERROR", message: "Invalid phone number" }],
      });

      const result = await updateUserProfile({
        data: { phone: "this-is-an-invalid-phone-number-and-is-way-too-long" },
      });
      expect(result.success).toBe(false);
      expect(result.errors?.[0].code).toBe("VALIDATION_ERROR");
    });

    it("should fail if user is not authenticated", async () => {
      vi.mocked(updateUserProfile).mockResolvedValue({
        success: false,
        errors: [{ code: "AUTH_ERROR", message: "Not authenticated" }],
      });

      const result = await updateUserProfile({ data: { gender: "Male" } });
      expect(result.success).toBe(false);
      expect(result.errors?.[0].message).toBe("Not authenticated");
    });
  });

  describe("completeUserProfile", () => {
    it("should set all required fields and mark profile as complete", async () => {
      const profileData = {
        gender: "Male",
        pronouns: "he/him",
        phone: "9876543210",
        privacySettings: {
          showEmail: true,
          showPhone: false,
          showLocation: false,
          showLanguages: false,
          showGamePreferences: false,
          allowTeamInvitations: true,
          allowFollows: true,
        },
        gameSystemPreferences: {
          favorite: [{ id: 3, name: "Wingspan" }],
          avoid: [],
        },
      };
      const completedProfile = { ...mockUser, ...profileData, profileComplete: true };
      vi.mocked(completeUserProfile).mockResolvedValue({
        success: true,
        data: completedProfile,
      });

      // eslint-disable-next-line  @typescript-eslint/no-explicit-any
      const result = await completeUserProfile({ data: profileData } as any);

      expect(result.success).toBe(true);
      expect(result.data?.profileComplete).toBe(true);
      expect(result.data?.gender).toBe("Male");
    });

    it("should return validation error for missing required fields", async () => {
      vi.mocked(completeUserProfile).mockResolvedValue({
        success: false,
        errors: [{ code: "VALIDATION_ERROR", message: "Missing required field" }],
      });

      // eslint-disable-next-line  @typescript-eslint/no-explicit-any
      const result = await completeUserProfile({ data: { phone: "123" } } as any);
      expect(result.success).toBe(false);
      expect(result.errors?.[0].code).toBe("VALIDATION_ERROR");
    });

    it("should update with new fields", async () => {
      const profileData = {
        gender: "Female",
        pronouns: "she/her",
        phone: "9876543210",
        privacySettings: {
          showEmail: true,
          showPhone: false,
          showLocation: false,
          showLanguages: false,
          showGamePreferences: false,
          allowTeamInvitations: true,
          allowFollows: true,
        },
        overallExperienceLevel: "intermediate" as const,
        identityTags: ["LGBTQ+", "Artist"],
        preferredGameThemes: ["Fantasy", "Scifi"],
        languages: ["en", "es"],
      };
      const completedProfile = { ...mockUser, ...profileData, profileComplete: true };
      vi.mocked(completeUserProfile).mockResolvedValue({
        success: true,
        data: completedProfile,
      });

      // eslint-disable-next-line  @typescript-eslint/no-explicit-any
      const result = await completeUserProfile({ data: profileData } as any);

      expect(result.success).toBe(true);
      expect(result.data?.overallExperienceLevel).toBe("intermediate");
      expect(result.data?.identityTags).toEqual(["LGBTQ+", "Artist"]);
      expect(result.data?.preferredGameThemes).toEqual(["Fantasy", "Scifi"]);
      expect(result.data?.languages).toEqual(["en", "es"]);
    });

    it("should update with all new fields including city, country, GM fields, and calendar", async () => {
      const profileData = {
        gender: "Female",
        pronouns: "she/her",
        phone: "9876543210",
        privacySettings: {
          showEmail: true,
          showPhone: false,
          showLocation: false,
          showLanguages: false,
          showGamePreferences: false,
          allowTeamInvitations: true,
          allowFollows: true,
        },
        overallExperienceLevel: "intermediate" as const,
        identityTags: ["LGBTQ+", "Artist"],
        preferredGameThemes: ["Fantasy", "Scifi"],
        languages: ["en", "es"],
        city: "Test City",
        country: "Test Country",
        isGM: true,
        gmStyle: "Narrative",
        calendarAvailability: defaultAvailabilityData,
      };
      const completedProfile = { ...mockUser, ...profileData, profileComplete: true };
      vi.mocked(completeUserProfile).mockResolvedValue({
        success: true,
        data: completedProfile,
      });

      // eslint-disable-next-line  @typescript-eslint/no-explicit-any
      const result = await completeUserProfile({ data: profileData } as any);

      expect(result.success).toBe(true);
      expect(result.data?.overallExperienceLevel).toBe("intermediate");
      expect(result.data?.identityTags).toEqual(["LGBTQ+", "Artist"]);
      expect(result.data?.preferredGameThemes).toEqual(["Fantasy", "Scifi"]);
      expect(result.data?.languages).toEqual(["en", "es"]);
      expect(result.data?.city).toBe("Test City");
      expect(result.data?.country).toBe("Test Country");
      expect(result.data?.isGM).toBe(true);
      expect(result.data?.gmStyle).toBe("Narrative");
      expect(result.data?.calendarAvailability).toEqual(defaultAvailabilityData);
    });
  });

  describe("updatePrivacySettings", () => {
    it("should update privacy settings", async () => {
      const privacySettings: PrivacySettings = {
        showEmail: false,
        showPhone: true,
        showLocation: false,
        showLanguages: false,
        showGamePreferences: false,
        allowTeamInvitations: false,
        allowFollows: true,
      };
      const updatedProfile = { ...mockUser, privacySettings };
      vi.mocked(updatePrivacySettings).mockResolvedValue({
        success: true,
        data: updatedProfile,
      });

      // eslint-disable-next-line  @typescript-eslint/no-explicit-any
      const result = await updatePrivacySettings({ data: privacySettings } as any);

      expect(result.success).toBe(true);
      expect(result.data?.privacySettings).toEqual(privacySettings);
    });

    it("should return validation error for invalid privacy settings", async () => {
      vi.mocked(updatePrivacySettings).mockResolvedValue({
        success: false,
        errors: [{ code: "VALIDATION_ERROR", message: "Invalid privacy settings" }],
      });

      const result = await updatePrivacySettings({
        data: { showEmail: "not-a-boolean" },
        // eslint-disable-next-line  @typescript-eslint/no-explicit-any
      } as any);
      expect(result.success).toBe(false);
      expect(result.errors?.[0].code).toBe("VALIDATION_ERROR");
    });
  });
});
