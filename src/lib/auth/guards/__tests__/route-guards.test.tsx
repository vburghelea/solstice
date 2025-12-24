import { redirect } from "@tanstack/react-router";
import { describe, expect, it, vi } from "vitest";
import type { User } from "~/lib/auth/types";
import { redirectIfAuthenticated, requireAuth } from "../route-guards";

// Mock redirect to track calls
vi.mock("@tanstack/react-router", () => ({
  redirect: vi.fn((options) => {
    throw new Error(`Redirect to ${options.to}`);
  }),
}));

describe("Route Guards", () => {
  const mockUser: User = {
    id: "test-user",
    email: "test@example.com",
    name: "Test User",
    emailVerified: true,
    image: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    profileComplete: true,
    dateOfBirth: new Date("1990-01-01"),
    phone: "+1234567890",
    gender: "male",
    pronouns: "he/him",
    emergencyContact: JSON.stringify({
      name: "Emergency Contact",
      phone: "+0987654321",
      relationship: "spouse",
    }),
    privacySettings: JSON.stringify({
      showEmail: false,
      showPhone: false,
      showDateOfBirth: false,
    }),
    profileVersion: 1,
    profileUpdatedAt: new Date(),
    mfaRequired: false,
    mfaEnrolledAt: null,
    twoFactorEnabled: false,
  };

  describe("requireAuth", () => {
    const mockLocation = { pathname: "/protected" };

    it("redirects to login when user is not authenticated", () => {
      expect(() => requireAuth({ user: null, location: mockLocation })).toThrow(
        "Redirect to /auth/login",
      );
      expect(redirect).toHaveBeenCalledWith({
        to: "/auth/login",
        search: { redirect: "/protected" },
      });
    });

    it("allows authenticated users through", () => {
      expect(() => requireAuth({ user: mockUser, location: mockLocation })).not.toThrow();
    });

    it("redirects to custom path when specified", () => {
      expect(() =>
        requireAuth({ user: null, location: mockLocation, redirectTo: "/custom-login" }),
      ).toThrow("Redirect to /custom-login");
      expect(redirect).toHaveBeenCalledWith({
        to: "/custom-login",
        search: { redirect: "/protected" },
      });
    });
  });

  describe("redirectIfAuthenticated", () => {
    it("redirects to dashboard when user is authenticated", () => {
      expect(() => redirectIfAuthenticated({ user: mockUser })).toThrow(
        "Redirect to /dashboard",
      );
      expect(redirect).toHaveBeenCalledWith({ to: "/dashboard" });
    });

    it("allows unauthenticated users through", () => {
      expect(() => redirectIfAuthenticated({ user: null })).not.toThrow();
    });

    it("redirects to custom path when specified", () => {
      expect(() =>
        redirectIfAuthenticated({ user: mockUser, redirectTo: "/home" }),
      ).toThrow("Redirect to /home");
      expect(redirect).toHaveBeenCalledWith({ to: "/home" });
    });
  });
});
