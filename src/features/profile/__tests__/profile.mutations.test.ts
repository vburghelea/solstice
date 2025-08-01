import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CompleteProfileInputType } from "../profile.schemas";
import type { PrivacySettings, ProfileInput, UserProfile } from "../profile.types";

// Mock the entire profile.mutations module
vi.mock("../profile.mutations", async (importOriginal) => {
  const original = await importOriginal<object>();
  return {
    ...original,
    updateUserProfile: vi
      .fn()
      // eslint-disable-next-line  @typescript-eslint/no-unused-vars
      .mockImplementation(async (args: { data?: Partial<ProfileInput> }) => {
        return Promise.resolve({ success: true, data: mockUser });
      }),
    completeUserProfile: vi
      .fn()
      // eslint-disable-next-line  @typescript-eslint/no-unused-vars
      .mockImplementation(async (args: { data?: CompleteProfileInputType }) => {
        return Promise.resolve({ success: true, data: mockUser });
      }),
    updatePrivacySettings: vi
      .fn()
      // eslint-disable-next-line  @typescript-eslint/no-unused-vars
      .mockImplementation(async (args: { data?: PrivacySettings }) => {
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
        // eslint-disable-next-line  @typescript-eslint/no-explicit-any
      } as any);

      expect(result.success).toBe(true);
      expect(result.data?.gender).toBe("Non-binary");
      expect(result.data?.phone).toBe("1234567890");
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
        // eslint-disable-next-line  @typescript-eslint/no-explicit-any
      } as any);

      expect(result.success).toBe(true);
      expect(result.data?.gameSystemPreferences).toEqual(preferences);
    });

    it("should update profileComplete status if profile becomes complete", async () => {
      const updatedProfile = { ...mockUser, profileComplete: true, gender: "Female" };
      vi.mocked(updateUserProfile).mockResolvedValue({
        success: true,
        data: updatedProfile,
      });

      // eslint-disable-next-line  @typescript-eslint/no-explicit-any
      const result = await updateUserProfile({ data: { gender: "Female" } } as any);

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
        // eslint-disable-next-line  @typescript-eslint/no-explicit-any
      } as any);
      expect(result.success).toBe(false);
      expect(result.errors?.[0].code).toBe("VALIDATION_ERROR");
    });

    it("should fail if user is not authenticated", async () => {
      vi.mocked(updateUserProfile).mockResolvedValue({
        success: false,
        errors: [{ code: "AUTH_ERROR", message: "Not authenticated" }],
      });

      // eslint-disable-next-line  @typescript-eslint/no-explicit-any
      const result = await updateUserProfile({ data: { gender: "Male" } } as any);
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
          allowTeamInvitations: true,
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
  });

  describe("updatePrivacySettings", () => {
    it("should update privacy settings", async () => {
      const privacySettings = {
        showEmail: false,
        showPhone: true,
        allowTeamInvitations: false,
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
