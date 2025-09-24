import { describe, expect, it } from "vitest";
import {
  normalizeProfileName,
  sanitizeProfileName,
  validateProfileNameValue,
} from "../profile.utils";

describe("profile name utilities", () => {
  describe("sanitizeProfileName", () => {
    it("removes invalid characters and trims whitespace while preserving case", () => {
      expect(sanitizeProfileName("  Player-One!!  ")).toBe("Player-One");
    });

    it("limits the result to 30 characters", () => {
      const longName = "ABCDEFGHIJKLMNOPQRSTUVWX.YZ123456"; // >30 chars
      const sanitized = sanitizeProfileName(longName);
      expect(sanitized.length).toBe(30);
      expect(sanitized).toBe(longName.slice(0, 30));
    });
  });

  describe("validateProfileNameValue", () => {
    it("accepts a valid sanitized profile name", () => {
      const result = validateProfileNameValue("Valid.Name-123");
      expect(result).toEqual({ success: true, value: "Valid.Name-123" });
    });

    it("returns an error when the name is too short after sanitization", () => {
      const result = validateProfileNameValue("!a!");
      expect(result).toEqual({
        success: false,
        error: "Profile name must be at least 3 characters",
      });
    });

    it("returns an error when the name contains invalid characters", () => {
      const result = validateProfileNameValue("Invalid Name!");
      expect(result).toEqual({ success: true, value: "InvalidName" });
    });
  });

  describe("normalizeProfileName", () => {
    it("returns a lowercase sanitized version of the profile name", () => {
      expect(normalizeProfileName("Player.Name-42")).toBe("player.name-42");
    });
  });
});
