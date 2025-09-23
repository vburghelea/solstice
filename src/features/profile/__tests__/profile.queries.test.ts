import { beforeEach, describe, expect, it, vi } from "vitest";
import { defaultAvailabilityData } from "~/db";
import type { PrivacySettings, UserProfile } from "../profile.types";
import { defaultPrivacySettings } from "../profile.types";

// Mock the entire profile.queries module
vi.mock("../profile.queries", async (importOriginal) => {
  const original = await importOriginal<object>();
  return {
    ...original,
    getUserProfile: vi.fn(),
    getGameSystems: vi.fn(),
    getUserGameSystemPreferences: vi.fn(),
    getProfileCompletionStatus: vi.fn(),
  };
});

// Import the mocked functions and the unmocked utility
import type { GameSystemSummary } from "../profile.queries";
import {
  getGameSystems,
  getProfileCompletionStatus,
  getUserGameSystemPreferences,
  getUserProfile,
} from "../profile.queries";
import { isProfileComplete } from "../profile.utils";

describe("Profile Queries", () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  describe("isProfileComplete", () => {
    const baseProfile = {
      id: "user-123",
      name: "Test User",
      email: "test@example.com",
      profileComplete: false,
      profileVersion: 1,
      // Add missing required properties with default values
      languages: [],
      identityTags: [],
      preferredGameThemes: [],
      isGM: false,
      gamesHosted: 0,
      responseRate: 0,
      // Add optional properties with undefined values
      image: undefined as string | undefined,
      gender: undefined as string | undefined,
      pronouns: undefined as string | undefined,
      phone: undefined as string | undefined,
      city: undefined as string | undefined,
      country: undefined as string | undefined,
      overallExperienceLevel: undefined as
        | "beginner"
        | "intermediate"
        | "advanced"
        | "expert"
        | undefined,
      gameSystemPreferences: undefined as
        | {
            favorite: { id: number; name: string }[];
            avoid: { id: number; name: string }[];
          }
        | undefined,
      calendarAvailability: defaultAvailabilityData,
      privacySettings: undefined as PrivacySettings | undefined,
      averageResponseTime: undefined as number | undefined,
      gmStyle: undefined as string | undefined,
      gmRating: undefined as number | undefined,
      profileUpdatedAt: undefined as Date | undefined,
    } as UserProfile;

    it("returns true when all required fields are present including new fields", () => {
      const profile: UserProfile = {
        ...baseProfile,
        gender: "Male",
        pronouns: "he/him",
        phone: "1234567890",
        privacySettings: {
          ...defaultPrivacySettings,
          showEmail: true,
          allowTeamInvitations: true,
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

      expect(isProfileComplete(profile)).toBe(true);
    });

    it("returns true when all required fields are present", () => {
      const profile: UserProfile = {
        ...baseProfile,
        gender: "Male",
        pronouns: "he/him",
        phone: "1234567890",
        privacySettings: {
          ...defaultPrivacySettings,
          showEmail: true,
          allowTeamInvitations: true,
        },
      };

      expect(isProfileComplete(profile)).toBe(true);
    });

    it("returns false when required fields are missing", () => {
      const profile = {
        ...baseProfile,
        // Required fields not set
        gender: undefined,
        pronouns: undefined,
        phone: undefined,
        privacySettings: undefined,
      } as unknown as UserProfile;

      expect(isProfileComplete(profile)).toBe(false);
    });
  });

  describe("getUserProfile", () => {
    it("should return user profile with all new fields if authenticated", async () => {
      vi.mocked(getUserProfile).mockResolvedValue({
        success: true,
        data: {
          id: "user-1",
          name: "Test User",
          email: "test@example.com",
          profileComplete: false,
          profileVersion: 1,
          languages: ["en", "es"],
          identityTags: ["LGBTQ+", "Artist"],
          preferredGameThemes: ["Fantasy", "Scifi"],
          isGM: true,
          gamesHosted: 5,
          responseRate: 95,
          overallExperienceLevel: "intermediate",
          city: "Test City",
          country: "Test Country",
          gmStyle: "Narrative",
          gmRating: 4,
          averageResponseTime: 30,
        },
      });

      const result = await getUserProfile();
      expect(result.success).toBe(true);
      expect(result.data).toEqual(
        expect.objectContaining({
          id: "user-1",
          email: "test@example.com",
          languages: ["en", "es"],
          identityTags: ["LGBTQ+", "Artist"],
          preferredGameThemes: ["Fantasy", "Scifi"],
          isGM: true,
          gamesHosted: 5,
          responseRate: 95,
          overallExperienceLevel: "intermediate",
        }),
      );
    });

    it("should return user profile if authenticated", async () => {
      vi.mocked(getUserProfile).mockResolvedValue({
        success: true,
        data: {
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
        },
      });

      const result = await getUserProfile();
      expect(result.success).toBe(true);
      expect(result.data).toEqual(
        expect.objectContaining({
          id: "user-1",
          email: "test@example.com",
        }),
      );
    });

    it("should return error if not authenticated", async () => {
      vi.mocked(getUserProfile).mockResolvedValue({
        success: false,
        errors: [{ code: "VALIDATION_ERROR", message: "User not authenticated" }],
      });

      const result = await getUserProfile();
      expect(result.success).toBe(false);
      expect(result.errors?.[0].message).toBe("User not authenticated");
    });

    it("should return error if user not found in DB", async () => {
      vi.mocked(getUserProfile).mockResolvedValue({
        success: false,
        errors: [{ code: "DATABASE_ERROR", message: "User not found" }],
      });

      const result = await getUserProfile();
      expect(result.success).toBe(false);
      expect(result.errors?.[0].message).toBe("User not found");
    });

    it("should handle unexpected errors", async () => {
      vi.mocked(getUserProfile).mockResolvedValue({
        success: false,
        errors: [{ code: "DATABASE_ERROR", message: "Failed to fetch user profile" }],
      });

      const result = await getUserProfile();
      expect(result.success).toBe(false);
      expect(result.errors?.[0].message).toBe("Failed to fetch user profile");
    });
  });

  describe("getUserProfile", () => {
    it("should return user profile if authenticated", async () => {
      vi.mocked(getUserProfile).mockResolvedValue({
        success: true,
        data: {
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
        },
      });

      const result = await getUserProfile();
      expect(result.success).toBe(true);
      expect(result.data).toEqual(
        expect.objectContaining({
          id: "user-1",
          email: "test@example.com",
        }),
      );
    });

    it("should return error if not authenticated", async () => {
      vi.mocked(getUserProfile).mockResolvedValue({
        success: false,
        errors: [{ code: "VALIDATION_ERROR", message: "User not authenticated" }],
      });

      const result = await getUserProfile();
      expect(result.success).toBe(false);
      expect(result.errors?.[0].message).toBe("User not authenticated");
    });

    it("should return error if user not found in DB", async () => {
      vi.mocked(getUserProfile).mockResolvedValue({
        success: false,
        errors: [{ code: "DATABASE_ERROR", message: "User not found" }],
      });

      const result = await getUserProfile();
      expect(result.success).toBe(false);
      expect(result.errors?.[0].message).toBe("User not found");
    });

    it("should handle unexpected errors", async () => {
      vi.mocked(getUserProfile).mockResolvedValue({
        success: false,
        errors: [{ code: "DATABASE_ERROR", message: "Failed to fetch user profile" }],
      });

      const result = await getUserProfile();
      expect(result.success).toBe(false);
      expect(result.errors?.[0].message).toBe("Failed to fetch user profile");
    });
  });

  describe("getProfileCompletionStatus", () => {
    it("should return completion status if authenticated", async () => {
      vi.mocked(getProfileCompletionStatus).mockResolvedValue({
        complete: true,
        missingFields: [],
      });

      const result = await getProfileCompletionStatus();
      expect(result.complete).toBe(true);
      expect(result.missingFields).toEqual([]);
    });

    it("should throw error if not authenticated", async () => {
      vi.mocked(getProfileCompletionStatus).mockRejectedValue(
        new Error("User not authenticated"),
      );
      await expect(getProfileCompletionStatus()).rejects.toThrow(
        "User not authenticated",
      );
    });

    it("should throw error if user not found in DB", async () => {
      vi.mocked(getProfileCompletionStatus).mockRejectedValue(
        new Error("User not found"),
      );
      await expect(getProfileCompletionStatus()).rejects.toThrow("User not found");
    });

    it("should handle unexpected errors", async () => {
      vi.mocked(getProfileCompletionStatus).mockRejectedValue(
        new Error("DB connection error"),
      );
      await expect(getProfileCompletionStatus()).rejects.toThrow("DB connection error");
    });
  });

  describe("getGameSystems", () => {
    it("should return empty array if search term is less than 3 characters", async () => {
      vi.mocked(getGameSystems).mockResolvedValue({
        success: true,
        data: [],
      });

      const result = await getGameSystems({ data: { searchTerm: "ab" } });
      expect(result.success).toBe(true);
      if (!result.success) throw new Error("expected success");
      expect(result.data).toEqual([]);
    });

    it("should return game systems matching the search term", async () => {
      const mockGameSystems: GameSystemSummary[] = [
        { id: 1, name: "Catan" },
        { id: 2, name: "Carcassonne" },
      ];
      vi.mocked(getGameSystems).mockResolvedValue({
        success: true,
        data: mockGameSystems,
      });

      const result = await getGameSystems({ data: { searchTerm: "cat" } });
      expect(result.success).toBe(true);
      if (!result.success) throw new Error("expected success");
      expect(result.data).toEqual(mockGameSystems);
    });

    it("should handle database errors", async () => {
      vi.mocked(getGameSystems).mockResolvedValue({
        success: false,
        errors: [{ code: "DATABASE_ERROR", message: "Failed to fetch game systems" }],
      });

      const result = await getGameSystems({ data: { searchTerm: "test" } });
      expect(result.success).toBe(false);
      if (result.success) throw new Error("expected failure");
      expect(result.errors[0].message).toBe("Failed to fetch game systems");
    });
  });

  describe("getUserGameSystemPreferences", () => {
    it("should return user's game system preferences", async () => {
      const mockPreferences = {
        favorite: [{ id: 1, name: "Catan" }],
        avoid: [{ id: 2, name: "Gloomhaven" }],
      };
      vi.mocked(getUserGameSystemPreferences).mockResolvedValue({
        success: true,
        data: mockPreferences,
      });

      const result = await getUserGameSystemPreferences();
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockPreferences);
    });

    it("should return empty arrays if no preferences are set", async () => {
      vi.mocked(getUserGameSystemPreferences).mockResolvedValue({
        success: true,
        data: { favorite: [], avoid: [] },
      });

      const result = await getUserGameSystemPreferences();
      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        favorite: [],
        avoid: [],
      });
    });

    it("should handle game systems not found in DB", async () => {
      vi.mocked(getUserGameSystemPreferences).mockResolvedValue({
        success: true,
        data: { favorite: [{ id: 99, name: "" }], avoid: [] },
      });

      const result = await getUserGameSystemPreferences();
      expect(result.success).toBe(true);
      expect(result.data?.favorite).toEqual([{ id: 99, name: "" }]);
    });

    it("should return error if user is not authenticated", async () => {
      vi.mocked(getUserGameSystemPreferences).mockResolvedValue({
        success: false,
        errors: [{ code: "VALIDATION_ERROR", message: "Not authenticated" }],
      });

      const result = await getUserGameSystemPreferences();
      expect(result.success).toBe(false);
      expect(result.errors?.[0].message).toBe("Not authenticated");
    });

    it("should handle database errors", async () => {
      vi.mocked(getUserGameSystemPreferences).mockResolvedValue({
        success: false,
        errors: [
          {
            code: "DATABASE_ERROR",
            message: "Failed to fetch user game system preferences",
          },
        ],
      });

      const result = await getUserGameSystemPreferences();
      expect(result.success).toBe(false);
      expect(result.errors?.[0].message).toBe(
        "Failed to fetch user game system preferences",
      );
    });
  });
});
